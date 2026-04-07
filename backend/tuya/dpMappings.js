/**
 * backend/tuya/dpMappings.js
 *
 * 涂鸦设备 Data Point (DP) 语义映射表
 *
 * 不同厂商的 DP Code 有差异，此处定义的是业内最通用的标准命名。
 * 如果您的具体设备使用了不同的 DP Code，可在此文件中修改对应字段。
 *
 * 查询您设备的精确 DP：
 *   iot.tuya.com → Cloud → API Explorer → GET /v1.0/devices/{id}/functions
 */

// ── 智能猫砂盆 ──────────────────────────────────────────────
export const LITTER_BOX_DPS = {
  // 猫咪体重（克）— 每次进入猫砂盆时记录
  CAT_WEIGHT:          'cat_weight',

  // 今日使用次数（次）
  USE_TIMES:           'excretion_times_day',

  // 最近一次使用时长（秒）
  USE_DURATION:        'clean_time',

  // 设备工作状态：'idle' | 'working' | 'cleaning' | 'fault'
  WORK_STATE:          'work_state',

  // 除味剂余量（%）
  DEODORANT_LEVEL:     'deodorant_life',

  // 猫砂余量状态：'enough' | 'low' | 'empty'
  LITTER_STATUS:       'sandbox_status',

  // 垃圾桶状态：'normal' | 'full'
  WASTE_FULL:          'waste_collection_full',

  // 异常告警：布尔值
  ALARM:               'alarm_active',
};

// ── 智能喂食器 ───────────────────────────────────────────────
export const FEEDER_DPS = {
  // 本次出粮量（克）— 每次出粮事件上报
  FEED_AMOUNT:         'feed_report',

  // 喂食状态：'standby' | 'feeding' | 'done' | 'fault'
  FEED_STATE:          'feed_state',

  // 余粮重量（克）— 料仓传感器
  FOOD_WEIGHT:         'food_weight',

  // 手动喂食触发（发送命令用）
  MANUAL_FEED:         'manual_feed',

  // 喂食计划（原始格式，仅读取）
  MEAL_PLAN:           'meal_plan',

  // 设备在线状态
  ONLINE:              'online',

  // 电量 / 电源状态
  BATTERY:             'battery_level',
};

// ── 智能饮水机 ───────────────────────────────────────────────
export const WATER_DPS = {
  // 今日总饮水量（毫升）— 部分型号支持
  WATER_TODAY:         'water_today',

  // 单次饮水量（毫升）— 每次检测到饮水行为上报
  WATER_ONCE:          'water_once',

  // 滤芯余量（%）
  FILTER_LIFE:         'filter_life',

  // 工作模式：'normal' | 'smart' | 'night'
  WORK_MODE:           'work_mode',

  // 水位状态：'high' | 'medium' | 'low' | 'empty'
  WATER_LEVEL:         'water_level_state',

  // 缺水告警
  LACK_WATER:          'lack_water',
};

// ── 设备 ID 配置（从环境变量读取）───────────────────────────
export const DEVICE_IDS = {
  LITTER_BOX: process.env.DEVICE_ID_LITTER_BOX || '',
  FEEDER:     process.env.DEVICE_ID_FEEDER     || '',
  WATER:      process.env.DEVICE_ID_WATER      || '',
};

// ── 模拟数据（当涂鸦未配置或连接失败时使用）─────────────────
export function getMockDeviceStatus(deviceType) {
  const now = new Date();
  const hour = now.getHours();

  if (deviceType === 'litter_box') {
    return {
      [LITTER_BOX_DPS.CAT_WEIGHT]:      5250 + Math.round((Math.random() - 0.5) * 200),
      [LITTER_BOX_DPS.USE_TIMES]:       Math.floor(Math.random() * 3) + 2,
      [LITTER_BOX_DPS.USE_DURATION]:    180 + Math.round(Math.random() * 120),
      [LITTER_BOX_DPS.WORK_STATE]:      'idle',
      [LITTER_BOX_DPS.DEODORANT_LEVEL]: 72,
      [LITTER_BOX_DPS.LITTER_STATUS]:   'enough',
      [LITTER_BOX_DPS.WASTE_FULL]:      false,
    };
  }

  if (deviceType === 'feeder') {
    return {
      [FEEDER_DPS.FEED_AMOUNT]:  hour >= 7 && hour <= 21 ? 85 : 0,
      [FEEDER_DPS.FEED_STATE]:   'standby',
      [FEEDER_DPS.FOOD_WEIGHT]:  450,
      [FEEDER_DPS.BATTERY]:      88,
    };
  }

  if (deviceType === 'water') {
    return {
      [WATER_DPS.WATER_TODAY]:   280 + Math.round(Math.random() * 60),
      [WATER_DPS.WATER_ONCE]:    35 + Math.round(Math.random() * 20),
      [WATER_DPS.FILTER_LIFE]:   65,
      [WATER_DPS.WORK_MODE]:     'smart',
      [WATER_DPS.WATER_LEVEL]:   'high',
    };
  }

  return {};
}
