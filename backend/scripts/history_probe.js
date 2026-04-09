import dotenv from 'dotenv';
import { tuyaGet, getAccessToken } from '../tuya/tuyaClient.js';

dotenv.config();

async function checkDepth() {
  const deviceId = '6cbe57f97b337a052bcfea';
  const tests = [7, 15, 30, 90, 365];
  
  console.log('🔍 [Depth Test] 开始探测涂鸦云端数据存储深度...');
  
  try {
    const token = await getAccessToken();
    console.log('✅ Token 获取成功');
    
    for (const days of tests) {
      const t = Date.now();
      const start = t - days * 24 * 3600 * 1000;
      const end = start + 24 * 3600 * 1000;
      // 使用 V2 Shadow Logs 接口，按照字母顺序排序参数：end_time, size, start_time
      const url = `/v2.0/cloud/thing/${deviceId}/shadow/logs?end_time=${end}&size=100&start_time=${start}`;
      
      try {
        const res = await tuyaGet(url);
        console.log(`✅ [${days}天前]: 可达! 抓取到 ${res.logs.length} 条记录`);
      } catch (err) {
        console.error(`❌ [${days}天前]: 不可达. 错误: ${err.message}`);
        if (err.message.includes('No permissions') || err.message.includes('expired')) {
          break;
        }
      }
    }
  } catch (e) {
    console.error('❌ 测试启动失败:', e.message);
  }
}

checkDepth();
