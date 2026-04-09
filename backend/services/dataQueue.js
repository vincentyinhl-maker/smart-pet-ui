import eventBus, { IOT_EVENTS } from './eventBus.js';
import { ingestSensorEvent } from '../db/database.js';
import { identifyPet } from './identityService.js';
import { checkAnomaly } from './anomalyDetector.js';

/**
 * backend/services/dataQueue.js
 * 
 * 高并发削峰缓冲池。
 * 作用：将海量分散的 IoT 写入请求进行秒级聚合，大幅减少 SQLite/DB 的事务竞争压力。
 * 即使未来迁移到 PostgreSQL，也能作为很好的批量写入器。
 */

const FLUSH_INTERVAL = 2000; // 2秒聚合一次
let queue = [];
let isProcessing = false;

/**
 * 启动队列监听器
 */
export function startDataQueueProcessor() {
  console.log(`[DataQueue] 已启动每 ${FLUSH_INTERVAL}ms 一次的批量同步机制`);

  // 监听来自事件总线的原始数据
  eventBus.on(IOT_EVENTS.STATION_DATA_RECEIVED, (data) => {
    queue.push(data);
    // 如果队列过大（例如超过1000条），可以触发即时处理
    if (queue.length >= 1000) {
      processQueue();
    }
  });

  // 定时将积压的数据落盘
  setInterval(processQueue, FLUSH_INTERVAL);
}

/**
 * 执行落盘处理
 */
async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  const currentBatch = [...queue];
  queue = [];

  try {
    const startTime = Date.now();
    
    // SQLite 聚合逻辑：虽然 ingestSensorEvent 目前是单笔处理，
    // 但在这里我们可以通过事务上下文进行外封装 (如果 database.js 暴露了事务句柄)
    // 目前先通过顺序调用验证逻辑
    for (const event of currentBatch) {
      const { tuyaDeviceId, metricType, value } = event;
      
      // V4.1: [新逻辑] 异常数据拦截
      const { isAnomaly, reason, isHealthSignal, signalType } = await checkAnomaly(null, metricType, value, event.duration || 0);
      if (isAnomaly) {
        console.warn(`[DataQueue] 拦截异常数据 (${metricType}): ${reason}`);
        continue;
      }

      // V4.0: 通过生物识别引擎寻找主人 (可能返回 GhostID)
      const { petId, confidence, source } = await identifyPet(event);
      
      // 如果检测到特殊健康信号（如霸坑便秘），透传给存储层
      const meta = { 
        confidence, 
        source, 
        isHealthSignal, 
        signalType,
        duration: event.duration 
      };

      ingestSensorEvent(petId, tuyaDeviceId, metricType, value, meta);
    }

    const duration = Date.now() - startTime;
    if (currentBatch.length > 50) {
      console.log(`[DataQueue] 成功聚合处理 ${currentBatch.length} 条数据，耗时 ${duration}ms`);
    }
  } catch (err) {
    console.error('[DataQueue] 批量处理失败:', err.message);
  } finally {
    isProcessing = false;
  }
}
