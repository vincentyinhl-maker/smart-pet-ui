import React from 'react';
import {
  ShieldCheck, AlertTriangle, AlertCircle, Siren,
  CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { analyzeHealth } from '../data/healthEngine';
import { BREED_STANDARDS } from '../data/breedStandards';
import { useState } from 'react';

const SEVERITY_CONFIG = {
  critical: { border: 'border-red-500/50',   bg: 'bg-red-500/10',   icon: Siren,          iconColor: 'text-red-400',    badge: 'bg-red-500/20 text-red-300',    label: '紧急' },
  high:     { border: 'border-amber-500/40', bg: 'bg-amber-500/8',  icon: AlertTriangle,  iconColor: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-300',label: '警告' },
  medium:   { border: 'border-yellow-500/30',bg: 'bg-yellow-500/5', icon: AlertCircle,    iconColor: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-300',label: '注意' },
};

const RISK_CONFIG = {
  acute:   { color: 'text-red-400',   bg: 'bg-red-500/10',   label: '急性变化' },
  chronic: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: '慢性积累' },
};

const OVERALL_CONFIG = {
  healthy:  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: '健康良好' },
  caution:  { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  icon: AlertCircle, label: '轻度预警' },
  warning:  { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: AlertTriangle, label: '中度预警' },
  critical: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: Siren,        label: '紧急预警' },
};

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const riskCfg = RISK_CONFIG[alert.risk] || RISK_CONFIG.chronic;
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0`} />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-sm font-bold text-gray-100">{alert.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}>
                {riskCfg.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {alert.triggers.map((t, i) => (
                <span key={i} className="text-[10px] bg-gray-800/60 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700/40">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-xs text-gray-400 leading-relaxed">{alert.description}</p>
          <div className="bg-gray-900/40 rounded-xl p-3 border border-white/5">
            <p className="text-xs font-semibold text-gray-200 leading-relaxed">{alert.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HealthAdvice({ sensorData, breedId = 'ragdoll' }) {
  const standard = BREED_STANDARDS[breedId]?.stages.find(s => s.name === '成年猫' || s.name.includes('成年'))
                || BREED_STANDARDS['mix'].stages.find(s => s.name === '成年猫' || s.name.includes('成年'));

  const result = analyzeHealth({
    current:  sensorData.current,
    sevenDay: sensorData.sevenDay,
    standard,
  });

  const overallCfg = OVERALL_CONFIG[result.overallStatus];
  const OverallIcon = overallCfg.icon;

  return (
    <div className="glass-panel p-6 mb-8">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-white">综合健康建议</h2>
        <span className="text-[10px] text-gray-600 border border-gray-700 rounded-full px-2 py-0.5 uppercase tracking-wider">
          实时联动
        </span>
      </div>

      {/* Overall Status Banner */}
      <div className={`flex items-center space-x-4 p-4 rounded-2xl border ${overallCfg.bg} ${overallCfg.border} mb-6`}>
        <div className={`p-3 rounded-xl ${overallCfg.bg} border ${overallCfg.border}`}>
          <OverallIcon className={`w-6 h-6 ${overallCfg.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className={`text-base font-bold ${overallCfg.color}`}>{overallCfg.label}</span>
            {result.alerts.length > 0 && (
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                {result.alerts.length} 项预警
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Alert Cards */}
      {result.alerts.length > 0 ? (
        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">预警详情（点击展开分析）</p>
          {result.alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 space-y-3 mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
          <p className="text-sm font-semibold text-emerald-400">所有指标正常</p>
          <p className="text-[11px] text-gray-500 text-center max-w-xs">
            当前数值均在该品种标准范围内，且与7日均值无显著波动。
          </p>
        </div>
      )}

      {/* Diagnostic Logic Legend */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
          <p className="text-[11px] font-bold text-amber-400 mb-1">📋 慢性信号</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">与品种标准差异大，但与7日均值接近。代表长期缓慢演变，建议调整饲养习惯或预约就诊。</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
          <p className="text-[11px] font-bold text-red-400 mb-1">🚨 急性信号</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">与品种标准差异大，且与7日均值也骤变。代表近期突发变化，建议密切观察，若状态异常立即就医。</p>
        </div>
      </div>

      {/* Insurance note */}
      {result.overallStatus === 'healthy' && (
        <div className="mt-4 flex items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">已连续积累健康数据 365+ 天</p>
            <p className="text-[10px] text-primary/60 mt-1 uppercase tracking-wide">
              您已获得下一年度宠物保险 85% 费率折扣资格
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
