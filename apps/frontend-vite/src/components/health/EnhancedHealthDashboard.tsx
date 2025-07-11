import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Calendar } from '../ui/calendar';
import { WeightTrendChart } from './WeightTrendChart';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
import { ExerciseCalendarHeatmap } from './ExerciseCalendarHeatmap';
import { HealthCharacter } from './HealthCharacter';
import { MealCard } from './MealCard';
import { NutritionChart } from './NutritionChart';
import { AIRecommendations } from './AIRecommendations';
import { useTheme } from '../../contexts/ThemeContext';
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
  Dumbbell,
  AlertTriangle,
  X,
  Trophy
} from 'lucide-react';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, UserGoal } from '../../api/auth';
import { useExerciseCalendarHeatmap } from '../../api/authApi';
import { getToken, getUserInfo, isTokenValid } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';
import { useDailyNutritionStats } from '@/api/authApi';
import { PeriodType, NutritionGoals as ImportedNutritionGoals, GoalAchievements as ImportedGoalAchievements } from './types/health';
import { processTodayData } from './utils/healthUtils';
import { GoalProgress } from './GoalProgress';
import { GoalsTab } from './tabs/GoalsTab';
import { updateExerciseScore, updateNutritionScore } from '../../api/auth';

interface EnhancedHealthDashboardProps {
  userId: string;
  period: PeriodType;
}

interface NutritionGoal {
  hasTarget: boolean;
  percentage: number;
}

interface NutritionGoals {
  carbs: NutritionGoal;
  protein: NutritionGoal;
  fat: NutritionGoal;
}

interface GoalAchievements {
  nutrition: NutritionGoals;
}

interface NutritionData {
  dailyCalories: number;
  dailyCarbs: number;
  dailyProtein: number;
  dailyFat: number;
}

interface TodayData {
  nutrition: NutritionData;
  exercise?: {
    count: number;
    minutes: number;
  };
}

// 대시보드 전용 타입 정의
interface DashboardNutritionGoal {
  percentage: number;
}

interface DashboardNutritionGoals {
  carbs: DashboardNutritionGoal;
  protein: DashboardNutritionGoal;
  fat: DashboardNutritionGoal;
}

interface DashboardGoalAchievements {
  nutrition: DashboardNutritionGoals;
  exercise?: Record<string, unknown>;  // exercise 타입을 Record로 명시
}

interface DashboardTodayData {
  goalAchievements: DashboardGoalAchievements;
}

// 메인 컴포넌트
export const EnhancedHealthDashboard: React.FC<EnhancedHealthDashboardProps> = ({
  userId,
  period
}) => {
  console.log('🚀 [EnhancedHealthDashboard] 컴포넌트 렌더링 시작!', { userId, period });
  
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'exercise' | 'goal'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  // 🎯 점수 추가 기능 상태 관리
  const [lastExerciseScoreUpdate, setLastExerciseScoreUpdate] = useState<string | null>(null);
  const [lastNutritionScoreUpdate, setLastNutritionScoreUpdate] = useState<string | null>(null);
  const [isExerciseButtonEnabled, setIsExerciseButtonEnabled] = useState(false);
  const [isNutritionButtonEnabled, setIsNutritionButtonEnabled] = useState(false);
  
  const navigate = useNavigate();

  // 인증 체크
  useEffect(() => {
    const token = getToken();
    if (!token || !isTokenValid()) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 📅 주간/일간 초기화 체크 함수들 (새로운 로직)
  const checkWeeklyReset = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = now.getDay(); // 0 = Sunday
    
    // 이번 주 일요일 날짜 계산
    const thisWeekSunday = new Date(now);
    thisWeekSunday.setDate(now.getDate() - dayOfWeek);
    const sundayString = thisWeekSunday.toISOString().split('T')[0];
    
    const lastUpdateKey = `exercise_score_last_update_${userId}`;
    const lastUpdate = localStorage.getItem(lastUpdateKey);
    
    // 이번 주 일요일 이후로 아직 업데이트하지 않았다면
    if (!lastUpdate || lastUpdate < sundayString) {
      console.log('🔄 [주간 초기화] 이번 주 운동 점수 초기화 필요:', { today, sundayString, lastUpdate });
      setLastExerciseScoreUpdate(null);
      return true;
    }
    return false;
  }, [userId]);

  const checkDailyReset = useCallback(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const lastUpdateKey = `nutrition_score_last_update_${userId}`;
    const lastUpdate = localStorage.getItem(lastUpdateKey);
    
    // 오늘 아직 점수를 추가하지 않았다면
    if (!lastUpdate || lastUpdate !== today) {
      console.log('🔄 [일간 초기화] 오늘 식단 점수 초기화 필요:', { today, lastUpdate });
      setLastNutritionScoreUpdate(null);
      return true;
    }
    return false;
  }, [userId]);

  // 💾 LocalStorage에서 마지막 업데이트 시간 로드 및 초기화 체크
  useEffect(() => {
    const exerciseKey = `exercise_score_last_update_${userId}`;
    const nutritionKey = `nutrition_score_last_update_${userId}`;
    
    const lastExerciseUpdate = localStorage.getItem(exerciseKey);
    const lastNutritionUpdate = localStorage.getItem(nutritionKey);
    
    setLastExerciseScoreUpdate(lastExerciseUpdate);
    setLastNutritionScoreUpdate(lastNutritionUpdate);
    
    // 🔄 초기화 체크 (자동 실행)
    const weeklyReset = checkWeeklyReset();
    const dailyReset = checkDailyReset();
    
    // 초기화가 필요한 경우 LocalStorage에서 해당 키들 제거
    if (weeklyReset) {
      const exerciseScoreKey = `exercise_score_last_value_${userId}`;
      localStorage.removeItem(exerciseKey);
      localStorage.removeItem(exerciseScoreKey);
      console.log('🗑️ [주간 초기화] LocalStorage에서 운동 점수 기록 제거');
    }
    if (dailyReset) {
      const nutritionScoreKey = `nutrition_score_last_value_${userId}`;
      localStorage.removeItem(nutritionKey);
      localStorage.removeItem(nutritionScoreKey);
      console.log('🗑️ [일간 초기화] LocalStorage에서 식단 점수 기록 제거');
    }
    
    console.log('🔄 [초기화 체크] 결과:', { 
      weeklyReset, 
      dailyReset, 
      lastExerciseUpdate, 
      lastNutritionUpdate,
      afterReset: {
        exercise: weeklyReset ? null : lastExerciseUpdate,
        nutrition: dailyReset ? null : lastNutritionUpdate
      }
    });
  }, [userId, checkWeeklyReset, checkDailyReset]);

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
    data: exerciseSessionsWeek, 
    isLoading: exerciseWeekLoading,
    error: exerciseWeekError
  } = useExerciseSessions(userId, 'week');

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
  const allLoading = healthLoading || mealLoading || exerciseWeekLoading || goalsLoading || healthStatsLoading || heatmapLoading || nutritionLoading;
  const hasError = healthError || mealError || exerciseWeekError || goalsError || healthStatsError || heatmapError || nutritionError;

  // 에러 처리
  useEffect(() => {
    if (hasError) {
      const errorMessage = 
        healthError?.message || 
        mealError?.message || 
        exerciseWeekError?.message || 
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
  }, [hasError, healthError, mealError, exerciseWeekError, goalsError, healthStatsError, heatmapError, nutritionError]);

  // 전체 재시도 함수
  const handleRetry = useCallback(() => {
    setError(null);
    refetchHealth();
    refetchMeals();
    refetchGoals();
    refetchHealthStats();
  }, [refetchHealth, refetchMeals, refetchGoals, refetchHealthStats]);

  // API 호출을 위한 새로운 함수들 추가
  const checkWeeklyExerciseReset = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_CORE_API_URL}/health-statistics/${userId}/check-weekly-reset`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('주간 초기화 체크 실패');
      }
      
      const result = await response.json();
      return result.needsReset || false;
    } catch (error) {
      console.error('주간 초기화 체크 오류:', error);
      return false;
    }
  };

  const checkDailyNutritionReset = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_CORE_API_URL}/health-statistics/${userId}/check-daily-reset`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('일간 초기화 체크 실패');
      }
      
      const result = await response.json();
      return result.needsReset || false;
    } catch (error) {
      console.error('일간 초기화 체크 오류:', error);
      return false;
    }
  };

  // 오늘의 데이터 계산 (실제 API 데이터 기반)
  const todayData = useMemo(() => {
    if (allLoading) {
      return null;
    }

    // React Query 응답 구조에 따라 데이터 추출
    const exerciseData = exerciseSessionsWeek?.data || exerciseSessionsWeek || [];
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

    // 영양소 목표 달성률 계산
    const nutrition = base.nutrition;
    const goals = base.nutritionGoals;

    const goalAchievements = {
      nutrition: {
      carbs: {
          percentage: goals.carbs ? (nutrition.dailyCarbs / goals.carbs) * 100 : 0,
          hasTarget: !!goals.carbs
      },
      protein: {
          percentage: goals.protein ? (nutrition.dailyProtein / goals.protein) * 100 : 0,
          hasTarget: !!goals.protein
      },
      fat: {
          percentage: goals.fat ? (nutrition.dailyFat / goals.fat) * 100 : 0,
          hasTarget: !!goals.fat
        }
      }
    };

    console.log('🔍 [DEBUG] Goal achievements calculation:', {
      nutrition,
      goals,
      goalAchievements
    });

    return {
      ...base,
      goalAchievements
    };
  }, [allLoading, exerciseSessionsWeek, mealLogs, userGoals, healthStats, nutritionStats]);

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

  // 목표 달성률 계산 함수들
  const weeklyWorkoutTarget = useMemo(() => (
    Number(userGoals?.data?.weekly_workout_target || (userGoals as { weekly_workout_target?: number })?.weekly_workout_target || 0)
  ), [userGoals]);

  const calculateExerciseScore = () => {
    if (!weeklyWorkoutTarget) return 0;
    
    // PythonAnalyticsCharts 방식: 달성률에 비례한 점수 계산
    const achievementRate = Math.min(totalWeeklyCount / weeklyWorkoutTarget, 1.0);
    return Math.round(achievementRate * 7);
  };

  const calculateNutritionScore = (achievements: GoalAchievements | undefined) => {
    if (!achievements?.nutrition) return 0;

    const { carbs, protein, fat } = achievements.nutrition;
    let score = 0;

    // 각 영양소가 100% 이상 달성되면 1점씩 부여
    if (carbs.hasTarget && carbs.percentage >= 100) score++;
    if (protein.hasTarget && protein.percentage >= 100) score++;
    if (fat.hasTarget && fat.percentage >= 100) score++;

    return score;
  };

  // 점수 계산 및 표시
  const nutritionScore = useMemo(() => {
    if (!todayData?.goalAchievements) return 0;
    return calculateNutritionScore(todayData.goalAchievements);
  }, [todayData?.goalAchievements]);

  // 최대 점수 계산 (목표가 설정된 영양소의 수)
  const maxNutritionScore = useMemo(() => {
    if (!todayData?.goalAchievements?.nutrition) return 0;
    const { carbs, protein, fat } = todayData.goalAchievements.nutrition;
    return (carbs.hasTarget ? 1 : 0) + (protein.hasTarget ? 1 : 0) + (fat.hasTarget ? 1 : 0);
  }, [todayData?.goalAchievements]);

  // 점수 표시 문자열
  const nutritionScoreDisplay = useMemo(() => {
    return `${nutritionScore} / ${maxNutritionScore}`;
  }, [nutritionScore, maxNutritionScore]);

  // 대시보드 전용 영양소 점수 계산 로직
  const calculateDashboardNutritionScore = () => {
    // 기존 데이터 구조 유지
    if (!todayData?.goalAchievements?.nutrition) {
      console.log('🔍 [DEBUG] Checking nutrition data:', {
        hasGoalAchievements: !!todayData?.goalAchievements,
        hasNutrition: !!todayData?.goalAchievements?.nutrition
      });
      return 0;
    }
    
    const nutrition = todayData.goalAchievements.nutrition;

    // 디버깅을 위한 로그 추가
    console.log('🔍 [DEBUG] Checking nutrition goals:', {
      carbs: nutrition.carbs?.percentage,
      protein: nutrition.protein?.percentage,
      fat: nutrition.fat?.percentage,
      hasTargets: {
        carbs: nutrition.carbs?.hasTarget,
        protein: nutrition.protein?.hasTarget,
        fat: nutrition.fat?.hasTarget
      }
    });
    
    // 모든 영양소가 목표를 달성했는지 확인 (목표가 설정된 영양소만 체크)
    const allTargetsMet = 
      (!nutrition.carbs.hasTarget || nutrition.carbs.percentage >= 100) &&
      (!nutrition.protein.hasTarget || nutrition.protein.percentage >= 100) &&
      (!nutrition.fat.hasTarget || nutrition.fat.percentage >= 100);
    
    // 하나라도 목표가 설정되어 있는지 확인
    const hasAnyTarget = 
      nutrition.carbs.hasTarget ||
      nutrition.protein.hasTarget ||
      nutrition.fat.hasTarget;
    
    console.log('🔍 [DEBUG] Goals achievement:', {
      allTargetsMet,
      hasAnyTarget,
      score: (allTargetsMet && hasAnyTarget) ? 1 : 0
    });
    
    // 목표가 하나도 설정되어 있지 않으면 0점
    // 목표가 설정된 영양소들이 모두 100% 이상 달성되었을 때만 1점
    return (allTargetsMet && hasAnyTarget) ? 1 : 0;
  };

  // 운동 점수 업데이트 핸들러 (증분 방식)
  const handleExerciseScoreUpdate = async () => {
    try {
      console.log('🎯 [운동 점수 업데이트] 시작:', { userId });
      
      // 현재 운동 달성률 계산
      const currentExerciseScore = calculateExerciseScore();
      console.log('💪 [운동 점수 계산] 결과:', { currentExerciseScore });
      
      const url = `${import.meta.env.VITE_CORE_API_URL}/health-statistics/${userId}/add-exercise-score?achievementCount=${currentExerciseScore}`;
      console.log('🚀 [API 호출] URL:', url);
      
      // 토큰 가져오기
      const token = getToken();
      console.log('🔑 [토큰 확인]:', { hasToken: !!token, tokenLength: token?.length || 0 });
      
      // 새로운 증분 점수 API 호출
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [API 응답] 상태:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API 에러] 응답:', errorText);
        throw new Error(`운동 점수 업데이트 실패: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [API 성공] 응답:', result);
      
      toast({
        title: '운동 점수 업데이트',
        description: `운동 목표 달성으로 ${currentExerciseScore}점이 추가되었습니다!`,
        variant: 'default'
      });
      
      // 데이터 새로고침
      refetchHealth();
      refetchHealthStats();
      
      // 업데이트 시간과 점수 저장
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const exerciseKey = `exercise_score_last_update_${userId}`;
      const exerciseScoreKey = `exercise_score_last_value_${userId}`;
      localStorage.setItem(exerciseKey, today);
      localStorage.setItem(exerciseScoreKey, currentExerciseScore.toString());
      setLastExerciseScoreUpdate(today);
      setIsExerciseButtonEnabled(false);
    } catch (error) {
      console.error('❌ [운동 점수 업데이트] 실패:', error);
      toast({
        title: '업데이트 실패',
        description: '운동 점수 업데이트에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  // 식단 점수 업데이트 핸들러 (증분 방식)
  const handleNutritionScoreUpdate = async () => {
    try {
      console.log('🍎 [식단 점수 업데이트] 시작:', { userId });
      
      // 오늘 식단 목표 달성 여부 확인
      const nutritionScore = calculateDashboardNutritionScore();
      const isDailyGoalAchieved = nutritionScore >= 1;
      console.log('🥗 [식단 점수 계산] 결과:', { nutritionScore, isDailyGoalAchieved });
      
      const url = `${import.meta.env.VITE_CORE_API_URL}/health-statistics/${userId}/add-nutrition-score?isDailyGoalAchieved=${isDailyGoalAchieved}`;
      console.log('🚀 [API 호출] URL:', url);
      
      // 토큰 가져오기
      const token = getToken();
      console.log('🔑 [토큰 확인]:', { hasToken: !!token, tokenLength: token?.length || 0 });
      
      // 새로운 증분 점수 API 호출
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 [API 응답] 상태:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API 에러] 응답:', errorText);
        throw new Error(`식단 점수 업데이트 실패: ${response.status}`);
      }

      const result = await response.json() as { scoreAdded?: number };
      const scoreAdded = result.scoreAdded || 0;
      console.log('✅ [API 성공] 응답:', result);
      
      toast({
        title: '식단 점수 업데이트',
        description: isDailyGoalAchieved 
          ? `오늘 식단 목표 달성으로 ${scoreAdded}점이 추가되었습니다!`
          : '오늘 식단 목표를 아직 달성하지 못했습니다.',
        variant: isDailyGoalAchieved ? 'default' : 'destructive'
      });
      
      // 데이터 새로고침
      refetchHealth();
      refetchMeals();
      
      // 업데이트 시간과 점수 저장
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nutritionKey = `nutrition_score_last_update_${userId}`;
      const nutritionScoreKey = `nutrition_score_last_value_${userId}`;
      localStorage.setItem(nutritionKey, today);
      localStorage.setItem(nutritionScoreKey, nutritionScore.toString());
      setLastNutritionScoreUpdate(today);
      setIsNutritionButtonEnabled(false);
    } catch (error) {
      console.error('❌ [식단 점수 업데이트] 실패:', error);
      toast({
        title: '업데이트 실패',
        description: '식단 점수 업데이트에 실패했습니다.',
        variant: 'destructive'
      });
    }
  };

  // 📊 버튼 활성화 상태 업데이트 (점수 변경 감지 로직)
  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay(); // 0 = Sunday
    
    // 🏃‍♂️ 운동 버튼 상태 확인 (점수 변경 감지)
    const currentExerciseScore = calculateExerciseScore();
    
    // 이번 주 일요일 날짜 계산
    const thisWeekSunday = new Date(now);
    thisWeekSunday.setDate(now.getDate() - dayOfWeek);
    const sundayString = thisWeekSunday.toISOString().split('T')[0];
    
    const exerciseKey = `exercise_score_last_update_${userId}`;
    const exerciseScoreKey = `exercise_score_last_value_${userId}`;
    const lastExerciseUpdate = localStorage.getItem(exerciseKey);
    const lastExerciseScore = parseInt(localStorage.getItem(exerciseScoreKey) || '0');
    
    // 운동 버튼 활성화 조건: 
    // 1. 운동 점수가 있고 
    // 2. (이번 주에 아직 업데이트하지 않았거나 OR 점수가 변경되었다면)
    const isThisWeekUpdated = lastExerciseUpdate && lastExerciseUpdate >= sundayString;
    const hasScoreChanged = currentExerciseScore !== lastExerciseScore;
    const exerciseButtonEnabled = currentExerciseScore > 0 && (!isThisWeekUpdated || hasScoreChanged);
    setIsExerciseButtonEnabled(exerciseButtonEnabled);
    
    // 🍎 식단 버튼 상태 확인 (점수 변경 감지)
    const currentNutritionScore = calculateDashboardNutritionScore();
    
    const nutritionKey = `nutrition_score_last_update_${userId}`;
    const nutritionScoreKey = `nutrition_score_last_value_${userId}`;
    const lastNutritionUpdate = localStorage.getItem(nutritionKey);
    const lastNutritionScore = parseInt(localStorage.getItem(nutritionScoreKey) || '0');
    
    // 식단 버튼 활성화 조건:
    // 1. 식단 점수가 1점이고
    // 2. (오늘 아직 업데이트하지 않았거나 OR 점수가 변경되었다면)
    const isTodayUpdated = lastNutritionUpdate === today;
    const hasNutritionScoreChanged = currentNutritionScore !== lastNutritionScore;
    const nutritionButtonEnabled = currentNutritionScore >= 1 && (!isTodayUpdated || hasNutritionScoreChanged);
    setIsNutritionButtonEnabled(nutritionButtonEnabled);
    
    console.log('🔄 [버튼 상태 업데이트]', {
      currentExerciseScore,
      lastExerciseScore,
      hasScoreChanged,
      currentNutritionScore,
      lastNutritionScore,
      hasNutritionScoreChanged,
      exerciseButtonEnabled,
      nutritionButtonEnabled,
      today,
      dayOfWeek,
      sundayString,
      lastExerciseUpdate,
      lastNutritionUpdate,
      isThisWeekUpdated,
      isTodayUpdated
    });
  }, [userId, healthStats, nutritionStats, exerciseSessionsWeek, userGoals, calculateExerciseScore, calculateDashboardNutritionScore]);

  // 상세 운동 데이터 계산 함수 (주간 기준)
  const calculateDetailedExerciseData = () => {
    // 메모된 주간 데이터 사용 (healthStats > exerciseSessions)
    const weeklyBodyPartCountsLocal = weeklyBodyPartCounts;
    
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

    // 달성률 계산 함수
    const getPercent = (current: number, target: number) => target > 0 ? Math.min((current / target) * 100, 100) : 0;
    
    return {
      chest: {
        current: weeklyBodyPartCountsLocal.chest || 0,
        target: bodyPartTargets.chest || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.chest || 0, bodyPartTargets.chest || 0),
        hasTarget: !!bodyPartTargets.chest
      },
      back: {
        current: weeklyBodyPartCountsLocal.back || 0,
        target: bodyPartTargets.back || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.back || 0, bodyPartTargets.back || 0),
        hasTarget: !!bodyPartTargets.back
      },
      legs: {
        current: weeklyBodyPartCountsLocal.legs || 0,
        target: bodyPartTargets.legs || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.legs || 0, bodyPartTargets.legs || 0),
        hasTarget: !!bodyPartTargets.legs
      },
      shoulders: {
        current: weeklyBodyPartCountsLocal.shoulders || 0,
        target: bodyPartTargets.shoulders || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.shoulders || 0, bodyPartTargets.shoulders || 0),
        hasTarget: !!bodyPartTargets.shoulders
      },
      arms: {
        current: weeklyBodyPartCountsLocal.arms || 0,
        target: bodyPartTargets.arms || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.arms || 0, bodyPartTargets.arms || 0),
        hasTarget: !!bodyPartTargets.arms
      },
      abs: {
        current: weeklyBodyPartCountsLocal.abs || 0,
        target: bodyPartTargets.abs || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.abs || 0, bodyPartTargets.abs || 0),
        hasTarget: !!bodyPartTargets.abs
      },
      cardio: {
        current: weeklyBodyPartCountsLocal.cardio || 0,
        target: bodyPartTargets.cardio || 0,
        percentage: getPercent(weeklyBodyPartCountsLocal.cardio || 0, bodyPartTargets.cardio || 0),
        hasTarget: !!bodyPartTargets.cardio
      }
    };
  };

  // 주간 운동 부위별 횟수 계산 함수 (중복 제거)
  const getBodyPartWeeklyCounts = (exerciseSessions: unknown[]): Record<string, number> => {
    const getWeekDates = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date.toISOString().slice(0, 10));
      }
      return dates;
    };

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
      
      // 같은 날짜에 같은 부위를 여러 번 해도 최대 1회만 카운트
      const key = `${part}_${date}`;
      if (!seen[key]) {
        seen[key] = true;
        counts[part]++;
      }
    }
    return counts;
  };

  // After userGoals query declaration
  const bodyPartGoalValues = useMemo(() => ({
    chest: Number(userGoals?.data?.weekly_chest || 0),
    back: Number(userGoals?.data?.weekly_back || 0),
    legs: Number(userGoals?.data?.weekly_legs || 0),
    shoulders: Number(userGoals?.data?.weekly_shoulders || 0),
    arms: Number(userGoals?.data?.weekly_arms || 0),
    abs: Number(userGoals?.data?.weekly_abs || 0),
    cardio: Number(userGoals?.data?.weekly_cardio || 0),
  }), [userGoals]);

  // 🏃 주간 부위별 횟수 메모 (healthStats 우선, 없으면 exerciseSessionsWeek 계산)
  const weeklyBodyPartCounts = useMemo(() => {
    // 1️⃣ healthStats.bodyPartFrequency 우선
    if (healthStats?.bodyPartFrequency && Array.isArray(healthStats.bodyPartFrequency)) {
      const counts: Record<string, number> = {};
      healthStats.bodyPartFrequency.forEach((item: { bodyPart?: string; count?: number }) => {
        const part = (item.bodyPart || '').toLowerCase();
        counts[part] = item.count || 0;
      });
      return {
        chest: counts['chest'] || 0,
        back: counts['back'] || 0,
        legs: counts['legs'] || 0,
        shoulders: counts['shoulders'] || 0,
        arms: counts['arms'] || 0,
        abs: counts['abs'] || 0,
        cardio: counts['cardio'] || 0,
      };
    }
    // 2️⃣ healthStats 주간 카운트 필드 존재 시 사용
    if (healthStats?.data) {
      return {
        chest: healthStats.data.weeklyChestCount || 0,
        back: healthStats.data.weeklyBackCount || 0,
        legs: healthStats.data.weeklyLegsCount || 0,
        shoulders: healthStats.data.weeklyShouldersCount || 0,
        arms: healthStats.data.weeklyArmsCount || 0,
        abs: healthStats.data.weeklyAbsCount || 0,
        cardio: healthStats.data.weeklyCardioCount || 0,
      } as Record<string, number>;
    }
    // 3️⃣ 마지막으로 세션 데이터로 계산
    return getBodyPartWeeklyCounts(exerciseSessionsWeek?.data || []);
  }, [healthStats, exerciseSessionsWeek]);

  const totalWeeklyCount = useMemo(() => Object.values(weeklyBodyPartCounts).reduce((a, b) => a + b, 0), [weeklyBodyPartCounts]);

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
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
          <h3 className="text-xl font-semibold mb-2 dark:text-gray-100">아직 건강 데이터가 없습니다</h3>
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
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* 캐릭터 기반 운동 현황 */}
          <HealthCharacter
            exerciseMinutes={todayData.exerciseMinutes}
            targetMinutes={todayData.targetMinutes}
            isExercising={todayData.exerciseMinutes > 0}
          />

          {/* 목표 달성률 섹션 */}
          <Card className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-2xl dark:text-gray-100">
                <Target className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
                목표 달성률
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {goalPeriod === 'day' && new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
                {goalPeriod === 'week' && `이번 주`}
                {goalPeriod === 'month' && `이번 달 (${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })})`}
              </div>
              
              

            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 운동 그룹 */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <span className="mr-2">💪</span>
                    운동 목표 달성률 (주간)
                  </h3>
                  
                  <div className="text-center mb-4">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !weeklyWorkoutTarget ? "#d1d5db" :
                            totalWeeklyCount >= weeklyWorkoutTarget ? "#10b981" : 
                            totalWeeklyCount >= weeklyWorkoutTarget * 0.5 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(((totalWeeklyCount) / (weeklyWorkoutTarget || 1)) * 100, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {weeklyWorkoutTarget 
                            ? Math.round(((totalWeeklyCount) / weeklyWorkoutTarget) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {weeklyWorkoutTarget 
                        ? `${totalWeeklyCount}회 / ${weeklyWorkoutTarget}회`
                        : `${totalWeeklyCount}회 / 목표 미설정`
                      }
                    </p>
                    
                    <Badge 
                      variant={
                        !weeklyWorkoutTarget ? "outline" :
                        totalWeeklyCount >= weeklyWorkoutTarget ? "default" : "secondary"
                      }
                      className="mb-3"
                    >
                      {!weeklyWorkoutTarget ? "목표 미설정" :
                       totalWeeklyCount >= weeklyWorkoutTarget ? "달성!" : "진행중"}
                    </Badge>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">주간 운동 달성 시 최대 7점</p>
                    <div className="relative w-full h-4 rounded-full bg-blue-200 dark:bg-blue-900/60 mt-1">
                      <div
                        className="absolute left-0 top-0 h-4 rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-500"
                        style={{ width: `${weeklyWorkoutTarget ? Math.min((totalWeeklyCount / weeklyWorkoutTarget) * 100, 100) : 0}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold drop-shadow">
                          {weeklyWorkoutTarget ? `${Math.round(Math.min((totalWeeklyCount / weeklyWorkoutTarget) * 100, 100))}%` : '0%'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">현재 획득 점수</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {calculateExerciseScore()}점 / 7점
                      </span>
                    </div>

                  </div>
                </div>

                {/* 식단 그룹 */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <span className="mr-2">🍽️</span>
                    식단 목표 달성률 (일간)
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* 탄수화물 */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                          <circle 
                            cx="50" cy="50" r="35" fill="none" 
                            stroke={
                              !todayData?.nutritionGoals?.carbs ? "#d1d5db" :
                              (todayData.nutrition.carbs / todayData.nutritionGoals.carbs * 100) >= 100 ? "#10b981" : 
                              (todayData.nutrition.carbs / todayData.nutritionGoals.carbs * 100) >= 50 ? "#3b82f6" : "#f59e0b"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 35 * Math.min((todayData.nutrition.carbs / todayData.nutritionGoals.carbs * 100), 100) / 100} ${2 * Math.PI * 35}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                            {todayData?.nutritionGoals?.carbs 
                              ? Math.round((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">탄수화물</p>
                    </div>

                    {/* 단백질 */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                          <circle 
                            cx="50" cy="50" r="35" fill="none" 
                            stroke={
                              !todayData?.nutritionGoals?.protein ? "#d1d5db" :
                              (todayData.nutrition.protein / todayData.nutritionGoals.protein * 100) >= 100 ? "#10b981" : 
                              (todayData.nutrition.protein / todayData.nutritionGoals.protein * 100) >= 50 ? "#8b5cf6" : "#f59e0b"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 35 * Math.min((todayData.nutrition.protein / todayData.nutritionGoals.protein * 100), 100) / 100} ${2 * Math.PI * 35}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                            {todayData?.nutritionGoals?.protein 
                              ? Math.round((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">단백질</p>
                    </div>

                    {/* 지방 */}
                    <div className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                          <circle 
                            cx="50" cy="50" r="35" fill="none" 
                            stroke={
                              !todayData?.nutritionGoals?.fat ? "#d1d5db" :
                              (todayData.nutrition.fat / todayData.nutritionGoals.fat * 100) >= 100 ? "#10b981" : 
                              (todayData.nutrition.fat / todayData.nutritionGoals.fat * 100) >= 50 ? "#ec4899" : "#f59e0b"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 35 * Math.min((todayData.nutrition.fat / todayData.nutritionGoals.fat * 100), 100) / 100} ${2 * Math.PI * 35}`}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                            {todayData?.nutritionGoals?.fat 
                              ? Math.round((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">지방</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">일일 식단 100% 달성 시 1점 (주간 최대 7점)</p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      모든 영양소 100% 달성 시 해당 날짜 1점 획득
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">오늘 획득 점수</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {calculateDashboardNutritionScore()}점 / 1점
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* 기간별 목표 달성률 요약 정보 */}
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    {goalPeriod === 'day' && '오늘의'}
                    {goalPeriod === 'week' && '이번 주'}
                    {goalPeriod === 'month' && '이번 달'} 
                    전체 목표 달성률
                  </h4>
                  
                  {/* 기본값인지 실제 설정된 목표인지 구분 표시 */}
                  {userGoals?.data?.user_goal_id ? (
                    <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        ✅ 설정된 목표로 계산 중 (설정일: {new Date(userGoals.data.created_at).toLocaleDateString('ko-KR')})
                      </p>
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        📋 기본 목표로 계산 중 (프로필에서 개인 목표를 설정하세요)
                      </p>
                    </div>
                  )}
                  
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {(() => {
                      const exercisePercentage = weeklyWorkoutTarget 
                        ? Math.min(((totalWeeklyCount) / weeklyWorkoutTarget) * 100, 100)
                        : 0;
                      
                      const carbsPercentage = todayData?.nutritionGoals?.carbs 
                        ? Math.min((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100, 100)
                        : 0;
                      
                      const proteinPercentage = todayData?.nutritionGoals?.protein 
                        ? Math.min((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100, 100)
                        : 0;
                      
                      const fatPercentage = todayData?.nutritionGoals?.fat 
                        ? Math.min((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100, 100)
                        : 0;
                      
                      const totalPercentage = (exercisePercentage + carbsPercentage + proteinPercentage + fatPercentage) / 4;
                      
                      return Math.round(totalPercentage);
                    })()}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    4개 목표 중 {(() => {
                      let completedCount = 0;
                      
                      if (weeklyWorkoutTarget && totalWeeklyCount >= weeklyWorkoutTarget) {
                        completedCount++;
                      }
                      if (todayData?.nutritionGoals?.carbs && (todayData.nutrition.carbs / todayData.nutritionGoals.carbs) >= 1) {
                        completedCount++;
                      }
                      if (todayData?.nutritionGoals?.protein && (todayData.nutrition.protein / todayData.nutritionGoals.protein) >= 1) {
                        completedCount++;
                      }
                      if (todayData?.nutritionGoals?.fat && (todayData.nutrition.fat / todayData.nutritionGoals.fat) >= 1) {
                        completedCount++;
                      }
                      
                      return completedCount;
                    })()}개 달성 완료
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🎯 점수 업데이트 버튼 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
                랭킹 점수 업데이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleExerciseScoreUpdate}
                  disabled={!isExerciseButtonEnabled}
                  className={`${
                    isExerciseButtonEnabled 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  운동 목표 점수 추가 (주간)
                  {isExerciseButtonEnabled && <span className="ml-2 text-xs">🔥</span>}
                </Button>
                <Button
                  onClick={handleNutritionScoreUpdate}
                  disabled={!isNutritionButtonEnabled}
                  className={`${
                    isNutritionButtonEnabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  식단 목표 점수 추가 (일간)
                  {isNutritionButtonEnabled && <span className="ml-2 text-xs">🔥</span>}
                </Button>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center">
                <div>🏃‍♂️ 운동: 주간 목표 달성 시 활성화 (매주 일요일 초기화)</div>
                <div>🍎 식단: 일간 목표 달성 시 활성화 (매일 자정 초기화)</div>
                <div className="mt-1 text-xs">
                  {!isExerciseButtonEnabled && !isNutritionButtonEnabled && '목표를 달성하면 버튼이 활성화됩니다'}
                  {isExerciseButtonEnabled && '운동 목표 달성! 점수를 추가하세요 🎉'}
                  {isNutritionButtonEnabled && '식단 목표 달성! 점수를 추가하세요 🎉'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상세 목표 달성률 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 📊 상세 운동 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  상세 운동 목표 달성률 (주간)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // 메모된 주간 집계 사용 (healthStats 우선)
                  const totalWeeklyCountLocal = totalWeeklyCount;
                  const target = weeklyWorkoutTarget;
                  const percentage = target ? Math.min((totalWeeklyCountLocal / target) * 100, 100) : 0;

                  return (
                    <div className="space-y-6">
                      {/* 전체 운동 목표 */}
                      <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">주간 총 운동 횟수</span>
                          <span className="text-2xl font-bold text-green-600">
                            {totalWeeklyCountLocal}회
                          </span>
                        </div>
                        <div className="relative">
                          <Progress value={percentage} className="h-4" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-white drop-shadow">
                              {Math.round(percentage)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span>0회</span>
                          <span>목표: {target}회</span>
                        </div>
                      </div>

                      {/* 운동 부위별 목표 달성률 */}
                      {(() => {
                        const exerciseDetails = calculateDetailedExerciseData();
                        const hasAnyTarget = Object.values(exerciseDetails).some(detail => detail.hasTarget);
                        return hasAnyTarget && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">운동 부위별 달성률 (횟수 기준)</h4>
                          
                            {/* 가슴 운동 */}
                            {exerciseDetails.chest.hasTarget && (
                              <div className="bg-red-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-red-600 dark:text-red-300">💪 가슴 운동</span>
                                  <span className="text-sm font-bold text-red-600 dark:text-red-300">
                                    {exerciseDetails.chest.current}회 / {exerciseDetails.chest.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.chest.percentage} className="h-2 [&>div]:bg-red-600 dark:[&>div]:bg-red-700" />
                                <div className="text-xs text-red-600 dark:text-red-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.chest.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 등 운동 */}
                            {exerciseDetails.back.hasTarget && (
                              <div className="bg-green-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-green-600 dark:text-green-300">🏋️‍♂️ 등 운동</span>
                                  <span className="text-sm font-bold text-green-600 dark:text-green-300">
                                    {exerciseDetails.back.current}회 / {exerciseDetails.back.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.back.percentage} className="h-2 [&>div]:bg-green-600 dark:[&>div]:bg-green-700" />
                                <div className="text-xs text-green-600 dark:text-green-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.back.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 다리 운동 */}
                            {exerciseDetails.legs.hasTarget && (
                              <div className="bg-purple-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-purple-600 dark:text-purple-300">🦵 다리 운동</span>
                                  <span className="text-sm font-bold text-purple-600 dark:text-purple-300">
                                    {exerciseDetails.legs.current}회 / {exerciseDetails.legs.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.legs.percentage} className="h-2 [&>div]:bg-purple-600 dark:[&>div]:bg-purple-700" />
                                <div className="text-xs text-purple-600 dark:text-purple-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.legs.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 어깨 운동 */}
                            {exerciseDetails.shoulders.hasTarget && (
                              <div className="bg-orange-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-orange-600 dark:text-orange-300">🤸‍♂️ 어깨 운동</span>
                                  <span className="text-sm font-bold text-orange-600 dark:text-orange-300">
                                    {exerciseDetails.shoulders.current}회 / {exerciseDetails.shoulders.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.shoulders.percentage} className="h-2 [&>div]:bg-orange-600 dark:[&>div]:bg-orange-700" />
                                <div className="text-xs text-orange-600 dark:text-orange-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.shoulders.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 팔 운동 */}
                            {exerciseDetails.arms.hasTarget && (
                              <div className="bg-pink-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-pink-600 dark:text-pink-300">💪 팔 운동</span>
                                  <span className="text-sm font-bold text-pink-600 dark:text-pink-300">
                                    {exerciseDetails.arms.current}회 / {exerciseDetails.arms.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.arms.percentage} className="h-2 [&>div]:bg-pink-600 dark:[&>div]:bg-pink-700" />
                                <div className="text-xs text-pink-600 dark:text-pink-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.arms.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 복근 운동 */}
                            {exerciseDetails.abs.hasTarget && (
                              <div className="bg-yellow-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-300">🏃‍♀️ 복근 운동</span>
                                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-300">
                                    {exerciseDetails.abs.current}회 / {exerciseDetails.abs.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.abs.percentage} className="h-2 [&>div]:bg-yellow-600 dark:[&>div]:bg-yellow-700" />
                                <div className="text-xs text-yellow-600 dark:text-yellow-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.abs.percentage)}% 달성
                                </div>
                              </div>
                            )}

                            {/* 유산소 운동 */}
                            {exerciseDetails.cardio.hasTarget && (
                              <div className="bg-cyan-50 dark:bg-card border-none dark:border-[#7c3aed] rounded-lg p-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-cyan-600 dark:text-cyan-300">🏃 유산소 운동</span>
                                  <span className="text-sm font-bold text-cyan-600 dark:text-cyan-300">
                                    {exerciseDetails.cardio.current}회 / {exerciseDetails.cardio.target}회
                                  </span>
                                </div>
                                <Progress value={exerciseDetails.cardio.percentage} className="h-2 [&>div]:bg-cyan-600 dark:[&>div]:bg-cyan-700" />
                                <div className="text-xs text-cyan-600 dark:text-cyan-300 mt-1 text-center">
                                  {Math.round(exerciseDetails.cardio.percentage)}% 달성
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 운동 상태 메시지 */}
                      <div className={`p-4 rounded-lg border-l-4 ${
                        target && totalWeeklyCountLocal >= target
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300'
                          : target && totalWeeklyCountLocal >= target * 0.5
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300'
                      }`}>
                        <div className="flex items-center">
                          {target && totalWeeklyCountLocal >= target ? (
                            <CheckCircle className="h-5 w-5 mr-2" />
                          ) : target && totalWeeklyCountLocal >= target * 0.5 ? (
                            <AlertTriangle className="h-5 w-5 mr-2" />
                          ) : (
                            <X className="h-5 w-5 mr-2" />
                          )}
                          <span className="font-medium">
                            {target && totalWeeklyCountLocal >= target
                              ? '🎉 주간 운동 목표를 달성했습니다!'
                              : target && totalWeeklyCountLocal >= target * 0.5
                              ? `💪 조금만 더! ${target - totalWeeklyCountLocal}회 더 운동하면 목표 달성!`
                              : target
                              ? `🔥 화이팅! ${target - totalWeeklyCountLocal}회 운동으로 목표를 달성해보세요!`
                              : '🎯 프로필에서 주간 운동 목표를 설정해보세요!'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* 🍎 상세 영양소 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  상세 영양소 목표 달성률 (일간)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 탄수화물 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center dark:text-gray-100">
                        🍞 탄수화물
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {(todayData?.nutrition?.carbs || 0).toFixed(1)}g / {(todayData?.nutritionGoals?.carbs || 0).toFixed(1)}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={todayData?.nutritionGoals?.carbs 
                        ? Math.min((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100, 100)
                        : 0} className="h-3 bg-blue-200 dark:bg-blue-900/60 [&>div]:bg-blue-600 dark:[&>div]:bg-blue-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold drop-shadow">
                          {todayData?.nutritionGoals?.carbs 
                            ? Math.round((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 단백질 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center dark:text-gray-100">
                        🥩 단백질
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {(todayData?.nutrition?.protein || 0).toFixed(1)}g / {(todayData?.nutritionGoals?.protein || 0).toFixed(1)}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={todayData?.nutritionGoals?.protein 
                        ? Math.min((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100, 100)
                        : 0} className="h-3 bg-purple-200 dark:bg-purple-900/60 [&>div]:bg-purple-600 dark:[&>div]:bg-purple-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold drop-shadow">
                          {todayData?.nutritionGoals?.protein 
                            ? Math.round((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 지방 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center dark:text-gray-100">
                        🥑 지방
                      </span>
                      <span className="font-bold text-pink-600 dark:text-pink-400">
                        {(todayData?.nutrition?.fat || 0).toFixed(1)}g / {(todayData?.nutritionGoals?.fat || 0).toFixed(1)}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={todayData?.nutritionGoals?.fat 
                        ? Math.min((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100, 100)
                        : 0} className="h-3 bg-pink-200 dark:bg-pink-900/60 [&>div]:bg-pink-600 dark:[&>div]:bg-pink-400" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold drop-shadow">
                          {todayData?.nutritionGoals?.fat 
                            ? Math.round((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 영양소 상태 요약 */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2">📈 영양소 섭취 현황</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`p-2 rounded ${todayData?.nutritionGoals?.carbs && (todayData.nutrition.carbs / todayData.nutritionGoals.carbs * 100) >= 80 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        <div className="text-xs">탄수화물</div>
                        <div className="font-bold">{todayData?.nutritionGoals?.carbs 
                          ? Math.round((todayData.nutrition.carbs / todayData.nutritionGoals.carbs) * 100)
                          : 0}%</div>
                      </div>
                      <div className={`p-2 rounded ${todayData?.nutritionGoals?.protein && (todayData.nutrition.protein / todayData.nutritionGoals.protein * 100) >= 80 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        <div className="text-xs">단백질</div>
                        <div className="font-bold">{todayData?.nutritionGoals?.protein 
                          ? Math.round((todayData.nutrition.protein / todayData.nutritionGoals.protein) * 100)
                          : 0}%</div>
                      </div>
                      <div className={`p-2 rounded ${todayData?.nutritionGoals?.fat && (todayData.nutrition.fat / todayData.nutritionGoals.fat * 100) >= 80 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                        <div className="text-xs">지방</div>
                        <div className="font-bold">{todayData?.nutritionGoals?.fat 
                          ? Math.round((todayData.nutrition.fat / todayData.nutritionGoals.fat) * 100)
                          : 0}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
        </TabsContent>

        {/* 🏋️ 운동 분석 탭 */}
        <TabsContent value="exercise" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BodyPartFrequencyChart 
              bodyPartFrequency={healthStats?.bodyPartFrequency || []}
              totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
              period={period}
              chartType="bar"
              goals={bodyPartGoalValues}
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