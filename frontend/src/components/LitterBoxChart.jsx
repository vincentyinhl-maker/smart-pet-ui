import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LitterBoxChart({ petId, petName = '小可爱' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // We want to show standard fixed nodes on X-axis: 360, 180, 90, 60, 30, 7, Today
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/health/litter-trend?petId=${petId}&days=360`);
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          const reversed = [...result.data].reverse();
          
          const calcNode = (daysSpan, label) => {
             const slice = reversed.slice(0, daysSpan);
             if(!slice.length) return { name: label, weight: 0, poopCount: 0, peeCount: 0 };
             const avg = (key) => slice.reduce((sum, item) => sum + (item[key] || 0), 0) / slice.length;
             return {
               name: label,
               weight: Math.round(avg('weight')),
               poopCount: Math.round(avg('defecationCount') * 10) / 10,
               peeCount: Math.round(avg('urinationCount') * 10) / 10,
               poopWeight: Math.round(avg('defecationCount') * 45), // estimate weight based on count
               peeWeight: Math.round(avg('urinationCount') * 30) // estimate weight based on count
             };
          };

          const nodes = [
             calcNode(360, '360天'),
             calcNode(180, '180天'),
             calcNode(90, '90天'),
             calcNode(60, '60天'),
             calcNode(30, '30天'),
             calcNode(7, '7天'),
             calcNode(1, '当天')
          ];
          setData(nodes);
        }
      } catch (e) {
        console.error("LitterBoxChart fetch err", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [petId]);

  const todayPeeCount = data.length ? data[6].peeCount : 0;
  const todayPoopCount = data.length ? data[6].poopCount : 0;

  return (
    <div className="glass-panel p-4 md:p-6 mt-12 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 space-y-2 md:space-y-0">
        <div>
          <h2 className="text-base md:text-lg font-bold text-white">我的{petName}的体重健康</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1">全局时间尺度的排泄与体征监控</p>
        </div>
      </div>
      
      <div className="h-[250px] md:h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-darkBase/50 backdrop-blur-sm rounded-xl">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"/>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 0, left: -25, bottom: 5 }}
            className="text-xs"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} dy={5} />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 10 }}
              tickFormatter={(v) => `${(v/1000).toFixed(1)}`}
            />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} 
              itemStyle={{ color: '#fff' }} 
              formatter={(value, name) => {
                if (name === "猫咪体重(Kg)") return [`${(value / 1000).toFixed(2)} Kg`, name];
                return [`${value} g`, name];
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '10px' }} />
            <Bar yAxisId="left" name="猫咪体重(Kg)" dataKey="weight" fill="#10b981" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar yAxisId="right" name="猫咪排便重量(g)" dataKey="poopWeight" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar yAxisId="right" name="猫咪排尿数量(g)" dataKey="peeWeight" fill="#0ea5e9" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-4 md:mt-6">
        <div className="bg-gray-800/40 rounded-xl p-2 md:p-3 border border-gray-700/50 flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">当日排便频率</p>
          <p className="text-base md:text-lg font-bold text-[#f59e0b]">{todayPoopCount} <span className="text-[10px] md:text-xs font-normal text-gray-500">次/日</span></p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-2 md:p-3 border border-gray-700/50 flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">当日排尿频率</p>
          <p className="text-base md:text-lg font-bold text-[#0ea5e9]">{todayPeeCount} <span className="text-[10px] md:text-xs font-normal text-gray-500">次/日</span></p>
        </div>
      </div>
    </div>
  );
}
