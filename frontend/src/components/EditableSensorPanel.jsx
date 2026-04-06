import React from 'react';
import { Pencil, RefreshCw, Droplets, Utensils, Weight, Activity } from 'lucide-react';
import { BREED_STANDARDS } from '../data/breedStandards';
import { pctFromMid } from '../data/healthEngine';

const FIELDS = [
  { key: 'weight',         label: '当前体重',     unit: 'g',   icon: Weight,    step: 50,  stdKey: ['weightMin', 'weightMax'] },
  { key: 'foodIntake',     label: '今日喂食量',    unit: 'g',   icon: Utensils,  step: 2,   stdKey: ['foodMin',   'foodMax']   },
  { key: 'waterIntake',    label: '今日饮水量',    unit: 'ml',  icon: Droplets,  step: 5,   stdKey: ['waterMin',  'waterMax']  },
  { key: 'urinationCount', label: '排尿次数',     unit: '次',  icon: Activity,  step: 1,   stdKey: null, norm: [2, 4]         },
  { key: 'defecationCount',label: '排便次数',     unit: '次',  icon: Activity,  step: 1,   stdKey: null, norm: [1, 2]         },
];

function StatusBar({ value, min, max }) {
  const clamped = Math.max(0, Math.min(100, ((value - min * 0.5) / (max * 1.5 - min * 0.5)) * 100));
  const lowPct  = ((min  - min * 0.5) / (max * 1.5 - min * 0.5)) * 100;
  const highPct = ((max  - min * 0.5) / (max * 1.5 - min * 0.5)) * 100;
  const color = value < min ? '#f59e0b' : value > max ? '#ef4444' : '#10b981';
  return (
    <div className="relative h-1.5 w-full bg-gray-700/50 rounded-full mt-1.5 mb-0.5">
      <div className="absolute top-0 bottom-0 bg-emerald-500/20 rounded-full"
        style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }} />
      <div className="absolute top-[-2px] w-2 h-2 rounded-full border-2 border-darkBase transition-all"
        style={{ left: `${clamped}%`, backgroundColor: color, transform: 'translateX(-50%)' }} />
    </div>
  );
}

const defaults = {
  current:  { weight: 5800, foodIntake: 85, waterIntake: 310, urinationCount: 3, defecationCount: 1 },
  sevenDay: { weight: 5750, foodIntake: 83, waterIntake: 305, urinationCount: 3, defecationCount: 1 },
};

export default function EditableSensorPanel({ sensorData, setSensorData, breedId = 'ragdoll' }) {
  const standard = BREED_STANDARDS[breedId]?.stages.find(s => s.name === '成年(1-8岁)')
                || BREED_STANDARDS['mix'].stages.find(s => s.name === '成年(1-8岁)');

  const handleChange = (section, key, val) => {
    const numVal = parseFloat(val);
    if (isNaN(numVal) || numVal < 0) return;
    setSensorData(prev => ({ ...prev, [section]: { ...prev[section], [key]: numVal } }));
  };
  const adjust = (section, key, step) => {
    setSensorData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: Math.max(0, +(prev[section][key] + step).toFixed(1)) }
    }));
  };
  const reset = () => setSensorData(defaults);

  return (
    <div className="glass-panel p-6 mb-8 border border-primary/10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/15 rounded-lg">
            <Pencil className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">当日传感器数据</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">可编辑 · 修改数值实时查看健康建议变化</p>
          </div>
        </div>
        <button onClick={reset}
          className="flex items-center space-x-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-primary/30">
          <RefreshCw className="w-3 h-3" />
          <span>重置</span>
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 mb-2 px-1">
        <span className="text-[10px] text-gray-600 uppercase tracking-widest">指标</span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest text-center">今日实测</span>
        <span className="text-[10px] text-gray-600 uppercase tracking-widest text-center">7日均值</span>
      </div>

      <div className="space-y-3">
        {FIELDS.map(({ key, label, unit, icon: Icon, step, stdKey, norm }) => {
          const stdMin = stdKey ? standard[stdKey[0]] : norm[0];
          const stdMax = stdKey ? standard[stdKey[1]] : norm[1];
          const curVal = sensorData.current[key];
          const avgVal = sensorData.sevenDay[key];
          const curDev = pctFromMid(curVal, stdMin, stdMax);
          const devColor = Math.abs(curDev) < 0.20 ? 'text-emerald-400'
                         : Math.abs(curDev) < 0.40 ? 'text-amber-400' : 'text-red-400';

          return (
            <div key={key} className="bg-gray-800/30 rounded-xl p-3 border border-white/5">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 items-center">
                {/* Label */}
                <div className="flex items-center space-x-2">
                  <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-300">{label}</p>
                    <p className="text-[10px] text-gray-600">
                      标准: {stdMin}–{stdMax} {unit}
                    </p>
                  </div>
                </div>

                {/* Current value input */}
                <div className="flex items-center justify-center space-x-1">
                  <button onClick={() => adjust('current', key, -step)}
                    className="w-5 h-5 rounded bg-gray-700/70 hover:bg-gray-600 text-gray-400 hover:text-white text-xs flex items-center justify-center transition-colors">−</button>
                  <div className="text-center">
                    <input
                      type="number" value={curVal} step={step}
                      onChange={e => handleChange('current', key, e.target.value)}
                      className={`w-16 bg-gray-900/60 border rounded-lg px-1 py-1 text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors ${devColor} border-gray-700/50`}
                    />
                    <p className={`text-[9px] mt-0.5 font-semibold ${devColor}`}>
                      {curDev > 0 ? '+' : ''}{(curDev * 100).toFixed(0)}% vs标准
                    </p>
                  </div>
                  <button onClick={() => adjust('current', key, step)}
                    className="w-5 h-5 rounded bg-gray-700/70 hover:bg-gray-600 text-gray-400 hover:text-white text-xs flex items-center justify-center transition-colors">+</button>
                </div>

                {/* 7-day avg input */}
                <div className="flex items-center justify-center space-x-1">
                  <button onClick={() => adjust('sevenDay', key, -step)}
                    className="w-5 h-5 rounded bg-gray-700/30 hover:bg-gray-700 text-gray-600 hover:text-gray-300 text-xs flex items-center justify-center transition-colors">−</button>
                  <input
                    type="number" value={avgVal} step={step}
                    onChange={e => handleChange('sevenDay', key, e.target.value)}
                    className="w-16 bg-gray-900/40 border border-gray-700/30 rounded-lg px-1 py-1 text-center text-sm font-medium text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600"
                  />
                  <button onClick={() => adjust('sevenDay', key, step)}
                    className="w-5 h-5 rounded bg-gray-700/30 hover:bg-gray-700 text-gray-600 hover:text-gray-300 text-xs flex items-center justify-center transition-colors">+</button>
                </div>
              </div>

              {/* Status bar */}
              <div className="mt-2 px-1">
                <StatusBar value={curVal} min={stdMin} max={stdMax} />
                <div className="flex justify-between text-[9px] text-gray-700 mt-0.5">
                  <span>{stdMin}</span>
                  <span className="text-gray-600">品种标准范围</span>
                  <span>{stdMax}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center space-x-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-2.5">
        <span className="text-[10px] text-blue-400/80 leading-relaxed">
          💡 修改今日实测值可验证健康预警逻辑。
          <span className="text-gray-500"> 与标准差异大但与7日均值接近 → 慢性病；两者均差异大 → 急症信号。</span>
        </span>
      </div>
    </div>
  );
}

export { defaults as sensorDefaults };
