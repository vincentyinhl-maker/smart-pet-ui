import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DietWaterChart({ petId, petName = '小可爱' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/health/diet-trend?petId=${petId}&days=360`);
        const result = await res.json();
        if (result.success && result.data.length > 0) {
          const reversed = [...result.data].reverse();
          
          const calcNode = (daysSpan, label) => {
             const slice = reversed.slice(0, daysSpan);
             if(!slice.length) return { name: label, food: 0, water: 0 };
             const avg = (key) => slice.reduce((sum, item) => sum + (item[key] || 0), 0) / slice.length;
             return {
               name: label,
               food: Math.round(avg('foodIntake')),
               water: Math.round(avg('waterIntake'))
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
        console.error("DietWaterChart fetch err", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [petId]);

  const todayFood = data.length ? data[6].food : 0;
  const todayWater = data.length ? data[6].water : 0;
  
  // Predict frequencies since the DB stores total intake.
  const foodFreq = todayFood > 0 ? Math.max(1, Math.round(todayFood / 15)) : 0;
  const waterFreq = todayWater > 0 ? Math.max(1, Math.round(todayWater / 20)) : 0;

  return (
    <div className="glass-panel p-4 md:p-6 mb-8 mt-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-base md:text-lg font-bold text-white">我的{petName}的吃喝</h2>
          <p className="text-[10px] md:text-xs text-gray-500 mt-1">全局时间尺度的饮食规律监控</p>
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
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={(value) => [`${value} g`]} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '10px', fontSize: '10px' }} />
            
            <Bar yAxisId="left" name="猫咪进食量(g)" dataKey="food" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar yAxisId="right" name="猫咪饮水量(g)" dataKey="water" fill="#0ea5e9" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 md:mt-6">
        <div className="bg-gray-800/40 rounded-xl p-2 md:p-3 border border-gray-700/50 flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">当日进食频率</p>
          <p className="text-base md:text-lg font-bold text-[#f59e0b]">{foodFreq} <span className="text-[10px] md:text-xs font-normal text-gray-500">次/日</span></p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-2 md:p-3 border border-gray-700/50 flex flex-col items-center md:items-start text-center md:text-left">
          <p className="text-[9px] md:text-[10px] text-gray-500 uppercase mb-1">当日饮水频率</p>
          <p className="text-base md:text-lg font-bold text-[#0ea5e9]">{waterFreq} <span className="text-[10px] md:text-xs font-normal text-gray-500">次/日</span></p>
        </div>
      </div>
    </div>
  );
}
