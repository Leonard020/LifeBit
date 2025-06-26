import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { WeightTrendChart } from './WeightTrendChart';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
import { ExerciseCalendarHeatmap } from './ExerciseCalendarHeatmap';
import { ActivityCalendar } from './ActivityCalendar';
import { HealthCharacter } from './HealthCharacter';
import { MealCard } from './MealCard';
import { NutritionChart } from './NutritionChart';
import { AIRecommendations } from './AIRecommendations';
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
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, UserGoal } from '../../api/auth';
import { useExerciseCalendarHeatmap } from '../../api/authApi';
import { getToken, getUserInfo, isTokenValid } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';
import { useDailyNutritionStats } from '@/api/authApi';
import { PeriodType, NutritionGoals } from './types/health';
import { processTodayData } from './utils/healthUtils';

interface EnhancedHealthDashboardProps {
  userId: string;
  period: PeriodType;
}

// 메인 컴포넌트
export const EnhancedHealthDashboard: React.FC<EnhancedHealthDashboardProps> = ({
  userId,
  period
}) => {
  console.log('🚀 [EnhancedHealthDashboard] 컴포넌트 렌더링 시작!', { userId, period });
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // localStorage를 사용하여 새로고침 후에도 탭 상태 유지
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'exercise' | 'calendar'>(() => {
    const savedTab = localStorage.getItem('enhanced-health-dashboard-active-tab');
    console.log('🔍 [EnhancedHealthDashboard] 저장된 탭 상태:', savedTab);
    return (savedTab === 'dashboard' || savedTab === 'nutrition' || savedTab === 'exercise' || savedTab === 'calendar') 
      ? savedTab as 'dashboard' | 'nutrition' | 'exercise' | 'calendar'
      : 'dashboard';
  });
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
  


  // 전체 로딩 상태 계산
  const allLoading = healthLoading || mealLoading || exerciseLoading || goalsLoading || healthStatsLoading || heatmapLoading || nutritionLoading;
  const hasError = healthError || mealError || exerciseError || goalsError || healthStatsError || heatmapError || nutritionError;

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

    // React Query 응답 구조에 따라 데이터 추출
    const exerciseData = exerciseSessions?.data || exerciseSessions || [];
    const mealData = mealLogs?.data || mealLogs || [];
    const goalData = userGoals?.data || userGoals;
    const healthData = healthStats?.data || healthStats;

    console.log('🔍 [EnhancedHealthDashboard] todayData 계산 시작:', {
      exerciseDataCount: exerciseData.length,
      mealDataCount: mealData.length,
      goalData,
      healthData,
      nutritionStats
    });

    return processTodayData(
      exerciseData,
      mealData,
      goalData,
      healthData,
      nutritionStats
    );
  }, [exerciseSessions, mealLogs, userGoals, healthStats, nutritionStats, allLoading]);

  const handleMealAdd = useCallback((mealType: string) => {
    console.log(`${mealType} 식단 추가`);
    
    // 실제 식단 추가를 위해 메인 페이지로 이동 (다른 페이지와 일관성 유지)
    navigate('/', { 
      state: { 
        action: 'diet',
        mealType: mealType 
      }
    });
    
    const mealTypeNames = {
      'breakfast': '아침',
      'lunch': '점심', 
      'dinner': '저녁',
      'midnight': '야식',
      'snack': '간식'
    };
    
    toast({
      title: '식단 기록',
      description: `${mealTypeNames[mealType as keyof typeof mealTypeNames] || '식사'} 식단 기록 페이지로 이동합니다.`,
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
      <Tabs value={activeTab} onValueChange={(value) => {
        const newTab = value as 'dashboard' | 'nutrition' | 'exercise' | 'calendar';
        console.log('🔄 [EnhancedHealthDashboard] 탭 변경:', newTab);
        setActiveTab(newTab);
        // localStorage에 탭 상태 저장
        localStorage.setItem('enhanced-health-dashboard-active-tab', newTab);
      }}>
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
              isCompleted={false} // 실제 데이터로 교체 필요
              calories={Math.round(todayData.nutrition.calories * 0.25)}
              onAdd={() => handleMealAdd('breakfast')}
            />
            <MealCard
              type="lunch"
              title="점심"
              icon={<Utensils className="h-5 w-5 text-green-600" />}
              isCompleted={false}
              calories={Math.round(todayData.nutrition.calories * 0.35)}
              onAdd={() => handleMealAdd('lunch')}
            />
            <MealCard
              type="dinner"
              title="저녁"
              icon={<Utensils className="h-5 w-5 text-blue-600" />}
              isCompleted={false}
              calories={Math.round(todayData.nutrition.calories * 0.3)}
              onAdd={() => handleMealAdd('dinner')}
            />
            <MealCard
              type="snack"
              title="간식"
              icon={<Cookie className="h-5 w-5 text-purple-600" />}
              isCompleted={false}
              calories={Math.round(todayData.nutrition.calories * 0.1)}
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
            calories={todayData.nutrition.calories}
            nutritionGoals={todayData.nutritionGoals}
          />
          
          <AIRecommendations
            calories={todayData.nutrition.calories}
            carbs={todayData.nutrition.carbs}
            protein={todayData.nutrition.protein}
            fat={todayData.nutrition.fat}
            exerciseMinutes={todayData.exerciseMinutes}
            caloriesBurned={todayData.caloriesBurned}
            nutritionGoals={todayData.nutritionGoals}
          />
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
          
          {/* 활동 캘린더 */}
          <ActivityCalendar
            userId={userId}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 