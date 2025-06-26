export type PeriodType = 'day' | 'week' | 'month' | 'year';

export interface ExerciseSession {
  exercise_date: string;
  duration_minutes: number;
  calories_burned: number;
  exercise_name?: string;
}

export interface NutritionData {
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  dailyCalories?: number;
  dailyCarbs?: number;
  dailyProtein?: number;
  dailyFat?: number;
}

export interface NutritionGoals {
  calories: number | null;
  carbs: number | null;
  protein: number | null;
  fat: number | null;
}

export interface HealthStatsData {
  dailyCalories?: number;
  dailyCarbs?: number;
  dailyProtein?: number;
  dailyFat?: number;
  weeklyExerciseMinutes?: number;
  bodyPartFrequency?: Array<{bodyPart: string; frequency: number}>;
  totalExerciseSessions?: number;
  weeklyWorkouts?: number;
  totalCaloriesBurned?: number;
  streak?: number;
}

export interface MealLog {
  meal_log_id: number;
  log_date: string;
  meal_time?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface UserGoal {
  weekly_workout_target?: number;
  daily_calory_target?: number;
  daily_carbs_target?: number;
  daily_protein_target?: number;
  daily_fat_target?: number;
  created_at?: string;
} 