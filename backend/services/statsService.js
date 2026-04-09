/**
 * backend/services/statsService.js
 * 
 * V4.1 高级功能：日度数据统计自动化与对账引擎。
 * 负责将原始 sensor_events_log 的海量打点流水汇总为 pet_health_daily 的均值/总计。
 */

import cron from 'node-cron';
import db from '../db/database.js';

/**
 * 执行指定日期的全量统计对账
 * @param {string} dateStr 'YYYY-MM-DD'，默认为昨天
 */
export async function performDailyRollup(dateStr = null) {
  if (!dateStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    dateStr = yesterday.toISOString().split('T')[0];
  }

  console.log(`[StatsService] 正在执行 ${dateStr} 的日度数据结算...`);

  try {
    // 1. 获取该日期有记录的所有宠物 (含 Ghost)
    const activePets = db.prepare(`
      SELECT DISTINCT pet_id FROM sensor_events_log 
      WHERE recorded_at LIKE ?
    `).all(dateStr + '%');

    for (const { pet_id } of activePets) {
      if (!pet_id) continue;

      // 2. 统计体重 (均值)
      const weightStats = db.prepare(`
        SELECT AVG(value) as avg_w FROM sensor_events_log
        WHERE pet_id = ? AND metric_type = 'weight' AND recorded_at LIKE ?
      `).get(pet_id, dateStr + '%');

      // 3. 统计进食量 (总计)
      const foodStats = db.prepare(`
        SELECT SUM(value) as sum_f FROM sensor_events_log
        WHERE pet_id = ? AND metric_type = 'food_intake' AND recorded_at LIKE ?
      `).get(pet_id, dateStr + '%');

      // 4. 统计饮水量 (总计)
      const waterStats = db.prepare(`
        SELECT SUM(value) as sum_w FROM sensor_events_log
        WHERE pet_id = ? AND metric_type = 'water_intake' AND recorded_at LIKE ?
      `).get(pet_id, dateStr + '%');

      // 5. 统计如厕次数 (计数)
      const litterStats = db.prepare(`
        SELECT COUNT(*) as count_l FROM sensor_events_log
        WHERE pet_id = ? AND metric_type = 'litter_usage' AND recorded_at LIKE ?
      `).get(pet_id, dateStr + '%');

      // 6. 写入/更新日切表
      db.prepare(`
        INSERT INTO pet_health_daily (pet_id, date, weight_avg, food_total, water_total, litter_count)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(pet_id, date) DO UPDATE SET
          weight_avg = excluded.weight_avg,
          food_total = excluded.food_total,
          water_total = excluded.water_total,
          litter_count = excluded.litter_count
      `).run(
        pet_id, 
        dateStr, 
        weightStats.avg_w || null, 
        foodStats.sum_f || 0, 
        waterStats.sum_w || 0, 
        litterStats.count_l || 0
      );
    }

    console.log(`[StatsService] ${dateStr} 结算完成，涉及宠物数: ${activePets.length}`);
  } catch (err) {
    console.error(`[StatsService] ${dateStr} 结算失败:`, err.message);
  }
}

/**
 * [V4.1] 自动清理历史流水记录
 * 仅在 NODE_ENV=production 模式下运行，删除超过 DATA_RETENTION_DAYS 天的细碎原始打点数据。
 */
export async function cleanupOldLogs() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    console.log('[StatsService] 当前为 Debug/Dev 模式，跳过历史流水清理，保留全量明细。');
    return;
  }

  const days = parseInt(process.env.DATA_RETENTION_DAYS || '7');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  console.log(`[StatsService] 正在执行生产环境清理：删除 ${cutoffStr} 之前的原始打点流水...`);

  try {
    const result = db.prepare(`
      DELETE FROM sensor_events_log 
      WHERE recorded_at < ?
    `).run(cutoffStr + ' 00:00:00');

    console.log(`[StatsService] 清理完成，释放了 ${result.changes} 条流水记录空间。`);
  } catch (err) {
    console.error('[StatsService] 数据库清理异常:', err.message);
  }
}

/**
 * 启动自动化定时任务
 */
export function startStatsScheduler() {
  // 每天凌晨 00:05 执行昨天的对账
  cron.schedule('5 0 * * *', async () => {
    await performDailyRollup();
    // 结算完成后，尝试进行生产环境清理
    await cleanupOldLogs();
  });

  // 启动即执行一次补丁（针对过去 7 天的空洞进行追溯平补）
  console.log('[StatsService] 启动 7 日历史空洞对账...');
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    performDailyRollup(d.toISOString().split('T')[0]);
  }
}
