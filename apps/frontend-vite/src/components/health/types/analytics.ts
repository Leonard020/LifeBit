import { ExerciseSession, MealLog, HealthRecord } from '../../../api/auth';

// 조인된 식단 데이터를 위한 확장 타입
export interface MealLogWithFoodItem extends MealLog {
  food_item?: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  };
}

export interface PythonAnalyticsChartsProps {
  userId: number;
  period: 'day' | 'week' | 'month' | 'year';
}

export interface ChartDataPoint {
  label: string;
  weight: number;
  bmi: number;
  exerciseMinutes: number;
  exerciseCalories: number;
  hasWeightData: boolean;
  hasBmiData: boolean;
  hasExerciseData: boolean;
}

export interface GoalAchievement {
  current: number;
  target: number;
  percentage: number;
  hasTarget: boolean;
}

export interface BodyPartGoals {
  chest: GoalAchievement;
  back: GoalAchievement;
  legs: GoalAchievement;
  shoulders: GoalAchievement;
  arms: GoalAchievement;
  abs: GoalAchievement;
  cardio: GoalAchievement;
}

export interface GoalAchievements {
  exercise: GoalAchievement;
  weight: GoalAchievement;
  calories: GoalAchievement;
  carbs: GoalAchievement;
  protein: GoalAchievement;
  fat: GoalAchievement;
  bodyParts: BodyPartGoals;
}

// 색상 팔레트
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899'
};

export const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1']; 