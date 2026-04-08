import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Video, History, Activity } from 'lucide-react';

export default function RemoteControl() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState(20);
  const [history, setHistory] = useState([]);
  const [feeding, setFeeding] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/history?deviceId=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.records) setHistory(data.records);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [id, token]);

  const handleFeed = async () => {
    setFeeding(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deviceId: id, amount })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('出粮成功！');
        fetchHistory(); // refresh records
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setFeedback('操作失败');
    } finally {
      setFeeding(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-darkBase flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center p-4 relative z-10 bg-gray-900/80 backdrop-blur-md sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-800 text-gray-300 transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">远程控制</h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </header>

      {/* Video Stream Area (Mock) */}
      <div className="relative w-full aspect-video bg-gray-800 flex flex-col items-center justify-center overflow-hidden z-10 shadow-xl">
        <div className="absolute top-3 left-3 bg-red-500/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          <span>LIVE</span>
        </div>
        <Video className="w-12 h-12 text-gray-600 mb-2 opacity-50" />
        <span className="text-gray-500 text-sm">监控画面未开启或无权限</span>
      </div>

      {/* Control Panel Area */}
      <div className="flex-1 px-6 py-8 relative z-10 flex flex-col items-center">
        {/* Glow effect matching action */}
        {feeding && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/40 rounded-full blur-[80px] animate-pulse pointer-events-none" />
        )}
        
        <div className="glass-panel w-full p-6 mb-8 mt-4 text-center border-t border-white/5 relative shadow-lg">
           <h2 className="text-gray-300 font-medium mb-6">出粮克数设定</h2>
           <div className="flex items-center justify-center space-x-6 mb-6">
             <button onClick={() => setAmount(Math.max(5, amount - 5))} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-xl font-medium">-</button>
             <div className="text-4xl font-bold text-primary w-20 tracking-tighter">
               {amount}<span className="text-base text-gray-400 font-normal ml-1">g</span>
             </div>
             <button onClick={() => setAmount(Math.min(100, amount + 5))} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-xl font-medium">+</button>
           </div>
           
           <div className="flex justify-center mt-8 relative">
              <button 
                onClick={handleFeed}
                disabled={feeding}
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center text-white
                  shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all transform active:scale-95
                  ${feeding ? 'bg-emerald-600 scale-95' : 'bg-primary hover:bg-emerald-400'}
                `}
              >
                {/* Ripple Effect base */}
                <div className={`absolute inset-0 rounded-full border-2 border-primary ${feeding ? 'animate-ping' : ''}`}></div>
                
                <Activity className="w-8 h-8 mb-1" />
                <span className="font-bold tracking-widest text-sm">出粮</span>
              </button>
           </div>
           
           {feedback && (
             <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-sm text-emerald-400 font-medium animate-bounce">
               {feedback}
             </div>
           )}
        </div>

        {/* History Log */}
        <div className="w-full mt-2">
          <div className="flex items-center space-x-2 mb-4 text-gray-300">
            <History className="w-4 h-4" />
            <h3 className="font-medium text-sm">最近记录</h3>
          </div>
          <div className="space-y-3">
            {history.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <div className="flex flex-col">
                  <span className="text-gray-100 font-medium">{item.target}</span>
                  <span className="text-gray-500 text-xs mt-1">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <span className="text-primary font-bold">+{item.amount}g</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-xs text-gray-500">暂无记录</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
