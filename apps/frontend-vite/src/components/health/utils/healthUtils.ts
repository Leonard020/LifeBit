import { ExerciseSession as BaseExerciseSession, NutritionData, HealthStatsData, UserGoal, MealLog } from '../types/health';

// API 응답의 다양한 케이스를 모두 지원하는 타입
export type ExerciseSession = BaseExerciseSession & {
  exercise_date?: string;
  exerciseDate?: string;
  ExerciseDate?: string;
  duration_minutes?: number;
  durationMinutes?: number;
  DurationMinutes?: number;
  calories_burned?: number;
  caloriesBurned?: number;
  CaloriesBurned?: number;
};

export const getIntensityFromMinutes = (minutes: number): 'none' | 'low' | 'medium' | 'high' | 'very-high' => {
  if (minutes === 0) return 'none';
  if (minutes < 15) return 'low';
  if (minutes < 30) return 'medium';
  if (minutes < 60) return 'high';
  return 'very-high';
};

export const calculateExerciseStats = (sessions: ExerciseSession[]) => {
  return {
    totalWorkouts: sessions.length,
    totalMinutes: sessions.reduce((sum, session) => sum + (session.duration_minutes ?? session.durationMinutes ?? 0), 0),
    totalCalories: sessions.reduce((sum, session) => sum + (session.calories_burned ?? session.caloriesBurned ?? 0), 0),
    activeDays: new Set(sessions.map(session => session.exercise_date ?? session.exerciseDate)).size
  };
};

export const mapTimePeriodToKorean = (timePeriod?: string): string => {
  const mapping: Record<string, string> = {
    'dawn': '새벽',
    'morning': '오전', 
    'afternoon': '오후',
    'evening': '저녁',
    'night': '야간'
  };
  return mapping[timePeriod || ''] || '';
};

// 필드명 유연 추출 함수 (snake_case, camelCase, PascalCase 모두 지원)
const getDate = (session: ExerciseSession) => session.exercise_date ?? session.exerciseDate ?? session.ExerciseDate ?? '';
const getDuration = (session: ExerciseSession) => session.duration_minutes ?? session.durationMinutes ?? session.DurationMinutes ?? 0;
const getCalories = (session: ExerciseSession) => session.calories_burned ?? session.caloriesBurned ?? session.CaloriesBurned ?? 0;

export const processTodayData = (
  exerciseSessions: ExerciseSession[],
  mealLogs: MealLog[],
  userGoals: UserGoal | undefined,
  healthStats: HealthStatsData | undefined,
  nutritionStats: { dailyCalories: number; dailyCarbs: number; dailyProtein: number; dailyFat: number; mealLogCount: number; dataSource: string; } | undefined
) => {
  const today = new Date().toISOString().split('T')[0];
  
  console.log('🔍 [healthUtils] processTodayData 시작:', {
    today,
    exerciseSessionsCount: exerciseSessions.length,
    mealLogsCount: mealLogs.length,
    nutritionStats
  });
  
  // 운동 세션 데이터 상세 로깅
  console.log('🏋️ [healthUtils] 운동 세션 데이터:', {
    allSessions: exerciseSessions,
    sessionDates: exerciseSessions.map(session => ({
      date: getDate(session),
      duration: getDuration(session)
    }))
  });
  
  // nutritionStats 상세 구조 확인
  console.log('🔍 [healthUtils] nutritionStats 상세 구조:', {
    nutritionStats,
    hasNutritionStats: !!nutritionStats,
    nutritionStatsKeys: nutritionStats ? Object.keys(nutritionStats) : null
  });
  
  // 운동 데이터 처리 (날짜 앞 10자리만 비교, 필드명 유연하게)
  const todayExercise = exerciseSessions.filter(session => {
    const sessionDate = getDate(session);
    const isToday = sessionDate && sessionDate.slice(0, 10) === today;
    console.log('🎯 [healthUtils] 운동 세션 날짜 비교:', {
      sessionDate,
      today,
      isToday,
      duration: session.duration_minutes,
      session
    });
    return isToday;
  });
  
  console.log('💪 [healthUtils] 오늘의 운동 세션:', {
    todayExercise,
    count: todayExercise.length,
    durations: todayExercise.map(session => session.duration_minutes)
  });
  
  // 🍽️ meal_logs에서 오늘 날짜 데이터 직접 계산 (정확한 필드명 사용)
  const todayMealLogs = mealLogs.filter(meal => {
    const mealDate = meal.log_date;
    return mealDate && mealDate.slice(0, 10) === today;
  });
  
  console.log('🍽️ [healthUtils] 오늘 식단 데이터:', {
    todayMealLogsCount: todayMealLogs.length,
    todayMealLogs: todayMealLogs.map(meal => ({
      meal_log_id: meal.meal_log_id,
      log_date: meal.log_date
    }))
  });
  
  // 상세 디버깅: 첫 번째 meal 데이터 전체 출력
  if (todayMealLogs.length > 0) {
    console.log('🔍 [healthUtils] 첫 번째 meal 데이터 전체:', todayMealLogs[0]);
  }
  
  // ⚠️ 중요: meal_logs에는 영양소 정보가 없으므로 nutritionStats 우선 사용
  console.log('⚠️ [healthUtils] meal_logs에는 영양소 정보가 없습니다. nutritionStats 사용:', nutritionStats);
  console.log('🔍 [healthUtils] nutritionStats 상세 구조:', {
    nutritionStats,
    dailyCalories: nutritionStats?.dailyCalories,
    dailyCarbs: nutritionStats?.dailyCarbs,
    dailyProtein: nutritionStats?.dailyProtein,
    dailyFat: nutritionStats?.dailyFat,
    mealLogCount: nutritionStats?.mealLogCount,
    dataSource: nutritionStats?.dataSource
  });
  
  // 영양 데이터 처리 (nutritionStats 우선 사용)
  const finalNutritionData = {
    dailyCalories: nutritionStats?.dailyCalories || healthStats?.dailyCalories || 0,
    dailyCarbs: nutritionStats?.dailyCarbs || healthStats?.dailyCarbs || 0,
    dailyProtein: nutritionStats?.dailyProtein || healthStats?.dailyProtein || 0,
    dailyFat: nutritionStats?.dailyFat || healthStats?.dailyFat || 0,
    // 호환성을 위한 별칭 추가
    calories: nutritionStats?.dailyCalories || healthStats?.dailyCalories || 0,
    carbs: nutritionStats?.dailyCarbs || healthStats?.dailyCarbs || 0,
    protein: nutritionStats?.dailyProtein || healthStats?.dailyProtein || 0,
    fat: nutritionStats?.dailyFat || healthStats?.dailyFat || 0
  };
  
  console.log('✅ [healthUtils] 계산된 오늘 영양소:', finalNutritionData);
  console.log('🔍 [healthUtils] 각 영양소 값 확인:', {
    'nutritionStats?.dailyCalories': nutritionStats?.dailyCalories,
    'healthStats?.dailyCalories': healthStats?.dailyCalories,
    '최종 dailyCalories': finalNutritionData.dailyCalories,
    'nutritionStats가 있나?': !!nutritionStats,
    'healthStats가 있나?': !!healthStats
  });
  
  // 목표 값 처리 - exercise_sessions에서 평균 운동 시간 계산
  const averageExerciseMinutes = exerciseSessions.length > 0 
    ? Math.round(exerciseSessions.reduce((sum, session) => sum + getDuration(session), 0) / exerciseSessions.length)
    : 60; // 운동 기록이 없으면 기본값 60분
  
  const targetMinutes = averageExerciseMinutes;
  
  const exerciseMinutes = todayExercise.reduce((sum, session) => {
    const duration = session.duration_minutes || 0;
    console.log('⏱️ [healthUtils] 운동 시간 계산:', {
      session,
      duration,
      currentSum: sum
    });
    return sum + duration;
  }, 0);
  
  console.log('⌛ [healthUtils] 총 운동 시간:', exerciseMinutes);
  
  const caloriesBurned = todayExercise.reduce((sum, session) => {
    return sum + getCalories(session);
  }, 0);
  

  
  const result = {
    exerciseMinutes,
    targetMinutes,
    caloriesBurned,
    nutrition: finalNutritionData,
    nutritionGoals: {
      calories: userGoals?.daily_calory_target || null,
      carbs: userGoals?.daily_carbs_target || null,
      protein: userGoals?.daily_protein_target || null,
      fat: userGoals?.daily_fat_target || null
    },
    hasGoals: !!(userGoals?.weekly_workout_target || 
                 userGoals?.daily_carbs_target || 
                 userGoals?.daily_protein_target || 
                 userGoals?.daily_fat_target),
    goalsCreatedAt: userGoals?.created_at
  };
  
  console.log('🎯 [healthUtils] 최종 결과:', result);
  
  return result;
}; 