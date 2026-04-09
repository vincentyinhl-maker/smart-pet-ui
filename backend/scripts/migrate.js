/**
 * backend/scripts/migrate.js
 * 
 * 智能迁移工具：检测并修复数据库表结构。
 */

import Database from 'better-sqlite3';
const db = new Database('./data/pet_health.db');

const tables = {
  users: [
    { name: 'email', type: 'TEXT UNIQUE NOT NULL' },
    { name: 'password', type: 'TEXT' },
    { name: 'name', type: 'TEXT' },
    { name: 'role', type: 'TEXT DEFAULT "user"' }
  ],
  pets: [
    { name: 'owner_id', type: 'TEXT' }
  ],
  devices: [
    { name: 'owner_id', type: 'TEXT' }
  ]
};

console.log('👷 [Migration] 正在自检数据库架构...');

for (const [table, columns] of Object.entries(tables)) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  const existingColumns = info.map(c => c.name);
  
  for (const col of columns) {
    if (!existingColumns.includes(col.name)) {
      console.log(`   ➕ 正在向 ${table} 表添加缺失字段: ${col.name}`);
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        console.error(`   ❌ 添加失败: ${e.message}`);
      }
    }
  }
}

console.log('✅ [Migration] 架构对齐完成。');
process.exit(0);
