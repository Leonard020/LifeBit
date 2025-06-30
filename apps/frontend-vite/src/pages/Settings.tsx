import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  const [language, setLanguage] = useState('ko');
  const [gearClicks, setGearClicks] = useState(0);
  const [isBroken, setIsBroken] = useState(false);
  const devs = [
    { name: '문경민', emoji: '🦁' },
    { name: '김성현', emoji: '🦊' },
    { name: '남궁현', emoji: '🐯' },
    { name: '박병규', emoji: '🐻' },
    { name: '백승빈', emoji: '🐧' },
    { name: '이민호', emoji: '🐳' },
    { name: '이지섭', emoji: '🦆' },
    { name: '손찬우', emoji: '🦄' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const devColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-pink-100 text-pink-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
  ];
  const getDevColor = idx => devColors[idx % devColors.length];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1
          className={`text-2xl font-bold mb-6 flex items-center gap-2 cursor-pointer select-none transition-all duration-300 relative ${isBroken ? 'broken-gear' : ''}`}
          onMouseEnter={e => e.currentTarget.classList.add('show-gear')}
          onMouseLeave={e => e.currentTarget.classList.remove('show-gear')}
          onClick={() => {
            if (isBroken) return;
            if (gearClicks + 1 >= 10) {
              setIsBroken(true);
            } else {
              setGearClicks(c => c + 1);
            }
          }}
        >
          <span className="settings-title-text transition-all duration-300">환경설정</span>
          <span className="settings-title-gear hidden transition-all duration-300 relative">
            <SettingsIcon 
              className={`w-8 h-8 ${isBroken ? 'gear-broken' : 'animate-spin-slow'}`}
              style={{
                filter: isBroken ? 'grayscale(1) blur(1.5px) brightness(0.7)' : undefined,
                transform: isBroken ? 'rotate(-30deg) scale(1.2)' : undefined,
                opacity: isBroken ? 0.5 : 1,
                transition: 'all 0.5s cubic-bezier(.68,-0.55,.27,1.55)'
              }}
            />
            {/* 부서지는 조각 효과 */}
            {gearClicks > 0 && !isBroken && (
              <span className="absolute left-0 top-0 w-8 h-8 pointer-events-none" style={{zIndex:2}}>
                {[...Array(gearClicks)].map((_, i) => (
                  <span key={i} className={`block absolute w-2 h-2 bg-gray-400 rounded-full gear-chip chip${i}`}
                    style={{
                      left: `${10 + Math.sin((i/10)*Math.PI*2)*12}px`,
                      top: `${10 + Math.cos((i/10)*Math.PI*2)*12}px`,
                      opacity: 0.7,
                      transform: `scale(${1 + i*0.1})`,
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </span>
            )}
          </span>
          {/* 10번 클릭 시 개발자 이름 이스터에그 */}
          {isBroken && (
            <div
              className="absolute left-1/2 top-full mt-4 -translate-x-1/2 z-50 animate-fade-in"
              onClick={() => { setIsBroken(false); setGearClicks(0); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="bg-white/95 border-2 border-blue-200 rounded-2xl shadow-2xl px-8 py-6 min-w-[320px] flex flex-col items-center">
                <div className="text-lg font-bold mb-2 flex items-center gap-2">
                  <span className="text-blue-500 text-2xl">🎉</span>
                  LifeBit 개발자
                  <span className="text-blue-500 text-2xl">🎉</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {devs.map((dev, i) => (
                    <span
                      key={dev.name}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold text-base shadow transition-all duration-500 opacity-0 translate-y-4 dev-badge dev-badge-${i}`}
                      style={{
                        animation: `dev-badge-fadein 0.5s ${0.2 * i + 0.2}s forwards cubic-bezier(.68,-0.55,.27,1.55)`
                      }}
                    >
                      <span className="text-xl">{dev.emoji}</span>
                      <span className={getDevColor(i)}>{dev.name}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-400">(클릭 시 닫힘)</div>
              </div>
              <style>{`
                @keyframes dev-badge-fadein {
                  from { opacity: 0; transform: translateY(24px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
            </div>
          )}
        </h1>
        <style>{`
          .show-gear .settings-title-text { display: none; }
          .show-gear .settings-title-gear { display: inline-flex; }
          @keyframes spin-slow { 100% { transform: rotate(360deg); } }
          .animate-spin-slow { animation: spin-slow 2s linear infinite; }
          .gear-broken { filter: grayscale(1) blur(1.5px) brightness(0.7); opacity: 0.5; transform: rotate(-30deg) scale(1.2); transition: all 0.5s cubic-bezier(.68,-0.55,.27,1.55); }
          .animate-fade-in { animation: fade-in 0.7s; }
          @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
        <div className="w-full max-w-6xl mx-auto mt-10">
          <NotificationSettings />
        </div>
      </div>
    </Layout>
  );
};

export default Settings; 
