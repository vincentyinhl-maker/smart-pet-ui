/**
 * Cat Breed Standard Data - Based on veterinary research and breed associations.
 * Sources: BellaDuke, Scribd breed charts, ASPCA, breed-specific registries.
 *
 * Data structure per life stage:
 * - weightMin/Max: grams (average of male+female ranges)
 * - foodMin/Max: grams of dry food per day (at ~360 kcal/100g)
 * - waterMin/Max: ml per day (40-60ml/kg body weight guideline)
 */

const LIFE_STAGES = ['1月龄', '3月龄', '6月龄', '9月龄', '12月龄', '成年(1-8岁)', '老年(8岁+)'];

export { LIFE_STAGES };

export const BREED_STANDARDS = {
  'british-shorthair': {
    name: '英国短毛猫',
    maturityNote: '生长缓慢，需3-4年达到完全成熟体型',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 25,  waterMax: 40  },
      { name: '3月龄',      weightMin: 1200, weightMax: 1800, foodMin: 30,  foodMax: 50,  waterMin: 60,  waterMax: 100 },
      { name: '6月龄',      weightMin: 2500, weightMax: 3500, foodMin: 50,  foodMax: 75,  waterMin: 110, waterMax: 175 },
      { name: '9月龄',      weightMin: 3200, weightMax: 4500, foodMin: 55,  foodMax: 80,  waterMin: 140, waterMax: 220 },
      { name: '12月龄',    weightMin: 3700, weightMax: 5500, foodMin: 60,  foodMax: 85,  waterMin: 165, waterMax: 260 },
      { name: '成年(1-8岁)', weightMin: 4000, weightMax: 8000, foodMin: 55,  foodMax: 90,  waterMin: 180, waterMax: 310 },
      { name: '老年(8岁+)', weightMin: 3800, weightMax: 7000, foodMin: 50,  foodMax: 80,  waterMin: 175, waterMax: 280 },
    ]
  },

  'american-shorthair': {
    name: '美国短毛猫',
    maturityNote: '约12-14个月达到成年体型，体格强健',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 25,  waterMax: 40  },
      { name: '3月龄',      weightMin: 1100, weightMax: 1700, foodMin: 28,  foodMax: 45,  waterMin: 55,  waterMax: 90  },
      { name: '6月龄',      weightMin: 2200, weightMax: 3200, foodMin: 48,  foodMax: 70,  waterMin: 100, waterMax: 155 },
      { name: '9月龄',      weightMin: 3000, weightMax: 4200, foodMin: 52,  foodMax: 78,  waterMin: 130, waterMax: 200 },
      { name: '12月龄',    weightMin: 3500, weightMax: 5500, foodMin: 58,  foodMax: 85,  waterMin: 155, waterMax: 255 },
      { name: '成年(1-8岁)', weightMin: 3600, weightMax: 6800, foodMin: 55,  foodMax: 88,  waterMin: 160, waterMax: 290 },
      { name: '老年(8岁+)', weightMin: 3500, weightMax: 6000, foodMin: 50,  foodMax: 80,  waterMin: 155, waterMax: 270 },
    ]
  },

  'siamese': {
    name: '暹罗猫',
    maturityNote: '约12-18个月成熟，体型纤细修长',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 300,  weightMax: 500,  foodMin: 10,  foodMax: 16,  waterMin: 20,  waterMax: 35  },
      { name: '3月龄',      weightMin: 900,  weightMax: 1300, foodMin: 22,  foodMax: 38,  waterMin: 45,  waterMax: 75  },
      { name: '6月龄',      weightMin: 1500, weightMax: 2500, foodMin: 38,  foodMax: 58,  waterMin: 75,  waterMax: 125 },
      { name: '9月龄',      weightMin: 2200, weightMax: 3500, foodMin: 44,  foodMax: 65,  waterMin: 100, waterMax: 165 },
      { name: '12月龄',    weightMin: 2700, weightMax: 4500, foodMin: 48,  foodMax: 70,  waterMin: 120, waterMax: 200 },
      { name: '成年(1-8岁)', weightMin: 2500, weightMax: 5500, foodMin: 45,  foodMax: 72,  waterMin: 110, waterMax: 240 },
      { name: '老年(8岁+)', weightMin: 2500, weightMax: 5000, foodMin: 42,  foodMax: 68,  waterMin: 110, waterMax: 220 },
    ]
  },

  'ragdoll': {
    name: '布偶猫',
    maturityNote: '大型品种，需3-4年达到完全成熟，性格温和如布偶',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 400,  weightMax: 700,  foodMin: 14,  foodMax: 22,  waterMin: 25,  waterMax: 45  },
      { name: '3月龄',      weightMin: 1300, weightMax: 2000, foodMin: 34,  foodMax: 55,  waterMin: 65,  waterMax: 110 },
      { name: '6月龄',      weightMin: 2500, weightMax: 4500, foodMin: 55,  foodMax: 85,  waterMin: 120, waterMax: 205 },
      { name: '9月龄',      weightMin: 3500, weightMax: 6000, foodMin: 65,  foodMax: 95,  waterMin: 165, waterMax: 280 },
      { name: '12月龄',    weightMin: 4000, weightMax: 7500, foodMin: 70,  foodMax: 100, waterMin: 190, waterMax: 340 },
      { name: '成年(1-8岁)', weightMin: 4500, weightMax: 9000, foodMin: 68,  foodMax: 110, waterMin: 210, waterMax: 420 },
      { name: '老年(8岁+)', weightMin: 4200, weightMax: 8000, foodMin: 62,  foodMax: 100, waterMin: 195, waterMax: 370 },
    ]
  },

  'persian': {
    name: '波斯猫',
    maturityNote: '约18-24个月成熟，长毛需每日梳理，消化道较敏感',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 22,  waterMax: 38  },
      { name: '3月龄',      weightMin: 1100, weightMax: 1700, foodMin: 28,  foodMax: 46,  waterMin: 58,  waterMax: 95  },
      { name: '6月龄',      weightMin: 2200, weightMax: 3200, foodMin: 48,  foodMax: 72,  waterMin: 104, waterMax: 156 },
      { name: '9月龄',      weightMin: 2800, weightMax: 4200, foodMin: 52,  foodMax: 78,  waterMin: 130, waterMax: 200 },
      { name: '12月龄',    weightMin: 3200, weightMax: 5500, foodMin: 56,  foodMax: 84,  waterMin: 150, waterMax: 255 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 7000, foodMin: 55,  foodMax: 88,  waterMin: 163, waterMax: 310 },
      { name: '老年(8岁+)', weightMin: 3200, weightMax: 6500, foodMin: 50,  foodMax: 82,  waterMin: 150, waterMax: 295 },
    ]
  },

  'maine-coon': {
    name: '缅因猫',
    maturityNote: '最大型家猫之一，需4-5年完全成熟，雄猫可超10kg',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 500,  weightMax: 900,  foodMin: 18,  foodMax: 30,  waterMin: 35,  waterMax: 60  },
      { name: '3月龄',      weightMin: 1500, weightMax: 2800, foodMin: 40,  foodMax: 68,  waterMin: 80,  waterMax: 150 },
      { name: '6月龄',      weightMin: 3000, weightMax: 6000, foodMin: 65,  foodMax: 108, waterMin: 150, waterMax: 300 },
      { name: '9月龄',      weightMin: 4000, weightMax: 7500, foodMin: 78,  foodMax: 120, waterMin: 195, waterMax: 370 },
      { name: '12月龄',    weightMin: 4500, weightMax: 9000, foodMin: 85,  foodMax: 135, waterMin: 220, waterMax: 445 },
      { name: '成年(1-8岁)', weightMin: 5000, weightMax: 11000,foodMin: 90,  foodMax: 150, waterMin: 245, waterMax: 540 },
      { name: '老年(8岁+)', weightMin: 4800, weightMax: 10000,foodMin: 82,  foodMax: 138, waterMin: 235, waterMax: 490 },
    ]
  },

  'munchkin': {
    name: '曼赤肯猫',
    maturityNote: '小型品种，约9-12个月成熟，注意控制体重避免关节负担',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 280,  weightMax: 500,  foodMin: 10,  foodMax: 15,  waterMin: 18,  waterMax: 32  },
      { name: '3月龄',      weightMin: 900,  weightMax: 1400, foodMin: 24,  foodMax: 38,  waterMin: 45,  waterMax: 78  },
      { name: '6月龄',      weightMin: 1600, weightMax: 2400, foodMin: 38,  foodMax: 58,  waterMin: 80,  waterMax: 125 },
      { name: '9月龄',      weightMin: 2000, weightMax: 3000, foodMin: 42,  foodMax: 62,  waterMin: 100, waterMax: 155 },
      { name: '12月龄',    weightMin: 2200, weightMax: 3500, foodMin: 44,  foodMax: 65,  waterMin: 108, waterMax: 175 },
      { name: '成年(1-8岁)', weightMin: 2300, weightMax: 4100, foodMin: 42,  foodMax: 65,  waterMin: 112, waterMax: 200 },
      { name: '老年(8岁+)', weightMin: 2200, weightMax: 3800, foodMin: 38,  foodMax: 60,  waterMin: 105, weatherMax: 190 },
    ]
  },

  'sphynx': {
    name: '斯芬克斯猫',
    maturityNote: '无毛，皮肤散热快，基础代谢比普通猫高约13%，食量需相应增加',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 13,  foodMax: 20,  waterMin: 25,  waterMax: 40  },
      { name: '3月龄',      weightMin: 1000, weightMax: 1600, foodMin: 30,  foodMax: 48,  waterMin: 55,  waterMax: 90  },
      { name: '6月龄',      weightMin: 2000, weightMax: 3000, foodMin: 50,  foodMax: 75,  waterMin: 100, waterMax: 155 },
      { name: '9月龄',      weightMin: 2800, weightMax: 4000, foodMin: 57,  foodMax: 84,  waterMin: 135, waterMax: 200 },
      { name: '12月龄',    weightMin: 3200, weightMax: 5000, foodMin: 62,  foodMax: 90,  waterMin: 155, waterMax: 250 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 7000, foodMin: 62,  foodMax: 98,  waterMin: 170, waterMax: 330 },
      { name: '老年(8岁+)', weightMin: 3200, weightMax: 6500, foodMin: 58,  foodMax: 92,  waterMin: 158, waterMax: 305 },
    ]
  },

  'scottish-fold': {
    name: '苏格兰折耳猫',
    maturityNote: '⚠ 先天骨骼基因缺陷，需定期骨科检查，避免高跳跃运动',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 25,  waterMax: 40  },
      { name: '3月龄',      weightMin: 1100, weightMax: 1700, foodMin: 28,  foodMax: 46,  waterMin: 55,  waterMax: 90  },
      { name: '6月龄',      weightMin: 2200, weightMax: 3200, foodMin: 48,  foodMax: 72,  waterMin: 104, waterMax: 155 },
      { name: '9月龄',      weightMin: 2800, weightMax: 4200, foodMin: 52,  foodMax: 78,  waterMin: 130, waterMax: 200 },
      { name: '12月龄',    weightMin: 3000, weightMax: 5500, foodMin: 55,  foodMax: 82,  waterMin: 143, waterMax: 255 },
      { name: '成年(1-8岁)', weightMin: 3000, weightMax: 6000, foodMin: 52,  foodMax: 84,  waterMin: 143, waterMax: 280 },
      { name: '老年(8岁+)', weightMin: 2800, weightMax: 5500, foodMin: 48,  foodMax: 78,  waterMin: 132, waterMax: 255 },
    ]
  },

  'dragon-li': {
    name: '狸花猫',
    maturityNote: '中国本土自然品种，体质强健，抗病力好，约12个月成熟',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 25,  waterMax: 38  },
      { name: '3月龄',      weightMin: 1100, weightMax: 1700, foodMin: 28,  foodMax: 44,  waterMin: 55,  waterMax: 90  },
      { name: '6月龄',      weightMin: 2200, weightMax: 3200, foodMin: 48,  foodMax: 70,  waterMin: 100, waterMax: 155 },
      { name: '9月龄',      weightMin: 3000, weightMax: 4200, foodMin: 52,  foodMax: 75,  waterMin: 130, waterMax: 198 },
      { name: '12月龄',    weightMin: 3500, weightMax: 5200, foodMin: 56,  foodMax: 80,  waterMin: 154, waterMax: 240 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 6000, foodMin: 55,  foodMax: 82,  waterMin: 160, waterMax: 275 },
      { name: '老年(8岁+)', weightMin: 3300, weightMax: 5500, foodMin: 50,  foodMax: 76,  waterMin: 150, waterMax: 255 },
    ]
  },

  'mix': {
    name: '米克斯 / 田园猫',
    maturityNote: '混种猫体质因个体差异大，参考数据取典型家猫均值',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 320,  weightMax: 600,  foodMin: 11,  foodMax: 18,  waterMin: 22,  waterMax: 38  },
      { name: '3月龄',      weightMin: 1000, weightMax: 1600, foodMin: 26,  foodMax: 44,  waterMin: 52,  waterMax: 88  },
      { name: '6月龄',      weightMin: 2000, weightMax: 3000, foodMin: 45,  foodMax: 68,  waterMin: 95,  waterMax: 148 },
      { name: '9月龄',      weightMin: 2800, weightMax: 4000, foodMin: 50,  foodMax: 74,  waterMin: 128, waterMax: 192 },
      { name: '12月龄',    weightMin: 3200, weightMax: 5000, foodMin: 54,  foodMax: 78,  waterMin: 148, waterMax: 235 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 7000, foodMin: 52,  foodMax: 85,  waterMin: 162, waterMax: 312 },
      { name: '老年(8岁+)', weightMin: 3300, weightMax: 6500, foodMin: 48,  foodMax: 80,  waterMin: 155, waterMax: 290 },
    ]
  },

  'custom': {
    name: '自定义品种',
    maturityNote: '请根据实际情况咨询兽医获取标准参考数据',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 600,  foodMin: 12,  foodMax: 18,  waterMin: 25,  waterMax: 40  },
      { name: '3月龄',      weightMin: 1000, weightMax: 1700, foodMin: 26,  foodMax: 44,  waterMin: 52,  waterMax: 90  },
      { name: '6月龄',      weightMin: 2000, weightMax: 3200, foodMin: 45,  foodMax: 72,  waterMin: 95,  waterMax: 155 },
      { name: '9月龄',      weightMin: 2800, weightMax: 4500, foodMin: 50,  foodMax: 78,  waterMin: 128, waterMax: 205 },
      { name: '12月龄',    weightMin: 3200, weightMax: 5500, foodMin: 54,  foodMax: 84,  waterMin: 148, waterMax: 255 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 7000, foodMin: 52,  foodMax: 88,  waterMin: 162, waterMax: 315 },
      { name: '老年(8岁+)', weightMin: 3300, weightMax: 6500, foodMin: 48,  foodMax: 82,  waterMin: 155, waterMax: 295 },
    ]
  },

  // ─── Newly Added Breeds ─────────────────────────────────────

  'bengal': {
    name: '孟加拉豹猫',
    maturityNote: '活跃运动型，约12-18个月成熟，好奇心强，食量略高于同体重普通猫',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 350,  weightMax: 650,  foodMin: 13,  foodMax: 20,  waterMin: 25,  waterMax: 42  },
      { name: '3月龄',      weightMin: 1100, weightMax: 1800, foodMin: 30,  foodMax: 50,  waterMin: 58,  waterMax: 98  },
      { name: '6月龄',      weightMin: 2200, weightMax: 3500, foodMin: 52,  foodMax: 78,  waterMin: 108, waterMax: 175 },
      { name: '9月龄',      weightMin: 3000, weightMax: 4800, foodMin: 58,  foodMax: 85,  waterMin: 145, waterMax: 228 },
      { name: '12月龄',    weightMin: 3600, weightMax: 6000, foodMin: 62,  foodMax: 92,  waterMin: 170, waterMax: 275 },
      { name: '成年(1-8岁)', weightMin: 3600, weightMax: 6800, foodMin: 60,  foodMax: 95,  waterMin: 168, waterMax: 315 },
      { name: '老年(8岁+)', weightMin: 3400, weightMax: 6200, foodMin: 55,  foodMax: 88,  waterMin: 158, waterMax: 290 },
    ]
  },

  'russian-blue': {
    name: '俄罗斯蓝猫',
    maturityNote: '约12-18个月成熟，性格内敛安静，短而密的双层毛，食量中等',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 320,  weightMax: 560,  foodMin: 11,  foodMax: 17,  waterMin: 22,  waterMax: 36  },
      { name: '3月龄',      weightMin: 1000, weightMax: 1600, foodMin: 26,  foodMax: 42,  waterMin: 52,  waterMax: 86  },
      { name: '6月龄',      weightMin: 1900, weightMax: 3000, foodMin: 46,  foodMax: 68,  waterMin: 95,  waterMax: 148 },
      { name: '9月龄',      weightMin: 2700, weightMax: 4000, foodMin: 50,  foodMax: 74,  waterMin: 128, waterMax: 192 },
      { name: '12月龄',    weightMin: 3200, weightMax: 5500, foodMin: 55,  foodMax: 80,  waterMin: 152, waterMax: 255 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 6500, foodMin: 52,  foodMax: 85,  waterMin: 162, waterMax: 300 },
      { name: '老年(8岁+)', weightMin: 3300, weightMax: 6000, foodMin: 48,  foodMax: 78,  waterMin: 152, waterMax: 278 },
    ]
  },

  'abyssinian': {
    name: '阿比西尼亚猫',
    maturityNote: '纤细好动的非洲裔品种，约12个月成熟，能量消耗高，需充足食量',
    seniorAge: 12,
    stages: [
      { name: '1月龄',      weightMin: 280,  weightMax: 520,  foodMin: 10,  foodMax: 16,  waterMin: 20,  waterMax: 34  },
      { name: '3月龄',      weightMin: 900,  weightMax: 1400, foodMin: 25,  foodMax: 40,  waterMin: 46,  waterMax: 76  },
      { name: '6月龄',      weightMin: 1600, weightMax: 2600, foodMin: 42,  foodMax: 62,  waterMin: 80,  waterMax: 130 },
      { name: '9月龄',      weightMin: 2200, weightMax: 3400, foodMin: 46,  foodMax: 68,  waterMin: 105, waterMax: 165 },
      { name: '12月龄',    weightMin: 2600, weightMax: 4200, foodMin: 50,  foodMax: 74,  waterMin: 125, waterMax: 200 },
      { name: '成年(1-8岁)', weightMin: 2700, weightMax: 5000, foodMin: 48,  foodMax: 76,  waterMin: 128, waterMax: 235 },
      { name: '老年(8岁+)', weightMin: 2600, weightMax: 4600, foodMin: 44,  foodMax: 70,  waterMin: 120, waterMax: 215 },
    ]
  },

  'norwegian-forest': {
    name: '挪威森林猫',
    maturityNote: '大型长毛品种，需4-5年完全成熟，双层防水外毛，耐寒能力极强',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 450,  weightMax: 800,  foodMin: 16,  foodMax: 26,  waterMin: 30,  waterMax: 52  },
      { name: '3月龄',      weightMin: 1400, weightMax: 2400, foodMin: 38,  foodMax: 62,  waterMin: 75,  waterMax: 130 },
      { name: '6月龄',      weightMin: 2800, weightMax: 5000, foodMin: 62,  foodMax: 98,  waterMin: 140, waterMax: 258 },
      { name: '9月龄',      weightMin: 3800, weightMax: 6500, foodMin: 72,  foodMax: 110, waterMin: 185, waterMax: 330 },
      { name: '12月龄',    weightMin: 4200, weightMax: 8000, foodMin: 80,  foodMax: 125, waterMin: 205, waterMax: 400 },
      { name: '成年(1-8岁)', weightMin: 4000, weightMax: 9000, foodMin: 78,  foodMax: 135, waterMin: 195, waterMax: 445 },
      { name: '老年(8岁+)', weightMin: 3800, weightMax: 8200, foodMin: 72,  foodMax: 125, waterMin: 185, waterMax: 408 },
    ]
  },

  'birman': {
    name: '伯曼猫',
    maturityNote: '中大型丝质长毛品种，约18个月成熟，以白色"手套"四肢为特征',
    seniorAge: 10,
    stages: [
      { name: '1月龄',      weightMin: 380,  weightMax: 650,  foodMin: 13,  foodMax: 20,  waterMin: 25,  waterMax: 42  },
      { name: '3月龄',      weightMin: 1200, weightMax: 1900, foodMin: 32,  foodMax: 52,  waterMin: 62,  waterMax: 105 },
      { name: '6月龄',      weightMin: 2400, weightMax: 4000, foodMin: 52,  foodMax: 80,  waterMin: 116, waterMax: 195 },
      { name: '9月龄',      weightMin: 3200, weightMax: 5200, foodMin: 58,  foodMax: 88,  waterMin: 155, waterMax: 252 },
      { name: '12月龄',    weightMin: 3600, weightMax: 6500, foodMin: 64,  foodMax: 95,  waterMin: 172, waterMax: 310 },
      { name: '成年(1-8岁)', weightMin: 3500, weightMax: 7000, foodMin: 60,  foodMax: 95,  waterMin: 162, waterMax: 325 },
      { name: '老年(8岁+)', weightMin: 3200, weightMax: 6500, foodMin: 55,  foodMax: 88,  waterMin: 150, waterMax: 300 },
    ]
  },
};
