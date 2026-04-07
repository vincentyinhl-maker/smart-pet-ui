/**
 * backend/tuya/tuyaClient.js
 *
 * 涂鸦 OpenAPI 认证客户端
 * 负责：token 管理、请求签名、通用 API 调用
 *
 * 涂鸦签名规则：
 *   获取 Token:   sign = HMAC-SHA256(clientId + t, secret).toUpperCase()
 *   业务请求:     sign = HMAC-SHA256(clientId + accessToken + t, secret).toUpperCase()
 */

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL     = process.env.TUYA_BASE_URL     || 'https://openapi.tuyacn.com';
const CLIENT_ID    = process.env.TUYA_CLIENT_ID    || '';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '';

// ── Token 缓存（涂鸦 Token 有效期 7200 秒）──────────────────
let tokenCache = {
  accessToken:  null,
  refreshToken: null,
  expiresAt:    0,        // Unix ms
};

function hmacSign(str, secret) {
  return crypto.createHmac('sha256', secret).update(str).digest('hex').toUpperCase();
}

/**
 * 获取 / 刷新 Access Token
 */
export async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const t    = Date.now().toString();
  const sign = hmacSign(CLIENT_ID + t, CLIENT_SECRET);

  try {
    const resp = await axios.get(`${BASE_URL}/v1.0/token?grant_type=1`, {
      headers: {
        client_id:   CLIENT_ID,
        sign,
        t,
        sign_method: 'HMAC-SHA256',
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    if (!resp.data.success) {
      throw new Error(`涂鸦 Token 获取失败: ${resp.data.msg}`);
    }

    const { access_token, refresh_token, expire_time } = resp.data.result;
    tokenCache = {
      accessToken:  access_token,
      refreshToken: refresh_token,
      expiresAt:    Date.now() + expire_time * 1000,
    };

    console.log('[TuyaClient] Token 刷新成功');
    return access_token;
  } catch (err) {
    console.error('[TuyaClient] Token 获取失败:', err.message);
    throw err;
  }
}

/**
 * 构建带签名的请求头
 */
async function buildHeaders(method, path, body = '') {
  const token = await getAccessToken();
  const t     = Date.now().toString();

  // 业务请求签名格式
  const strToSign = CLIENT_ID + token + t;
  const sign      = hmacSign(strToSign, CLIENT_SECRET);

  return {
    client_id:   CLIENT_ID,
    access_token: token,
    sign,
    t,
    sign_method: 'HMAC-SHA256',
    'Content-Type': 'application/json',
  };
}

/**
 * 通用 GET 请求
 */
export async function tuyaGet(path) {
  const headers = await buildHeaders('GET', path);
  try {
    const resp = await axios.get(`${BASE_URL}${path}`, { headers, timeout: 10_000 });
    if (!resp.data.success) {
      throw new Error(`API 错误 [${path}]: ${resp.data.msg} (code: ${resp.data.code})`);
    }
    return resp.data.result;
  } catch (err) {
    console.error(`[TuyaClient] GET ${path} 失败:`, err.message);
    throw err;
  }
}

/**
 * 通用 POST 请求
 */
export async function tuyaPost(path, body = {}) {
  const headers = await buildHeaders('POST', path);
  try {
    const resp = await axios.post(`${BASE_URL}${path}`, body, { headers, timeout: 10_000 });
    if (!resp.data.success) {
      throw new Error(`API 错误 [${path}]: ${resp.data.msg} (code: ${resp.data.code})`);
    }
    return resp.data.result;
  } catch (err) {
    console.error(`[TuyaClient] POST ${path} 失败:`, err.message);
    throw err;
  }
}

/**
 * 获取设备当前所有 DP 状态
 * @param {string} deviceId
 * @returns {Object} { code: value, ... }
 */
export async function getDeviceStatus(deviceId) {
  const result = await tuyaGet(`/v1.0/devices/${deviceId}/status`);
  // 将数组格式 [{code, value}] 转为对象格式 {code: value}
  return Object.fromEntries(result.map(dp => [dp.code, dp.value]));
}

/**
 * 获取设备历史日志（最近 N 小时）
 * @param {string} deviceId
 * @param {number} hours
 */
export async function getDeviceLogs(deviceId, hours = 24) {
  const endTime   = Date.now();
  const startTime = endTime - hours * 3600 * 1000;
  const path = `/v2.0/cloud/thing/${deviceId}/shadow/logs?start_time=${startTime}&end_time=${endTime}&size=200`;
  try {
    return await tuyaGet(path);
  } catch (err) {
    // 部分设备不支持日志 API，返回空数组
    console.warn(`[TuyaClient] 设备 ${deviceId} 日志获取失败（可能不支持）:`, err.message);
    return { logs: [] };
  }
}

/**
 * 向设备发送控制命令
 * @param {string} deviceId
 * @param {Array}  commands  [{code, value}]
 */
export async function sendDeviceCommand(deviceId, commands) {
  return await tuyaPost(`/v1.0/devices/${deviceId}/commands`, { commands });
}

// ── 自检：启动时验证凭证 ────────────────────────────────────
export async function selfCheck() {
  if (!CLIENT_ID || CLIENT_ID === 'your_access_id_here') {
    console.warn('[TuyaClient] ⚠️  涂鸦凭证未配置，将使用模拟数据模式');
    return false;
  }
  try {
    await getAccessToken();
    console.log('[TuyaClient] ✅ 涂鸦 API 连接验证成功');
    return true;
  } catch {
    console.warn('[TuyaClient] ⚠️  涂鸦 API 连接失败，切换为模拟数据模式');
    return false;
  }
}
