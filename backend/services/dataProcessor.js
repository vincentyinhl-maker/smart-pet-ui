/**
 * backend/services/dataProcessor.js (V2.0 包含 Data Imputation 引擎)
 *
 * 将数据库宠物健康的日切记录转化为前端所需的平滑聚合格式。
 * 当请求数十天甚至 360 天趋势数据且数据库存在缺口（断网断电、设备送修）时，
 * 系统将利用内置的自动滑窗算法 (Moving Average Imputation) 推算出合理的历史值以防图表断层。
 */

import db, {
  getPetDailyRollups,
  DEFAULT_V2_PET_ID,
  getAllDeviceSnapshots,
  updatePet,
  upsertDailyRollup
} from '../db/database.js';

// ── 日期基础工具 ───────────────────────────────────────────
function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

function generateDateSeries(endDateStr, totalDays) {
  const dates = [];
  const end = new Date(endDateStr);
  // 从过去的第 N 天，一直推演到今天
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

// ── 核心 Data Imputation (空缺滑窗填补算法) ─────────────────────
/**
 * 确保图表即使横跨 1 年，横轴也绝对连续不间断。
 * 对于没有记录的日子，使用最近过去 7 天的动态均值填补。
 */
function applyMovingAverageImputation(rawRows, totalDays, endDataStr) {
  const dateSeries = generateDateSeries(endDataStr, totalDays);
  
  // Array 转 Map 以防万一，用 O(1) 取数
  const dataMap = new Map(rawRows.map(r => [r.date, r]));
  
  const smoothData = [];
  
  // 滑动窗口存底：保留过去最近 7 个有效天气的记录用作填平
  const windowQueue = []; 

  for (const date of dateSeries) {
    const dbRow = dataMap.get(date);
    
    if (dbRow && (dbRow.weight_avg || dbRow.food_total > 0)) {
      // 真实记录：推入并纳入窗口模型
      smoothData.push({
        date: date,
        label: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        weight: dbRow.weight_avg,
        foodIntake: dbRow.food_total,
        waterIntake: dbRow.water_total,
        litterCount: dbRow.litter_count,
        urinationCount: Math.max(1, Math.round(dbRow.litter_count * 0.75)),
        defecationCount: Math.max(0, Math.round(dbRow.litter_count * 0.25)),
        isImputed: false // 表示这天是硬打点数据
      });
      windowQueue.push(smoothData[smoothData.length - 1]);
      if (windowQueue.length > 7) windowQueue.shift();
    } else {
      // 缺失记录：启动拟合
      let impWeight = 5000, impFood = 0, impWater = 0, impLitter = 0;
      
      if (windowQueue.length > 0) {
        // 求最近 N 个记录的平均数
        const sum = windowQueue.reduce((acc, cur) => {
          acc.w += cur.weight || 0;
          acc.f += cur.foodIntake || 0;
          acc.water += cur.waterIntake || 0;
          acc.l += cur.litterCount || 0;
          return acc;
        }, { w: 0, f: 0, water: 0, l: 0 });
        
        impWeight = Math.round(sum.w / windowQueue.length);
        impFood   = Math.round(sum.f / windowQueue.length);
        impWater  = Math.round(sum.water / windowQueue.length);
        impLitter = Math.round(sum.l / windowQueue.length);
      }
      
      smoothData.push({
        date: date,
        label: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        weight: impWeight,
        foodIntake: impFood,
        waterIntake: impWater,
        litterCount: impLitter,
        urinationCount: Math.max(1, Math.round(impLitter * 0.75)),
        defecationCount: Math.max(0, Math.round(impLitter * 0.25)),
        isImputed: true // 标志：这个是由平台算法软预测的兜底数据
      });
    }
  }
  
  return smoothData;
}

/** 统一获取基础平滑长序列 */
function getSmoothTrend(petId, days) {
  const endDate = new Date();
  const endDateStr = toDateStr(endDate);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = toDateStr(startDate);
  
  // 1. 读取原生数据库
  const rawRollups = getPetDailyRollups(petId, startDateStr, endDateStr);
  
  // 2. 将稀疏结果送入 Imputation 引擎
  return applyMovingAverageImputation(rawRollups, days, endDateStr);
}

// ── 前端业务接口支撑（支持 petId 或直接走 DEFAULT）──────────

export function getTodayMetrics(petId = DEFAULT_V2_PET_ID) {
  // 今天在平滑序列的最后一个
  const trend = getSmoothTrend(petId, 1);
  const today = trend[0];
  
  // HasRealData: 兜底数据不算是真实数据
  today.hasRealData = !today.isImputed;
  return today;
}

export function getSevenDayAvg(petId = DEFAULT_V2_PET_ID) {
  const trend = getSmoothTrend(petId, 7);
  
  const avg = (key) => Math.round(trend.reduce((s, row) => s + row[key], 0) / trend.length);
  
  return {
    weight:          avg('weight'),
    foodIntake:      avg('foodIntake'),
    waterIntake:     avg('waterIntake'),
    urinationCount:  avg('urinationCount'),
    defecationCount: avg('defecationCount'),
  };
}

export function getLitterBoxTrend(days = 360, petId = DEFAULT_V2_PET_ID) {
  const trend = getSmoothTrend(petId, days);
  // 保留图表所需字段丢弃多余的以省带宽
  return trend.map(t => ({
    date: t.date, label: t.label,
    weight: t.weight, litterCount: t.litterCount,
    urinationCount: t.urinationCount, defecationCount: t.defecationCount
  }));
}

export function getDietWaterTrend(days = 360, petId = DEFAULT_V2_PET_ID) {
  const trend = getSmoothTrend(petId, days);
  return trend.map(t => ({
    date: t.date, label: t.label,
    foodIntake: t.foodIntake, waterIntake: t.waterIntake
  }));
}

export function getDeviceStatusSummary() {
  const snaps = getAllDeviceSnapshots();
  const summary = {
    littlerBox: { online: false },
    feeder:     { online: false },
    water:      { online: false }
  };
  
  for (const s of snaps) {
    if (s.device_type === 'litter_box') summary.littlerBox = { online: true, data: JSON.parse(s.data_json), lastSeen: s.updated_at};
    if (s.device_type === 'feeder') summary.feeder = { online: true, data: JSON.parse(s.data_json), lastSeen: s.updated_at};
    if (s.device_type === 'water') summary.water = { online: true, data: JSON.parse(s.data_json), lastSeen: s.updated_at};
  }
  
  return summary;
}
export function recordExtraMeal(petId, food = 0, water = 0) {
  const dateStr = toDateStr(new Date());
  console.log(`[Record Extra Meal] Pet: ${petId}, Date: ${dateStr}, Food: +${food}g, Water: +${water}g`);
  upsertDailyRollup(petId || DEFAULT_V2_PET_ID, dateStr, { food, water });
  
  const updated = getTodayMetrics(petId);
  console.log(`[Record Extra Meal] New Total Food: ${updated.foodIntake}g`);
  return updated;
}

export function getFullSensorData(petId = DEFAULT_V2_PET_ID) {
  let petName = '小可爱';
  let petBreed = 'ragdoll';
  try {
    const p = db.prepare('SELECT name, breed FROM pets WHERE id = ?').get(petId);
    if (p) {
      if (p.name) petName = p.name;
      if (p.breed) petBreed = p.breed;
    }
  } catch (e) {}

  return {
    petInfo: { name: petName, breed: petBreed },
    current:  getTodayMetrics(petId),
    sevenDay: getSevenDayAvg(petId),
  };
}

export function updatePetInfo(petId, updates) {
  return updatePet(petId, updates);
}
