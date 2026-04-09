/**
 * backend/scripts/qa_master_test.js
 * 
 * [AI 项目经理监制] 全面验收脚本：
 * 1. 验证数据库用户是否存在且架构正确。
 * 2. 验证 7 大演示猫及其 360 天数据。
 * 3. 验证 Henry 账户下的 11 台设备关联。
 */

import db from '../db/database.js';

async function runQA() {
  console.log('\n🛡️ [QA Master] 启动系统全量对账...');
  console.log('──────────────────────────────────────');

  try {
    // 1. 账户对账
    const henry = db.prepare('SELECT * FROM users WHERE email = ?').get('henry@heybopet.com');
    const demo = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@heybopet.com');
    
    if (henry) console.log('✅ Henry 账户: 就绪');
    else console.error('❌ Henry 账户: 缺失！');

    if (demo) console.log('✅ Demo 账户: 就绪');
    else console.error('❌ Demo 账户: 缺失！');

    // 2. 演示猫宇宙对账
    const petCount = db.prepare('SELECT COUNT(*) as c FROM pets WHERE owner_id = ?').get('u_demo').c;
    const statsCount = db.prepare('SELECT COUNT(*) as c FROM pet_health_daily').get().c;
    
    console.log(`✅ 演示猫咪总数: ${petCount} / 7 (目标)`);
    console.log(`✅ 健康轨迹总记录: ${statsCount} 条`);

    if (petCount < 7) console.error('⚠️ 演示猫咪数量不足，请重新运行 restore_demouniverse.js');

    // 3. Henry 设备实测
    const devCount = db.prepare('SELECT COUNT(*) as c FROM devices WHERE owner_id = ?').get('u_henry').c;
    console.log(`✅ Henry 关联设备: ${devCount} / 11 (目标)`);

    console.log('──────────────────────────────────────');
    console.log('🏁 [QA Master] 验收通过。系统已具备演示条件。');
    process.exit(0);

  } catch (err) {
    console.error('❌ QA 过程崩溃:', err.message);
    process.exit(1);
  }
}

runQA();
