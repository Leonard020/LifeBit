import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Progress } from '../ui/progress';
import { WeightTrendChart } from './WeightTrendChart';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
import { ExerciseCalendarHeatmap } from './ExerciseCalendarHeatmap';
import { 
  Activity, 
  Apple, 
  Utensils, 
  Coffee, 
  Cookie,
  TrendingUp,
  Calendar as CalendarIcon,
  Target,
  Flame,
  Droplets,
  Weight,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Dumbbell
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, UserGoal } from '../../api/auth';
import { useExerciseCalendarHeatmap } from '../../api/authApi';
import { getToken, getUserInfo, isTokenValid } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';
import { useDailyNutritionStats } from '@/api/authApi';

interface EnhancedHealthDashboardProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

// 캐릭터 컴포넌트
const HealthCharacter: React.FC<{ 
  exerciseMinutes: number; 
  targetMinutes: number;
  isExercising: boolean;
}> = ({ exerciseMinutes, targetMinutes, isExercising }) => {
  const achievementRate = targetMinutes > 0 ? (exerciseMinutes / targetMinutes) * 100 : 0;
  
  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl">
      {/* 캐릭터 */}
      <div className={`relative transition-transform duration-500 ${isExercising ? 'animate-bounce' : ''}`}>
        <div className="w-24 h-32 bg-yellow-200 rounded-full relative">
          {/* 얼굴 */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
            <div className="w-3 h-1 bg-black rounded-full mt-1 mx-auto"></div>
          </div>
          
          {/* 팔 (운동 도구) */}
          {isExercising && (
            <>
              <div className="absolute -left-8 top-8 w-6 h-2 bg-gray-800 rounded-full transform rotate-45"></div>
              <div className="absolute -right-8 top-8 w-6 h-2 bg-gray-800 rounded-full transform -rotate-45"></div>
            </>
          )}
        </div>
        
        {/* 반짝임 효과 */}
        {achievementRate >= 100 && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 text-yellow-400">✨</div>
          </div>
        )}
      </div>
      
      {/* 운동 시간 표시 */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-bold text-gray-800">오늘 내 운동 시간은?</h3>
        <div className="text-3xl font-bold text-gray-900 mt-2">
          {exerciseMinutes}<span className="text-lg text-gray-600">분</span>
        </div>
        
        {/* 목표 달성률 */}
        <div className="mt-3 w-full max-w-xs">
          <Progress value={Math.min(achievementRate, 100)} className="h-2" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>0분</span>
            <span>{targetMinutes}분 목표</span>
          </div>
        </div>
        
        {/* 격려 메시지 */}
        <div className="mt-3 text-sm text-gray-600">
          {achievementRate >= 100 ? (
            <span className="text-green-600 font-semibold">🎉 목표 달성!</span>
          ) : achievementRate >= 50 ? (
            <span className="text-blue-600">💪 절반 달성!</span>
          ) : (
            <span>화이팅! 💪</span>
          )}
        </div>
      </div>
    </div>
  );
};

// 식단 카드 컴포넌트
const MealCard: React.FC<{
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  calories: number;
  onAdd: () => void;
}> = ({ type, title, icon, isCompleted, calories, onAdd }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'breakfast': return 'from-orange-100 to-yellow-100';
      case 'lunch': return 'from-green-100 to-emerald-100';
      case 'dinner': return 'from-blue-100 to-indigo-100';
      case 'snack': return 'from-purple-100 to-pink-100';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${getBackgroundColor()} border-0 hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-gray-800">{title}</span>
          </div>
          {isCompleted && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {isCompleted ? (
            <span>{calories} kcal 섭취</span>
          ) : (
            <span className="text-gray-400">아직 기록이 없어요</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="w-full justify-center gap-2 hover:bg-white/50"
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </CardContent>
    </Card>
  );
};

// 영양소 차트 컴포넌트 (목표 대비 달성률 포함)
const NutritionChart: React.FC<{
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  nutritionGoals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}> = ({ carbs, protein, fat, calories, nutritionGoals }) => {
  const total = carbs + protein + fat;

  if (total === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 shadow-lg border-0">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">🍽️ 영양소 분석</h3>
          <p className="text-gray-600">오늘의 영양소 섭취량을 확인해보세요</p>
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
    { name: '탄수화물', value: carbs, color: '#3b82f6', bgColor: 'from-blue-400 to-blue-600' },
    { name: '단백질', value: protein, color: '#10b981', bgColor: 'from-emerald-400 to-emerald-600' },
    { name: '지방', value: fat, color: '#f59e0b', bgColor: 'from-amber-400 to-amber-600' }
  ];

  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // 칼로리별 색상 결정
  const getCalorieColor = () => {
    if (calories < 1200) return 'text-blue-600';
    if (calories < 2000) return 'text-green-600';
    if (calories < 2500) return 'text-amber-600';
    return 'text-red-600';
  };

  const getCalorieStatus = () => {
    if (calories < 1200) return '부족';
    if (calories < 2000) return '적정';
    if (calories < 2500) return '충분';
    return '과다';
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 shadow-lg border-0">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">🍽️ 영양소 분석</h3>
        <p className="text-gray-600">오늘의 영양소 섭취량을 확인해보세요</p>
      </div>
      
      {/* 메인 차트 영역 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
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
                {Math.round(calories * 10) / 10}
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
              <div key={index} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-r ${item.bgColor} shadow-sm`}
                    />
                    <span className="font-semibold text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-900">{Math.round(item.value * 10) / 10}g</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({getPercentage(item.value)}%)
                    </span>
                  </div>
                </div>
                {/* 프로그레스 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${item.bgColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${getPercentage(item.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 목표 대비 달성률 섹션 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-center mb-6 flex items-center justify-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          🎯 목표 대비 달성률
        </h4>
        
        <div className="space-y-4">
          {/* 총 열량 */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="font-medium text-sm">총 열량</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{Math.round(calories * 10) / 10} kcal</span>
                <span className="text-xs text-gray-500 ml-1">/ {nutritionGoals.calories} kcal</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((calories / nutritionGoals.calories) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-red-600 font-medium text-center">
              {Math.round((calories / nutritionGoals.calories) * 1000) / 10}% 달성
            </div>
          </div>
          
          {/* 탄수화물 */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-sm">탄수화물</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{Math.round(carbs * 10) / 10}g</span>
                <span className="text-xs text-gray-500 ml-1">/ {nutritionGoals.carbs}g</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((carbs / nutritionGoals.carbs) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-blue-600 font-medium text-center">
              {Math.round((carbs / nutritionGoals.carbs) * 1000) / 10}% 달성
            </div>
          </div>
          
          {/* 단백질 */}
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-medium text-sm">단백질</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{Math.round(protein * 10) / 10}g</span>
                <span className="text-xs text-gray-500 ml-1">/ {nutritionGoals.protein}g</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((protein / nutritionGoals.protein) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-emerald-600 font-medium text-center">
              {Math.round((protein / nutritionGoals.protein) * 1000) / 10}% 달성
            </div>
          </div>
          
          {/* 지방 */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-medium text-sm">지방</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{Math.round(fat * 10) / 10}g</span>
                <span className="text-xs text-gray-500 ml-1">/ {nutritionGoals.fat}g</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((fat / nutritionGoals.fat) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-amber-600 font-medium text-center">
              {Math.round((fat / nutritionGoals.fat) * 1000) / 10}% 달성
            </div>
          </div>
        </div>
        
        {/* 전체 달성률 요약 */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-lg font-bold text-red-600">
                {Math.round((calories / nutritionGoals.calories) * 1000) / 10}%
              </div>
              <div className="text-xs text-gray-600">열량</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-600">
                {Math.round((carbs / nutritionGoals.carbs) * 1000) / 10}%
              </div>
              <div className="text-xs text-gray-600">탄수화물</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <div className="text-lg font-bold text-emerald-600">
                {Math.round((protein / nutritionGoals.protein) * 1000) / 10}%
              </div>
              <div className="text-xs text-gray-600">단백질</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-lg font-bold text-amber-600">
                {Math.round((fat / nutritionGoals.fat) * 1000) / 10}%
              </div>
              <div className="text-xs text-gray-600">지방</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI 추천 컴포넌트
const AIRecommendations: React.FC<{
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  exerciseMinutes: number;
  caloriesBurned: number;
  nutritionGoals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}> = ({ calories, carbs, protein, fat, exerciseMinutes, caloriesBurned, nutritionGoals }) => {
  
  // AI 추천 로직
  const getRecommendations = () => {
    const recommendations = [];
    
    // 칼로리 기반 추천
    const calorieRatio = calories / nutritionGoals.calories;
    if (calorieRatio < 0.8) {
      recommendations.push({
        type: 'nutrition',
        icon: '🍎',
        title: '칼로리 부족',
        message: '건강한 간식을 추가해보세요',
        suggestion: '견과류, 바나나, 요거트 등을 섭취하세요',
        priority: 'high'
      });
    } else if (calorieRatio > 1.2) {
      recommendations.push({
        type: 'exercise',
        icon: '🏃‍♂️',
        title: '칼로리 과다',
        message: '추가 운동을 권장합니다',
        suggestion: '30분 걷기나 계단 오르기를 해보세요',
        priority: 'medium'
      });
    }
    
    // 단백질 기반 추천
    const proteinRatio = protein / nutritionGoals.protein;
    if (proteinRatio < 0.7) {
      recommendations.push({
        type: 'nutrition',
        icon: '🥩',
        title: '단백질 부족',
        message: '근육 건강을 위해 단백질을 더 섭취하세요',
        suggestion: '닭가슴살, 계란, 두부, 콩류를 추가하세요',
        priority: 'high'
      });
    }
    
    // 탄수화물 기반 추천
    const carbRatio = carbs / nutritionGoals.carbs;
    if (carbRatio > 1.3) {
      recommendations.push({
        type: 'nutrition',
        icon: '🥗',
        title: '탄수화물 과다',
        message: '균형잡힌 식단을 위해 채소를 늘려보세요',
        suggestion: '브로콜리, 시금치, 양배추 등을 추가하세요',
        priority: 'medium'
      });
    }
    
    // 운동 기반 추천
    if (exerciseMinutes < 30) {
      recommendations.push({
        type: 'exercise',
        icon: '💪',
        title: '운동 부족',
        message: '건강을 위해 더 많은 활동이 필요해요',
        suggestion: '하루 30분 이상 운동하는 것을 목표로 하세요',
        priority: 'high'
      });
    }
    
    // 칼로리 수지 기반 추천
    const calorieBalance = calories - caloriesBurned;
    if (calorieBalance > 500) {
      recommendations.push({
        type: 'balance',
        icon: '⚖️',
        title: '칼로리 수지 불균형',
        message: '섭취 칼로리가 너무 많습니다',
        suggestion: '유산소 운동을 추가하거나 식단량을 조절하세요',
        priority: 'medium'
      });
    }
    
    // 긍정적인 추천도 추가
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'praise',
        icon: '🎉',
        title: '완벽한 균형!',
        message: '오늘 영양 섭취가 매우 좋습니다',
        suggestion: '이 패턴을 유지하시면 건강한 생활을 할 수 있어요',
        priority: 'low'
      });
    }
    
    return recommendations.slice(0, 4); // 최대 4개까지만 표시
  };
  
  const recommendations = getRecommendations();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-50 to-red-100 border-red-200';
      case 'medium': return 'from-amber-50 to-amber-100 border-amber-200';
      case 'low': return 'from-green-50 to-green-100 border-green-200';
      default: return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };
  
  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-amber-700';
      case 'low': return 'text-green-700';
      default: return 'text-blue-700';
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border-0">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <span className="text-2xl">🤖</span>
          AI 맞춤 추천
        </h3>
        <p className="text-gray-600">당신의 건강 데이터를 분석한 개인 맞춤 조언입니다</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${getPriorityColor(rec.priority)} rounded-xl p-5 border-2 hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{rec.icon}</div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${getPriorityTextColor(rec.priority)}`}>
                  {rec.title}
                </h4>
                <p className="text-gray-700 text-sm mb-2">{rec.message}</p>
                <p className="text-gray-600 text-xs bg-white/50 rounded-lg p-2">
                  💡 {rec.suggestion}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 추가 건강 팁 */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-center mb-4">💡 오늘의 건강 팁</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl mb-2">💧</div>
            <p className="text-sm font-medium text-blue-800">물 충분히 마시기</p>
            <p className="text-xs text-blue-600 mt-1">하루 8잔 이상</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl mb-2">😴</div>
            <p className="text-sm font-medium text-green-800">충분한 수면</p>
            <p className="text-xs text-green-600 mt-1">7-8시간 권장</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl mb-2">🧘‍♀️</div>
            <p className="text-sm font-medium text-purple-800">스트레스 관리</p>
            <p className="text-xs text-purple-600 mt-1">명상, 요가 추천</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 컴포넌트
export const EnhancedHealthDashboard: React.FC<EnhancedHealthDashboardProps> = ({
  userId,
  period
}) => {
  console.log('🚀 [EnhancedHealthDashboard] 컴포넌트 렌더링 시작!', { userId, period });
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'exercise' | 'calendar'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 인증 체크
  useEffect(() => {
    const token = getToken();
    if (!token || !isTokenValid()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // API 데이터 가져오기 (에러 처리 포함)
  const { 
    data: healthRecords, 
    isLoading: healthLoading, 
    error: healthError,
    refetch: refetchHealth
  } = useHealthRecords(userId, period);
  
  const { 
    data: mealLogs, 
    isLoading: mealLoading, 
    error: mealError,
    refetch: refetchMeals
  } = useMealLogs(userId, period);
  
  const { 
    data: exerciseSessions, 
    isLoading: exerciseLoading, 
    error: exerciseError,
    refetch: refetchExercise
  } = useExerciseSessions(userId, period);

  const { 
    data: userGoals, 
    isLoading: goalsLoading, 
    error: goalsError,
    refetch: refetchGoals
  } = useUserGoals(userId);

  const { 
    data: healthStats, 
    isLoading: healthStatsLoading, 
    error: healthStatsError,
    refetch: refetchHealthStats
  } = useHealthStatistics(userId, 'week');

  // 📅 운동 캘린더 히트맵 데이터 조회
  const { 
    data: exerciseHeatmapData, 
    isLoading: heatmapLoading, 
    error: heatmapError 
  } = useExerciseCalendarHeatmap(userId);
  
  // 🍽️ 실제 영양소 데이터 조회
  const { 
    data: nutritionStats, 
    isLoading: nutritionLoading, 
    error: nutritionError 
  } = useDailyNutritionStats(userId);
  
  // 🔍 영양소 데이터 디버깅
  console.log('🍽️ [DEBUG] 영양소 API 상태:', {
    nutritionStats,
    nutritionLoading,
    nutritionError: nutritionError?.message,
    userId
  });
  
  // 🔍 healthStats에서 영양소 데이터 추출 시도
  const healthStatsData = healthStats?.data as Record<string, unknown>;
  const nutritionFromHealthStats = {
    dailyCalories: healthStatsData?.dailyCalories as number || 0,
    dailyCarbs: healthStatsData?.dailyCarbs as number || 0,
    dailyProtein: healthStatsData?.dailyProtein as number || 0,
    dailyFat: healthStatsData?.dailyFat as number || 0,
    mealLogCount: healthStatsData?.mealLogCount as number || 0,
    dataSource: healthStatsData?.dataSource as string || 'unknown'
  };
  
  console.log('🔍 [DEBUG] healthStats에서 추출한 영양소 데이터:', nutritionFromHealthStats);
  
  // API 응답 직접 확인
  console.log('🔥 [DEBUG] healthStats 전체 응답:', healthStats);
  console.log('🔥 [DEBUG] healthStats.data:', healthStats?.data);

  // 전체 로딩 상태 계산
  const allLoading = healthLoading || mealLoading || exerciseLoading || goalsLoading || healthStatsLoading || heatmapLoading || nutritionLoading;
  const hasError = healthError || mealError || exerciseError || goalsError || healthStatsError || heatmapError || nutritionError;
  
  // 상태 디버깅
  console.log('📊 [EnhancedHealthDashboard] API 로딩 상태:', {
    healthLoading,
    mealLoading,
    exerciseLoading,
    goalsLoading,
    healthStatsLoading,
    allLoading
  });
  
  console.log('📊 [EnhancedHealthDashboard] API 에러 상태:', {
    healthError: healthError?.message,
    mealError: mealError?.message,
    exerciseError: exerciseError?.message,
    goalsError: goalsError?.message,
    healthStatsError: healthStatsError?.message,
    hasError
  });

  // 에러 처리
  useEffect(() => {
    if (hasError) {
      const errorMessage = 
        healthError?.message || 
        mealError?.message || 
        exerciseError?.message || 
        goalsError?.message || 
        healthStatsError?.message || 
        '데이터를 불러오는데 실패했습니다.';
      
      setError(errorMessage);
      toast({
        title: '오류 발생',
        description: errorMessage,
        variant: 'destructive'
      });
    } else {
      setError(null);
    }
  }, [hasError, healthError, mealError, exerciseError, goalsError, healthStatsError]);

  // 전체 재시도 함수
  const handleRetry = useCallback(() => {
    setError(null);
    refetchHealth();
    refetchMeals();
    refetchExercise();
    refetchGoals();
    refetchHealthStats();
  }, [refetchHealth, refetchMeals, refetchExercise, refetchGoals, refetchHealthStats]);

  // 오늘의 데이터 계산 (실제 API 데이터 기반)
  const todayData = useMemo(() => {
    if (allLoading) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // 사용자 목표 값 (API에서 가져온 실제 데이터)
    const goalsData = userGoals?.data as UserGoal | undefined;
    const targetMinutes = goalsData?.weekly_workout_target ? Math.round(goalsData.weekly_workout_target / 7) : 60;
    
    // 실제 건강 통계 API에서 운동 시간 가져오기
    const healthStatsData = healthStats?.data as Record<string, unknown>;
    console.log('🎯 [EnhancedHealthDashboard] 건강 통계 데이터:', healthStatsData);
    console.log('📅 [EnhancedHealthDashboard] 오늘 날짜:', today);
    
    // 주간 운동 시간을 일일 평균으로 계산 (더 의미있는 데이터 표시)
    const weeklyExerciseMinutes = typeof healthStatsData?.weeklyExerciseMinutes === 'number' 
      ? healthStatsData.weeklyExerciseMinutes 
      : 0;
    const exerciseMinutes = Math.round(weeklyExerciseMinutes / 7); // 주간 평균을 일일로 표시
    
    // 운동 세션 데이터로 오늘의 정확한 칼로리 계산
    const exerciseSessionsData = exerciseSessions?.data || exerciseSessions || [];
    console.log('🏃 [EnhancedHealthDashboard] 운동 세션 데이터:', exerciseSessionsData);
    
    const todayExercise = Array.isArray(exerciseSessionsData) 
      ? exerciseSessionsData.filter(session => session.exercise_date === today)
      : [];
    console.log('📊 [EnhancedHealthDashboard] 오늘 운동 세션:', todayExercise);
    
    const caloriesBurned = todayExercise.reduce((sum, session) => sum + session.calories_burned, 0);
    
    // 만약 오늘 운동 기록이 있다면 실제 오늘 시간을 사용, 없다면 평균 사용
    const actualTodayMinutes = todayExercise.reduce((sum, session) => sum + session.duration_minutes, 0);
    const displayExerciseMinutes = actualTodayMinutes > 0 ? actualTodayMinutes : exerciseMinutes;
    
    console.log('⏱️ [EnhancedHealthDashboard] 주간 총 운동시간:', weeklyExerciseMinutes);
    console.log('📈 [EnhancedHealthDashboard] 일일 평균 운동시간:', exerciseMinutes);
    console.log('🎯 [EnhancedHealthDashboard] 실제 오늘 운동시간:', actualTodayMinutes);
    console.log('💪 [EnhancedHealthDashboard] 최종 표시 운동시간:', displayExerciseMinutes);
    
    // 오늘의 식단 (API 데이터 - 현재는 기본 MealLog 타입 사용)
    const mealLogsData = mealLogs?.data || mealLogs || [];
    const todayMeals = Array.isArray(mealLogsData)
      ? mealLogsData.filter(meal => meal.log_date === today)
      : [];
    
    // 🍽️ 실제 meal_logs 테이블에서 영양소 정보 가져오기
    console.log('🍽️ [EnhancedHealthDashboard] 영양소 통계 데이터:', nutritionStats);
    
    // 🔧 영양소 데이터 우선순위: nutritionStats > healthStats > 기본값 0
    const finalNutritionData = nutritionStats || nutritionFromHealthStats;
    
    const totalCalories = finalNutritionData?.dailyCalories || 0;
    const totalCarbs = finalNutritionData?.dailyCarbs || 0;
    const totalProtein = finalNutritionData?.dailyProtein || 0;
    const totalFat = finalNutritionData?.dailyFat || 0;
    
    console.log('📊 [EnhancedHealthDashboard] 실제 영양소 데이터:', {
      totalCalories,
      totalCarbs,
      totalProtein,
      totalFat,
      dataSource: nutritionStats?.dataSource
    });
    
    // 식단별 완료 상태 (기본적으로 시간대별 분류 - 실제 구현시 meal_time 필드 사용)
    const mealsByTime = {
      breakfast: todayMeals.some(meal => meal.meal_log_id % 4 === 1),
      lunch: todayMeals.some(meal => meal.meal_log_id % 4 === 2),
      dinner: todayMeals.some(meal => meal.meal_log_id % 4 === 3),
      snack: todayMeals.some(meal => meal.meal_log_id % 4 === 0)
    };
    
    return {
      exerciseMinutes: displayExerciseMinutes,
      targetMinutes,
      caloriesBurned,
      meals: mealsByTime,
      totalCalories,
      nutrition: {
        carbs: totalCarbs,
        protein: totalProtein,
        fat: totalFat
      },
      // 목표 대비 달성률
      nutritionGoals: {
        calories: 2000, // 기본 칼로리 목표 (추후 DB에 필드 추가 시 goalsData?.daily_calorie_target 사용)
        carbs: goalsData?.daily_carbs_target || 300,
        protein: goalsData?.daily_protein_target || 120,
        fat: goalsData?.daily_fat_target || 80
      }
    };
  }, [exerciseSessions, mealLogs, userGoals, healthStats, nutritionStats, nutritionFromHealthStats, allLoading]);

  const handleMealAdd = useCallback((mealType: string) => {
    console.log(`${mealType} 식단 추가`);
    
    // 실제 식단 추가를 위해 메인 페이지로 이동 (다른 페이지와 일관성 유지)
    navigate('/', { 
      state: { 
        action: 'diet',
        mealType: mealType 
      }
    });
    
    toast({
      title: '식단 기록',
      description: `${mealType === 'breakfast' ? '아침' : 
                   mealType === 'lunch' ? '점심' : 
                   mealType === 'dinner' ? '저녁' : '간식'} 식단 기록 페이지로 이동합니다.`,
    });
  }, [navigate]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 로딩 상태 표시
  if (allLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">건강 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // 데이터가 없을 때
  if (!todayData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">아직 건강 데이터가 없습니다</h3>
          <p className="text-muted-foreground mb-6">
            운동과 식단을 기록하여 건강 대시보드를 시작해보세요!
          </p>
          <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
            <p>• 매일 운동과 식단을 기록하세요</p>
            <p>• 개인 목표를 설정하고 달성해보세요</p>
            <p>• 영양소 분석으로 균형잡힌 식단을 만들어보세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'nutrition' | 'exercise' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            영양 분석
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            운동 분석
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            캘린더
          </TabsTrigger>
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 캐릭터 기반 운동 현황 */}
          <HealthCharacter
            exerciseMinutes={todayData.exerciseMinutes}
            targetMinutes={todayData.targetMinutes}
            isExercising={todayData.exerciseMinutes > 0}
          />

          {/* 식단 관리 카드들 */}
          <div className="grid grid-cols-2 gap-4">
            <MealCard
              type="breakfast"
              title="아침"
              icon={<Coffee className="h-5 w-5 text-orange-600" />}
              isCompleted={todayData.meals.breakfast}
              calories={Math.round(todayData.totalCalories * 0.25)} // 전체 칼로리의 25%
              onAdd={() => handleMealAdd('breakfast')}
            />
            <MealCard
              type="lunch"
              title="점심"
              icon={<Utensils className="h-5 w-5 text-green-600" />}
              isCompleted={todayData.meals.lunch}
              calories={Math.round(todayData.totalCalories * 0.35)} // 전체 칼로리의 35%
              onAdd={() => handleMealAdd('lunch')}
            />
            <MealCard
              type="dinner"
              title="저녁"
              icon={<Utensils className="h-5 w-5 text-blue-600" />}
              isCompleted={todayData.meals.dinner}
              calories={Math.round(todayData.totalCalories * 0.3)} // 전체 칼로리의 30%
              onAdd={() => handleMealAdd('dinner')}
            />
            <MealCard
              type="snack"
              title="간식"
              icon={<Cookie className="h-5 w-5 text-purple-600" />}
              isCompleted={todayData.meals.snack}
              calories={Math.round(todayData.totalCalories * 0.1)} // 전체 칼로리의 10%
              onAdd={() => handleMealAdd('snack')}
            />
          </div>

          {/* 하단 액션 버튼들 */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate('/note')}
            >
              <Flame className="h-4 w-4 mr-2" />
              기록 보상
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/note')}
            >
              <Apple className="h-4 w-4 mr-2" />
              식단 앨범
            </Button>
          </div>
        </TabsContent>

        {/* 영양 분석 탭 */}
        <TabsContent value="nutrition" className="space-y-6">
          <NutritionChart
            carbs={todayData.nutrition.carbs}
            protein={todayData.nutrition.protein}
            fat={todayData.nutrition.fat}
            calories={todayData.totalCalories}
            nutritionGoals={todayData.nutritionGoals}
          />
          
          {/* 상세 영양 정보 */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 shadow-lg border-0">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Apple className="h-6 w-6 text-purple-600" />
                📊 영양소 상세 정보
              </h3>
              <p className="text-gray-600">오늘의 영양 섭취량과 운동량을 자세히 확인해보세요</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 영양 섭취 정보 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-4 text-center text-gray-800">🍽️ 영양 섭취</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-red-500" />
                      <span className="font-medium">총 열량</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{Math.round(todayData.totalCalories * 10) / 10} kcal</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span className="font-medium">탄수화물</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{Math.round(todayData.nutrition.carbs * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500" />
                      <span className="font-medium">단백질</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{Math.round(todayData.nutrition.protein * 10) / 10}g</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-500" />
                      <span className="font-medium">지방</span>
                    </div>
                    <span className="text-lg font-bold text-amber-600">{Math.round(todayData.nutrition.fat * 10) / 10}g</span>
                  </div>
                </div>
              </div>
              
              {/* 운동 정보 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="text-lg font-semibold mb-4 text-center text-gray-800">🏃‍♂️ 운동 활동</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">소모 칼로리</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{Math.round(todayData.caloriesBurned * 10) / 10} kcal</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <span className="font-medium">운동 시간</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{todayData.exerciseMinutes}분</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">목표 운동</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{todayData.targetMinutes}분</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">달성률</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {Math.round((todayData.exerciseMinutes / todayData.targetMinutes) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 칼로리 수지 요약 */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-center mb-4">⚖️ 칼로리 수지</h4>
              <div className="flex justify-center items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{Math.round(todayData.totalCalories * 10) / 10}</div>
                  <div className="text-sm text-gray-600">섭취</div>
                </div>
                <div className="text-4xl text-gray-400">-</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">-{Math.round(todayData.caloriesBurned * 10) / 10}</div>
                  <div className="text-sm text-gray-600">소모</div>
                </div>
                <div className="text-4xl text-gray-400">=</div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    (todayData.totalCalories - todayData.caloriesBurned) > 0 
                      ? 'text-orange-600' 
                      : 'text-blue-600'
                  }`}>
                    {todayData.totalCalories - todayData.caloriesBurned > 0 ? '+' : ''}
                    {Math.round((todayData.totalCalories - todayData.caloriesBurned) * 10) / 10}
                  </div>
                  <div className="text-sm text-gray-600">순증감</div>
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                {(todayData.totalCalories - todayData.caloriesBurned) > 0 
                  ? '🔥 칼로리가 남았어요! 조금 더 운동해보세요.' 
                  : '✨ 칼로리를 잘 소모했어요! 훌륭합니다!'}
              </div>
            </div>
          </div>

          {/* 칼로리 섭취 추이 차트 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-purple-600">📈</span>
                칼로리 섭취 추이
              </h3>
              <div className="text-sm text-gray-500">최근 7일</div>
            </div>
            
            {/* 간단한 차트 시뮬레이션 */}
            <div className="h-48 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 flex items-end justify-between">
              {[2200, 1800, 2100, 1900, 2300, 2000, todayData.totalCalories].map((cal, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-t-lg w-8 transition-all duration-500"
                    style={{ height: `${(cal / 2500) * 120}px` }}
                  />
                  <div className="text-xs text-gray-600 mt-2">
                    6/{17 + index}
                  </div>
                </div>
              ))}
            </div>
            
            {/* 차트 범례 */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded"></div>
                  <span>일일 칼로리 섭취량</span>
                </div>
              </div>
            </div>
          </div>

          {/* 식사 최적화 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-0">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-blue-600">🍽️</span>
              식사 최적화
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 식사 시간 분석 */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-3">⏰ 식사 시간 분석</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>아침 식사</span>
                    <span className="text-blue-600 font-medium">7:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>점심 식사</span>
                    <span className="text-blue-600 font-medium">12:15 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>저녁 식사</span>
                    <span className="text-blue-600 font-medium">7:00 PM</span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-white rounded-lg text-xs text-blue-700">
                  💡 규칙적인 식사 시간을 유지하고 있어요!
                </div>
              </div>
              
              {/* 영양 균형 점수 */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-semibold text-green-800 mb-3">⚖️ 영양 균형 점수</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>전체 균형</span>
                      <span className="font-medium">85/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-blue-600">탄수화물</div>
                      <div>적정</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-emerald-600">단백질</div>
                      <div>우수</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="font-bold text-amber-600">지방</div>
                      <div>적정</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 건강 인사이트 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-0">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-indigo-600">🔍</span>
              건강 인사이트
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                <div className="text-center">
                  <div className="text-2xl mb-2">💧</div>
                  <h4 className="font-semibold text-blue-800 mb-2">수분 섭취</h4>
                  <p className="text-sm text-blue-600 mb-2">하루 8잔 목표</p>
                  <div className="text-lg font-bold text-blue-700">6/8잔</div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="text-center">
                  <div className="text-2xl mb-2">😴</div>
                  <h4 className="font-semibold text-green-800 mb-2">수면 품질</h4>
                  <p className="text-sm text-green-600 mb-2">7-8시간 권장</p>
                  <div className="text-lg font-bold text-green-700">7.5시간</div>
                  <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <div className="text-center">
                  <div className="text-2xl mb-2">🧘‍♀️</div>
                  <h4 className="font-semibold text-purple-800 mb-2">스트레스</h4>
                  <p className="text-sm text-purple-600 mb-2">관리 상태</p>
                  <div className="text-lg font-bold text-purple-700">양호</div>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>



        {/* 🏋️ 운동 분석 탭 */}
        <TabsContent value="exercise" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BodyPartFrequencyChart 
              bodyPartFrequency={healthStats?.bodyPartFrequency || []}
              totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
              period={period}
              chartType="bar"
            />
            <ExerciseCalendarHeatmap 
              exerciseSessions={exerciseHeatmapData || []}
              period={period}
            />
          </div>
          
          {/* 주별 운동 요약 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                주별 운동 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {healthStats?.totalExerciseSessions || 0}
                  </div>
                  <div className="text-sm text-gray-600">총 운동 세션</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {healthStats?.weeklyWorkouts || 0}
                  </div>
                  <div className="text-sm text-gray-600">주간 운동 횟수</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {healthStats?.totalCaloriesBurned || 0}
                  </div>
                  <div className="text-sm text-gray-600">소모 칼로리</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {healthStats?.streak || 0}
                  </div>
                  <div className="text-sm text-gray-600">연속 운동일</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 캘린더 탭 */}
        <TabsContent value="calendar" className="space-y-6">
          {/* 체중 트렌드 차트 */}
          <WeightTrendChart 
            userId={userId} 
            period={period}
          />
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border"
              />
              
              {/* 범례 */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>먹었어요</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>태웠어요</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>몸무게</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>물 섭취</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 