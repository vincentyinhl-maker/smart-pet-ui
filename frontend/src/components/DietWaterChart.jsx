import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: '360天', weight: 4200, feedCount: 3, feedWeight: 60, drinkCount: 5, drinkVolume: 160 },
  { name: '180天', weight: 4350, feedCount: 3, feedWeight: 62, drinkCount: 5, drinkVolume: 170 },
  { name: '90天', weight: 4420, feedCount: 4, feedWeight: 65, drinkCount: 6, drinkVolume: 180 },
  { name: '60天', weight: 4480, feedCount: 4, feedWeight: 68, drinkCount: 6, drinkVolume: 185 },
  { name: '30天', weight: 4510, feedCount: 3, feedWeight: 65, drinkCount: 5, drinkVolume: 182 },
  { name: '7天', weight: 4520, feedCount: 4, feedWeight: 66, drinkCount: 6, drinkVolume: 190 },
  { name: '当天', weight: 4535, feedCount: 4, feedWeight: 67, drinkCount: 6, drinkVolume: 188 },
];

export default function DietWaterChart() {
  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">喂食喂水对比分析</h2>
          <p className="text-xs text-gray-500 mt-1">记录每日营养摄入与水分补充状态</p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              yAxisId="weight"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }}
              domain={[4000, 5000]}
              hide
            />
            <YAxis 
              yAxisId="value"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
            />
            <Bar yAxisId="value" name="喂食重量(g)" dataKey="feedWeight" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={25} />
            <Bar yAxisId="value" name="饮水数量(ml)" dataKey="drinkVolume" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={25} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase mb-1">平均喂食频次</p>
          <p className="text-lg font-bold text-amber-400">3.8 <span className="text-xs font-normal text-gray-500">次/日</span></p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase mb-1">平均饮水频次</p>
          <p className="text-lg font-bold text-sky-400">5.6 <span className="text-xs font-normal text-gray-500">次/日</span></p>
        </div>
      </div>
    </div>
  );
}
