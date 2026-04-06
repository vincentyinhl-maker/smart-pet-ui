import React from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BREED_STANDARDS } from '../data/breedStandards';
import { AlertTriangle } from 'lucide-react';

// ============================================================
// FIXED sensor-recorded actual measurements (from smart devices).
// These represent real device data and NEVER change when the
// breed selector changes — only the standard reference lines update.
// In production, these values come from the IoT device API.
// ============================================================
const FIXED_SENSOR_READINGS = [
  { stage: '1月龄',       weightActual: null, foodActual: null, waterActual: null },
  { stage: '3月龄',       weightActual: null, foodActual: null, waterActual: null },
  { stage: '6月龄',       weightActual: 2850, foodActual: 58,   waterActual: 138  },
  { stage: '9月龄',       weightActual: 3920, foodActual: 66,   waterActual: 168  },
  { stage: '12月龄',      weightActual: 4700, foodActual: 72,   waterActual: 185  },
  { stage: '成年(1-8岁)', weightActual: 5250, foodActual: 68,   waterActual: 185  },
  { stage: '老年(8岁+)',  weightActual: null, foodActual: null, waterActual: null },
];

function buildChartData(breedId) {
  const standard = BREED_STANDARDS[breedId] || BREED_STANDARDS['mix'];
  return standard.stages.map((stage, i) => {
    const sensor = FIXED_SENSOR_READINGS[i] || {};
    return {
      name: stage.name,
      // Standard reference — updates with breed selection
      weightStdMax: stage.weightMax,
      weightStdMin: stage.weightMin,
      foodStdMax:   stage.foodMax,
      foodStdMin:   stage.foodMin,
      waterStdMax:  stage.waterMax,
      waterStdMin:  stage.waterMin,
      // Sensor actual readings — FIXED, never affected by breed change
      weightActual: sensor.weightActual ?? null,
      foodActual:   sensor.foodActual   ?? null,
      waterActual:  sensor.waterActual  ?? null,
    };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-white/10 rounded-xl p-3 text-xs shadow-2xl min-w-[180px]">
      <p className="font-bold text-white mb-2 border-b border-white/10 pb-1">{label}</p>
      {payload.map((entry, i) => (
        entry.value != null && (
          <div key={i} className="flex justify-between items-center py-0.5 space-x-4">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
            <span className="text-white font-mono">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        )
      ))}
    </div>
  );
};

export default function GrowthChart({ breedId = 'mix' }) {
  const standard = BREED_STANDARDS[breedId] || BREED_STANDARDS['mix'];
  const data = buildChartData(breedId);
  const isWarningBreed = breedId === 'scottish-fold';

  return (
    <div className="glass-panel p-6 mb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-white">全生命周期成长曲线</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-md">
            {standard.name} · {standard.maturityNote}
          </p>
        </div>
        <div className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 font-semibold uppercase tracking-wider">
          {standard.name}
        </div>
      </div>

      {isWarningBreed && (
        <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300/80">该品种存在先天骨骼基因缺陷，请定期进行骨关节专项检查。</p>
        </div>
      )}

      {/* Legend clarification */}
      <div className="flex items-center space-x-5 mb-5 text-[10px] text-gray-500">
        <span className="flex items-center space-x-1.5">
          <span className="w-5 h-[2px] bg-emerald-500/60 border-dashed inline-block" style={{borderTop: '2px dashed #10b981'}} />
          <span>品种标准区间（随品种变化）</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-5 h-[2px] bg-emerald-400 inline-block" />
          <span>传感器实测数据（固定不变）</span>
        </span>
      </div>

      {/* Weight Chart */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>体重成长曲线 (g)</span>
        </p>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v/1000).toFixed(1)}kg`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area dataKey="weightStdMax" name="标准上限" fill="#10b981" stroke="none" fillOpacity={0.12} legendType="none" />
              <Area dataKey="weightStdMin" name="标准下限" fill="#111827" stroke="none" fillOpacity={1} legendType="none" />
              <Line dataKey="weightStdMax" name="标准上限" stroke="#10b981" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} />
              <Line dataKey="weightStdMin" name="标准下限" stroke="#10b981" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} legendType="none" />
              <Line dataKey="weightActual" name="实测体重(g)" stroke="#34d399" strokeWidth={2.5}
                dot={{ r: 4, fill: '#34d399', stroke: '#111827', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Food Chart */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>每日喂食量 (g/天)</span>
        </p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}g`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area dataKey="foodStdMax" fill="#f59e0b" stroke="none" fillOpacity={0.10} legendType="none" />
              <Area dataKey="foodStdMin" fill="#111827" stroke="none" fillOpacity={1} legendType="none" />
              <Line dataKey="foodStdMax" name="推荐上限" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} />
              <Line dataKey="foodStdMin" name="推荐下限" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} legendType="none" />
              <Line dataKey="foodActual" name="实测喂食量(g)" stroke="#fbbf24" strokeWidth={2.5}
                dot={{ r: 4, fill: '#fbbf24', stroke: '#111827', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Chart */}
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
          <span>每日饮水量 (ml/天)</span>
        </p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${v}ml`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area dataKey="waterStdMax" fill="#0ea5e9" stroke="none" fillOpacity={0.10} legendType="none" />
              <Area dataKey="waterStdMin" fill="#111827" stroke="none" fillOpacity={1} legendType="none" />
              <Line dataKey="waterStdMax" name="推荐上限" stroke="#0ea5e9" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} />
              <Line dataKey="waterStdMin" name="推荐下限" stroke="#0ea5e9" strokeWidth={1} strokeDasharray="5 3" dot={false} activeDot={false} legendType="none" />
              <Line dataKey="waterActual" name="实测饮水量(ml)" stroke="#38bdf8" strokeWidth={2.5}
                dot={{ r: 4, fill: '#38bdf8', stroke: '#111827', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 p-3 bg-gray-800/20 rounded-xl border border-white/5">
        <p className="text-[10px] text-gray-500 italic leading-relaxed">
          * 虚线标准区间基于该品种兽医文献综合值（雌雄均值），随品种切换动态更新。实线为智能设备传感器实测数据，固定不变。实际指导请结合个体体型、绝育状态咨询专业兽医。
        </p>
      </div>
    </div>
  );
}
