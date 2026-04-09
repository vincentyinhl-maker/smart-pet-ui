import express from 'express';
import db from '../db/database.js';

const router = express.Router();

/**
 * [NEW] 影子数据认领接口 (V4.1)
 * 允许用户选择特定的“起始日期”，将 Ghost 库的历史数据迁移到宠物档案下。
 */
router.post('/device/:tuyaDeviceId/claim', (req, res) => {
  const { tuyaDeviceId } = req.params;
  const { petId, startDate } = req.body;

  if (!petId || !startDate) {
    return res.status(400).json({ error: 'Missing petId or startDate' });
  }

  try {
    // 1. 验证设备是否存在
    const device = db.prepare('SELECT * FROM devices WHERE tuya_device_id = ?').get(tuyaDeviceId);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    // 2. 迁移 sensor_events_log 中的相关数据 (GhostID -> RealPetID)
    const ghostId = 'ghost_' + tuyaDeviceId;
    const result = db.prepare(`
      UPDATE sensor_events_log 
      SET pet_id = ? 
      WHERE pet_id = ? AND recorded_at >= ?
    `).run(petId, ghostId, startDate);

    // 3. 标记设备正式归属于该宠物
    db.prepare('UPDATE devices SET pet_id = ? WHERE tuya_device_id = ?').run(petId, tuyaDeviceId);

    res.json({ 
      success: true, 
      claimedCount: result.changes,
      message: `成功为您找回针对 ${petId} 的 ${result.changes} 条历史健康记录。`
    });
  } catch (err) {
    console.error('[Claim] 导出失败:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
