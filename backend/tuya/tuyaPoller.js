/**
 * backend/tuya/tuyaPoller.js (V2.0 网关接入口)
 *
 * 将涂鸦平台的数据流标准转换为应用层事件。
 * 现已高度解耦：这里只负责"收/拉"数据，不管数据属于谁；
 * 然后统一交由 ingestSensorEvent() 去路由分配。
 */

import cron from 'node-cron';
import { getDeviceStatus, getDeviceLogs, selfCheck, tuyaGet } from './tuyaClient.js';
import { LITTER_BOX_DPS, FEEDER_DPS, WATER_DPS } from './dpMappings.js';
import db, { upsertDeviceSnapshot } from '../db/database.js';
import eventBus, { IOT_EVENTS } from '../services/eventBus.js';
import { importHistoricalLogs } from '../services/tuyaImporter.js';

/**
 * 助手函数：将事件派发到异地总线，实现高并发兼容
 */
function emitIoTEvent(tuyaDeviceId, metricType, value) {
  eventBus.emit(IOT_EVENTS.STATION_DATA_RECEIVED, {
    tuyaDeviceId,
    metricType,
    value
  });
}

let tuyaConnected = false;

// ── 1. 涂鸦数据标准化解析管道 ──────────────────────────────
function parseLitterBoxData(tuyaId, statusObj) {
  upsertDeviceSnapshot(tuyaId, 'litter_box', statusObj);
  
  const w = statusObj[LITTER_BOX_DPS.CAT_WEIGHT];
  if (w && w > 500) emitIoTEvent(tuyaId, 'weight', w);
  
  // 涂鸦平台每次猫砂盆清扫完成也会触发事件，我们将其计作一次如厕
  const d = statusObj[LITTER_BOX_DPS.USE_DURATION];
  if (d && d > 0) emitIoTEvent(tuyaId, 'litter_usage', d);
}

function parseFeederData(tuyaId, statusObj) {
  upsertDeviceSnapshot(tuyaId, 'feeder', statusObj);
  
  const f = statusObj[FEEDER_DPS.FEED_AMOUNT];
  if (f && f > 0) emitIoTEvent(tuyaId, 'food_intake', f);
}

function parseWaterData(tuyaId, statusObj) {
  upsertDeviceSnapshot(tuyaId, 'water', statusObj);
  
  const w = statusObj[WATER_DPS.WATER_ONCE];
  if (w && w > 0) emitIoTEvent(tuyaId, 'water_intake', w);
}

// ── 2. 模拟真实世界传感器事件 (Demo 环境) ────────────────────
function triggerMockEvents() {
  const hour = new Date().getHours();
  // V2架构下，Demo 也要发送到设备 ID，然后依靠 DB 表映射回宠物
  const devLitter = process.env.DEVICE_ID_LITTER_BOX || 'dev_l_01';
  const devFeeder = process.env.DEVICE_ID_FEEDER || 'dev_f_01';
  const devWater  = process.env.DEVICE_ID_WATER || 'dev_w_01';

  // 模拟猫砂盆如厕（体重随机波动在 5.2kg - 5.5kg）
  if (Math.random() < 0.15) {
    const rawVal = 5200 + Math.round(Math.random() * 300);
    emitIoTEvent(devLitter, 'weight', rawVal);
    emitIoTEvent(devLitter, 'litter_usage', 120 + Math.round(Math.random() * 60));
  }

  // 模拟喂食器：早晨7点和晚间6点附近集中出粮
  if ((hour >= 7 && hour <= 9 || hour >= 18 && hour <= 20) && Math.random() < 0.3) {
    emitIoTEvent(devFeeder, 'food_intake', 25 + Math.round(Math.random() * 20));
  }

  // 模拟饮水机：白天随机时间喝水
  if (hour > 8 && hour < 23 && Math.random() < 0.25) {
    emitIoTEvent(devWater, 'water_intake', 15 + Math.round(Math.random() * 25));
  }
}

// ── 3. 定时轮询主入口 ────────────────────────────────────────
async function pollDevices() {
  if (!tuyaConnected) {
    triggerMockEvents();
    return;
  }

  // V4.1: 从数据库动态获取所有已绑定的涂鸦设备
  const devList = db.prepare('SELECT tuya_device_id, device_type FROM devices').all();
  if (devList.length === 0) return;

  const tasks = devList.map(dev => {
    return getDeviceStatus(dev.tuya_device_id)
      .then(status => {
        if (dev.device_type === 'litter_box' || dev.device_type === 'unknown') parseLitterBoxData(dev.tuya_device_id, status);
        else if (dev.device_type === 'feeder') parseFeederData(dev.tuya_device_id, status);
        else if (dev.device_type === 'water') parseWaterData(dev.tuya_device_id, status);
      })
      .catch(e => console.error(`[Poller] 设备 ${dev.tuya_device_id} (${dev.device_type}) 同步失败:`, e.message));
  });

  await Promise.allSettled(tasks);
}


export async function startPoller() {
  const interval = parseInt(process.env.POLL_INTERVAL_MINUTES || '5');
  tuyaConnected = await selfCheck();

  console.log(`[IoT Gateway] 启动。模式: ${tuyaConnected ? '云端直连' : '模拟引擎'}, 频率: ${interval}min`);

  if (tuyaConnected) {
    // V4.1 [增量补足]: 启动时拉取所有设备过去 24 小时丢失的数据
    console.log('[Poller] 启动数据补漏机制 (Catch-up)...');
    const devList = db.prepare('SELECT tuya_device_id FROM devices').all();
    for (const dev of devList) {
      await importHistoricalLogs(dev.tuya_device_id, 'startup_sync', 24).catch(() => {});
    }
  }

  // 启动即拉取或写入一次
  await pollDevices();
  cron.schedule(`*/${interval} * * * *`, pollDevices);
}

export { tuyaConnected };
