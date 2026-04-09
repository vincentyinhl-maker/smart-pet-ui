/**
 * scripts/tuya_full_import.js
 * 
 * V4.1 高级功能：涂鸦云端全量数据同步导入测试工具。
 * 该脚本通过 OpenAPI 抓取账户下所有硬件的历史状态，
 * 并通过最新的 V4.1 算法引擎（含多猫识别、异常拦截、排泄分摊）进行重放。
 */

import dotenv from 'dotenv';
import { getAccessToken, tuyaGet } from '../backend/tuya/tuyaClient.js';
import { importHistoricalLogs } from '../backend/services/tuyaImporter.js';
import { startDataQueueProcessor } from '../backend/services/dataQueue.js';
import db from '../backend/db/database.js';

dotenv.config();

async function runFullImport() {
  console.log('\n🌟 [Heybo PaaS Importer] 启动全量同步测试...');
  console.log('──────────────────────────────────────────');

  try {
    // 1. 初始化后端引擎
    startDataQueueProcessor();

    // 2. 验证凭证
    await getAccessToken();
    console.log('✅ 涂鸦云端连接成功');

    // 3. 检索该账户下的所有设备
    // 我们直接通过 ID 列表接口获取
    const devices = db.prepare('SELECT tuya_device_id FROM devices').all();
    if (devices.length === 0) {
      console.error('❌ 本地数据库中未发现已注册的设备 ID，请先在 .env 中配置。');
      process.exit(1);
    }

    console.log(`📋 发现待同步设备: ${devices.length} 台`);

    // 4. 逐台同步过去一周的数据
    for (const dev of devices) {
      console.log(`\n⏳ 正在同步: ${dev.tuya_device_id}`);
      // 默认同步过去 7 天 (168小时)
      const count = await importHistoricalLogs(dev.tuya_device_id, 't_heybo', 168);
      console.log(`✅ 同步完成: 捕获并重放了 ${count} 条 IoT 事件`);
    }

    console.log('\n──────────────────────────────────────────');
    console.log('🎉 所有历史数据已通过 V4.1 算法引擎处理完毕。');
    console.log('📈 您现在可以刷新看板，查看基于真实历史数据的健康曲线。');
    
    // 给队列一点时间落盘
    setTimeout(() => process.exit(0), 5000);

  } catch (err) {
    console.error('❌ 同步过程中发生错误:', err.message);
    process.exit(1);
  }
}

runFullImport();
