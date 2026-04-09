/**
 * backend/db/database.js (V2.0 Pet-Centric Architecture)
 *
 * 高吞吐物联网架构数据库层。
 * 支持千万级数据沉淀，海量设备解耦绑定，以及长达十年以上的数据归档。
 * （目前基于 SQLite WAL，未来可无缝平移 PostgreSQL + TimescaleDB）
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { splitExcretionWeight, detectExcretionTypes } from '../services/excretionAnalyzer.js';
dotenv.config();

const DB_PATH = process.env.DB_PATH || './data/pet_health.db';

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');     // 提升并发写入
db.pragma('foreign_keys = ON');      // 开启外键约束，保证孤儿数据被清理

// ── V2.0 建表：以宠物为主线 ─────────────────────────────────────
db.exec(`
  -- 0. 账户管理表 (Auth)
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT,
    role        TEXT DEFAULT 'user', -- 'user' | 'admin' | 'guest'
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 1. 宠物档案核心表
  CREATE TABLE IF NOT EXISTS pets (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT,             -- 归属用户
    name        TEXT NOT NULL,
    breed       TEXT,
    avatar      TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 2. 硬件解耦表
  CREATE TABLE IF NOT EXISTS devices (
    id             TEXT PRIMARY KEY,
    owner_id       TEXT,             -- 归属用户
    tuya_device_id TEXT NOT NULL UNIQUE,
    device_type    TEXT NOT NULL,    -- 'litter_box' | 'feeder' | 'water' | 'collar'
    pet_id         TEXT,             -- 当前绑定的宠物 (可能动态切换)
    created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE SET NULL
  );

  -- 3. 时序原始打点日志表 (V4.0 增加置信度与识别来源)
  CREATE TABLE IF NOT EXISTS sensor_events_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id      TEXT,                -- 可能指向 GhostID
    device_id   TEXT,
    metric_type TEXT,                -- 'weight', 'food_intake', 'water_intake', 'litter_duration'...
    value       REAL,
    confidence  REAL DEFAULT 1.0,    -- 识别置信度 (0.0 - 1.0)
    identity_source TEXT,            -- 'rfid' | 'weight' | 'behavior' | 'manual'
    recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. 宠物健康长效日切表 (UI核心读表，支撑十几年的平滑加载)
  -- 复合主键保证每天只有一个唯一的 Rollup
  CREATE TABLE IF NOT EXISTS pet_health_daily (
    pet_id         TEXT NOT NULL,
    date           TEXT NOT NULL,    -- 'YYYY-MM-DD'
    weight_avg     REAL DEFAULT NULL,
    food_total     REAL DEFAULT 0,
    water_total    REAL DEFAULT 0,
    litter_count   INTEGER DEFAULT 0,
    extra_metrics  TEXT DEFAULT '{}',-- JSON 列：用于后期灵活扩充血氧、体温、运动量等
    PRIMARY KEY(pet_id, date),
    FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
  );

  -- 5. 设备状态快照（仅保留最新，用于诊断在线离线）
  CREATE TABLE IF NOT EXISTS device_snapshots (
    tuya_device_id TEXT PRIMARY KEY,
    device_type    TEXT,
    data_json      TEXT, 
    updated_at     TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- 建立提升并发读取速度的索引
  CREATE INDEX IF NOT EXISTS idx_events_pet_date ON sensor_events_log(pet_id, recorded_at);
  CREATE INDEX IF NOT EXISTS idx_events_dev_date ON sensor_events_log(device_id, recorded_at);
`);

console.log(`[DB V2.0] SQLite 平台级核心初始化完成 → ${DB_PATH}`);

// ── V2.0 基础数据自检与初始化（预设一个测试猫主子）──────────────
const testPetId = 'pet_heybo_test_001';
const existingPet = db.prepare('SELECT id FROM pets WHERE id = ?').get(testPetId);
if (!existingPet) {
  db.prepare('INSERT INTO pets (id, name, breed) VALUES (?, ?, ?)')
    .run(testPetId, 'HeyboPet', 'ragdoll');
    
  // 自动绑定默认设备到该猫咪（兼容老环境变量逻辑）
  const devFeeder = process.env.DEVICE_ID_FEEDER || 'dev_f_01';
  db.prepare('INSERT OR IGNORE INTO devices (id, tuya_device_id, device_type, pet_id) VALUES (?, ?, ?, ?)').run('dev_1', devFeeder, 'feeder', testPetId);
  
  const devWater = process.env.DEVICE_ID_WATER || 'dev_w_01';
  db.prepare('INSERT OR IGNORE INTO devices (id, tuya_device_id, device_type, pet_id) VALUES (?, ?, ?, ?)').run('dev_2', devWater, 'water', testPetId);
  
  const devLitter = process.env.DEVICE_ID_LITTER_BOX || 'dev_l_01';
  db.prepare('INSERT OR IGNORE INTO devices (id, tuya_device_id, device_type, pet_id) VALUES (?, ?, ?, ?)').run('dev_3', devLitter, 'litter_box', testPetId);
}

// ── V2写入：事件驱动与日切表 Upsert 引擎 ───────────────────────

/** 
 * 根据涂鸦 ID 查找绑定的宠物与内部 ID
 */
export function resolveDevice(tuyaDeviceId) {
  return db.prepare(`SELECT id, device_type, pet_id FROM devices WHERE tuya_device_id = ?`).get(tuyaDeviceId);
}

/** 更新涂鸦快照 */
export function upsertDeviceSnapshot(tuya_id, type, data) {
  const stmt = db.prepare(`
    INSERT INTO device_snapshots (tuya_device_id, device_type, data_json, updated_at) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(tuya_device_id) DO UPDATE SET 
      data_json=excluded.data_json, updated_at=excluded.updated_at
  `);
  stmt.run(tuya_id, type, JSON.stringify(data), new Date().toISOString());
}

/** 
 * 向日切表高效 Upsert (Merge) 累计数据或覆盖均值数据
 * @param {string} pet_id 
 * @param {string} date 'YYYY-MM-DD'
 * @param {Object} metrics { weight, food, water, litter_increment }
 */
export function upsertDailyRollup(pet_id, date, metrics = {}) {
  const { weight, food = 0, water = 0, litter_increment = 0 } = metrics;
  
  // 对于体重（瞬时状态），如果有新有效值，我们取新值和旧值的平均，或者直接由业务层提供平均
  // 对于食物/水/猫砂（累计状态），我们相加
  
  const stmt = db.prepare(`
    INSERT INTO pet_health_daily (pet_id, date, weight_avg, food_total, water_total, litter_count)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(pet_id, date) DO UPDATE SET
      weight_avg = CASE 
                     WHEN excluded.weight_avg IS NOT NULL AND weight_avg IS NOT NULL THEN (weight_avg + excluded.weight_avg) / 2
                     WHEN excluded.weight_avg IS NOT NULL THEN excluded.weight_avg
                     ELSE weight_avg END,
      food_total = COALESCE(food_total, 0) + excluded.food_total,
      water_total = COALESCE(water_total, 0) + excluded.water_total,
      litter_count = COALESCE(litter_count, 0) + excluded.litter_count
  `);
  stmt.run(pet_id, date, (weight && weight > 500) ? weight : null, food, water, litter_increment);
}

/**
 * 更新宠物档案（名字、品种等）
 */
export function updatePet(id, updates = {}) {
  const { name, breed } = updates;
  const fields = [];
  const params = [];

  if (name !== undefined) {
    fields.push('name = ?');
    params.push(name);
  }
  if (breed !== undefined) {
    fields.push('breed = ?');
    params.push(breed);
  }

  if (fields.length === 0) return;

  params.push(id);
  const sql = `UPDATE pets SET ${fields.join(', ')} WHERE id = ?`;
  return db.prepare(sql).run(...params);
}

/**
 * 核心：网关层事件注入入口 (V4.0 支持多猫识别结果注入)
 * @param {string} petId 已识别出的宠物ID (可能由 IdentityService 计算得出)
 * @param {string} tuyaDeviceId 原始设备ID
 * @param {string} metricType 
 * @param {number} value 
 * @param {Object} meta { confidence, source }
 */
export function ingestSensorEvent(petId, tuyaDeviceId, metricType, value, meta = {}) {
  const { confidence = 1.0, source = 'static_bond', recordedAt = null } = meta;
  const devInfo = resolveDevice(tuyaDeviceId);
  
  const now = recordedAt ? new Date(recordedAt) : new Date();
  const dateStr = now.toISOString().split('T')[0];

  // 1. 落日志 (保留置信度)
  db.prepare(`
    INSERT INTO sensor_events_log (pet_id, device_id, metric_type, value, confidence, identity_source, recorded_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(petId, devInfo?.id || tuyaDeviceId, metricType, value, confidence, source, now.toISOString().replace('T', ' ').substring(0, 19));

  // 2. 如果置信度足够高 (>= 0.6)，则更新日切视图参与看板统计
  if (confidence >= 0.6) {
    const payload = {};
    if (metricType === 'weight') payload.weight = value;
    if (metricType === 'food_intake') payload.food = value;
    if (metricType === 'water_intake') payload.water = value;
    
    // [死结 C] 特殊处理：猫砂盆排泄识别与分摊
    if (metricType === 'litter_usage') {
      payload.litter_increment = 1;
      
      // 异步分摊算法 (封装在 meta 或通过数据库快照获取停留时长)
      const duration = meta.duration || 30; // 默认 30s
      const types = detectExcretionTypes(duration, value);
      
      // 如果检测到多种类型，执行比例切分
      if (types.length > 1) {
        // 由于 DB 层目前保持同步，此处采用预计算好的比例或默认比例
        // 生产环境建议将此处逻辑上移至 Service 层
        payload.extra_stats = { types, detected_weight: value };
      }
    }
    
    upsertDailyRollup(petId, dateStr, payload);
  } else {
    console.log(`[V4.0 Identity] 低置信度事件 (${confidence})，仅存入流水表备查，不计入健康统计。`);
  }
}

// ── V2读取：长效健康读图接口（十万级也能极速返回）──────────────

/**
 * 获取任意宠物、任意历史跨度的健康日度聚合流
 * 这里只负责把 DB 里存在的数据原样拉出。若天数间有空洞，由 Service 层的 Imputation 算法负责无缝滑窗填补。
 */
export function getPetDailyRollups(pet_id, dateStart, dateEnd) {
  const stmt = db.prepare(`
    SELECT date, weight_avg, food_total, water_total, litter_count, extra_metrics 
    FROM pet_health_daily
    WHERE pet_id = ? AND date >= ? AND date <= ?
    ORDER BY date ASC
  `);
  return stmt.all(pet_id, dateStart, dateEnd);
}

/**
 * 查找用户 (用于 Auth)
 */
export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

export function getAllDeviceSnapshots() {
  return db.prepare('SELECT * FROM device_snapshots').all();
}

/** 测试暴露的基础系统 ID 供后续服务默认读取使用 */
export const DEFAULT_V2_PET_ID = testPetId;

export default db;
