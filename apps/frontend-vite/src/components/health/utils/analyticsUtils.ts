import { ChartDataPoint } from '../types/analytics';

export const getDateKey = (dateStr: string, period: string): string => {
  const date = new Date(dateStr);
  
  switch (period) {
    case 'day':
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'week': {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      return startOfWeek.toISOString().split('T')[0];
    }
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return String(date.getFullYear());
    default:
      return date.toISOString().split('T')[0];
  }
};

export const generatePeriodLabel = (baseDate: Date, period: string, index: number): string => {
  const date = new Date(baseDate);
  
  switch (period) {
    case 'day':
      date.setDate(date.getDate() - (6 - index));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'week': {
      date.setDate(date.getDate() - (4 - index) * 7);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    }
    case 'month':
      date.setMonth(date.getMonth() - (11 - index));
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return String(date.getFullYear() - (4 - index));
    default:
      return date.toISOString().split('T')[0];
  }
};

export const getExtendedPeriod = (period: string) => {
  switch (period) {
    case 'day':
      return 7; // 7일
    case 'week':
      return 5; // 5주
    case 'month':
      return 12; // 12개월
    case 'year':
      return 5; // 5년
    default:
      return 7;
  }
};

export const getPeriodLabel = (period: string) => {
  switch (period) {
    case 'day':
      return '최근 7일';
    case 'week':
      return '최근 5주';
    case 'month':
      return '최근 12개월';
    case 'year':
      return '최근 5년';
    default:
      return '기간';
  }
};

export const getDateRange = (period: 'day' | 'week' | 'month') => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'day':
      start.setDate(now.getDate() - 1);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
  }
  
  return { start, end: now };
};

export const getExerciseTarget = (period: 'day' | 'week' | 'month', userGoals: { exercise_minutes_per_day?: number } | null) => {
  if (!userGoals?.exercise_minutes_per_day) return null;
  
  const dailyTarget = userGoals.exercise_minutes_per_day;
  
  switch (period) {
    case 'day':
      return dailyTarget;
    case 'week':
      return dailyTarget * 7;
    case 'month':
      return dailyTarget * 30;
    default:
      return dailyTarget;
  }
};

export const getNutritionTarget = (
  dailyTarget: number | undefined, 
  period: 'day' | 'week' | 'month'
) => {
  if (!dailyTarget) return null;
  
  switch (period) {
    case 'day':
      return dailyTarget;
    case 'week':
      return dailyTarget * 7;
    case 'month':
      return dailyTarget * 30;
    default:
      return dailyTarget;
  }
};

export const calculateExerciseScore = (chartData: ChartDataPoint[]) => {
  const totalExercise = chartData.reduce((sum, item) => sum + item.exerciseMinutes, 0);
  const exerciseDays = chartData.filter(item => item.exerciseMinutes > 0).length;
  const avgExercise = exerciseDays > 0 ? totalExercise / exerciseDays : 0;
  
  // 일일 30분 기준으로 점수 계산 (최대 100점)
  const score = Math.min((avgExercise / 30) * 100, 100);
  
  return Math.round(score);
};

export const calculateNutritionScore = (nutritionStats: {
  totalCalories?: number;
  totalCarbs?: number;
  totalProtein?: number;
  totalFat?: number;
} | null) => {
  if (!nutritionStats) return 0;
  
  // 영양 균형 점수 계산 (간단한 예시)
  const { totalCalories, totalCarbs, totalProtein, totalFat } = nutritionStats;
  
  if (!totalCalories) return 0;
  
  // 권장 비율: 탄수화물 50-65%, 단백질 10-35%, 지방 20-35%
  const carbsRatio = (totalCarbs * 4) / totalCalories;
  const proteinRatio = (totalProtein * 4) / totalCalories;
  const fatRatio = (totalFat * 9) / totalCalories;
  
  let score = 0;
  
  // 각 영양소 비율이 권장 범위에 있으면 점수 추가
  if (carbsRatio >= 0.5 && carbsRatio <= 0.65) score += 33;
  if (proteinRatio >= 0.1 && proteinRatio <= 0.35) score += 33;
  if (fatRatio >= 0.2 && fatRatio <= 0.35) score += 34;
  
  return Math.round(score);
}; 