import db from '../db/database.js';

/**
 * backend/services/anomalyDetector.js
 * 
 * 异常数据拦截引擎 (V4.1)
 * 解决：打翻喂水器、无意义跳跃、便秘/尿闭前兆识别。
 */

export async function checkAnomaly(petId, metricType, value, duration = 0) {
  // 1. 物理极限过滤：严重偏离正常值的数据直接舍弃
  // 例如：猫不可能重 30kg (除非是豹子)，喝水不可能瞬间 5000ml
  if (metricType === 'weight' && (value > 20000 || value < 500)) return { isAnomaly: true, reason: 'physical_limit' };
  if (metricType === 'water_intake' && value > 1000) return { isAnomaly: true, reason: 'vessel_tipped' };

  // 2. 猫砂盆无效动作识别
  if (metricType === 'litter_usage') {
    // 动作极快且无重量变化 -> 视为跳进跳出，舍弃计数
    if (duration < 5 && (!value || value < 10)) {
      return { isAnomaly: true, reason: 'quick_jump' };
    }

    // [关键业务点] 便秘/尿闭前兆识别
    // 逻辑：时间很长 (如 > 180秒) 且重量为 0。
    if (duration > 180 && (!value || value < 5)) {
      return { 
        isAnomaly: false, // 不作为异常舍弃，而作为特殊的健康信号保留
        isHealthSignal: true, 
        signalType: 'straining_detected' 
      };
    }
  }

  return { isAnomaly: false };
}
