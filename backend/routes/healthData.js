/**
 * backend/routes/healthData.js (V2.0)
 *
 * REST API 路由，对接宠物主线的降采样数据接口。
 * 支持长时间跨度（如 180, 360 天）请求及空值滑窗自动填补。
 */

import express from 'express';
import {
  getTodayMetrics,
  getSevenDayAvg,
  getLitterBoxTrend,
  getDietWaterTrend,
  getDeviceStatusSummary,
  getFullSensorData,
  recordExtraMeal,
  updatePetInfo,
} from '../services/dataProcessor.js';
import { sendDeviceCommand } from '../tuya/tuyaClient.js';
import { DEVICE_IDS, FEEDER_DPS } from '../tuya/dpMappings.js';
import { tuyaConnected } from '../tuya/tuyaPoller.js';
import { DEFAULT_V2_PET_ID } from '../db/database.js';

const router = express.Router();

/** 通用获取请求目标宠物 ID */
function getPetId(req) {
  return req.query.petId || req.body.petId || DEFAULT_V2_PET_ID;
}

// ── 宠物级健康长效数据接口 ──────────────────────────────────

/**
 * GET /api/health/sensor-data
 * 返回完整的数据缓存
 */
router.get('/health/sensor-data', (req, res) => {
  try {
    const petId = getPetId(req);
    const data = getFullSensorData(petId);
    res.json({ success: true, data, mode: tuyaConnected ? 'live' : 'demo' });
  } catch (err) {
    console.error('[API] /health/sensor-data 错误:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /api/health/today */
router.get('/health/today', (req, res) => {
  try {
    res.json({ success: true, data: getTodayMetrics(getPetId(req)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /api/health/sevenday */
router.get('/health/sevenday', (req, res) => {
  try {
    res.json({ success: true, data: getSevenDayAvg(getPetId(req)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/health/litter-trend?days=360
 * 支持长达数十年的平滑降采样输出
 */
router.get('/health/litter-trend', (req, res) => {
  const days = Math.min(parseInt(req.query.days || '7'), 3650); // 最高支援十年(3650天)查询
  try {
    res.json({ success: true, data: getLitterBoxTrend(days, getPetId(req)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/health/diet-trend?days=360
 */
router.get('/health/diet-trend', (req, res) => {
  const days = Math.min(parseInt(req.query.days || '7'), 3650);
  try {
    res.json({ success: true, data: getDietWaterTrend(days, getPetId(req)) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── V2 预留开放网关及控制接口 ──────────────────────────────────

/** GET /api/devices/status */
router.get('/devices/status', (req, res) => {
  try {
    res.json({
      success: true,
      data: getDeviceStatusSummary(),
      mode: tuyaConnected ? 'live' : 'demo',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** POST /api/devices/feed */
router.post('/devices/feed', async (req, res) => {
  const { amount = 20 } = req.body;

  if (!DEVICE_IDS.FEEDER) {
    return res.status(400).json({ success: false, error: '喂食器没绑定' });
  }
  if (!tuyaConnected) {
    return res.json({ success: true, message: `已模拟下发 ${amount}g 喂食控制命令`, demo: true });
  }

  try {
    await sendDeviceCommand(DEVICE_IDS.FEEDER, [{ code: FEEDER_DPS.MANUAL_FEED, value: Math.round(amount) }]);
    res.json({ success: true, message: `出粮指令成功下发 ${amount}g` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** GET /api/system/status */
router.get('/system/status', (req, res) => {
  res.json({
    success:   true,
    version:   '2.0 (Pet-Centric Scalable Engine)',
    tuyaMode:  tuyaConnected ? 'live' : 'demo',
    deviceIds: {
      litterBox: DEVICE_IDS.LITTER_BOX ? '已配置' : '未配置',
      feeder:    DEVICE_IDS.FEEDER     ? '已配置' : '未配置',
      water:     DEVICE_IDS.WATER      ? '已配置' : '未配置',
    },
    serverTime: new Date().toISOString(),
  });
});

/** POST /api/health/extra-meal */
router.post('/health/extra-meal', (req, res) => {
  const { food = 0, water = 0 } = req.body;
  const petId = getPetId(req);
  try {
    const updated = recordExtraMeal(petId, food, water);
    res.json({ success: true, data: updated, message: '加餐记录成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
/** PATCH /api/pets/:id */
router.patch('/pets/:id', (req, res) => {
  const { id } = req.params;
  const { name, breed } = req.body;
  try {
    updatePetInfo(id, { name, breed });
    res.json({ success: true, message: '宠物档案更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
