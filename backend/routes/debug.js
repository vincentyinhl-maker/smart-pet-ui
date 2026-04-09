/**
 * backend/routes/debug.js
 * 
 * 开发者测试用的数据注入引擎
 * 支撑 V3.0 的 "多宠物、任意用户名、360天大满贯疾病拟真数据注入"
 */

import express from 'express';
import db, { upsertDailyRollup } from '../db/database.js';
import eventBus, { IOT_EVENTS } from '../services/eventBus.js';

const router = express.Router();

/** 给基础数值增加正态或均匀噪声 */
const addNoise = (base, percentRange) => {
  const noise = base * percentRange * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + noise));
};


// ── 5 种猫咪生理形态生成器 (360 天推进) ──────────────────────

const generatePetData = (petId, breedType, days = 360) => {
  const endDate = new Date();
  
  // 清理如果该宠物历史数据已有的话
  db.prepare('DELETE FROM pet_health_daily WHERE pet_id = ?').run(petId);

  // 初值设置
  let weightBase = 4500, foodBase = 55, waterBase = 150, litterBase = 2; // 默认
  let weightStep = 0, waterStep = 0, foodStep = 0, litterStep = 0;

  switch (breedType) {
    case 'british_shorthair': // 肥胖
      weightBase = 5500; weightStep = (7500 - 5500) / days; 
      foodBase = 85;     foodStep   = 0;
      break;
    case 'ragdoll':           // 肾功能不好 (CKD)
      weightBase = 6200; weightStep = (5000 - 6200) / days; // 慢性暴瘦
      waterBase = 140;   waterStep  = (380 - 140) / days;   // 烦渴
      litterBase = 2;    litterStep = (6 - 2) / days;       // 多尿
      break;
    case 'siamese':           // 营养不良/消瘦
      weightBase = 3500; weightStep = (2800 - 3500) / days; 
      foodBase = 35;     foodStep   = 0; // 厌食
      break;
    case 'maine_coon':        // 健康大型猫
      weightBase = 6000; weightStep = (8500 - 6000) / days; // 稳健成长
      foodBase = 90;     foodStep   = 0.05; 
      waterBase = 250;   waterStep  = 0.1;
      break;
    case 'bengal':            // 健康矫健
      weightBase = 5000; weightStep = (5800 - 5000) / days;
      foodBase = 65;     foodStep   = 0;
      break;
  }

  // 插入数据
  const stmt = db.prepare(`
    INSERT INTO pet_health_daily (pet_id, date, weight_avg, food_total, water_total, litter_count, extra_metrics)
    VALUES (?, ?, ?, ?, ?, ?, '{}')
  `);

  db.transaction(() => {
    // 从过去第 days 天向今天推演
    for (let i = days; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // 每过一天，基地值都在演变
      weightBase += weightStep;
      foodBase   += foodStep;
      waterBase  += waterStep;
      litterBase += litterStep;

      stmt.run(
        petId, 
        dateStr,
        addNoise(weightBase, 0.015), // 体重1.5%范围内波动
        addNoise(foodBase, 0.1),     // 饭量10%范围内波动
        addNoise(waterBase, 0.15),   // 水量15%范围内波动
        addNoise(litterBase, 0.2)    // 猫砂20%范围内波动
      );
    }
  })();
};

// ── 暴露 API ──────────────────────────────────────────────────

/**
 * POST /api/debug/seed-pet
 * {
 *   "username": "Vincent",
 *   "petName": "胖虎",
 *   "breedType": "british_shorthair" | "ragdoll" | "siamese" | ...
 * }
 */
router.post('/seed-pet', (req, res) => {
  const { username = 'TestUser', petName = 'TestCat', breedType = 'bengal' } = req.body;
  
  if (!username || !petName || !breedType) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    // 1. 创建或更新宠物账号绑定 (虚拟关联)
    const petId = `pet_${username}_${Date.now()}`;
    db.prepare('INSERT INTO pets (id, name, breed) VALUES (?, ?, ?)')
      .run(petId, petName, breedType);

    // 2. 将之前存在的默认三项设备，暴力劫持给新宠 (方便 Demo Dashboard 共用一套设备)
    db.prepare('UPDATE devices SET pet_id = ?').run(petId);

    // 3. 开始灌入 360 天上帝视角数据
    generatePetData(petId, breedType, 360);

    res.json({ 
      success: true, 
      petId, 
      message: `成功为 ${username} 的 ${breedType} '${petName}' 写入 360 天病理学特征演算数据，设备已转移。` 
    });
  } catch (err) {
    console.error('[Debug API] Seed 失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET 获取已注入的宠物列表
router.get('/pets', (req, res) => {
  try {
    const pets = db.prepare('SELECT * FROM pets ORDER BY created_at DESC').all();
    res.json({ success: true, data: pets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * [NEW] 极速并发打点注入接口 - 专门用于压力测试
 * 直接跳过 DB 写入，投递到 EventBus
 */
router.post('/inject-raw', (req, res) => {
  const { tuyaDeviceId, metricType, value } = req.body;
  
  eventBus.emit(IOT_EVENTS.STATION_DATA_RECEIVED, {
    tuyaDeviceId,
    metricType,
    value
  });

  res.json({ success: true });
});

export default router;
