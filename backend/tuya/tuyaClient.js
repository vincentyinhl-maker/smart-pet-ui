/**
 * backend/tuya/tuyaClient.js
 *
 * 涂鸦 OpenAPI 认证客户端 (V2 全量签名修正版)
 * 解决 uri path invalid 与 签名不匹配问题。
 */

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL      = process.env.TUYA_BASE_URL      || 'https://openapi.tuyacn.com';
const CLIENT_ID     = process.env.TUYA_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '';

let tokenCache = {
  accessToken:  null,
  expiresAt:    0,
};

/**
 * 计算涂鸦 V2 签名
 * 注意：url 必须包含并排序好 query 参数
 */
function calcSign(clientId, secret, t, accessToken, method, url, body = '') {
  const contentHash = crypto.createHash('sha256').update(body).digest('hex');
  const stringToSign = [method, contentHash, '', url].join('\n');
  const signStr = clientId + (accessToken || '') + t + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

export async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const t = Date.now().toString();
  const url = '/v1.0/token?grant_type=1';
  const sign = calcSign(CLIENT_ID, CLIENT_SECRET, t, null, 'GET', url, '');

  try {
    const resp = await axios.get(`${BASE_URL}${url}`, {
      headers: {
        client_id: CLIENT_ID,
        sign,
        t,
        sign_method: 'HMAC-SHA256',
      }
    });

    if (!resp.data.success) throw new Error(resp.data.msg);

    const { access_token, expire_time } = resp.data.result;
    tokenCache = {
      accessToken: access_token,
      expiresAt: Date.now() + expire_time * 1000,
    };
    return access_token;
  } catch (err) {
    console.error('[TuyaClient] Token 获取失败:', err.message);
    throw err;
  }
}

async function request(method, url, body = {}) {
  const token = await getAccessToken();
  const t = Date.now().toString();
  const bodyStr = (method === 'GET' || !body) ? '' : JSON.stringify(body);
  
  // 核心：自动对 Query 参数按字典序排序，防止 uri path invalid
  const [path, query] = url.split('?');
  let sortedUrl = path;
  if (query) {
    const params = new URLSearchParams(query);
    const sortedParams = new URLSearchParams([...params.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    sortedUrl = `${path}?${sortedParams.toString()}`;
  }

  const sign = calcSign(CLIENT_ID, CLIENT_SECRET, t, token, method, sortedUrl, bodyStr);

  const config = {
    method,
    url: `${BASE_URL}${sortedUrl}`,
    headers: {
      client_id: CLIENT_ID,
      access_token: token,
      sign,
      t,
      sign_method: 'HMAC-SHA256',
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  };

  if (method === 'POST') config.data = body;

  const resp = await axios(config);
  if (!resp.data.success) {
    throw new Error(`API Error [${url}]: ${resp.data.msg}`);
  }
  return resp.data.result;
}

export const tuyaGet = (url) => request('GET', url);
export const tuyaPost = (url, body) => request('POST', url, body);

/**
 * 获取设备历史日志
 * 修正：确保参数按字典序排序以匹配涂鸦签名校验
 */
export async function getDeviceLogs(deviceId, hours = 24) {
  const endTime = Date.now();
  const startTime = endTime - hours * 3600 * 1000;
  
  // 参数按 code 排序：end_time, size, start_time
  const url = `/v2.0/cloud/thing/${deviceId}/shadow/logs?end_time=${endTime}&size=500&start_time=${startTime}`;
  return await tuyaGet(url);
}

export async function getDeviceStatus(deviceId) {
  const result = await tuyaGet(`/v1.0/devices/${deviceId}/status`);
  return Object.fromEntries(result.map(dp => [dp.code, dp.value]));
}

export async function selfCheck() {
  if (!CLIENT_ID) return false;
  try {
    await getAccessToken();
    console.log('[TuyaClient] ✅ 涂鸦 API 连接验证成功');
    return true;
  } catch {
    console.warn('[TuyaClient] ⚠️  涂鸦 API 连接失败，将切换为观测模式');
    return false;
  }
}

export async function sendDeviceCommand(deviceId, commands) {
  return await tuyaPost(`/v1.0/devices/${deviceId}/commands`, { commands });
}

export default { tuyaGet, tuyaPost, getDeviceLogs, getAccessToken, getDeviceStatus, selfCheck, sendDeviceCommand };
