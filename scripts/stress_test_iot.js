/**
 * scripts/stress_test_iot.js
 * 
 * 测试经理 AI 编写：高并发 IoT 模拟压测脚本。
 * 作用：模拟 1,000 台设备在短时间内发送 5,000 条传感器打点数据，
 * 验证后端 EventBus + DataQueue 的处理能力和稳定性。
 */

import axios from 'axios';

const API_ENDPOINT = 'http://localhost:3000/api/debug/inject-raw'; // 我们需要增加一个原始注入接口
const TOTAL_DEVICES = 1000;
const EVENTS_PER_DEVICE = 5;
const CONCURRENCY = 100; // 每秒并发数

async function runStressTest() {
  console.log(`\n🚀 [QA] 开始高并发压力测试...`);
  console.log(`📊 配置: ${TOTAL_DEVICES} 台设备, 每台 ${EVENTS_PER_DEVICE} 条数据, 总事件: ${TOTAL_DEVICES * EVENTS_PER_DEVICE}`);
  
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  const devices = Array.from({ length: TOTAL_DEVICES }, (_, i) => `stress_dev_${i}`);
  
  for (let i = 0; i < TOTAL_DEVICES; i++) {
    const promises = [];
    for (let j = 0; j < EVENTS_PER_DEVICE; j++) {
      const payload = {
        tuyaDeviceId: devices[i],
        metricType: Math.random() > 0.5 ? 'weight' : 'food_intake',
        value: Math.floor(Math.random() * 5000),
      };
      
      promises.push(
        axios.post(API_ENDPOINT, payload)
          .then(() => successCount++)
          .catch(() => failCount++)
      );

      // 控制并发速率
      if (promises.length >= CONCURRENCY) {
        await Promise.all(promises);
        promises.length = 0;
      }
    }
    await Promise.all(promises);
    if ((i + 1) % 100 === 0) console.log(`已发送 ${i + 1} 台设备的数据...`);
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ 测试完成!`);
  console.log(`⏱️  总耗时: ${duration}s`);
  console.log(`📈 成功: ${successCount}, 失败: ${failCount}`);
  console.log(`⚡ 吞吐量: ${(successCount / duration).toFixed(2)} req/s`);
}

runStressTest().catch(console.error);
