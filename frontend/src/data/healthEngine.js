/**
 * Smart Pet Health Analysis Engine
 * Analyzes 4 core indicators vs. breed standard AND 7-day personal baseline.
 *
 * Differential Diagnosis:
 * - Deviates from standard BUT NOT from 7-day avg → Chronic condition
 * - Deviates from BOTH standard AND 7-day avg    → Acute condition
 */

// Behavioral norms consistent across breeds
export const BEHAVIOR_NORMS = {
  urination:   { min: 2, max: 4 },
  defecation:  { min: 1, max: 2 },
};

// Deviation thresholds (as fraction of standard midpoint)
const T = {
  HIGH:      0.40,   // >40% above midpoint → high
  MILD_HIGH: 0.20,   // 20-40% → mildly high
  MILD_LOW: -0.20,   // 20-40% below → mildly low
  LOW:      -0.40,   // >40% below midpoint → low
  ACUTE:     0.22,   // >22% change from 7-day avg → acute signal
};

export function pctFromMid(value, min, max) {
  const mid = (min + max) / 2;
  return (value - mid) / mid;
}
export function pctFrom7Day(current, baseline) {
  if (!baseline) return 0;
  return (current - baseline) / baseline;
}

function classify(dev) {
  if (dev >  T.HIGH)      return 'very-high';
  if (dev >  T.MILD_HIGH) return 'high';
  if (dev >= T.MILD_LOW)  return 'normal';
  if (dev >= T.LOW)       return 'low';
  return 'very-low';
}
function isHigh(c)  { return c === 'high' || c === 'very-high'; }
function isLow(c)   { return c === 'low'  || c === 'very-low';  }
function isAcute(current, baseline) {
  return Math.abs(pctFrom7Day(current, baseline)) >= T.ACUTE;
}

function push(alerts, alert) {
  if (!alerts.find(a => a.id === alert.id)) alerts.push(alert);
}

export function analyzeHealth({ current, sevenDay, standard }) {
  if (!standard) return { overallStatus: 'healthy', alerts: [], summary: '品种数据未加载。' };

  const wDev  = pctFromMid(current.weight,        standard.weightMin, standard.weightMax);
  const fDev  = pctFromMid(current.foodIntake,    standard.foodMin,   standard.foodMax);
  const waDev = pctFromMid(current.waterIntake,   standard.waterMin,  standard.waterMax);

  const wCls  = classify(wDev);
  const fCls  = classify(fDev);
  const waCls = classify(waDev);

  const wAcute  = isAcute(current.weight,        sevenDay.weight);
  const fAcute  = isAcute(current.foodIntake,     sevenDay.foodIntake);
  const waAcute = isAcute(current.waterIntake,    sevenDay.waterIntake);
  const peeAcute= isAcute(current.urinationCount, sevenDay.urinationCount);

  const peeFreq = current.urinationCount >= 6;
  const peeCrit = current.urinationCount >= 8;
  const pooLow  = current.defecationCount < 1;
  const pooHigh = current.defecationCount > 3;

  const alerts = [];

  // ── Pattern 1: CKD ── 多饮 + 体重下降
  if (isHigh(waCls) && isLow(wCls)) {
    const acute = waAcute || wAcute;
    push(alerts, {
      id: 'ckd', title: '慢性肾脏病 (CKD)',
      risk: acute ? 'acute' : 'chronic', severity: acute ? 'high' : 'medium',
      triggers: ['饮水量显著升高', '体重持续下降'],
      description: '肾脏失去浓缩尿液能力时，猫须大量饮水来排出代谢废物。CKD 是老龄猫第一死因。',
      recommendation: acute
        ? '🚨 饮水量近期骤升且体重骤降。请密切观察是否伴随呕吐/嗜睡，若出现立即就医。'
        : '📋 数据持续偏离但未急剧恶化（慢性演变）。建议近期安排血液检查（肌酐、SDMA、BUN）。',
    });
  }

  // ── Pattern 2: Diabetes ── 多饮 + 多食 + 体重下降
  if (isHigh(waCls) && isHigh(fCls) && isLow(wCls)) {
    alerts.splice(alerts.findIndex(a => a.id === 'ckd'), 1); // 更具体，替换CKD
    const acute = (waAcute && fAcute) || wAcute;
    push(alerts, {
      id: 'diabetes', title: '糖尿病 (Diabetes Mellitus)',
      risk: acute ? 'acute' : 'chronic', severity: acute ? 'high' : 'medium',
      triggers: ['饮水量升高', '食量增大', '体重下降（吃多变瘦）'],
      description: '身体无法利用葡萄糖 → "一直饥饿"多食；渗透性利尿 → 多饮多尿；组织消耗 → 体重下降。',
      recommendation: acute
        ? '🚨 三联征且近期有急剧变化，建议72小时内检测血糖、尿糖，排除糖尿病酮症酸中毒。'
        : '📋 符合早期糖尿病慢性进展。建议低糖高蛋白饮食，定期检测空腹血糖。',
    });
  }

  // ── Pattern 3: Hyperthyroidism ── 多食 + 体重下降（非糖尿病）
  if (isHigh(fCls) && isLow(wCls) && !alerts.find(a => a.id === 'diabetes')) {
    const acute = fAcute && wAcute;
    push(alerts, {
      id: 'hyperthyroidism', title: '甲状腺功能亢进 (甲亢)',
      risk: acute ? 'acute' : 'chronic', severity: 'medium',
      triggers: ['食量大增', '体重持续下降', '饮水正常或轻微升高'],
      description: '甲状腺素过多使代谢率异常增高，导致"越吃越瘦"。多发于7岁以上中老年猫，可伴随心跳加快、烦躁。',
      recommendation: acute
        ? '📍 变化较突然，建议尽快检测甲状腺素（T4/fT4），关注是否伴随心跳明显加速。'
        : '📋 符合甲亢慢性进展。建议检测甲状腺素，评估药物控制或碘放射治疗方案。',
    });
  }

  // ── Pattern 4: FLUTD / Urinary Obstruction ── 食减 + 频繁排尿
  if (isLow(fCls) && peeFreq) {
    const acute = fAcute || peeAcute || peeCrit;
    push(alerts, {
      id: 'flutd', title: peeCrit ? '🚨 尿路梗阻（急症警报）' : '下泌尿道综合征 (FLUTD)',
      risk: 'acute', severity: peeCrit ? 'critical' : 'high',
      triggers: ['食量明显下降', `排尿频次异常（当前 ${current.urinationCount} 次/天，正常 2-4 次）`],
      description: '频繁排尿但每次量少、食量减退是FLUTD典型信号。若频繁蹲盆但几乎无尿——尿路梗阻属24小时内可致死急症。',
      recommendation: peeCrit
        ? '🚨 极度频繁排尿！立刻检查猫咪是否能正常排尿。若无尿液排出，2-4小时内紧急就医！'
        : '📍 增加饮水（湿粮/流动饮水机），减少矿物质，必要时做尿检排除结石/感染。',
    });
  }

  // ── Pattern 5: Pancreatitis ── 食减 + 饮水不降反升
  if (isLow(fCls) && isHigh(waCls) && !alerts.find(a => a.id === 'flutd')) {
    const acute = fAcute;
    push(alerts, {
      id: 'pancreatitis', title: '慢性胰腺炎 (Pancreatitis)',
      risk: acute ? 'acute' : 'chronic', severity: acute ? 'high' : 'medium',
      triggers: ['食量明显减退', '饮水量不降反升', '可能伴随精神萎靡或呕吐'],
      description: '食量骤降同时饮水相对增多，可能伴恶心/呕吐，影响营养吸收。肥胖猫禁食超过48小时易并发脂肪肝。',
      recommendation: acute
        ? '📍 食量近期骤降持续24小时以上，请立即就医，防止脂肪肝并发症。'
        : '📋 建议低脂高消化率湿食，避免突然换粮，检测血清脂肪酶和淀粉酶。',
    });
  }

  // ── Pattern 6: Bowel – 排便异常
  if ((pooLow || pooHigh) && alerts.length === 0) {
    push(alerts, {
      id: 'bowel', title: pooLow ? '便秘 / 巨结肠症风险' : '肠道异常（IBD 风险）',
      risk: 'chronic', severity: 'medium',
      triggers: [`排便 ${current.defecationCount} 次/天（正常 1-2 次）`],
      description: pooLow
        ? '排便过少可能提示便秘或巨结肠症，长期便秘导致毒素积累，影响整体健康。'
        : '排便过于频繁伴随性状变化，可能指向炎症性肠病（IBD）或消化道肿瘤。',
      recommendation: '增加饮水量和膳食纤维摄入，观察粪便形态。若持续异常或伴随血便，请就医进行肠道检查。',
    });
  }

  // ── Pattern 7: Weight only standalone ──
  if ((isLow(wCls) || isHigh(wCls)) && alerts.length === 0) {
    const obese = isHigh(wCls);
    push(alerts, {
      id: 'weight-only', title: obese ? '体重超标（肥胖风险）' : '体重持续偏低（慢性病信号）',
      risk: wAcute ? 'acute' : 'chronic', severity: 'medium',
      triggers: [`当前体重 ${(current.weight / 1000).toFixed(2)}kg 偏离品种标准范围`],
      description: obese
        ? '体重超出品种标准上限，增加糖尿病、关节炎、心脏病风险。'
        : '短期内（1-3个月）体重无故下降5-10%具有极大临床意义。',
      recommendation: obese
        ? '建议减少热量密度，增加运动，参考品种标准喂食量。'
        : wAcute ? '📍 近期体重快速下降，建议1-2周内完整血液检查。' : '📋 建议定期称重，与兽医评估是否需要进一步检查。',
    });
  }

  if (alerts.length === 0) {
    return {
      overallStatus: 'healthy', alerts: [],
      metrics: { wCls, fCls, waCls },
      summary: '所有监控指标均在正常范围内。请继续当前饲养方式，建议每3-6个月定期体检。',
    };
  }

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasAcute    = alerts.some(a => a.risk === 'acute');
  return {
    overallStatus: hasCritical ? 'critical' : hasAcute ? 'warning' : 'caution',
    alerts,
    metrics: { wCls, fCls, waCls },
    summary: hasCritical
      ? '⚠️ 检测到急性危险信号！请立即观察猫咪行为，若出现异常立即就医。'
      : hasAcute
        ? '数据较上周均值出现显著波动，可能存在急性健康风险，建议尽快就医评估。'
        : '检测到慢性健康风险信号，数据与品种标准持续偏差，建议调整饲养或安排就诊。',
  };
}
