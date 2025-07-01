import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Calendar } from '../ui/calendar';
import { WeightTrendChart } from './WeightTrendChart';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
import { ExerciseCalendarHeatmap } from './ExerciseCalendarHeatmap';
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
import { GoalProgress } from './GoalProgress';
import { GoalsTab } from './tabs/GoalsTab';
import { GoalAchievements } from './types/analytics';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'exercise' | 'goal'>('dashboard');
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

    const base = processTodayData(
      exerciseData,
      mealData,
      goalData,
      healthData,
      nutritionStats
    );

    // nutritionStats 변환 (GoalsTab 타입에 맞게)
    const nutritionStatsForGoal = base.nutrition
      ? {
          totalCalories: base.nutrition.calories,
          totalCarbs: base.nutrition.carbs,
          totalProtein: base.nutrition.protein,
          totalFat: base.nutrition.fat
        }
      : {};

    // 이번 주 날짜 배열 생성 (일요일~토요일)
    const getWeekDates = () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일 기준
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
    };

    // 부위별 날짜별 1회만 카운트
    const getBodyPartWeeklyCounts = (exerciseSessions: unknown[]): Record<string, number> => {
      const weekDates = getWeekDates();
      const bodyParts = ['chest', 'back', 'legs', 'shoulders', 'arms', 'abs', 'cardio'];
      const counts: Record<string, number> = {};
      bodyParts.forEach(part => counts[part] = 0);
      const seen: Record<string, boolean> = {};
      for (const s of exerciseSessions) {
        const typedSession = s as { exercise_date?: string; exerciseDate?: string; body_part?: string; bodyPart?: string };
        const date = (typedSession.exercise_date || typedSession.exerciseDate || '').slice(0, 10);
        const part = (typedSession.body_part || typedSession.bodyPart || '').toLowerCase();
        if (!date || !part || !weekDates.includes(date) || !Object.prototype.hasOwnProperty.call(counts, part)) continue;
        const key = `${part}_${date}`;
        if (!seen[key]) {
          seen[key] = true;
          counts[part]++;
        }
      }
      return counts;
    };

    // 부위별 목표값 (프로필에서 설정한 주간 횟수)
    const bodyPartTargets: Record<string, number> = {
      chest: Number(userGoals?.weekly_chest || userGoals?.data?.weekly_chest || 0),
      back: Number(userGoals?.weekly_back || userGoals?.data?.weekly_back || 0),
      legs: Number(userGoals?.weekly_legs || userGoals?.data?.weekly_legs || 0),
      shoulders: Number(userGoals?.weekly_shoulders || userGoals?.data?.weekly_shoulders || 0),
      arms: Number(userGoals?.weekly_arms || userGoals?.data?.weekly_arms || 0),
      abs: Number(userGoals?.weekly_abs || userGoals?.data?.weekly_abs || 0),
      cardio: Number(userGoals?.weekly_cardio || userGoals?.data?.weekly_cardio || 0),
    };

    // 실제 부위별 주간 횟수 계산
    const bodyPartCounts: Record<string, number> = getBodyPartWeeklyCounts(exerciseData);

    // 달성률 계산 함수
    const getPercent = (current: number, target: number) => target > 0 ? Math.min((current / target) * 100, 100) : 0;

    // 목표 달성률 객체 생성 (BodyPartGoals 타입에 맞게 명시적으로 작성)
    const goalAchievements: GoalAchievements = {
      exercise: {
        current: (Object.values(bodyPartCounts) as number[]).reduce((a, b) => a + b, 0),
        target: (Object.values(bodyPartTargets) as number[]).reduce((a, b) => a + b, 0),
        percentage: getPercent(
          (Object.values(bodyPartCounts) as number[]).reduce((a, b) => a + b, 0),
          (Object.values(bodyPartTargets) as number[]).reduce((a, b) => a + b, 0)
        ),
        hasTarget: (Object.values(bodyPartTargets) as number[]).some(v => v > 0)
      },
      weight: { current: 0, target: 0, percentage: 0, hasTarget: false }, // 필요시 추가 구현
      calories: {
        current: nutritionStatsForGoal.totalCalories || 0,
        target: Number(userGoals?.daily_calories_target || userGoals?.data?.daily_calories_target || 0),
        percentage: getPercent(nutritionStatsForGoal.totalCalories || 0, Number(userGoals?.daily_calories_target || userGoals?.data?.daily_calories_target || 0)),
        hasTarget: !!(userGoals?.daily_calories_target || userGoals?.data?.daily_calories_target)
      },
      carbs: {
        current: nutritionStatsForGoal.totalCarbs || 0,
        target: Number(userGoals?.daily_carbs_target || userGoals?.data?.daily_carbs_target || 0),
        percentage: getPercent(nutritionStatsForGoal.totalCarbs || 0, Number(userGoals?.daily_carbs_target || userGoals?.data?.daily_carbs_target || 0)),
        hasTarget: !!(userGoals?.daily_carbs_target || userGoals?.data?.daily_carbs_target)
      },
      protein: {
        current: nutritionStatsForGoal.totalProtein || 0,
        target: Number(userGoals?.daily_protein_target || userGoals?.data?.daily_protein_target || 0),
        percentage: getPercent(nutritionStatsForGoal.totalProtein || 0, Number(userGoals?.daily_protein_target || userGoals?.data?.daily_protein_target || 0)),
        hasTarget: !!(userGoals?.daily_protein_target || userGoals?.data?.daily_protein_target)
      },
      fat: {
        current: nutritionStatsForGoal.totalFat || 0,
        target: Number(userGoals?.daily_fat_target || userGoals?.data?.daily_fat_target || 0),
        percentage: getPercent(nutritionStatsForGoal.totalFat || 0, Number(userGoals?.daily_fat_target || userGoals?.data?.daily_fat_target || 0)),
        hasTarget: !!(userGoals?.daily_fat_target || userGoals?.data?.daily_fat_target)
      },
      bodyParts: {
        chest: {
          current: bodyPartCounts['chest'] || 0,
          target: bodyPartTargets['chest'] || 0,
          percentage: getPercent(bodyPartCounts['chest'] || 0, bodyPartTargets['chest'] || 0),
          hasTarget: !!bodyPartTargets['chest']
        },
        back: {
          current: bodyPartCounts['back'] || 0,
          target: bodyPartTargets['back'] || 0,
          percentage: getPercent(bodyPartCounts['back'] || 0, bodyPartTargets['back'] || 0),
          hasTarget: !!bodyPartTargets['back']
        },
        legs: {
          current: bodyPartCounts['legs'] || 0,
          target: bodyPartTargets['legs'] || 0,
          percentage: getPercent(bodyPartCounts['legs'] || 0, bodyPartTargets['legs'] || 0),
          hasTarget: !!bodyPartTargets['legs']
        },
        shoulders: {
          current: bodyPartCounts['shoulders'] || 0,
          target: bodyPartTargets['shoulders'] || 0,
          percentage: getPercent(bodyPartCounts['shoulders'] || 0, bodyPartTargets['shoulders'] || 0),
          hasTarget: !!bodyPartTargets['shoulders']
        },
        arms: {
          current: bodyPartCounts['arms'] || 0,
          target: bodyPartTargets['arms'] || 0,
          percentage: getPercent(bodyPartCounts['arms'] || 0, bodyPartTargets['arms'] || 0),
          hasTarget: !!bodyPartTargets['arms']
        },
        abs: {
          current: bodyPartCounts['abs'] || 0,
          target: bodyPartTargets['abs'] || 0,
          percentage: getPercent(bodyPartCounts['abs'] || 0, bodyPartTargets['abs'] || 0),
          hasTarget: !!bodyPartTargets['abs']
        },
        cardio: {
          current: bodyPartCounts['cardio'] || 0,
          target: bodyPartTargets['cardio'] || 0,
          percentage: getPercent(bodyPartCounts['cardio'] || 0, bodyPartTargets['cardio'] || 0),
          hasTarget: !!bodyPartTargets['cardio']
        }
      }
    };

    return {
      ...base,
      goalAchievements,
      nutritionStatsForGoal
    };
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dashboard' | 'nutrition' | 'exercise' | 'goal')}>
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
          {/* <TabsTrigger value="goal" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            목표
          </TabsTrigger> */}
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 캐릭터 기반 운동 현황 */}
          <HealthCharacter
            exerciseMinutes={todayData.exerciseMinutes}
            targetMinutes={todayData.targetMinutes}
            isExercising={todayData.exerciseMinutes > 0}
          />
          {/* 목표 달성률 분석/상세 목표 등 GoalsTab 주요 내용 추가 */}
          <GoalsTab
            goalAchievements={todayData?.goalAchievements as GoalAchievements}
            goalsData={userGoals?.data || userGoals || null}
            healthStats={healthStats?.data || healthStats || null}
            chartData={[]}
            nutritionStats={todayData?.nutritionStatsForGoal || {}}
          />
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
        </TabsContent>

        {/* 🏋️ 운동 분석 탭 */}
        <TabsContent value="exercise" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BodyPartFrequencyChart 
              bodyPartFrequency={healthStats?.bodyPartFrequency || []}
              totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
              period={period}
              chartType="bar"
              goals={{ chest: 3, cardio: 4, back: 2, legs: 2, shoulders: 2, arms: 2, abs: 2 }}
            />
            <ExerciseCalendarHeatmap 
              exerciseSessions={exerciseHeatmapData || []}
              period={period}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 