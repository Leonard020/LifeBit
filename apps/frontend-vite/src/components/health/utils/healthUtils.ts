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
  nutritionStats: NutritionData | undefined
) => {
  const today = new Date().toISOString().split('T')[0];
  
  // 운동 데이터 처리 (날짜 앞 10자리만 비교, 필드명 유연하게)
  const todayExercise = exerciseSessions.filter(session => {
    const sessionDate = getDate(session);
    const isToday = sessionDate && sessionDate.slice(0, 10) === today;
    return isToday;
  });
  
  // 영양 데이터 처리
  const finalNutritionData = nutritionStats || {
    dailyCalories: healthStats?.dailyCalories || 0,
    dailyCarbs: healthStats?.dailyCarbs || 0,
    dailyProtein: healthStats?.dailyProtein || 0,
    dailyFat: healthStats?.dailyFat || 0
  };
  
  // 목표 값 처리 - exercise_sessions에서 평균 운동 시간 계산
  const averageExerciseMinutes = exerciseSessions.length > 0 
    ? Math.round(exerciseSessions.reduce((sum, session) => sum + getDuration(session), 0) / exerciseSessions.length)
    : 60; // 운동 기록이 없으면 기본값 60분
  
  const targetMinutes = averageExerciseMinutes;
  
  const exerciseMinutes = todayExercise.reduce((sum, session) => {
    return sum + getDuration(session);
  }, 0);
  
  const caloriesBurned = todayExercise.reduce((sum, session) => {
    return sum + getCalories(session);
  }, 0);
  
  return {
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
}; 