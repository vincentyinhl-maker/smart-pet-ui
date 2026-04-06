import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Bell, Settings } from 'lucide-react';
import PetHeaderInfo from '../components/PetHeaderInfo';
import HealthSummaryCards from '../components/HealthSummaryCards';
import LitterBoxChart from '../components/LitterBoxChart';
import DietWaterChart from '../components/DietWaterChart';
import GrowthChart from '../components/GrowthChart';
import EditableSensorPanel, { sensorDefaults } from '../components/EditableSensorPanel';
import HealthAdvice from '../components/HealthAdvice';

export default function Dashboard() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedBreedId, setSelectedBreedId] = useState('ragdoll');

  // ── Sensor data state (lifted here so it flows to both editor and health advice)
  const [sensorData, setSensorData] = useState(sensorDefaults);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBase flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse font-medium">正在生成宠物健康全景图...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBase text-white pb-20 relative overflow-x-hidden">
      {/* Dynamic Background Blurs */}
      <div className="fixed top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel !rounded-none !bg-darkBase/60 border-x-0 border-t-0 border-b-white/5 px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-white text-xs">HB</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Heybo <span className="text-primary">Pet</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-darkBase" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-[1px] h-4 bg-gray-700" />
          <button onClick={logout} className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors px-2 py-1">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-medium">退出</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pt-8">
        {/* Row 1 & 2: Pet Info */}
        <PetHeaderInfo selectedBreedId={selectedBreedId} onBreedChange={setSelectedBreedId} />

        {/* Row 3: Health Quick Stats */}
        <HealthSummaryCards sensorData={sensorData} />

        {/* Row 4: Litter Box Trends */}
        <section className="mb-12">
          <LitterBoxChart />
        </section>

        {/* Row 5: Diet & Hydration */}
        <section className="mb-12">
          <DietWaterChart />
        </section>

        {/* Row 6: Growth Curve */}
        <section className="mb-12">
          <GrowthChart breedId={selectedBreedId} />
        </section>

        {/* Row 7a: Editable Sensor Panel (Demo) */}
        <section className="mb-4">
          <EditableSensorPanel
            sensorData={sensorData}
            setSensorData={setSensorData}
            breedId={selectedBreedId}
          />
        </section>

        {/* Row 7b: Dynamic Health Advice */}
        <section className="mb-8">
          <HealthAdvice sensorData={sensorData} breedId={selectedBreedId} />
        </section>

        <footer className="py-8 text-center border-t border-white/5">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest">
            Heybo Smart Pet Ecosystem · Designed for Wellness
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 glass-panel px-6 py-3 flex items-center space-x-8 shadow-2xl shadow-primary/20 z-[60]">
        <button className="text-primary"><Settings className="w-6 h-6" /></button>
        <button className="text-gray-400"><Bell className="w-6 h-6" /></button>
        <button className="text-gray-400"><LogOut className="w-6 h-6" /></button>
      </div>
    </div>
  );
}
