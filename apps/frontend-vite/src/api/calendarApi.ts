import axios from '@/utils/axios';
import { useQuery } from '@tanstack/react-query';

export interface CalendarActivityData {
  date: string;
  hasExercise: boolean;
  hasDiet: boolean;
  hasHealthRecord: boolean;
  exerciseCount: number;
  dietCount: number;
  totalCalories: number;
  totalExerciseMinutes: number;
  activities: {
    exercises: Array<{
      exercise_name: string;
      duration_minutes: number;
      calories_burned: number;
    }>;
    meals: Array<{
      food_name: string;
      meal_time: string;
      calories: number;
    }>;
    healthRecords: Array<{
      weight?: number;
      water_intake?: number;
    }>;
  };
}

export interface CalendarMonthData {
  [date: string]: CalendarActivityData;
}

/**
 * 캘린더 월별 활동 데이터 조회
 */
export const getCalendarMonthData = async (
  userId: string, 
  year: number, 
  month: number
): Promise<CalendarMonthData> => {
  console.log('📅 [calendarApi] 월별 캘린더 데이터 조회:', { userId, year, month });
  
  try {
    const response = await axios.get(`/api/calendar/${userId}/month`, {
      params: { year, month }
    });
    
    console.log('✅ [calendarApi] 월별 캘린더 데이터 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [calendarApi] 월별 캘린더 데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * 캘린더 특정 날짜 활동 데이터 조회
 */
export const getCalendarDayData = async (
  userId: string, 
  date: string
): Promise<CalendarActivityData> => {
  console.log('📅 [calendarApi] 일별 캘린더 데이터 조회:', { userId, date });
  
  try {
    const response = await axios.get(`/api/calendar/${userId}/day`, {
      params: { date }
    });
    
    console.log('✅ [calendarApi] 일별 캘린더 데이터 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [calendarApi] 일별 캘린더 데이터 조회 실패:', error);
    throw error;
  }
};

/**
 * React Query: 월별 캘린더 데이터 훅
 */
export const useCalendarMonthData = (userId: string, year: number, month: number) => {
  return useQuery({
    queryKey: ['calendarMonthData', userId, year, month],
    queryFn: () => getCalendarMonthData(userId, year, month),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2
  });
};

/**
 * React Query: 일별 캘린더 데이터 훅
 */
export const useCalendarDayData = (userId: string, date: string) => {
  return useQuery({
    queryKey: ['calendarDayData', userId, date],
    queryFn: () => getCalendarDayData(userId, date),
    enabled: !!userId && !!date,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2
  });
};

/**
 * 통합 활동 데이터 조회 (임시 - 백엔드 API 개발 전까지 기존 API들을 조합)
 */
export const getCombinedActivityData = async (
  userId: string,
  year: number,
  month: number
): Promise<CalendarMonthData> => {
  console.log('🔄 [calendarApi] 통합 활동 데이터 조회 (임시):', { userId, year, month });
  
  try {
    // 현재 달의 시작일과 마지막일 계산
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // 병렬로 데이터 조회
    const [exerciseResponse, mealResponse, healthResponse] = await Promise.all([
      // 운동 세션 데이터
      axios.get(`/api/exercise-sessions/${userId}`, {
        params: { 
          period: 'month',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }).catch(() => ({ data: [] })),
      
      // 식단 데이터  
      axios.get(`/api/meal-logs/${userId}`, {
        params: { 
          period: 'month',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }).catch(() => ({ data: [] })),
      
      // 건강 기록 데이터
      axios.get(`/api/health-records/${userId}`, {
        params: { 
          period: 'month',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }).catch(() => ({ data: [] }))
    ]);

    // 날짜별로 데이터 집계
    const calendarData: CalendarMonthData = {};
    
    // 운동 데이터 처리
    const exercises = exerciseResponse.data || [];
    exercises.forEach((exercise: { exercise_date?: string; exerciseDate?: string; duration_minutes?: number; durationMinutes?: number; calories_burned?: number; caloriesBurned?: number; exercise_name?: string; exerciseName?: string }) => {
      const date = exercise.exercise_date || exercise.exerciseDate;
      if (!date) return;
      
      if (!calendarData[date]) {
        calendarData[date] = {
          date,
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0,
          totalExerciseMinutes: 0,
          activities: {
            exercises: [],
            meals: [],
            healthRecords: []
          }
        };
      }
      
      calendarData[date].hasExercise = true;
      calendarData[date].exerciseCount++;
      calendarData[date].totalExerciseMinutes += exercise.duration_minutes || exercise.durationMinutes || 0;
      calendarData[date].totalCalories += exercise.calories_burned || exercise.caloriesBurned || 0;
      calendarData[date].activities.exercises.push({
        exercise_name: exercise.exercise_name || exercise.exerciseName || '운동',
        duration_minutes: exercise.duration_minutes || exercise.durationMinutes || 0,
        calories_burned: exercise.calories_burned || exercise.caloriesBurned || 0
      });
    });
    
    // 식단 데이터 처리
    const meals = mealResponse.data || [];
    meals.forEach((meal: any) => {
      const date = meal.log_date || meal.logDate;
      if (!date) return;
      
      if (!calendarData[date]) {
        calendarData[date] = {
          date,
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0,
          totalExerciseMinutes: 0,
          activities: {
            exercises: [],
            meals: [],
            healthRecords: []
          }
        };
      }
      
      calendarData[date].hasDiet = true;
      calendarData[date].dietCount++;
      calendarData[date].activities.meals.push({
        food_name: meal.food_name || meal.foodName || '음식',
        meal_time: meal.meal_time || meal.mealTime || 'LUNCH',
        calories: meal.calories || 0
      });
    });
    
    // 건강 기록 데이터 처리
    const healthRecords = healthResponse.data || [];
    healthRecords.forEach((record: any) => {
      const date = record.record_date || record.recordDate;
      if (!date) return;
      
      if (!calendarData[date]) {
        calendarData[date] = {
          date,
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0,
          totalExerciseMinutes: 0,
          activities: {
            exercises: [],
            meals: [],
            healthRecords: []
          }
        };
      }
      
      calendarData[date].hasHealthRecord = true;
      calendarData[date].activities.healthRecords.push({
        weight: record.weight,
        water_intake: record.water_intake || record.waterIntake
      });
    });
    
    console.log('✅ [calendarApi] 통합 활동 데이터 조회 완료:', { 
      userId, 
      year, 
      month,
      totalDays: Object.keys(calendarData).length,
      sampleData: Object.keys(calendarData).slice(0, 3).map(key => ({ [key]: calendarData[key] }))
    });
    
    return calendarData;
    
  } catch (error) {
    console.error('❌ [calendarApi] 통합 활동 데이터 조회 실패:', error);
    return {};
  }
};

/**
 * React Query: 통합 활동 데이터 훅 (임시)
 */
export const useCombinedActivityData = (userId: string, year: number, month: number) => {
  return useQuery({
    queryKey: ['combinedActivityData', userId, year, month],
    queryFn: () => getCombinedActivityData(userId, year, month),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 10 * 60 * 1000, // 10분
    retry: 2
  });
}; 