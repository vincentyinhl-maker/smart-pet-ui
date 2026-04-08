import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Settings, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PetHeaderInfo from '../components/PetHeaderInfo';
import HealthSummaryCards from '../components/HealthSummaryCards';
import LitterBoxChart from '../components/LitterBoxChart';
import DietWaterChart from '../components/DietWaterChart';
import GrowthChart from '../components/GrowthChart';
import HealthAdvice from '../components/HealthAdvice';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedBreedId, setSelectedBreedId] = useState('ragdoll');
  const [petId, setPetId] = useState(localStorage.getItem('heybo_active_pet_id') || 'pet_heybo_test_001');

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mealLoading, setMealLoading] = useState(false);

  // ── Core Sensor Data (current & 7-day baseline) ──
  const [sensorData, setSensorData] = useState(null);

  // Listen for local storage changes from Sandbox
  useEffect(() => {
    const handleStorageChange = () => {
      const newPetId = localStorage.getItem('heybo_active_pet_id');
      if (newPetId && newPetId !== petId) {
        setPetId(newPetId);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [petId]);

  useEffect(() => {
    async function fetchCoreData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/health/sensor-data?petId=${petId}`);
        const result = await res.json();
        if (result.success) {
          setSensorData(result.data);
          // Sync breed state from DB to allow persistence
          if (result.data.petInfo?.breed) {
            setSelectedBreedId(result.data.petInfo.breed);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sensor data:", err);
      }
      setLoading(false);
    }
    fetchCoreData();
  }, [petId, refreshTrigger]);

  const handleAddExtraMeal = async (type, inputId) => {
    const input = document.getElementById(inputId);
    const val = parseFloat(input.value);
    if (!val || val <= 0 || mealLoading) return;

    setMealLoading(true);
    try {
      const payload = type === 'food' ? { petId, food: val } : { petId, water: val };
      const res = await fetch('/api/health/extra-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        input.value = '';
        // Update local state directly for instant feedback
        if (result.data) {
          setSensorData(prev => ({
            ...prev,
            current: result.data
          }));
        }
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error("Failed to add extra meal:", e);
    } finally {
      setMealLoading(false);
    }
  };

  const handlePetProfileUpdate = async (updates) => {
    try {
      const payload = {};
      if (updates.name) payload.name = updates.name;
      if (updates.breedId) {
        payload.breed = updates.breedId;
        setSelectedBreedId(updates.breedId); // 同步本地 UI 状态
      }

      const res = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error("Failed to update pet profile:", e);
    }
  };

  if (loading || !sensorData) {
    return (
      <div className="min-h-screen bg-darkBase flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse font-medium">拉取全景生命流...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBase text-white pb-24 relative overflow-x-hidden">
      {/* Dynamic Background Blurs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !bg-darkBase/60 border-x-0 border-t-0 border-b-white/5 px-4 md:px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-white text-xs">HB</span>
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">
            {sensorData?.petInfo?.name || 'Heybo'} <span className="text-primary">Pet</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <button onClick={() => navigate('/debug')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center space-x-1">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Debug 测试站</span>
            <span className="sm:hidden">Debug</span>
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors relative hidden sm:block">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-darkBase" />
          </button>
          <div className="w-[1px] h-4 bg-gray-700 hidden sm:block" />
          <button onClick={logout} className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors px-2 py-1">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">退出</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-6 md:pt-8 w-full">
        {/* Row 1: Pet Info */}
        <PetHeaderInfo 
          petId={petId}
          petName={sensorData?.petInfo?.name}
          selectedBreedId={selectedBreedId} 
          onUpdate={handlePetProfileUpdate} 
        />

        {/* 今日加餐 (New V3.1 Section) */}
        <section className="mb-8 p-6 glass-panel border-primary/20 bg-primary/5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">今日加餐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400">固体加餐 (罐头、冻干)</label>
                <div className="flex bg-black/40 rounded-lg p-1">
                  <button className="px-3 py-1 rounded-md bg-primary text-white text-[10px]">克(g)</button>
                </div>
              </div>
              <div className="flex space-x-2">
                <input 
                  id="solidFoodInput"
                  type="number" 
                  placeholder="输入份量..." 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all text-sm"
                />
                <button 
                  onClick={() => handleAddExtraMeal('food', 'solidFoodInput')}
                  disabled={mealLoading}
                  className={`bg-primary hover:bg-primary/80 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mealLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {mealLoading ? '处理中...' : '添加食物'}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400">液体加餐 (牛奶、鸡汤)</label>
                <div className="flex bg-black/40 rounded-lg p-1">
                  <button className="px-3 py-1 rounded-md bg-blue-500 text-white text-[10px]">克(g)</button>
                </div>
              </div>
              <div className="flex space-x-2">
                <input 
                  id="liquidFoodInput"
                  type="number" 
                  placeholder="输入份量..." 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-all text-sm"
                />
                <button 
                  onClick={() => handleAddExtraMeal('water', 'liquidFoodInput')}
                  disabled={mealLoading}
                  className={`bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mealLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {mealLoading ? '处理中...' : '添加饮品'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Health Quick Stats */}
        <HealthSummaryCards sensorData={sensorData} />

        {/* Row 3: Litter Box Trends */}
        <section className="mb-8 md:mb-12">
          <LitterBoxChart petId={petId} petName={sensorData?.petInfo?.name || '小可爱'} />
        </section>

        {/* Row 4: Diet & Hydration */}
        <section className="mb-8 md:mb-12">
          <DietWaterChart petId={petId} petName={sensorData?.petInfo?.name || '小可爱'} />
        </section>

        {/* Row 5: Growth Curve */}
        <section className="mb-8 md:mb-12">
          <GrowthChart breedId={selectedBreedId} currentData={sensorData.current} />
        </section>

        {/* Row 6: Dynamic Health Advice */}
        <section className="mb-8">
          <HealthAdvice sensorData={sensorData} breedId={selectedBreedId} />
        </section>

        <footer className="py-8 text-center border-t border-white/5 mt-8 max-w-xs mx-auto md:max-w-full">
          <p className="text-gray-600 text-[9px] md:text-[10px] uppercase tracking-widest break-words leading-relaxed">
            Heybo Smart Pet Ecosystem · Designed for Wellness<br/>V3.0 Extended Release
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[320px] glass-panel px-6 py-4 flex items-center justify-between shadow-2xl shadow-primary/20 z-[60] rounded-2xl border border-white/10">
        <button className="text-primary flex flex-col items-center"><Activity className="w-5 h-5 mb-1" /><span className="text-[9px]">概览</span></button>
        <button className="text-gray-500 flex flex-col items-center"><Settings className="w-5 h-5 mb-1" /><span className="text-[9px]">设备</span></button>
        <button className="text-gray-500 flex flex-col items-center relative">
          <Bell className="w-5 h-5 mb-1" />
          <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border border-darkBase" />
          <span className="text-[9px]">消息</span>
        </button>
      </div>
    </div>
  );
}
