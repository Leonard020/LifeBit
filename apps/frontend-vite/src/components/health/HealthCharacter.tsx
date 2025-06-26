import React from 'react';
import { Progress } from '../ui/progress';

interface HealthCharacterProps {
  exerciseMinutes: number;
  targetMinutes: number;
  isExercising: boolean;
}

export const HealthCharacter: React.FC<HealthCharacterProps> = ({
  exerciseMinutes,
  targetMinutes,
  isExercising
}) => {
  const achievementRate = targetMinutes > 0 ? (exerciseMinutes / targetMinutes) * 100 : 0;
  
  // 캐릭터 상태에 따른 표정과 색상 결정
  const getCharacterState = () => {
    if (achievementRate >= 100) return 'excellent';
    if (achievementRate >= 75) return 'happy';
    if (achievementRate >= 50) return 'good';
    if (achievementRate >= 25) return 'motivated';
    return 'start';
  };

  const characterState = getCharacterState();
  
  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-indigo-100 shadow-xl overflow-hidden">
      {/* 캐릭터 */}
      <div className={`relative z-10 transition-all duration-700 ${
        isExercising ? 'animate-bounce' : characterState === 'excellent' ? 'animate-pulse' : ''
      } ${characterState === 'excellent' ? 'scale-110' : 'scale-100'}`}>
        
        {/* 메인 몸체 */}
        <div className="relative">
          {/* 원형 게이지 배경 */}
          <svg className="absolute -top-2 -left-2 w-36 h-44 transform -rotate-90" viewBox="0 0 144 176">
            <circle
              cx="72"
              cy="88"
              r="70"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="4"
              opacity="0.3"
            />
            <circle
              cx="72"
              cy="88"
              r="70"
              fill="none"
              stroke={
                characterState === 'excellent' ? '#f59e0b' :
                characterState === 'happy' ? '#10b981' :
                characterState === 'good' ? '#3b82f6' :
                characterState === 'motivated' ? '#8b5cf6' :
                '#6b7280'
              }
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${Math.PI * 2 * 70}`}
              strokeDashoffset={`${Math.PI * 2 * 70 * (1 - Math.min(achievementRate, 100) / 100)}`}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 6px ${
                  characterState === 'excellent' ? '#f59e0b40' :
                  characterState === 'happy' ? '#10b98140' :
                  characterState === 'good' ? '#3b82f640' :
                  characterState === 'motivated' ? '#8b5cf640' :
                  '#6b728040'
                })`
              }}
            />
          </svg>
          
          {/* 게이지 퍼센트 표시 */}
          {achievementRate > 0 && (
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-bold px-3 py-2 rounded-full shadow-lg ${
              characterState === 'excellent' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
              characterState === 'happy' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
              characterState === 'good' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
              characterState === 'motivated' ? 'bg-purple-100 text-purple-800 border-2 border-purple-300' :
              'bg-gray-100 text-gray-700 border-2 border-gray-300'
            }`}>
              {Math.round(achievementRate)}%
            </div>
          )}
          
          <div className={`relative w-32 h-40 rounded-full transition-all duration-500 ${
            characterState === 'excellent' ? 'bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 shadow-2xl shadow-yellow-300/50' :
            characterState === 'happy' ? 'bg-gradient-to-br from-green-300 via-emerald-300 to-teal-300 shadow-xl shadow-green-300/40' :
            characterState === 'good' ? 'bg-gradient-to-br from-blue-300 via-cyan-300 to-sky-300 shadow-lg shadow-blue-300/30' :
            characterState === 'motivated' ? 'bg-gradient-to-br from-purple-300 via-violet-300 to-indigo-300 shadow-lg shadow-purple-300/30' :
            'bg-gradient-to-br from-gray-300 via-slate-300 to-zinc-300 shadow-md'
          }`}>
            {/* 얼굴 */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
              {/* 눈 */}
              <div className="flex gap-2 justify-center mb-2">
                {characterState === 'excellent' ? (
                  <>
                    <div className="w-3 h-3 bg-gradient-to-br from-amber-800 to-yellow-900 rounded-full relative">
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                    <div className="w-3 h-3 bg-gradient-to-br from-amber-800 to-yellow-900 rounded-full relative">
                      <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80"></div>
                    </div>
                  </>
                ) : characterState === 'happy' ? (
                  <>
                    <div className="w-1 h-3 bg-black rounded-full transform rotate-12"></div>
                    <div className="w-1 h-3 bg-black rounded-full transform -rotate-12"></div>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 bg-black rounded-full relative">
                      <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-2.5 h-2.5 bg-black rounded-full relative">
                      <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full"></div>
                    </div>
                  </>
                )}
              </div>
              
              {/* 입 */}
              <div className="flex justify-center">
                {characterState === 'excellent' ? (
                  <div className="w-6 h-3 border-2 border-amber-800 rounded-full border-t-0 bg-gradient-to-b from-red-300 to-red-400"></div>
                ) : characterState === 'happy' ? (
                  <div className="w-5 h-2 border-2 border-black rounded-full border-t-0"></div>
                ) : characterState === 'good' ? (
                  <div className="w-4 h-1.5 border-2 border-black rounded-full border-t-0"></div>
                ) : characterState === 'motivated' ? (
                  <div className="w-3 h-1 bg-black rounded-full"></div>
                ) : (
                  <div className="w-3 h-0.5 bg-gray-600 rounded-full"></div>
                )}
              </div>
              
              {/* 뺨 홍조 (행복할 때) */}
              {(characterState === 'excellent' || characterState === 'happy') && (
                <>
                  <div className="absolute -left-2 top-1 w-2 h-1.5 bg-pink-300 rounded-full opacity-60"></div>
                  <div className="absolute -right-2 top-1 w-2 h-1.5 bg-pink-300 rounded-full opacity-60"></div>
                </>
              )}
            </div>
            
            {/* 운동 도구 (활동적일 때) */}
            {isExercising && (
              <>
                <div className="absolute -left-10 top-10 w-8 h-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full transform rotate-45 shadow-lg"></div>
                <div className="absolute -right-10 top-10 w-8 h-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full transform -rotate-45 shadow-lg"></div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 운동 시간 표시 */}
      <div className="relative z-10 mt-6 text-center">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-3 ${
          characterState === 'excellent' ? 'bg-yellow-200 text-yellow-800' :
          characterState === 'happy' ? 'bg-green-200 text-green-800' :
          characterState === 'good' ? 'bg-blue-200 text-blue-800' :
          characterState === 'motivated' ? 'bg-purple-200 text-purple-800' :
          'bg-gray-200 text-gray-700'
        }`}>
          {characterState === 'excellent' ? '🏆 완벽해요!' :
           characterState === 'happy' ? '😊 훌륭해요!' :
           characterState === 'good' ? '👍 잘하고 있어요!' :
           characterState === 'motivated' ? '💪 화이팅!' :
           '🌱 시작해볼까요?'}
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">오늘 내 운동 시간은?</h3>
        
        <div className={`inline-block p-4 rounded-2xl mb-4 ${
          characterState === 'excellent' ? 'bg-gradient-to-br from-yellow-100 to-amber-100 border-2 border-yellow-300' :
          characterState === 'happy' ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300' :
          characterState === 'good' ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300' :
          characterState === 'motivated' ? 'bg-gradient-to-br from-purple-100 to-violet-100 border-2 border-purple-300' :
          'bg-gradient-to-br from-gray-100 to-slate-100 border-2 border-gray-300'
        }`}>
          <div className="text-4xl font-black text-gray-900">
            {exerciseMinutes}<span className="text-2xl text-gray-600 font-semibold ml-1">분</span>
          </div>
        </div>
        
        {/* 목표 달성률 */}
        <div className="w-full max-w-sm mx-auto">
          <div className="relative">
            <Progress 
              value={Math.min(achievementRate, 100)} 
              className={`h-3 ${
                characterState === 'excellent' ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' :
                characterState === 'happy' ? '[&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-500' :
                characterState === 'good' ? '[&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-cyan-500' :
                characterState === 'motivated' ? '[&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-violet-500' :
                '[&>div]:bg-gradient-to-r [&>div]:from-gray-400 [&>div]:to-slate-500'
              }`}
            />
            {achievementRate > 100 && (
              <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-2 font-medium">
            <span>0분</span>
            <span className="font-bold">{Math.round(achievementRate)}%</span>
            <span>{targetMinutes}분 목표</span>
          </div>
        </div>
        
        {/* 격려 메시지 */}
        <div className={`mt-4 p-3 rounded-xl text-sm font-semibold ${
          characterState === 'excellent' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          characterState === 'happy' ? 'bg-green-50 text-green-700 border border-green-200' :
          characterState === 'good' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
          characterState === 'motivated' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
          'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          {achievementRate >= 120 ? (
            <span>🎊 목표를 크게 넘어섰네요! 대단해요!</span>
          ) : achievementRate >= 100 ? (
            <span>🎉 완벽한 목표 달성! 최고입니다!</span>
          ) : achievementRate >= 75 ? (
            <span>🔥 거의 다 왔어요! 조금만 더!</span>
          ) : achievementRate >= 50 ? (
            <span>💪 절반 달성! 멋진 진전이에요!</span>
          ) : achievementRate >= 25 ? (
            <span>🌟 좋은 시작! 꾸준히 해봐요!</span>
          ) : (
            <span>🚀 오늘도 건강한 하루 시작해요!</span>
          )}
        </div>
      </div>
    </div>
  );
}; 