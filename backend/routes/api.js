import express from 'express';
import jwt from 'jsonwebtoken';
import { findUserByEmail } from '../db/database.js';
import { mockDevices, mockHistory } from '../data/mockData.js';

const router = express.Router();
const SECRET_KEY = 'super_secret_pet_key_for_demo';

// POST /api/login - 用户登录 (V4.2 数据库对齐版)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // 核心：从数据库查询用户
  const user = findUserByEmail(email);

  if (user && user.password === password) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
    return res.json({ 
      token, 
      user: { 
        id: user.id,
        name: user.name, 
        email: user.email,
        role: user.role 
      }
    });
  }

  return res.status(401).json({ error: '邮箱或密码错误，演示请使用 demo@heybopet.com / demo123' });
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/devices - 获取设备列表
router.get('/devices', authMiddleware, (req, res) => {
  // Simulate network delay
  setTimeout(() => res.json({ devices: mockDevices }), 500);
});

// POST /api/feed - 手动触发喂食
router.post('/feed', authMiddleware, (req, res) => {
  const { deviceId, amount } = req.body;
  const device = mockDevices.find(d => d.id === deviceId);
  
  if (!device || device.type !== 'feeder') {
    return res.status(400).json({ error: '无效的喂食器设备' });
  }

  // Update mock state
  const time = new Date().toISOString();
  device.foodLevel = Math.max(0, device.foodLevel - (amount / 100)); // Rough math for demo
  device.lastFed = time;
  
  const newHistory = {
    id: `his_${Date.now()}`,
    deviceId,
    amount,
    timestamp: time,
    target: "手动喂食"
  };
  mockHistory.unshift(newHistory); // add to top
  
  setTimeout(() => res.json({ status: 'success', timestamp: time, newLevel: device.foodLevel }), 800);
});

// GET /api/history - 获取喂食记录
router.get('/history', authMiddleware, (req, res) => {
  const deviceId = req.query.deviceId;
  let records = mockHistory;
  if (deviceId) {
    records = records.filter(h => h.deviceId === deviceId);
  }
  res.json({ records });
});

export default router;
