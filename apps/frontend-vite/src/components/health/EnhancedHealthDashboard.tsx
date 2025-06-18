import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Progress } from '../ui/progress';
import { WeightTrendChart } from './WeightTrendChart';
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
  ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useHealthRecords, useMealLogs, useExerciseSessions } from '../../api/healthApi';

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

// 영양소 차트 컴포넌트
const NutritionChart: React.FC<{
  carbs: number;
  protein: number;
  fat: number;
}> = ({ carbs, protein, fat }) => {
  const total = carbs + protein + fat;
  
  const data = [
    { name: '탄수화물', value: carbs, color: '#3b82f6' },
    { name: '단백질', value: protein, color: '#10b981' },
    { name: '지방', value: fat, color: '#f59e0b' }
  ];

  const getPercentage = (value: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">영양소 상세</h3>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}g</div>
              <div className="text-sm text-gray-600">총 영양소</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 영양소 상세 정보 */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{item.value}g</span>
              <span className="text-xs text-gray-500 ml-1">
                ({getPercentage(item.value)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 메인 컴포넌트
export const EnhancedHealthDashboard: React.FC<EnhancedHealthDashboardProps> = ({
  userId,
  period
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'calendar'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // API 데이터 가져오기
  const { data: healthRecords } = useHealthRecords(userId, period);
  const { data: mealLogs } = useMealLogs(userId, period);
  const { data: exerciseSessions } = useExerciseSessions(userId, period);

  // 오늘의 데이터 계산
  const todayData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘의 운동 시간
    const exerciseSessionsData = exerciseSessions?.data || exerciseSessions || [];
    const todayExercise = Array.isArray(exerciseSessionsData) 
      ? exerciseSessionsData.filter(session => session.exercise_date === today)
      : [];
    const exerciseMinutes = todayExercise.reduce((sum, session) => sum + session.duration_minutes, 0);
    
    // 오늘의 식단
    const mealLogsData = mealLogs?.data || mealLogs || [];
    const todayMeals = Array.isArray(mealLogsData)
      ? mealLogsData.filter(meal => meal.log_date === today)
      : [];
    
    // 식단별 칼로리 계산 (임시 데이터)
    const mealsByTime = {
      breakfast: todayMeals.filter(meal => meal.food_item_id <= 10).length > 0,
      lunch: todayMeals.filter(meal => meal.food_item_id > 10 && meal.food_item_id <= 20).length > 0,
      dinner: todayMeals.filter(meal => meal.food_item_id > 20 && meal.food_item_id <= 30).length > 0,
      snack: todayMeals.filter(meal => meal.food_item_id > 30).length > 0,
    };
    
    return {
      exerciseMinutes,
      targetMinutes: 60, // 기본 목표 60분
      meals: mealsByTime,
      totalCalories: todayMeals.length * 200, // 임시 계산
      nutrition: {
        carbs: 150,
        protein: 80,
        fat: 60
      }
    };
  }, [exerciseSessions, mealLogs]);

  const handleMealAdd = useCallback((mealType: string) => {
    console.log(`${mealType} 식단 추가`);
    // 실제 식단 추가 로직 구현
  }, []);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'nutrition' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="h-4 w-4" />
            영양 분석
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
              calories={300}
              onAdd={() => handleMealAdd('breakfast')}
            />
            <MealCard
              type="lunch"
              title="점심"
              icon={<Utensils className="h-5 w-5 text-green-600" />}
              isCompleted={todayData.meals.lunch}
              calories={500}
              onAdd={() => handleMealAdd('lunch')}
            />
            <MealCard
              type="dinner"
              title="저녁"
              icon={<Utensils className="h-5 w-5 text-blue-600" />}
              isCompleted={todayData.meals.dinner}
              calories={400}
              onAdd={() => handleMealAdd('dinner')}
            />
            <MealCard
              type="snack"
              title="간식"
              icon={<Cookie className="h-5 w-5 text-purple-600" />}
              isCompleted={todayData.meals.snack}
              calories={150}
              onAdd={() => handleMealAdd('snack')}
            />
          </div>

          {/* 하단 액션 버튼들 */}
          <div className="flex gap-3">
            <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
              <Flame className="h-4 w-4 mr-2" />
              기록 보상
            </Button>
            <Button variant="outline" className="flex-1">
              <Apple className="h-4 w-4 mr-2" />
              식단 앱범
            </Button>
          </div>
        </TabsContent>

        {/* 영양 분석 탭 */}
        <TabsContent value="nutrition" className="space-y-6">
          <NutritionChart
            carbs={todayData.nutrition.carbs}
            protein={todayData.nutrition.protein}
            fat={todayData.nutrition.fat}
          />
          
          {/* 상세 영양 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>영양소 상세 보는 법</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>총 열량:</strong> {todayData.totalCalories} kcal</p>
                <p><strong>탄수화물:</strong> {todayData.nutrition.carbs}g</p>
                <p><strong>단백질:</strong> {todayData.nutrition.protein}g</p>
                <p><strong>지방:</strong> {todayData.nutrition.fat}g</p>
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