import React, { useState } from 'react';
import { Database, AlertTriangle, MonitorPlay, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CAT_MODELS = [
  { id: 'bengal', label: '孟加拉豹猫 (健康活跃)', desc: '标准曲线，体重稳定在 5.5kg 周边，饮食规律。' },
  { id: 'maine_coon', label: '缅因猫 (健康巨婴)', desc: '体重大，稳定飙升至 8kg，食量和饮水量显著。' },
  { id: 'british_shorthair', label: '英短 (过度肥胖危急)', desc: '体重不断攀升，每日高食物摄入，严重超重。' },
  { id: 'ragdoll', label: '布偶猫 (慢性肾衰初期 CKD)', desc: '体重无规律下降，饮水暴增烦渴，排尿极度频繁。' },
  { id: 'siamese', label: '暹罗猫 (严重营养不良)', desc: '日食量不足，体重长期干瘪（消瘦警报）。' },
];

export default function DebugSandbox() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('MyOreo');
  const [petName, setPetName] = useState('HeyboPet');
  const [breedType, setBreedType] = useState('ragdoll');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInject = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/debug/seed-pet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, petName, breedType })
      });
      const data = await res.json();
      
      // Store the active pet ID into localStorage
      if (data.success && data.petId) {
        localStorage.setItem('heybo_active_pet_id', data.petId);
        // Force an event so Dashboard can pick it up if needed
        window.dispatchEvent(new Event('storage'));
      }
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12">
      <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors">
        <ChevronLeft className="w-5 h-5" />
        <span>返回 Dashboard</span>
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="glass-panel p-8">
          <div className="flex items-center space-x-4 mb-6 relative">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 border border-red-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">上帝沙盒 (V3.0 Debug)</h1>
              <p className="text-gray-400 text-sm mt-1">瞬时注入长达 1 年的生物学及疾病拟真打点，考验 AI 图表渲染。</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">分配给用户</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                  placeholder="如: Vincent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">宠物名字</label>
                <input
                  type="text"
                  value={petName}
                  onChange={e => setPetName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all"
                  placeholder="如: 胖虎"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-gray-400 uppercase">选择拟真模型 (360 天数据)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CAT_MODELS.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setBreedType(cat.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${breedType === cat.id ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-white/20 bg-white/5'}`}
                  >
                    <div className="font-medium text-sm text-white mb-1">{cat.label}</div>
                    <div className="text-xs text-gray-500 leading-tight">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleInject}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <MonitorPlay className="w-5 h-5" />}
                <span>{loading ? '正在执行数百次时间穿梭...' : '瞬间注入 360 天拟真数据'}</span>
              </button>
            </div>

            {result && (
              <div className={`mt-4 p-4 rounded-xl border flex items-start space-x-3 ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {result.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <p className="text-sm font-medium leading-relaxed">{result.success ? result.message : result.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
