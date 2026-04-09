/**
 * backend/scripts/historicalHarvester.js
 * 
 * V4.2 历史数据挖掘机
 * 
 * 逻辑：从今天开始，以 7 天为一个窗口向后追溯 1 年（或直到涂鸦数据截断）。
 * 自动识别 11 台设备并录入。
 */

import dotenv from 'dotenv';
import db from '../db/database.js';
import { tuyaGet, getAccessToken } from '../tuya/tuyaClient.js';
import { ingestSensorEvent } from '../db/database.js';

dotenv.config();

// 工具：睡眠函数防止触发涂鸦频次限制
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function harvestDevice(deviceId, type) {
  console.log(`\n🚜 [Harvester] 正在挖掘设备: ${deviceId} (${type})...`);
  
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 3600 * 1000;
  const windowSize = 7 * 24 * 3600 * 1000;
  
  let currentEnd = now;
  let totalLogs = 0;
  let emptyWindows = 0;

  while (currentEnd > oneYearAgo && emptyWindows < 3) {
    const currentStart = Math.max(currentEnd - windowSize, oneYearAgo);
    const startStr = new Date(currentStart).toLocaleDateString();
    const endStr = new Date(currentEnd).toLocaleDateString();
    
    console.log(`   📅 正在追溯窗口: ${startStr} 至 ${endStr}...`);
    
    try {
      // V4.2 使用 Shadow Logs API，参数字典序已由 tuyaClient 处理
      const url = `/v2.0/cloud/thing/${deviceId}/shadow/logs?end_time=${currentEnd}&size=500&start_time=${currentStart}`;
      const res = await tuyaGet(url);
      
      const logs = res.logs || [];
      if (logs.length > 0) {
        console.log(`   ✅ 抓取到 ${logs.length} 条记录`);
        totalLogs += logs.length;
        emptyWindows = 0;

        // 重放打点数据到业务引擎
        for (const log of logs) {
          // 识别逻辑：将涂鸦 DP 转为应用层指标
          // (简化版：直接根据 device_type 推断，进阶版需调用 ingestSensorEvent 并进行 identity 识别)
          // 注意：此处需要解析 log.code 和 log.value
          processLog(deviceId, type, log);
        }
      } else {
        console.log(`   ⚠️ 该窗口无数据`);
        emptyWindows++;
      }
    } catch (err) {
      console.error(`   ❌ 追溯失败: ${err.message}`);
      if (err.message.includes('No permissions') || err.message.includes('expired')) {
        console.log('   🛑 权限截止，停止追溯。');
        break;
      }
    }

    currentEnd = currentStart;
    await sleep(500); // 避开 429 Error
  }
  
  console.log(`✨ 设备 ${deviceId} 同步完成！共补录 ${totalLogs} 条数据。`);
}

/**
 * 核心解析逻辑：对接 V4.1 算法引擎
 */
function processLog(tuyaId, type, log) {
  // DP 映射 (这里简化，实际生产中应与 dpMappings 对应)
  let metric = null;
  let val = log.value;
  
  // 猫砂盆：重量、使用时长
  if (log.code === 'cat_weight') metric = 'weight';
  else if (log.code === 'clean_time') metric = 'litter_usage';
  
  // 喂食器：出粮量
  else if (log.code === 'feed_report') metric = 'food_intake';
  
  // 饮水机：饮水量
  else if (log.code === 'water_report') metric = 'water_intake';

  if (metric) {
    // 调用数据库注入层，它会自动执行多猫识别 (Identity Engine)
    // 假设历史记录的时间戳使用 log.event_time
    const recordedAt = new Date(log.event_time).toISOString();
    
    // 这里我们先跳过 IdentityService，直接入库并打上 'historical_recovery' 标签
    // 或者直接调用 ingestSensorEvent，它会自动处理
    ingestSensorEvent(null, tuyaId, metric, val, { source: 'historical_recovery', recordedAt });
  }
}

async function startHarvest() {
  console.log('🚀 [OneYearHarvester] 启动全量历史数据补录任务...');
  
  await getAccessToken().catch(() => {
    console.error('❌ 无法获取涂鸦 Token，请检查 .env。');
    process.exit(1);
  });

  const devices = db.prepare('SELECT tuya_device_id, device_type FROM devices').all();
  console.log(`📋 计划补录 ${devices.length} 台设备...`);

  for (const dev of devices) {
    await harvestDevice(dev.tuya_device_id, dev.device_type);
  }

  console.log('\n🏁 [OneYearHarvester] 补录任务圆满结束！');
  console.log('📈 请刷新前端看板查看全年健康趋势。');
}

startHarvest();
