import { EventEmitter } from 'events';

/**
 * backend/services/eventBus.js
 * 
 * 系统跨层解耦的核心：异步事件总线。
 * 将 IoT 物理层数据的接收（Polling/Pulsar）与 业务逻辑层（DB/Alert）彻底隔离。
 */
class GlobalEventBus extends EventEmitter {}

const eventBus = new GlobalEventBus();

// 事件类型定义常量
export const IOT_EVENTS = {
  STATION_DATA_RECEIVED: 'tuya:raw_data',  // 涂鸦原始打点
  HEALTH_ALERT_TRIGGERED: 'health:alert', // 健康建议引擎触发预警
  DEVICE_STATUS_CHANGE: 'device:status'   // 设备在线离线状态变更
};

export default eventBus;
