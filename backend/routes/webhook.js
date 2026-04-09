import express from 'express';
import eventBus, { IOT_EVENTS } from '../services/eventBus.js';
import { parseWebhookPayload } from '../services/semanticAdapter.js';

const router = express.Router();

/**
 * [NEW] 平台标准 Webhook 入口 (V4.0)
 * 供不同品牌商推送设备数据。
 * URL: /api/webhook/iot/:tenantId
 */
router.post('/iot/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  const payload = req.body;

  try {
    // 1. 通过语义适配器解析多品牌异构 Payload
    const events = parseWebhookPayload(tenantId, payload);

    // 2. 将解析后的标准事件派发到总线
    events.forEach(event => {
      eventBus.emit(IOT_EVENTS.STATION_DATA_RECEIVED, event);
    });

    res.json({ success: true, processed: events.length });
  } catch (err) {
    console.error(`[Webhook] 品牌 ${tenantId} 数据解析失败:`, err.message);
    res.status(400).json({ success: false, error: 'Payload format mismatch' });
  }
});

export default router;
