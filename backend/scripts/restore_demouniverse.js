/**
 * backend/scripts/restore_demouniverse.js
 * 
 * V3.2 复刻计划：恢复 7 大演示猫咪病理宇宙 + 建立 Henry 生产账号
 */

import db from '../db/database.js';

console.log('🌌 [DemoUniverse] 正在启动时空穿梭，恢复 V3.2 演示阵容...');

const addNoise = (base, percentRange) => {
  const noise = base * percentRange * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + noise));
};

function generate360DaysData(petId, model) {
  const days = 360;
  const endDate = new Date();
  
  // 清理旧数据 (事务外层处理)
  // db.prepare('DELETE FROM pet_health_daily WHERE pet_id = ?').run(petId);

  let wBase = model.wBase, wStep = model.wStep;
  let fBase = model.fBase, fStep = model.fStep;
  let waBase = model.waBase, waStep = model.waStep;
  let lBase = model.lBase, lStep = model.lStep;

  const stmt = db.prepare(`
    INSERT INTO pet_health_daily (pet_id, date, weight_avg, food_total, water_total, litter_count, extra_metrics)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 从过去第 days 天向今天推演
  for (let i = days; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    wBase += wStep;
    fBase += fStep;
    waBase += waStep;
    lBase += lStep;

    stmt.run(
      petId, 
      dateStr,
      addNoise(wBase, 0.015),
      addNoise(fBase, 0.1),
      addNoise(waBase, 0.15),
      addNoise(lBase, 0.2),
      JSON.stringify({ model: model.type })
    );
  }
}

const CATS = [
  { id: 'cat_bengal', name: '豹豹', breed: 'Bengal', type: 'healthy', wBase: 5000, wStep: 800/360, fBase: 65, fStep: 0, waBase: 150, waStep: 0, lBase: 2, lStep: 0 },
  { id: 'cat_maine', name: '大白', breed: 'Maine Coon', type: 'healthy_large', wBase: 6000, wStep: 2500/360, fBase: 95, fStep: 0.05, waBase: 280, waStep: 0.1, lBase: 3, lStep: 0 },
  { id: 'cat_british', name: '胖虎', breed: 'British Shorthair', type: 'obese', wBase: 5500, wStep: 2200/360, fBase: 88, fStep: 0, waBase: 160, waStep: 0, lBase: 2, lStep: 0 },
  { id: 'cat_ragdoll', name: '仙仙', breed: 'Ragdoll', type: 'ckd', wBase: 6200, wStep: -1400/360, fBase: 55, fStep: -0.05, waBase: 140, waStep: 250/360, lBase: 2, lStep: 4/360 },
  { id: 'cat_siamese', name: '干瘪', breed: 'Siamese', type: 'malnourished', wBase: 3500, wStep: -800/360, fBase: 35, fStep: 0, waBase: 120, waStep: 0, lBase: 1, lStep: 0 },
  { id: 'cat_garfield', name: '加菲', breed: 'Persian', type: 'digestive', wBase: 5200, wStep: 500/360, fBase: 60, fStep: 0, waBase: 130, waStep: 0, lBase: 1.5, lStep: -0.8/360 },
  { id: 'cat_abyssinian', name: '小美', breed: 'Abyssinian', type: 'hyperthyroid', wBase: 4200, wStep: -1200/360, fBase: 110, fStep: 0.2, waBase: 220, waStep: 0.2, lBase: 2, lStep: 0 },
];

async function seed() {
  try {
    // 1. 创建演示账号与 Henry 账号
    db.prepare('INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
      .run('u_demo', 'demo@heybopet.com', 'demo123', 'Demo Universe', 'admin');
    
    db.prepare('INSERT OR IGNORE INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)')
      .run('u_henry', 'henry@heybopet.com', 'heybo2026', 'Henry', 'user');

    console.log('✅ 用户账号创建成功 (Henry: henry@heybopet.com / heybo2026)');

    // 2. 注入 7 大演示猫
    db.transaction(() => {
        for (const cat of CATS) {
          db.prepare('INSERT OR REPLACE INTO pets (id, owner_id, name, breed) VALUES (?, ?, ?, ?)')
            .run(cat.id, 'u_demo', cat.name, cat.breed);
          
          console.log(`   🐾 正在生成 ${cat.name} (${cat.breed}) 的 360 天病理数据...`);
          // 清理旧数据
          db.prepare('DELETE FROM pet_health_daily WHERE pet_id = ?').run(cat.id);
          generate360DaysData(cat.id, cat);
        }

        // 3. 将 11 台真实设备绑定给 Henry
        const all11 = [
            '6c27a80d703718211cd5j8', '6cd64646945d09cc1davqk', '6c5d39b12b865140838fik',
            '6cc4ccb9e9fdae3f403lb2', '6cc29b66de5ec6a3e4nt6a', '6cfe568b04cef68a072lfz',
            '6c739186019dd82735kfhz', '6c2cca664c357a9eb5cs9b', '6c2ef55d366c1f580c4gmb',
            '6cbe57f97b337a052bcfea', '6c1d6ab183da685958lajo'
        ];

        for (const tuyaId of all11) {
            db.prepare(`
                INSERT OR REPLACE INTO devices (id, owner_id, tuya_device_id, device_type, pet_id)
                VALUES (?, ?, ?, ?, ?)
            `).run('dev_' + tuyaId.substring(0,6), 'u_henry', tuyaId, 'unknown', null);
        }
    })();
    
    console.log('✅ 11 台真实设备已成功关联至 Henry 账户。');
    console.log('🏁 复刻完成！');

  } catch (err) {
    console.error('❌ 复刻失败:', err.message);
  }
}

seed();
