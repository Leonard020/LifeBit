import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { Progress } from '../ui/progress';
import { WeightTrendChart } from './WeightTrendChart';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
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
import { getToken, getUserInfo, isTokenValid } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';

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

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">영양소 상세</h3>
        <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
          <Utensils className="h-10 w-10 mb-3" />
          <p className="font-semibold">기록된 식단이 없습니다</p>
          <p className="text-sm">식단을 추가하여 영양소를 분석해보세요.</p>
        </div>
      </div>
    );
  }
  
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
  
  // API 응답 직접 확인
  console.log('🔥 [DEBUG] healthStats 전체 응답:', healthStats);
  console.log('🔥 [DEBUG] healthStats.data:', healthStats?.data);

  // 전체 로딩 상태 계산
  const allLoading = healthLoading || mealLoading || exerciseLoading || goalsLoading || healthStatsLoading;
  const hasError = healthError || mealError || exerciseError || goalsError || healthStatsError;
  
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
    
    // 기본값으로 영양소 정보 설정 (실제 구현 시 별도 API 호출 필요)
    const estimatedCaloriesPerMeal = 200;
    const totalCalories = todayMeals.length * estimatedCaloriesPerMeal;
    
    // 기본 영양소 비율로 추정 (탄수화물 50%, 단백질 20%, 지방 30%)
    const totalCarbs = Math.round(totalCalories * 0.5 / 4); // 1g = 4kcal
    const totalProtein = Math.round(totalCalories * 0.2 / 4); // 1g = 4kcal  
    const totalFat = Math.round(totalCalories * 0.3 / 9); // 1g = 9kcal
    
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
        carbs: goalsData?.daily_carbs_target || 300,
        protein: goalsData?.daily_protein_target || 120,
        fat: goalsData?.daily_fat_target || 80
      }
    };
  }, [exerciseSessions, mealLogs, userGoals, healthStats, allLoading]);

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
          />
          
          {/* 목표 대비 달성률 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                목표 대비 달성률
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 탄수화물 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>탄수화물</span>
                  <span>{todayData.nutrition.carbs}g / {todayData.nutritionGoals.carbs}g</span>
                </div>
                <Progress 
                  value={Math.min((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              {/* 단백질 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>단백질</span>
                  <span>{todayData.nutrition.protein}g / {todayData.nutritionGoals.protein}g</span>
                </div>
                <Progress 
                  value={Math.min((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100, 100)} 
                  className="h-2"
                />
              </div>
              
              {/* 지방 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>지방</span>
                  <span>{todayData.nutrition.fat}g / {todayData.nutritionGoals.fat}g</span>
                </div>
                <Progress 
                  value={Math.min((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* 상세 영양 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>영양소 상세 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>총 열량:</strong> {todayData.totalCalories} kcal</p>
                  <p><strong>탄수화물:</strong> {todayData.nutrition.carbs}g</p>
                  <p><strong>단백질:</strong> {todayData.nutrition.protein}g</p>
                  <p><strong>지방:</strong> {todayData.nutrition.fat}g</p>
                </div>
                <div className="space-y-2 text-gray-600">
                  <p>소모 칼로리: {todayData.caloriesBurned} kcal</p>
                  <p>운동 시간: {todayData.exerciseMinutes}분</p>
                  <p>목표 운동: {todayData.targetMinutes}분</p>
                  <p>달성률: {Math.round((todayData.exerciseMinutes / todayData.targetMinutes) * 100)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <BodyPartFrequencyChart 
              bodyPartFrequency={healthStats?.bodyPartFrequency || []}
              totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
              period={period}
              chartType="pie"
            />
          </div>
          
          {/* 운동 요약 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                운동 요약
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