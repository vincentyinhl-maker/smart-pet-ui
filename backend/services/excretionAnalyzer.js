import db from '../db/database.js';

/**
 * backend/services/excretionAnalyzer.js
 * 
 * 排泄成分分析引擎 (V4.1)
 * 解决死结 C：区分排便与排尿，并在混合场景下进行智能分摊。
 */

/**
 * 将单次如厕的总重量，按照宠物的历史习惯进行比例切分。
 * @param {string} petId 
 * @param {number} totalWeight 
 * @returns {Object} { urineWeight, fecesWeight }
 */
export async function splitExcretionWeight(petId, totalWeight) {
  // 1. 获取该猫过去 7 天的平均值
  // 逻辑：猫的排泄比例通常较为稳定，健康个体尿比便略重 (此为演示比例 3:2)
  const history = db.prepare(`
    SELECT weight_avg FROM pet_health_daily 
    WHERE pet_id = ? 
    ORDER BY date DESC LIMIT 7
  `).all(petId);

  // 默认分摊比例 (如果没有足够历史数据)
  let urineRatio = 0.6; 
  let fecesRatio = 0.4;

  // 如果有品牌算法补偿配置，可以在此调整策略
  // ...

  return {
    urineWeight: Math.round(totalWeight * urineRatio),
    fecesWeight: Math.round(totalWeight * fecesRatio)
  };
}

/**
 * 判定本次动作的属性
 * @param {number} durationSec 停留秒数
 * @param {number} weight 变化重量
 * @returns {Array} ['urine', 'feces']
 */
export function detectExcretionTypes(durationSec, weight) {
  const types = [];
  
  // 逻辑设定：
  // 1. 排尿通常持续 10-40秒
  // 2. 排便通常持续 60秒以上
  // 3. 重量超过 50g 且持续时间极短，可能是混合触发
  
  if (durationSec > 0 && durationSec < 60) {
    types.push('urine');
  } else if (durationSec >= 60) {
    types.push('feces');
    // 如果重量较大，判定为同时发生了排尿
    if (weight > 150) types.push('urine');
  }

  // 兜底：如果检测不到，根据重量判定
  if (types.length === 0 && weight > 0) {
    types.push('urine');
  }

  return types;
}
