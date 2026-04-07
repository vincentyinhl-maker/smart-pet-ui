import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import healthDataRoutes from './routes/healthData.js';
import debugRoutes from './routes/debug.js';
import { startPoller } from './tuya/tuyaPoller.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── 路由 ──────────────────────────────────────────────────────
app.use('/api', apiRoutes);          // 原有路由（登录/设备列表等）
app.use('/api', healthDataRoutes);   // 健康数据 + 设备控制
app.use('/api/debug', debugRoutes);  // V3.0 上帝模式调试通道

// ── 系统健康检查 ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Pet Backend is running', time: new Date().toISOString() });
});

// ── 启动服务 ──────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Smart Pet Backend → http://localhost:${PORT}`);
  console.log('──────────────────────────────────────────');

  // 启动数据拉取定时任务（涂鸦连接 or 演示模式）
  try {
    await startPoller();
  } catch (err) {
    console.error('[Server] 轮询器启动失败:', err.message);
  }

  console.log('──────────────────────────────────────────');
  console.log('📋 API 端点：');
  console.log(`   GET  /api/health/sensor-data   — 完整传感器数据`);
  console.log(`   GET  /api/health/today          — 今日指标`);
  console.log(`   GET  /api/health/sevenday       — 7日均值`);
  console.log(`   GET  /api/health/litter-trend   — 猫砂盆趋势`);
  console.log(`   GET  /api/health/diet-trend     — 饮食趋势`);
  console.log(`   GET  /api/devices/status        — 设备状态`);
  console.log(`   POST /api/devices/feed          — 远程喂食`);
  console.log(`   GET  /api/system/status         — 系统诊断`);
  console.log('──────────────────────────────────────────\n');
});
