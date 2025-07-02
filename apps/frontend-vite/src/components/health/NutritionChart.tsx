import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Target, Flame, Utensils } from 'lucide-react';
import { NutritionGoals } from './types/health';

interface NutritionChartProps {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  nutritionGoals: NutritionGoals;
}

// NaN 방지 유틸
const safeNumber = (value: number | undefined | null) => isNaN(Number(value)) ? 0 : Number(value);

export const NutritionChart: React.FC<NutritionChartProps> = ({
  carbs,
  protein,
  fat,
  calories,
  nutritionGoals
}) => {
  const total = safeNumber(carbs) + safeNumber(protein) + safeNumber(fat);

  // 목표가 설정되지 않은 경우 처리
  const hasNutritionGoals = !!(
    nutritionGoals.calories || 
    nutritionGoals.carbs || 
    nutritionGoals.protein || 
    nutritionGoals.fat
  );

  // 다크모드 판별
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
      const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  if (total === 0) {
    return (
      <div className={
        (isDarkMode
          ? 'bg-card border-border'
          : 'bg-gradient-to-br from-slate-50 to-blue-50') +
        ' rounded-2xl p-8 shadow-lg border-0'
      }>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">🍽️ 영양소 분석</h3>
          <p className="text-gray-600 dark:text-white">오늘의 영양소 섭취량을 확인해보세요</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 bg-white rounded-xl shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Utensils className="h-10 w-10 text-gray-400" />
          </div>
          <p className="font-semibold text-lg mb-2">아직 기록된 식단이 없습니다</p>
          <p className="text-sm text-gray-400">식단을 추가하여 영양소를 분석해보세요</p>
        </div>
      </div>
    );
  }
  
  const data = [
    { name: '탄수화물', value: safeNumber(carbs), color: '#3b82f6', bgColor: 'from-blue-400 to-blue-600' },
    { name: '단백질', value: safeNumber(protein), color: '#10b981', bgColor: 'from-emerald-400 to-emerald-600' },
    { name: '지방', value: safeNumber(fat), color: '#f59e0b', bgColor: 'from-amber-400 to-amber-600' }
  ];

  const getPercentage = (value: number) => {
    const percent = total > 0 ? Math.round((safeNumber(value) / total) * 100) : 0;
    return isNaN(percent) ? 0 : percent;
  };

  // 칼로리별 색상 결정
  const getCalorieColor = () => {
    if (safeNumber(calories) < 1200) return 'text-blue-600';
    if (safeNumber(calories) < 2000) return 'text-green-600';
    if (safeNumber(calories) < 2500) return 'text-amber-600';
    return 'text-red-600';
  };

  const getCalorieStatus = () => {
    if (safeNumber(calories) < 1200) return '부족';
    if (safeNumber(calories) < 2000) return '적정';
    if (safeNumber(calories) < 2500) return '충분';
    return '과다';
  };

  return (
    <div className={
      (isDarkMode
        ? 'bg-card border border-[#7c3aed]'
        : 'bg-white border-none') +
      ' rounded-2xl p-8 shadow-lg'
    }>
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">🍽️ 영양소 분석</h3>
        <p className="text-gray-600 dark:text-white">오늘의 영양소 섭취량을 확인해보세요</p>
      </div>
      
      {/* 메인 차트 영역 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 dark:bg-card dark:border-border">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* 파이 차트 */}
          <div className="relative">
            <div className="w-56 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 중앙 칼로리 표시 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-white rounded-full w-24 h-24 flex flex-col items-center justify-center shadow-md">
                <div className={`text-2xl font-bold ${getCalorieColor()}`}>
                  {isNaN(calories) ? 0 : Math.round(safeNumber(calories) * 10) / 10}
                </div>
                <div className="text-xs text-gray-500">kcal</div>
                <div className={`text-xs font-medium ${getCalorieColor()}`}>
                  {getCalorieStatus()}
                </div>
              </div>
            </div>
          </div>
          
          {/* 영양소 상세 정보 */}
          <div className="flex-1 space-y-4">
            {data.map((item, index) => (
              <div key={index} className={
                (isDarkMode
                  ? 'bg-card border border-[#7c3aed]'
                  : 'bg-gray-50 border-none') +
                ' rounded-xl p-4 hover:shadow-md transition-shadow'
              }>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.bgColor} shadow-sm`}
                    />
                    <span className={
                      'font-semibold ' +
                      (item.name === '탄수화물'
                        ? 'text-blue-600 dark:text-blue-200'
                        : item.name === '단백질'
                        ? 'text-green-600 dark:text-green-200'
                        : item.name === '지방'
                        ? 'text-amber-600 dark:text-amber-200'
                        : 'text-gray-800')
                    }>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className={
                      'text-lg font-bold ' +
                      (item.name === '탄수화물'
                        ? 'text-blue-600 dark:text-blue-100'
                        : item.name === '단백질'
                        ? 'text-green-600 dark:text-green-100'
                        : item.name === '지방'
                        ? 'text-amber-600 dark:text-amber-100'
                        : 'text-gray-900')
                    }>{isNaN(item.value) ? 0 : Math.round(item.value * 10) / 10}g</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({getPercentage(item.value)}%)
                    </span>
                  </div>
                </div>
                {/* 프로그레스 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-muted">
                  <div
                    className={`bg-gradient-to-r ${item.bgColor}
                      ${item.name === '탄수화물' ? 'dark:from-blue-500 dark:to-blue-700' : ''}
                      ${item.name === '단백질' ? 'dark:from-emerald-500 dark:to-emerald-700' : ''}
                      ${item.name === '지방' ? 'dark:from-amber-500 dark:to-amber-700' : ''}
                      h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${getPercentage(item.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 목표 대비 달성률 섹션 - 목표가 설정된 경우만 표시 */}
      {hasNutritionGoals ? (
        <div className={
          (isDarkMode
            ? 'bg-card border border-[#7c3aed]'
            : 'bg-white border-none') +
          ' mt-8 rounded-2xl p-6 shadow-sm'
        }>
          <h4 className="text-lg font-semibold text-center mb-6 flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            🎯 목표 대비 달성률 (최신 목표 기준)
          </h4>
          <div className="space-y-4">
            {/* 총 열량 - 목표가 있는 경우만 표시 */}
            {nutritionGoals.calories && (
              <div className={
                (isDarkMode
                  ? 'bg-card border border-[#7c3aed]'
                  : 'bg-red-50 bg-gradient-to-r from-red-50 to-pink-50 border-none') +
                ' rounded-xl p-4'
              }>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-sm">총 열량</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{isNaN(calories) ? 0 : Math.round(safeNumber(calories) * 10) / 10} kcal</span>
                    <span className="text-xs text-gray-500 ml-1">/ {safeNumber(nutritionGoals.calories)} kcal</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((safeNumber(calories) / safeNumber(nutritionGoals.calories)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-red-600 font-medium text-center">
                  {isNaN(calories) || isNaN(nutritionGoals.calories) || !nutritionGoals.calories ? 0 : Math.round((safeNumber(calories) / safeNumber(nutritionGoals.calories)) * 1000) / 10}% 달성
                </div>
              </div>
            )}
            {/* 탄수화물 - 목표가 있는 경우만 표시 */}
            {nutritionGoals.carbs && (
              <div className={
                (isDarkMode
                  ? 'bg-card border border-[#7c3aed]'
                  : 'bg-blue-50 bg-gradient-to-r from-blue-50 to-cyan-50 border-none') +
                ' rounded-xl p-4'
              }>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="font-semibold text-blue-600 dark:text-blue-200">탄수화물</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-100">{isNaN(carbs) ? 0 : Math.round(safeNumber(carbs) * 10) / 10}g</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">/ {safeNumber(nutritionGoals.carbs)}g</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((safeNumber(carbs) / safeNumber(nutritionGoals.carbs)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 font-medium text-center">
                  {isNaN(carbs) || isNaN(nutritionGoals.carbs) || !nutritionGoals.carbs ? 0 : Math.round((safeNumber(carbs) / safeNumber(nutritionGoals.carbs)) * 1000) / 10}% 달성
                </div>
              </div>
            )}
            {/* 단백질 - 목표가 있는 경우만 표시 */}
            {nutritionGoals.protein && (
              <div className={
                (isDarkMode
                  ? 'bg-card border border-[#7c3aed]'
                  : 'bg-emerald-50 bg-gradient-to-r from-emerald-50 to-green-50 border-none') +
                ' rounded-xl p-4'
              }>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-green-600 dark:text-green-200">단백질</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600 dark:text-green-100">{isNaN(protein) ? 0 : Math.round(safeNumber(protein) * 10) / 10}g</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">/ {safeNumber(nutritionGoals.protein)}g</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((safeNumber(protein) / safeNumber(nutritionGoals.protein)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-emerald-600 font-medium text-center">
                  {isNaN(protein) || isNaN(nutritionGoals.protein) || !nutritionGoals.protein ? 0 : Math.round((safeNumber(protein) / safeNumber(nutritionGoals.protein)) * 1000) / 10}% 달성
                </div>
              </div>
            )}
            {/* 지방 - 목표가 있는 경우만 표시 */}
            {nutritionGoals.fat && (
              <div className={
                (isDarkMode
                  ? 'bg-card border border-[#7c3aed]'
                  : 'bg-amber-50 bg-gradient-to-r from-amber-50 to-yellow-50 border-none') +
                ' rounded-xl p-4'
              }>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="font-semibold text-amber-600 dark:text-amber-200">지방</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-100">{isNaN(fat) ? 0 : Math.round(safeNumber(fat) * 10) / 10}g</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">/ {safeNumber(nutritionGoals.fat)}g</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-muted rounded-full h-2 mb-1">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((safeNumber(fat) / safeNumber(nutritionGoals.fat)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-amber-600 font-medium text-center">
                  {isNaN(fat) || isNaN(nutritionGoals.fat) || !nutritionGoals.fat ? 0 : Math.round((safeNumber(fat) / safeNumber(nutritionGoals.fat)) * 1000) / 10}% 달성
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-amber-50 rounded-2xl p-6 text-center border border-amber-200">
          <div className="text-amber-600 text-lg mb-2">🎯 목표 미설정</div>
          <p className="text-sm text-amber-700 mb-3">
            영양소 목표를 설정하여 달성률을 확인해보세요!
          </p>
          <button 
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            onClick={() => {
              console.log('영양소 목표 설정 페이지로 이동');
            }}
          >
            목표 설정하기
          </button>
        </div>
      )}
    </div>
  );
}; 