/**
 * backend/services/semanticAdapter.js
 * 
 * 语义化适配器：解决多品牌、异构数据接口的归一化问题。
 * 将不同品牌的原始 DP (Data Point) 数据转换为 Heybo 系统标准的指标。
 */

// 预设的语义映射表 (实际生产环境建议存储在数据库中，支持动态更新)
const BRAND_MAPS = {
  't_heybo': {
    // 涂鸦编码 -> 标准指标
    'weight': 'weight',
    'food_intake': 'food_intake',
    'water_intake': 'water_intake',
    'litter_usage': 'litter_usage',
    'rfid': 'rfid_tag'
  },
  'brand_generic_tuya': {
    // 假设某品牌的 DP Code 不同
    '101': 'weight',
    '102': 'food_intake',
    '105': 'litter_usage'
  }
};

/**
 * 核心转换函数
 * @param {string} tenantId 品牌ID
 * @param {string} rawKey 原始代码 (如 DP Code)
 * @param {any} rawValue 原始值
 * @returns {Object|null} { metric: string, value: any }
 */
export function translateMetric(tenantId, rawKey, rawValue) {
  const map = BRAND_MAPS[tenantId] || BRAND_MAPS['brand_generic_tuya'];
  
  const standardMetric = map[rawKey];
  
  if (!standardMetric) {
    // 如果没有映射，尝试直接透传（兼容自定义标准）
    return { metric: rawKey, value: rawValue };
  }

  // 可以在这里进行单位转换 (例如：g 转 kg)
  let processedValue = rawValue;
  if (standardMetric === 'weight' && rawValue > 1000) {
    // 假设某些品牌发来的是克，系统标准是kg (演示版本目前统一用克处理)
    // processedValue = rawValue / 1000;
  }

  return {
    metric: standardMetric,
    value: processedValue
  };
}

/**
 * 解析来自不同品牌的 Webhook Payloads
 * 支持将整个 JSON 对象转换为标准事件数组
 */
export function parseWebhookPayload(tenantId, payload) {
  const events = [];
  
  // 这里可以根据不同品牌的 Webhook 结构编写不同的解析逻辑
  // 涂鸦标准 Webhook 通常有 status 数组
  if (payload.status && Array.isArray(payload.status)) {
    payload.status.forEach(item => {
      const translated = translateMetric(tenantId, item.code, item.value);
      if (translated) {
        events.push({
          tuyaDeviceId: payload.devId,
          metricType: translated.metric,
          value: translated.value,
          timestamp: payload.t || Date.now()
        });
      }
    });
  }

  return events;
}
