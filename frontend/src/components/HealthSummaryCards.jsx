import React from 'react';
import { Weight, Utensils, Droplets } from 'lucide-react';

export default function HealthSummaryCards({ sensorData }) {
  const cur = sensorData?.current;
  const avg = sensorData?.sevenDay;

  // Compute trend percentage vs 7-day average
  function trend(current, baseline) {
    if (!baseline) return null;
    const pct = ((current - baseline) / baseline) * 100;
    return pct.toFixed(1);
  }

  const weightTrend  = trend(cur?.weight,       avg?.weight);
  const foodTrend    = trend(cur?.foodIntake,    avg?.foodIntake);
  const waterTrend   = trend(cur?.waterIntake,   avg?.waterIntake);

  function trendBadge(pct) {
    if (pct === null) return { label: '—', cls: 'bg-gray-500/10 text-gray-500' };
    const n = parseFloat(pct);
    if (Math.abs(n) < 2) return { label: '±稳定', cls: 'bg-gray-500/10 text-gray-400' };
    if (n > 0) return { label: `+${n}%`, cls: 'bg-amber-500/10 text-amber-400' };
    return { label: `${n}%`, cls: 'bg-emerald-500/10 text-emerald-400' };
  }

  const stats = [
    {
      label: '今日体重',
      sublabel: `7日均值 ${avg ? (avg.weight / 1000).toFixed(2) : '—'} kg`,
      value: cur ? (cur.weight / 1000).toFixed(2) : '—',
      unit: 'kg',
      icon: <Weight className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      badge: trendBadge(weightTrend),
    },
    {
      label: '今日喂食量',
      sublabel: `7日均值 ${avg?.foodIntake ?? '—'} g`,
      value: cur?.foodIntake ?? '—',
      unit: 'g',
      icon: <Utensils className="w-5 h-5" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      badge: trendBadge(foodTrend),
    },
    {
      label: '今日饮水量',
      sublabel: `7日均值 ${avg?.waterIntake ?? '—'} ml`,
      value: cur?.waterIntake ?? '—',
      unit: 'ml',
      icon: <Droplets className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      badge: trendBadge(waterTrend),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="glass-panel p-5 group hover:border-primary/40 transition-all cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color} shadow-inner`}>
              {stat.icon}
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.badge.cls}`}>
                {stat.badge.label}
              </span>
              <p className="text-[10px] text-gray-500 mt-1">较7日均值</p>
            </div>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">{stat.label}</h3>
            <p className="text-[10px] text-gray-600 mb-1">{stat.sublabel}</p>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white tracking-tight">{stat.value}</span>
              <span className="text-sm text-gray-500 font-medium">{stat.unit}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
