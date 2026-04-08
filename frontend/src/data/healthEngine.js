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

// Deviation thresholds (as fraction of standard midpoint or baseline)
const T = {
  HIGH:      0.35,   // >35% above midpoint → high (slightly more sensitive)
  MILD_HIGH: 0.15,   // 15-35% → mildly high
  MILD_LOW: -0.15,   // 15-35% below → mildly low
  LOW:      -0.35,   // >35% below midpoint → low
  ACUTE:     0.20,   // >20% change from 7-day avg → acute signal
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
function isAcute(current, baseline, threshold = T.ACUTE) {
  if (!baseline) return false;
  return Math.abs(pctFrom7Day(current, baseline)) >= threshold;
}

function push(alerts, alert) {
  if (!alerts.find(a => a.id === alert.id)) alerts.push(alert);
}

export function analyzeHealth({ current, sevenDay, standard }) {
  if (!standard) return { overallStatus: 'healthy', alerts: [], summary: '品种数据未加载。' };

  // 1. Calculate Deviations vs Standard
  const wDev  = pctFromMid(current.weight,        standard.weightMin, standard.weightMax);
  const fDev  = pctFromMid(current.foodIntake,    standard.foodMin,   standard.foodMax);
  const waDev = pctFromMid(current.waterIntake,   standard.waterMin,  standard.waterMax);

  const wCls  = classify(wDev);
  const fCls  = classify(fDev);
  const waCls = classify(waDev);

  // 2. Calculate Acute Changes vs 7-day Average
  const wAcute  = isAcute(current.weight,        sevenDay.weight, 0.05); // Weight is very sensitive (5% is acute)
  const fAcute  = isAcute(current.foodIntake,     sevenDay.foodIntake);
  const waAcute = isAcute(current.waterIntake,    sevenDay.waterIntake);
  const peeAcute= isAcute(current.urinationCount, sevenDay.urinationCount);

  const fDrop   = pctFrom7Day(current.foodIntake, sevenDay.foodIntake) < -0.4; // 40% drop is severe
  const waSpike = pctFrom7Day(current.waterIntake, sevenDay.waterIntake) > 0.5; // 50% increase is major

  const peeFreq = current.urinationCount >= 6;
  const peeCrit = current.urinationCount >= 8;
  const pooZero = current.defecationCount === 0;
  const pooHigh = current.defecationCount > 3;

  const alerts = [];

  // ── Pattern 1: Diabetes ── 多饮 + 多食 + 体重下降 (Acute or Chronic)
  if ((isHigh(waCls) || waSpike) && (isHigh(fCls) || fAcute) && (isLow(wCls) || wAcute)) {
    const acute = waSpike || fAcute || wAcute;
    push(alerts, {
      id: 'diabetes', title: '糖尿病风险 (Diabetes Mellitus)',
      risk: acute ? 'acute' : 'chronic', severity: acute ? 'high' : 'medium',
      triggers: ['饮水量异常升高', '食量持续增加', '体重由于代谢异常而下降'],
      description: '猫糖尿病典型三联征：即使食欲增加也会变瘦。葡萄糖随尿液排出带走大量水分，导致口渴。',
      recommendation: acute
        ? '🚨 三联征呈现急性恶化。建议 48 小时内检测血糖与尿糖，排除酮症酸中毒风险。'
        : '📋 呈现慢性进展趋势。建议预约兽医进行禁食血糖检测，并考虑切换低碳水饮食。',
    });
  }

  // ── Pattern 2: CKD ── 多饮 + 体重下降 (No polyphagia)
  if ((isHigh(waCls) || waSpike) && (isLow(wCls) || wAcute) && !alerts.find(a => a.id === 'diabetes')) {
    const acute = waSpike || wAcute;
    push(alerts, {
      id: 'ckd', title: '肾脏健康预警 (CKD)',
      risk: acute ? 'acute' : 'chronic', severity: acute ? 'high' : 'medium',
      triggers: ['多饮多尿', '体重进行性下降'],
      description: '肾功能减退导致尿液无法浓缩，猫被迫大量饮水以排出毒素，伴随肌肉流失和体重减轻。',
      recommendation: acute
        ? '🚨 饮水量剧增且体重突减。请检查是否伴随呕吐，建议立即进行肾功三项检查。'
        : '📋 符合慢性肾病早期特征。建议检测肌酐、SDMA、BUN 以及尿比重。',
    });
  }

  // ── Pattern 3: Anorexia/Hyporexia ── 食量骤降
  if (fDrop) {
    push(alerts, {
      id: 'anorexia', title: '食欲废绝 / 严重厌食',
      risk: 'acute', severity: 'critical',
      triggers: [`今日摄食量仅 ${current.foodIntake}g (较均值下降 ${Math.abs(pctFrom7Day(current.foodIntake, sevenDay.foodIntake)*100).toFixed(0)}%)`],
      description: '猫咪禁食超过 24-48 小时，特别是肥胖猫，极大风险诱发脂肪肝（肝脂质沉积症），这是致死性的。',
      recommendation: '🚨 紧急！尝试提供高适口性食物（主食罐头、零食）。若 24 小时内仍不进食，必须立即就医给药或插管。',
    });
  }

  // ── Pattern 4: FLUTD / Obstruction ── 频急排尿
  if (peeFreq || peeCrit) {
    push(alerts, {
      id: 'flutd', title: peeCrit ? '🚨 疑似尿路梗阻（致命急症）' : '下泌尿道疾病 (FLUTD)',
      risk: 'acute', severity: peeCrit ? 'critical' : 'high',
      triggers: [`排尿高达 ${current.urinationCount} 次/天 (正常 2-4 次)`],
      description: '频繁蹲盆可能代表尿道炎症、结石或结晶。若表现为有尿意但无尿产出（梗阻），24 小时内可引发尿毒症。',
      recommendation: peeCrit
        ? '🚨 极高频排尿！检查猫砂盆是否有实际尿量。若仅为滴尿或无尿，请立即就近急诊！'
        : '📍 增加饮水量，尝试湿粮，减少应激源，并观察是否有血尿情况。',
    });
  }

  // ── Pattern 5: Constipation ── 闭便
  if (pooZero) {
    push(alerts, {
      id: 'constipation', title: '便秘 / 巨结肠症风险',
      risk: 'acute', severity: 'medium',
      triggers: ['今日无排便记录'],
      description: '若连续 2-3 天无排便，脱水的粪便会嵌塞在结肠，引发腹痛、食欲下降。',
      recommendation: '📍 增加膳食纤维（南瓜泥）和饮水量。若伴随呕吐或持续不排便，请就医通便。',
    });
  }

  // ── Pattern 6: Hyperthyroidism ── 多食 + 体重下降 (Simple spike)
  if (isHigh(fCls) && (isLow(wCls) || wAcute) && !alerts.find(a => a.id === 'diabetes')) {
    push(alerts, {
      id: 'hyperthyroidism', title: '甲状腺功能亢进风险',
      risk: fAcute ? 'acute' : 'chronic', severity: 'medium',
      triggers: ['代谢水平异常', '摄食增加但消瘦'],
      description: '多见于中老年猫。代谢率过高导致能量消耗远超摄入。',
      recommendation: '📋 建议检测总 T4 水平。关注猫咪是否伴随烦躁、心跳过快等症状。',
    });
  }

  // ── Pattern 7: Acute Weight Loss Only ──
  if (wAcute && alerts.length === 0) {
    push(alerts, {
      id: 'acute-weight-drop', title: '体重急性骤降',
      risk: 'acute', severity: 'high',
      triggers: [`体重较均值下降 ${Math.abs(pctFrom7Day(current.weight, sevenDay.weight)*100).toFixed(1)}%`],
      description: '短期内的体重显著下降是严重的急性疾病信号，可能涉及内脏炎症或代谢崩溃。',
      recommendation: '🚨 建议 24-48 小时内寻求兽医帮助，进行生化与血常规筛查。',
    });
  }

  // ── Pattern 8: Weight Check (Chronic) ──
  if ((isLow(wCls) || isHigh(wCls)) && alerts.length === 0) {
    const obese = isHigh(wCls);
    push(alerts, {
      id: 'weight-only', title: obese ? '超重/肥胖预警' : '消瘦/营养不良',
      risk: 'chronic', severity: 'medium',
      triggers: [`体重 ${(current.weight / 1000).toFixed(2)}kg 显著偏离品种标准`],
      description: obese ? '增加关节炎、肝病和糖尿病风险。' : '可能存在吸收障碍或未发现的慢性消耗性疾病。',
      recommendation: obese ? '建议调整每餐克数，增加互动运动。' : '建议排除寄生虫感染或由于口味挑剔导致的摄入不足。',
    });
  }

  // 3. Final Overall Status
  if (alerts.length === 0) {
    return {
      overallStatus: 'healthy', alerts: [],
      metrics: { wCls, fCls, waCls },
      summary: '所有核心指标均处于稳定区间。请继续保持当前的科学喂养方案。',
    };
  }

  const hasCritical = alerts.some(a => a.severity === 'critical');
  const hasHigh     = alerts.some(a => a.severity === 'high');
  const hasAcute    = alerts.some(a => a.risk === 'acute');

  let overallStatus = 'caution';
  if (hasCritical) overallStatus = 'critical';
  else if (hasHigh || hasAcute) overallStatus = 'warning';

  return {
    overallStatus,
    alerts,
    metrics: { wCls, fCls, waCls },
    summary: hasCritical
      ? '🚨 发现紧急健康威胁！数据指标呈现急性恶化趋势，建议立即咨询兽医。'
      : hasAcute
        ? '数据较上周基准出现大幅度急性波动，可能存在潜在病理变化，请密切观察。'
        : '检测到慢性健康风险，主要表现为与品种标准的长期偏差，建议优化日常护理。',
  };
}
