import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PawPrint, Mail, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('henry@heybopet.com');
  const [password, setPassword] = useState('heybo2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-700/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-panel p-8 w-full max-w-md mx-4 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-primary/20 rounded-full mb-4 ring-1 ring-primary/30">
            <PawPrint className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Smart Pet</h1>
          <p className="text-sm text-gray-400 mt-2">智能陪伴，无微不至</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">邮箱账号</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300 ml-1">密码</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-emerald-400 text-white font-semibold py-3.5 rounded-xl mt-4 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            {loading ? '正在登录...' : '进入宠物空间'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500 mb-2">演示建议</p>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => { setEmail('henry@heybopet.com'); setPassword('heybo2026'); }}
              className="text-[10px] text-primary/60 hover:text-primary transition-colors"
            >
              实物设备演示: henry@heybopet.com / heybo2026
            </button>
            <button 
              onClick={() => { setEmail('demo@heybopet.com'); setPassword('demo123'); }}
              className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              7大病理猫宇宙: demo@heybopet.com / demo123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
