import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: '360天', weight: 4200, poopCount: 1.1, poopWeight: 45, peeCount: 3.2, peeWeight: 120 },
  { name: '180天', weight: 4350, poopCount: 1.0, poopWeight: 48, peeCount: 3.0, peeWeight: 125 },
  { name: '90天', weight: 4420, poopCount: 1.2, poopWeight: 50, peeCount: 3.4, peeWeight: 130 },
  { name: '60天', weight: 4480, poopCount: 1.1, poopWeight: 46, peeCount: 3.1, peeWeight: 128 },
  { name: '30天', weight: 4510, poopCount: 1.0, poopWeight: 44, peeCount: 3.3, peeWeight: 132 },
  { name: '7天', weight: 4520, poopCount: 1.3, poopWeight: 52, peeCount: 3.5, peeWeight: 140 },
  { name: '当天', weight: 4535, poopCount: 1.0, poopWeight: 49, peeCount: 3.0, peeWeight: 135 },
];

export default function LitterBoxChart() {
  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">猫砂盆健康趋势</h2>
          <p className="text-xs text-gray-500 mt-1">综合排泄频率与重量监控</p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left"
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
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
            <Bar yAxisId="left" name="平均体重(g)" dataKey="weight" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar yAxisId="right" name="排便重量(g)" dataKey="poopWeight" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
            <Bar yAxisId="right" name="排尿重量(g)" dataKey="peeWeight" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase mb-1">平均排便频次</p>
          <p className="text-lg font-bold text-amber-400">1.1 <span className="text-xs font-normal text-gray-500">次/日</span></p>
        </div>
        <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
          <p className="text-[10px] text-gray-500 uppercase mb-1">平均排尿频次</p>
          <p className="text-lg font-bold text-blue-400">3.2 <span className="text-xs font-normal text-gray-500">次/日</span></p>
        </div>
      </div>
    </div>
  );
}
