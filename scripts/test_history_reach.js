/**
 * scripts/test_history_reach.js
 * 
 * 用于探索涂鸦云端历史数据的可达深度（7天、30天还是1年）。
 */

import dotenv from 'dotenv';
import { getAccessToken, tuyaGet } from '../backend/tuya/tuyaClient.js';

dotenv.config({ path: '../backend/.env' });

async function checkDepth() {
  const deviceId = '6cbe57f97b337a052bcfea'; // 您指定的猫砂盆
  const tests = [7, 15, 30, 90, 365]; // 测试天数
  
  console.log('🔍 [Depth Test] 开始探测涂鸦云端数据存储深度...');
  
  for (const days of tests) {
    const t = Date.now();
    const start = t - days * 24 * 3600 * 1000;
    // 尝试拉取那天开始的 24 小时数据
    const url = `/v1.0/devices/${deviceId}/logs?start_time=${start}&end_time=${start + 24 * 3600 * 1000}`;
    
    try {
      const res = await tuyaGet(url);
      console.log(`✅ [${days}天前]: 可达! 抓取到 ${res.logs.length} 条记录`);
      if (res.logs.length === 0) {
        console.warn(`⚠️ [${days}天前]: 虽然没有报错，但返回了 0 条数据。这可能是该天无活动，也可能是数据已清理。`);
      }
    } catch (err) {
      console.error(`❌ [${days}天前]: 不可达. 错误: ${err.message}`);
      if (err.message.includes('No permissions') || err.message.includes('expired')) {
        console.log('💡 探测终止：您的账户权限上限似乎在此处。');
        break;
      }
    }
  }
}

checkDepth();
