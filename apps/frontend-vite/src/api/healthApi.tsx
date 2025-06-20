import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/utils/axios';
import { AUTH_CONFIG } from '@/config/env';
// import { supabase } from '../lib/supabase'; // TODO: Supabase 설정 후 주석 해제

// ============================================================================
// 타입 정의 (TypeScript 인터페이스)
// ============================================================================

// 건강 기록 관련 타입
export interface HealthRecord {
  health_record_id: number;
  uuid: string;
  user_id: number;
  weight: number;
  bmi: number;
  record_date: string;
  created_at: string;
}

// 사용자 목표 관련 타입
export interface UserGoal {
  user_goal_id: number;
  uuid: string;
  user_id: number;
  weekly_workout_target: number;
  daily_carbs_target: number;
  daily_protein_target: number;
  daily_fat_target: number;
  created_at: string;
  updated_at: string;
}

// 운동 세션 관련 타입
export interface ExerciseSession {
  exercise_session_id: number;
  uuid: string;
  user_id: number;
  exercise_catalog_id: number;
  duration_minutes: number;
  calories_burned: number;
  notes: string;
  exercise_date: string;
  created_at: string;
}

// 식단 기록 관련 타입
export interface MealLog {
  meal_log_id: number;
  uuid: string;
  user_id: number;
  food_item_id: number;
  quantity: number;
  log_date: string;
  created_at: string;
}

// 건강 통계 관련 타입
export interface HealthStatistics {
  total_records: number;
  average_weight: number;
  average_bmi: number;
  weight_trend: 'increasing' | 'decreasing' | 'stable';
  bmi_category: '저체중' | '정상' | '과체중' | '비만';
  goal_completion_rate: number;
}

// 추천 관련 타입
export interface Recommendation {
  recommendation_id: number;
  uuid: string;
  user_id: number;
  recommendation_data: {
    exercise_recommendations: Array<{
      type: string;
      duration: number;
      intensity: string;
      reason: string;
    }>;
    nutrition_recommendations: Array<{
      type: string;
      food: string;
      amount: string;
      reason: string;
    }>;
    health_tips: Array<{
      tip: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  created_at: string;
}

// API 요청 데이터 타입
export interface CreateHealthRecordData {
  user_id: number;
  weight: number;
  bmi: number;
  record_date: string;
}

export interface UpdateGoalData {
  weekly_workout_target?: number;
  daily_carbs_target?: number;
  daily_protein_target?: number;
  daily_fat_target?: number;
}

export interface CreateExerciseData {
  user_id: number;
  exercise_catalog_id: number;
  duration_minutes: number;
  calories_burned: number;
  notes?: string;
  exercise_date: string;
}

export interface CreateMealData {
  user_id: number;
  food_item_id: number;
  quantity: number;
  log_date: string;
}

export interface FeedbackData {
  feedback_type: string;
  feedback_data: Record<string, unknown>;
}

// ExerciseState 인터페이스 추가 (최상단에 추가)
interface ExerciseState {
  exercise?: string;
  category?: string;
  subcategory?: string;
  time_period?: string;
  weight?: number;
  sets?: number;
  reps?: number;
  duration_min?: number;
}

// 식단 기록 관련 타입
export interface MealLog {
  meal_log_id: number;
  uuid: string;
  user_id: number;
  food_item_id: number;
  quantity: number;
  log_date: string;
  created_at: string;
}

// 식단 기록 요청 타입
export interface DietRecordRequest {
  food_name: string;
  amount: string;
  meal_time: string;
  nutrition: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

// 운동 기록 요청 타입  
export interface ExerciseRecordRequest {
  exercise_name: string;
  category: string;
  target?: string;
  sets?: number;
  reps?: number;
  duration_min?: number;
  calories_burned?: number;
}

// ============================================================================
// API 함수들 (백엔드와 통신하는 함수들)
// ============================================================================

// ============================================================================
// 에러 처리 관련 타입 및 유틸리티
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  status?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// 에러 코드별 사용자 친화적 메시지
const ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: '로그인이 필요합니다. 다시 로그인해주세요.',
  USER_NOT_FOUND: '사용자 정보를 찾을 수 없습니다.',
  TEMPORARY_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 관리자에게 문의해주세요.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  PERMISSION_DENIED: '접근 권한이 없습니다.',
  DATA_NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
  RATE_LIMIT_EXCEEDED: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
};

// API 호출 옵션 타입 정의
interface ApiCallOptions {
  method?: string;
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  retries?: number;
}

// 🔧 개선된 API 호출 함수
const apiCall = async <T = unknown>(
  endpoint: string, 
  options: ApiCallOptions = {}
): Promise<ApiResponse<T>> => {
  const { method = 'GET', data, params, retries = 2 } = options;
  
  // 🔒 토큰 유효성 사전 검사
  const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  if (!token) {
    console.warn('🚨 [apiCall] 토큰이 없습니다. 로그인이 필요합니다.');
    return {
      error: {
        code: 'AUTH_REQUIRED',
        message: '로그인이 필요합니다.',
        status: 401
      },
      success: false
    };
  }

  // JWT 토큰 만료 검사
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
      console.warn('🚨 [apiCall] 토큰이 만료되었습니다.');
      // 만료된 토큰 제거
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      window.dispatchEvent(new Event('storage'));
      
      return {
        error: {
          code: 'TOKEN_EXPIRED',
          message: '로그인이 만료되었습니다. 다시 로그인해주세요.',
          status: 401
        },
        success: false
      };
    }
    
    console.log('✅ [apiCall] 토큰 유효성 확인됨:', {
      userId: payload.userId,
      expiresIn: Math.floor(payload.exp - currentTime),
      endpoint
    });
  } catch (error) {
    console.error('❌ [apiCall] 토큰 파싱 실패:', error);
    // 잘못된 토큰 제거
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    window.dispatchEvent(new Event('storage'));
    
    return {
      error: {
        code: 'INVALID_TOKEN',
        message: '토큰이 손상되었습니다. 다시 로그인해주세요.',
        status: 401
      },
      success: false
    };
  }
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axiosInstance({
        url: endpoint,
        method,
        data,
        params,
        timeout: 10000, // 10초 타임아웃
      });
      
      // 백엔드에서 error 필드가 있는 경우 (fallback 응답)
      if (response.data?.error) {
        const errorCode = response.data?.errorCode || 'UNKNOWN_ERROR';
        return {
          data: response.data,
          error: {
            code: errorCode,
            message: ERROR_MESSAGES[errorCode] || response.data.error,
            details: response.data.error,
            status: response.status
          },
          success: false
        };
      }
      
      return {
        data: response.data,
        success: true
      };
      
    } catch (error: unknown) {
      const axiosError = error as { 
        response?: { status?: number; statusText?: string; data?: { message?: string } }; 
        message?: string;
        code?: string;
      };
      
      // 401/403 오류 시 토큰 관련 처리
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        console.warn(`🚨 [apiCall] 인증 오류 (${axiosError.response.status}):`, endpoint);
        
        // 토큰 제거 및 로그인 페이지 리다이렉트 준비
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_KEY);
        window.dispatchEvent(new Event('storage'));
        
        return {
          error: {
            code: axiosError.response.status === 401 ? 'AUTH_REQUIRED' : 'PERMISSION_DENIED',
            message: axiosError.response.status === 401 
              ? '로그인이 필요합니다.' 
              : '해당 데이터에 접근할 권한이 없습니다.',
            details: axiosError.response?.data?.message || axiosError.message,
            status: axiosError.response.status
          },
          success: false
        };
      }
      
      // 마지막 시도가 아니면 재시도
      if (attempt < retries) {
        console.warn(`🔄 API 재시도 (${attempt + 1}/${retries + 1}): ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 지수 백오프
        continue;
      }
      
      // 상세한 에러 분류
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        errorCode = 'TIMEOUT_ERROR';
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'NETWORK_ERROR') {
        errorCode = 'NETWORK_ERROR';
      } else if (axiosError.response?.status) {
        const status = axiosError.response.status;
        if (status === 401) errorCode = 'AUTH_REQUIRED';
        else if (status === 403) errorCode = 'PERMISSION_DENIED';
        else if (status === 404) errorCode = 'DATA_NOT_FOUND';
        else if (status === 422) errorCode = 'VALIDATION_ERROR';
        else if (status === 429) errorCode = 'RATE_LIMIT_EXCEEDED';
        else if (status >= 500) errorCode = 'SERVER_ERROR';
      }
      
      errorMessage = ERROR_MESSAGES[errorCode] || errorMessage;
      
      console.error('🚨 API Call Error:', {
        endpoint,
        method,
        attempt: attempt + 1,
        status: axiosError.response?.status,
        code: errorCode,
        message: axiosError.message
      });
      
      return {
        error: {
          code: errorCode,
          message: errorMessage,
          details: axiosError.response?.data?.message || axiosError.message,
          status: axiosError.response?.status
        },
        success: false
      };
    }
  }
  
  // 이 지점에 도달하면 안 됨
  return {
    error: {
      code: 'UNKNOWN_ERROR',
      message: '예상치 못한 오류가 발생했습니다.'
    },
    success: false
  };
};

// 건강 기록 관련 API 함수들
export const healthApi = {
  // 건강 기록 조회
  getHealthRecords: async (userId: string, period: string = 'month'): Promise<ApiResponse<HealthRecord[]>> => {
    return apiCall<HealthRecord[]>(`/api/health-statistics/health-records/${userId}?period=${period}`);
  },

  // 건강 기록 생성
  createHealthRecord: async (data: CreateHealthRecordData): Promise<ApiResponse<HealthRecord>> => {
    return apiCall<HealthRecord>('/api/health-records', {
      method: 'POST',
      data,
    });
  },

  // 사용자 목표 조회
  getUserGoals: async (userId: string): Promise<ApiResponse<UserGoal>> => {
    console.log('🎯 [getUserGoals] 요청 시작:', { userId });
    
    // 토큰 확인
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.warn('🚨 [getUserGoals] 토큰이 없습니다.');
      return {
        error: {
          code: 'AUTH_REQUIRED',
          message: '로그인이 필요합니다.'
        },
        success: false
      };
    }
    
    console.log('🔑 [getUserGoals] 토큰 확인됨:', token.substring(0, 20) + '...');
    
    try {
      const result = await apiCall<UserGoal>(`/api/user-goals/${userId}`);
      console.log('✅ [getUserGoals] 응답 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ [getUserGoals] 요청 실패:', error);
      
      // 403 오류인 경우 특별 처리
      if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
        return {
          error: {
            code: 'PERMISSION_DENIED',
            message: '사용자 목표에 접근할 권한이 없습니다. 로그인을 다시 시도해주세요.',
            status: 403
          },
          success: false
        };
      }
      
      throw error;
    }
  },

  // 사용자 목표 업데이트
  updateUserGoals: async (userId: string, data: UpdateGoalData): Promise<ApiResponse<UserGoal>> => {
    return apiCall<UserGoal>(`/api/user-goals/${userId}`, {
      method: 'PUT',
      data,
    });
  },

  // 운동 세션 조회
  getExerciseSessions: async (userId: string, period: string = 'month'): Promise<ApiResponse<ExerciseSession[]>> => {
    return apiCall<ExerciseSession[]>(`/api/health-statistics/exercise-sessions/${userId}?period=${period}`);
  },

  // 운동 세션 생성
  createExerciseSession: async (data: CreateExerciseData): Promise<ApiResponse<ExerciseSession>> => {
    return apiCall<ExerciseSession>('/api/exercise-sessions', {
      method: 'POST',
      data,
    });
  },

  // 식단 기록 조회
  getMealLogs: async (userId: string, period: string = 'month'): Promise<ApiResponse<MealLog[]>> => {
    // 🔒 사용자 권한 검증
    if (!validateUserAccess(userId)) {
      return {
        error: {
          code: 'PERMISSION_DENIED',
          message: '다른 사용자의 식단 기록에 접근할 수 없습니다.',
          status: 403
        },
        success: false
      };
    }

    // 🔍 디버깅: 토큰과 사용자 ID 확인
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    console.log('🔍 [getMealLogs] 토큰 상태:', {
      hasToken: !!token,
      tokenLength: token?.length,
      userId,
      period,
      endpoint: `/api/meal-logs/${userId}?period=${period}`
    });

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 [getMealLogs] 토큰 정보:', {
          tokenUserId: payload.userId,
          requestedUserId: userId,
          isMatch: payload.userId?.toString() === userId,
          exp: new Date(payload.exp * 1000),
          isExpired: payload.exp < Date.now() / 1000
        });
      } catch (e) {
        console.error('🚨 [getMealLogs] 토큰 파싱 오류:', e);
      }
    }

    console.log('🍽️ [getMealLogs] 식단 기록 조회 시작:', { userId, period });
    return apiCall<MealLog[]>(`/api/meal-logs/${userId}?period=${period}`);
  },

  // 식단 기록 생성
  createMealLog: async (data: CreateMealData): Promise<ApiResponse<MealLog>> => {
    return apiCall<MealLog>('/api/meal-logs', {
      method: 'POST',
      data,
    });
  },

  // 건강 통계 조회
  getHealthStatistics: async (userId: string, period: string = 'month'): Promise<ApiResponse<HealthStatistics>> => {
    return apiCall<HealthStatistics>(`/api/health-statistics/${userId}?period=${period}`);
  },

  // 추천 조회
  getRecommendations: async (userId: string): Promise<ApiResponse<Recommendation[]>> => {
    return apiCall<Recommendation[]>(`/api/recommendations/${userId}`);
  },

  // 피드백 제출
  submitFeedback: async (recommendationId: string, feedback: FeedbackData): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/api/recommendations/${recommendationId}/feedback`, {
      method: 'POST',
      data: feedback,
    });
  },

  // 실시간 업데이트 구독 (임시 구현)
  subscribeToHealthUpdates: (userId: string, callback: (data: Record<string, unknown>) => void) => {
    // TODO: Supabase 설정 후 실제 구현으로 교체
    console.log('실시간 구독 시작:', userId);
    
    // 임시로 5초마다 더미 데이터 전송
    const interval = setInterval(() => {
      callback({
        type: 'health_update',
        timestamp: new Date().toISOString(),
        user_id: userId,
      });
    }, 5000);

    // 구독 해제 함수 반환
    return {
      unsubscribe: () => {
        clearInterval(interval);
        console.log('실시간 구독 해제:', userId);
      },
    };
  },

  // 식단 기록 저장 API
  saveDietRecord: async (dietData: DietRecordRequest): Promise<MealLog> => {
    try {
      // 1. 먼저 음식 정보를 검색하거나 생성
      const foodResponse = await axiosInstance.post('/api/foods/find-or-create', {
        name: dietData.food_name,
        calories: dietData.nutrition.calories,
        carbs: dietData.nutrition.carbs,
        protein: dietData.nutrition.protein,
        fat: dietData.nutrition.fat
      });

      // 2. 식단 로그 저장
      const mealResponse = await axiosInstance.post('/api/meals/record', {
        foodItemId: foodResponse.data.food_item_id,
        quantity: parseFloat(dietData.amount) || 1.0,
        mealTime: dietData.meal_time
      });

      return mealResponse.data;
    } catch (error) {
      console.error('Diet record save error:', error);
      throw error;
    }
  },

  // 운동 기록 저장 API 개선
  saveExerciseRecord: async (exerciseData: ExerciseRecordRequest): Promise<ExerciseSession> => {
    try {
      // 1. 먼저 운동 카탈로그를 검색하거나 생성
      const catalogResponse = await axiosInstance.post('/api/exercises/find-or-create', {
        name: exerciseData.exercise_name,
        bodyPart: exerciseData.target,
        description: `${exerciseData.category} 운동`
      });

      // 2. 운동 세션 저장
      const sessionResponse = await axiosInstance.post('/api/exercises/record', {
        catalogId: catalogResponse.data.exercise_catalog_id,
        durationMinutes: exerciseData.duration_min,
        caloriesBurned: exerciseData.calories_burned,
        weight: exerciseData.sets && exerciseData.reps ? 
          (exerciseData.sets * exerciseData.reps * 0.5) : null, // 임시 계산
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        notes: `${exerciseData.category} 운동`
      });

      return sessionResponse.data;
    } catch (error) {
      console.error('Exercise record save error:', error);
      throw error;
    }
  },
};

// ============================================================================
// React Query 훅들 (데이터 페칭 및 캐싱)
// ============================================================================

// 건강 기록 조회 훅
export const useHealthRecords = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['healthRecords', userId, period],
    queryFn: () => healthApi.getHealthRecords(userId, period),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 사용자 목표 조회 훅
export const useUserGoals = (userId: string) => {
  return useQuery({
    queryKey: ['userGoals', userId],
    queryFn: () => healthApi.getUserGoals(userId),
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 지연
  });
};

// 운동 세션 조회 훅
export const useExerciseSessions = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['exerciseSessions', userId, period],
    queryFn: () => healthApi.getExerciseSessions(userId, period),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 식단 기록 조회 훅
export const useMealLogs = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['mealLogs', userId, period],
    queryFn: () => healthApi.getMealLogs(userId, period),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 건강 통계 조회 훅
export const useHealthStatistics = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['healthStatistics', userId, period],
    queryFn: () => healthApi.getHealthStatistics(userId, period),
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 지연
  });
};

// 추천 조회 훅
export const useRecommendations = (userId: string) => {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => healthApi.getRecommendations(userId),
    staleTime: 30 * 60 * 1000, // 30분간 캐시 유지
    gcTime: 60 * 60 * 1000, // 1시간간 가비지 컬렉션 지연
  });
};

// ============================================================================
// 뮤테이션 훅들 (데이터 수정)
// ============================================================================

// 건강 기록 생성 뮤테이션
export const useCreateHealthRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: healthApi.createHealthRecord,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 관련 쿼리 무효화하여 데이터 새로고침
        queryClient.invalidateQueries({
          queryKey: ['healthRecords', response.data.user_id],
        });
        queryClient.invalidateQueries({
          queryKey: ['healthStatistics', response.data.user_id],
        });
      }
    },
    onError: (error) => {
      console.error('건강 기록 생성 실패:', error);
    },
  });
};

// 사용자 목표 업데이트 뮤테이션
export const useUpdateUserGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateGoalData }) =>
      healthApi.updateUserGoals(userId, data),
    onSuccess: (response, variables) => {
      if (response.success) {
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({
          queryKey: ['userGoals', variables.userId],
        });
        queryClient.invalidateQueries({
          queryKey: ['healthStatistics', variables.userId],
        });
      }
    },
    onError: (error) => {
      console.error('사용자 목표 업데이트 실패:', error);
    },
  });
};

// 운동 세션 생성 뮤테이션
export const useCreateExerciseSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: healthApi.createExerciseSession,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({
          queryKey: ['exerciseSessions', response.data.user_id],
        });
        queryClient.invalidateQueries({
          queryKey: ['healthStatistics', response.data.user_id],
        });
      }
    },
    onError: (error) => {
      console.error('운동 세션 생성 실패:', error);
    },
  });
};

// 식단 기록 생성 뮤테이션
export const useCreateMealLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: healthApi.createMealLog,
    onSuccess: (response) => {
      if (response.success && response.data) {
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({
          queryKey: ['mealLogs', response.data.user_id],
        });
        queryClient.invalidateQueries({
          queryKey: ['healthStatistics', response.data.user_id],
        });
      }
    },
    onError: (error) => {
      console.error('식단 기록 생성 실패:', error);
    },
  });
};

// 피드백 제출 뮤테이션
export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recommendationId, feedback }: { recommendationId: string; feedback: FeedbackData }) =>
      healthApi.submitFeedback(recommendationId, feedback),
    onSuccess: (data, variables) => {
      // 추천 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['recommendations'],
      });
    },
    onError: (error) => {
      console.error('피드백 제출 실패:', error);
    },
  });
};

// ============================================================================
// 실시간 업데이트 훅
// ============================================================================

// 실시간 건강 데이터 업데이트 구독 훅
export const useHealthRealtime = (userId: string) => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const subscription = healthApi.subscribeToHealthUpdates(userId, (data) => {
      console.log('실시간 데이터 업데이트:', data);
      
      // 실시간 데이터 업데이트 시 관련 쿼리들 무효화
      queryClient.invalidateQueries({
        queryKey: ['healthRecords', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['userGoals', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['recommendations', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['healthStatistics', userId],
      });
    });

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, queryClient]);
};

// ============================================================================
// 유틸리티 함수들
// ============================================================================

// BMI 계산 함수
export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
};

// BMI 카테고리 판정 함수
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return '저체중';
  if (bmi < 25) return '정상';
  if (bmi < 30) return '과체중';
  return '비만';
};

// 목표 달성률 계산 함수
export const calculateGoalCompletionRate = (
  current: number,
  target: number
): number => {
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

// 날짜 포맷팅 함수
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 시간 포맷팅 함수
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
};

// 칼로리 포맷팅 함수
export const formatCalories = (calories: number): string => {
  return `${calories.toLocaleString()} kcal`;
};

console.log('=== 토큰 상태 확인 ===');
console.log('access_token:', localStorage.getItem('access_token'));
console.log('userInfo:', localStorage.getItem('userInfo'));
console.log('모든 localStorage 키:', Object.keys(localStorage));

// 브라우저 콘솔에서 실행
console.log('Token:', localStorage.getItem('token'));
console.log('User Info:', localStorage.getItem('user'));

// 브라우저 콘솔에서 실행
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Token expires at:', new Date(payload.exp * 1000));
  console.log('Current time:', new Date());
}

// 🔧 사용자 ID 안전하게 가져오기 헬퍼 함수
const getCurrentUserId = (): string | null => {
  try {
    // 1. 토큰에서 사용자 ID 추출 시도
    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) {
        return payload.userId.toString();
      }
    }

    // 2. 사용자 정보에서 추출 시도
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      if (user.userId) {
        return user.userId.toString();
      }
    }

    console.warn('🚨 [getCurrentUserId] 사용자 ID를 찾을 수 없습니다.');
    return null;
  } catch (error) {
    console.error('❌ [getCurrentUserId] 사용자 ID 추출 실패:', error);
    return null;
  }
};

// 🔧 사용자 ID 검증 함수
const validateUserAccess = (requestedUserId: string): boolean => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    console.warn('🚨 [validateUserAccess] 현재 사용자 ID가 없습니다.');
    return false;
  }

  if (currentUserId !== requestedUserId) {
    console.warn('🚨 [validateUserAccess] 사용자 ID 불일치:', {
      current: currentUserId,
      requested: requestedUserId
    });
    return false;
  }

  return true;
};

export default healthApi; 