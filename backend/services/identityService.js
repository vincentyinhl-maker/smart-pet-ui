import db from '../db/database.js';
import eventBus, { IOT_EVENTS } from './eventBus.js';

/**
 * backend/services/identityService.js
 * 
 * 多猫多维识别引擎。
 * 核心逻辑：基于体重指纹、行为特征、RFID 置信度加权模型，
 * 将 IoT 设备数据准确分流给具体的宠物。
 */

const WEIGHT_TOLERANCE = 150; // 体重容差范围 (g)

/**
 * 核心识别函数
 * @param {Object} event { tuyaDeviceId, metricType, value, timestamp }
 * @returns {Object} { petId, confidence, source }
 */
export async function identifyPet(event) {
  const { tuyaDeviceId, metricType, value } = event;

  // 1. 查找该设备关联的所有可能宠物（多租户/多猫家庭场景）
  const candidates = db.prepare(`
    SELECT p.id as petId, p.name, prof.rfid_tag, prof.avg_weight, prof.confidence_bias
    FROM pets p
    JOIN devices d ON p.id = d.pet_id
    LEFT JOIN pet_identity_profiles prof ON p.id = prof.pet_id
    WHERE d.tuya_device_id = ?
  `).all(tuyaDeviceId);

  if (candidates.length === 0) {
    return { petId: 'ghost_' + tuyaDeviceId, confidence: 1.0, source: 'unregistered' };
  }

  // 如果只有一只猫，直接返回
  if (candidates.length === 1) {
    return { petId: candidates[0].petId, confidence: 1.0, source: 'single_bond' };
  }

  // --- 多猫家庭识别逻辑 ---

  // A. RFID 匹配 (最高置信度)
  if (metricType === 'rfid_tag') {
    const match = candidates.find(c => c.rfid_tag === value);
    if (match) return { petId: match.petId, confidence: 1.0, source: 'rfid' };
  }

  // B. 体重匹配 (中等置信度)
  if (metricType === 'weight') {
    const WEIGHT_CONFUSION_THRESHOLD = 200; // 用户指定：200g 以内视为死结
    let matches = candidates.filter(cat => 
      cat.avg_weight && Math.abs(cat.avg_weight - value) < WEIGHT_TOLERANCE
    );

    // [死结A] 处理逻辑：如果存在多只体重相近的猫（且无RFID数据干扰）
    if (matches.length > 1 && !event.rfid_tag) {
      const diffBetweenMatches = Math.abs(matches[0].avg_weight - matches[1].avg_weight);
      if (diffBetweenMatches < WEIGHT_CONFUSION_THRESHOLD) {
        console.log(`[Identity] 触发死结A：检测到体重漂移风险 (${matches[0].name} vs ${matches[1].name})，取消该打点的基准训练资格。`);
        return { 
          petId: matches[0].petId, // 仍然分配给最接近的一个，但置信度设极低
          confidence: 0.1, 
          source: 'weight_confusion_lock' 
        };
      }
    }

    let bestMatch = null;
    let minDiff = Infinity;

    matches.forEach(cat => {
      const diff = Math.abs(cat.avg_weight - value);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatch = cat;
      }
    });

    if (bestMatch) {
      const confidence = Math.max(0.6, 1 - (minDiff / WEIGHT_TOLERANCE));
      return { petId: bestMatch.petId, confidence, source: 'weight_fingerprint' };
    }
  }

  // C. 兜底策略：如果无法识别，归入该设备下的“暂不确定”影子账户，或者按权重最高的分配并标记低置信度
  return { 
    petId: candidates[0].petId, // 默认分配给第一个
    confidence: 0.3, 
    source: 'uncertain_assignment' 
  };
}

/**
 * 处理入库前的数据流转向
 */
export function initializeIdentityProcessor() {
  // 这里可以监听总线或者被 DataQueue 调用
  // 为了不改变现有逻辑，我们可以在 ingest 之前挂载这个 Hook
}
