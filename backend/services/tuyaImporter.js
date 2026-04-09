import { getDeviceLogs } from '../tuya/tuyaClient.js';
import eventBus, { IOT_EVENTS } from './eventBus.js';
import { parseWebhookPayload } from './semanticAdapter.js';

/**
 * backend/services/tuyaImporter.js
 * 
 * 全量数据抓取服务 (QA 测试利器)
 * 允许用户通过 Access 凭证追溯该账户下所有设备的历史记录。
 */

export async function importHistoricalLogs(deviceId, tenantId, hours = 24 * 7) {
  console.log(`[Importer] 正在抓取设备 ${deviceId} 的历史日志 (${hours}小时)...`);
  
  try {
    const result = await getDeviceLogs(deviceId, hours);
    if (!result || !result.logs) return 0;

    // 按时间顺序对日志进行排序（防止时序死结）
    const sortedLogs = result.logs.sort((a, b) => a.event_time - b.event_time);

    let count = 0;
    sortedLogs.forEach(log => {
      // 模拟 Webhook 数据包格式进行归一化解析
      const mockPayload = {
        devId: deviceId,
        t: log.event_time,
        status: [{ code: log.code, value: log.value }]
      };

      const events = parseWebhookPayload(tenantId, mockPayload);
      events.forEach(event => {
        eventBus.emit(IOT_EVENTS.STATION_DATA_RECEIVED, event);
        count++;
      });
    });

    return count;
  } catch (err) {
    console.error(`[Importer] 设备 ${deviceId} 同步失败:`, err.message);
    return 0;
  }
}
