/**
 * backend/scripts/emergency_restore.js
 * 
 * 紧急恢复脚本：重建核心数据库表并填充演示数据。
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = './data/pet_health.db';
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);

console.log('🚑 [Emergency] 正在重建核心数据库...');

db.exec(`
  CREATE TABLE IF NOT EXISTS pets (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL, 
    breed TEXT, 
    avatar TEXT, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY, 
    tuya_device_id TEXT NOT NULL UNIQUE, 
    device_type TEXT NOT NULL, 
    pet_id TEXT, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT
  );

  -- 恢复演示猫咪档
  INSERT OR IGNORE INTO pets (id, name, breed) VALUES ('pet_heybo_test_001', 'HeyboPet', 'ragdoll');
  INSERT OR IGNORE INTO pets (id, name, breed) VALUES ('pet_baobao', '豹豹', 'Bengal');
  INSERT OR IGNORE INTO pets (id, name, breed) VALUES ('pet_nani', '纳尼', 'Garfield');

  -- 恢复默认演示设备绑定
  INSERT OR IGNORE INTO devices (id, tuya_device_id, device_type, pet_id) VALUES ('dev_1', 'dummy_litter_01', 'litter_box', 'pet_baobao');
`);

console.log('✅ [Emergency] 数据库表与演示数据恢复成功。');
process.exit(0);
