import React, { useState, useRef, useEffect } from 'react';
import { Edit2, PawPrint, Calendar, ChevronDown, Info, Camera } from 'lucide-react';

const BREED_GROUPS = [
  {
    group: '经典短毛类',
    breeds: [
      { id: 'british-shorthair', zh: '英国短毛猫', en: 'British Shorthair', alias: '英短', tag: '蓝灰·圆脸·温顺' },
      { id: 'american-shorthair', zh: '美国短毛猫', en: 'American Shorthair', alias: '美短', tag: '川字纹·活泼·长寿' },
      { id: 'siamese', zh: '暹罗猫', en: 'Siamese', alias: '暹罗', tag: '重点色·话多·粘人' },
      { id: 'russian-blue', zh: '俄罗斯蓝猫', en: 'Russian Blue', alias: '俄蓝', tag: '蓝灰丝毛·安静·聪明' },
      { id: 'abyssinian', zh: '阿比西尼亚猫', en: 'Abyssinian', alias: '阿比', tag: '东非·修长·活泼好动' },
    ]
  },
  {
    group: '华丽长毛类',
    breeds: [
      { id: 'ragdoll', zh: '布偶猫', en: 'Ragdoll', alias: '仙女猫', tag: '蓝眼·丝毛·温和' },
      { id: 'persian', zh: '波斯猫', en: 'Persian', alias: '波斯', tag: '扁鼻·长毛·文静' },
      { id: 'maine-coon', zh: '缅因猫', en: 'Maine Coon', alias: '缅因', tag: '大体型·围脖毛·温柔巨人' },
      { id: 'norwegian-forest', zh: '挪威森林猫', en: 'Norwegian Forest Cat', alias: '挪威猫', tag: '双层毛·耐寒·独立' },
      { id: 'birman', zh: '伯曼猫', en: 'Birman', alias: '布尔曼', tag: '丝质长毛·白手套·温顺' },
    ]
  },
  {
    group: '特色品类',
    breeds: [
      { id: 'bengal', zh: '孟加拉豹猫', en: 'Bengal', alias: '豹猫', tag: '豹纹·活跃·运动型' },
      { id: 'munchkin', zh: '曼赤肯猫', en: 'Munchkin', alias: '短腿猫', tag: '短腿·敏捷·爱社交' },
      { id: 'sphynx', zh: '斯芬克斯猫', en: 'Sphynx', alias: '无毛猫', tag: '无毛·聪明·粘人' },
      { id: 'scottish-fold', zh: '苏格兰折耳猫', en: 'Scottish Fold', alias: '折耳猫', tag: '折耳·猫头鹰·注意骨骼', warning: true },
    ]
  },
  {
    group: '非纯种 / 田园猫',
    breeds: [
      { id: 'dragon-li', zh: '狸花猫', en: 'Dragon Li', alias: '中华田园猫', tag: '本土品种·捕鼠·独立忠诚' },
      { id: 'mix', zh: '米克斯', en: 'Mix / 田园猫', alias: '混血猫', tag: '混种·独一无二' },
    ]
  },
  {
    group: '其他',
    breeds: [
      { id: 'custom', zh: '自定义', en: 'Custom', alias: '', tag: '' },
    ]
  }
];

const ALL_BREEDS = BREED_GROUPS.flatMap(g => g.breeds);

export default function PetHeaderInfo({ 
  petId, 
  petName = 'My Heybo', 
  selectedBreedId = 'ragdoll', 
  onUpdate = () => {} 
}) {
  const [name, setName] = useState(petName);
  
  // Sync name from prop (e.g. from Dashboard or Debug injection)
  useEffect(() => {
    setName(petName);
  }, [petName]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customBreed, setCustomBreed] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [birthday, setBirthday] = useState({ year: '2023', month: '05', day: '15' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const avatarInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const currentBreed = ALL_BREEDS.find(b => b.id === selectedBreedId) || ALL_BREEDS[0];

  const handleBreedSelect = (id) => {
    onUpdate({ breedId: id });
    setShowBreedPicker(false);
  };

  const handleNameSave = () => {
    setIsEditingName(false);
    if (name.trim() !== petName) {
      onUpdate({ name: name.trim() });
    }
  };

  return (
    <div className="space-y-6 mb-8 relative z-10">
      {/* Row 1: Avatar + Pet Name */}
      <div className="flex items-center space-x-4">
        {/* Avatar Upload */}
        <div className="relative flex-shrink-0 group">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 hover:border-primary transition-all shadow-lg shadow-primary/10 relative flex items-center justify-center bg-gray-800/60 group"
            title="点击上传宠物头像"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="宠物头像" className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-7 h-7 text-primary/60" />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
          {/* Online indicator dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-darkBase shadow" />
        </div>

        {/* Name + Edit */}
        <div className="flex items-center space-x-3 flex-1">
          {isEditingName ? (
            <input
              type="text"
              className="bg-gray-800/60 border border-primary/40 rounded-xl px-4 py-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-white w-full max-w-xs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
              autoFocus
            />
          ) : (
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
              {name}
            </h1>
          )}
          <button
            onClick={() => setIsEditingName(true)}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-primary transition-all active:scale-90"
            title="编辑宠物名字"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Breed + Birthday */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Breed Selector */}
        <div className="glass-panel p-4 flex items-center space-x-4 relative">
          <div className="p-2 bg-primary/20 rounded-lg text-primary flex-shrink-0">
            <PawPrint className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">猫咪品种</p>
            <button
              onClick={() => setShowBreedPicker(!showBreedPicker)}
              className="flex items-center space-x-1 text-left w-full group"
            >
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {currentBreed.id === 'custom'
                      ? (customBreed || '自定义品种')
                      : currentBreed.zh}
                  </span>
                  {currentBreed.warning && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                      ⚠ 注意骨骼
                    </span>
                  )}
                </div>
                {currentBreed.id !== 'custom' && (
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{currentBreed.en} · {currentBreed.tag}</p>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${showBreedPicker ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Breed Dropdown */}
          {showBreedPicker && (
            <div className="absolute left-0 top-full mt-2 w-full z-50 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
              style={{ background: 'rgba(15,15,20,0.97)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="max-h-72 overflow-y-auto py-2">
                {BREED_GROUPS.map(group => (
                  <div key={group.group}>
                    <div className="px-4 py-1.5 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                      {group.group}
                    </div>
                    {group.breeds.map(breed => (
                      <button
                        key={breed.id}
                        onClick={() => handleBreedSelect(breed.id)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors ${selectedBreedId === breed.id ? 'bg-primary/10' : ''}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${selectedBreedId === breed.id ? 'text-primary' : 'text-gray-200'}`}>
                              {breed.zh}
                            </span>
                            {breed.alias && (
                              <span className="text-[10px] text-gray-600">({breed.alias})</span>
                            )}
                            {breed.warning && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">⚠</span>
                            )}
                          </div>
                          {breed.tag && (
                            <p className="text-[10px] text-gray-600 mt-0.5">{breed.tag}</p>
                          )}
                        </div>
                        {selectedBreedId === breed.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom breed input (only shown if 'custom' selected) */}
        {selectedBreedId === 'custom' && (
          <div className="glass-panel p-4 flex items-center space-x-4 md:col-span-1">
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">自定义品种名称</p>
              <input
                type="text"
                className="bg-transparent text-sm font-medium text-gray-200 focus:outline-none w-full border-b border-gray-700 focus:border-primary pb-1 transition-colors"
                placeholder="请输入品种名称..."
                value={customBreed}
                onChange={(e) => setCustomBreed(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Birthday Card */}
        <div className="glass-panel p-4 flex items-center space-x-4">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">出生日期</p>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                className="bg-gray-800/40 rounded px-2 py-1 w-16 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
                value={birthday.year}
                onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
                min="2000" max="2030"
              />
              <span className="text-gray-500 text-xs">年</span>
              <input
                type="number"
                className="bg-gray-800/40 rounded px-2 py-1 w-12 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
                value={birthday.month}
                onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
                min="1" max="12"
              />
              <span className="text-gray-500 text-xs">月</span>
              <input
                type="number"
                className="bg-gray-800/40 rounded px-2 py-1 w-12 text-sm font-semibold text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary/50 text-center"
                value={birthday.day}
                onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
                min="1" max="31"
              />
              <span className="text-gray-500 text-xs">日</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scottish Fold Warning Banner */}
      {currentBreed.warning && (
        <div className="flex items-center space-x-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 animate-pulse-once">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300/80 leading-relaxed">
            <span className="font-bold text-amber-400">注意：</span>苏格兰折耳猫携带先天基因缺陷，容易引发骨关节疾病，请定期进行骨骼健康检查并咨询专业兽医。
          </p>
        </div>
      )}
    </div>
  );
}
