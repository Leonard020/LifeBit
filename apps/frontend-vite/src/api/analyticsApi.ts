/**
 * AI 분석 및 머신러닝 기반 건강 추천 API
 * - Airflow 데이터 파이프라인 연동
 * - 머신러닝 모델 기반 개인화 추천
 * - 건강 패턴 분석 및 예측
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance, { createAiAxiosInstance } from '@/utils/axios';
import { API_CONFIG } from '@/config/env';

// AI API 전용 인스턴스 생성
const aiAxiosInstance = createAiAxiosInstance();

// ============================================================================
// 타입 정의
// ============================================================================

// AI 분석 응답 공통 타입
export interface AnalyticsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    timestamp: string;
    pipeline_version: string;
    model_version: string;
  };
}

// 건강 분석 리포트
export interface HealthAnalyticsReport {
  user_id: number;
  analysis_period: string;
  overall_score: number;
  trends: {
    weight_trend: 'increasing' | 'decreasing' | 'stable';
    exercise_trend: 'improving' | 'declining' | 'stable';
    nutrition_trend: 'improving' | 'declining' | 'stable';
  };
  predictions: {
    weight_prediction_7d: number;
    weight_prediction_30d: number;
    goal_achievement_probability: number;
  };
  risk_factors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
}

// AI 인사이트
export interface AIInsights {
  user_id: number;
  generated_at: string;
  summary: string;
  achievements: string[];
  recommendations: string[];
  personalized_tips: Array<{
    category: 'exercise' | 'nutrition' | 'lifestyle';
    tip: string;
    priority: 'high' | 'medium' | 'low';
    evidence: string;
  }>;
  motivation_message: string;
}

// 체중 트렌드 분석
export interface WeightAnalysis {
  user_id: number;
  current_weight: number;
  weight_change_7d: number;
  weight_change_30d: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  predicted_weight_7d: number;
  predicted_weight_30d: number;
  bmi_category: string;
  healthy_weight_range: {
    min: number;
    max: number;
  };
}

// 운동 패턴 분석
export interface ExerciseAnalysis {
  user_id: number;
  total_sessions: number;
  avg_duration: number;
  total_calories: number;
  current_streak: number;
  best_streak: number;
  preferred_exercise_times: string[];
  exercise_intensity_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  recommendations: {
    optimal_frequency: number;
    suggested_duration: number;
    recommended_exercises: string[];
  };
}

// BMI 분석
export interface BMIAnalysis {
  user_id: number;
  current_bmi: number;
  bmi_category: string;
  bmi_trend: 'improving' | 'declining' | 'stable';
  target_bmi: number;
  months_to_target: number;
}

// 영양 분석
export interface NutritionAnalysis {
  user_id: number;
  daily_avg_calories: number;
  macronutrient_balance: {
    carbs_percentage: number;
    protein_percentage: number;
    fat_percentage: number;
  };
  meal_timing_pattern: {
    breakfast_time: string;
    lunch_time: string;
    dinner_time: string;
  };
  nutritional_gaps: string[];
  recommended_foods: string[];
}

// 개인화 추천
export interface PersonalizedRecommendations {
  user_id: number;
  exercise_recommendations: Array<{
    type: string;
    duration: number;
    frequency: string;
    intensity: string;
    reason: string;
  }>;
  nutrition_recommendations: Array<{
    category: string;
    suggestion: string;
    benefits: string;
  }>;
  lifestyle_recommendations: Array<{
    area: string;
    recommendation: string;
    implementation: string;
  }>;
}

// ============================================================================
// 관리자 대시보드 타입 정의
// ============================================================================

export interface AccessStatsDto {
  period: string;
  접속자: number;
}

export interface UserActivityDto {
  period: string;
  총접속자: number;
  활동사용자: number;
}

export interface ExerciseStatsDto {
  category: string;
  참여자: number;
  color: string;
}

export interface MealStatsDto {
  name?: string;
  value?: number;
  color?: string;
  날짜?: string;
  아침?: number;
  점심?: number;
  저녁?: number;
  간식?: number;
}

export interface AnalyticsDataDto {
  accessStats: AccessStatsDto[];
  userActivity: UserActivityDto[];
  exerciseStats: ExerciseStatsDto[];
  mealStats: MealStatsDto[];
  summary?: SummaryDto; // 요약 정보 추가
}

export interface SummaryDto {
  current: PeriodSummaryDto;
  previous: PeriodSummaryDto;
}

export interface PeriodSummaryDto {
  totalUsers: number;     // 총 회원수
  activeUsers: number;    // 접속자
  recordingUsers: number; // 활동 사용자
}

export interface OnlineUsersDto {
  onlineUsers: number;
  timestamp: number;
}

export interface OnlineUsersDetailDto {
  onlineUsers: number;
  authenticatedUsers: number;
  activeRecorders: number;
  pageStats: {
    'health-log': number;
    admin: number;
    profile: number;
    unknown: number;
  };
  timestamp: number;
}

// ============================================================================
// 관리자 대시보드 API 함수들
// ============================================================================

// 접속 현황 통계 조회
export const getAccessStats = async (period: string): Promise<AccessStatsDto[]> => {
  console.log('🔍 [API] getAccessStats 요청:', { period });
  
  try {
    const response = await axiosInstance.get(`/admin/analytics/access-stats?period=${period}`);
    console.log('✅ [API] getAccessStats 성공:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getAccessStats 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 사용자 활동 비교 통계 조회
export const getUserActivityStats = async (period: string): Promise<UserActivityDto[]> => {
  console.log('🔍 [API] getUserActivityStats 요청:', { period });
  
  try {
    const response = await axiosInstance.get(`/admin/analytics/user-activity?period=${period}`);
    console.log('✅ [API] getUserActivityStats 성공:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getUserActivityStats 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 운동 참여자 통계 조회
export const getExerciseStats = async (period: string): Promise<ExerciseStatsDto[]> => {
  console.log('🔍 [API] getExerciseStats 요청:', { period });
  
  try {
    const response = await axiosInstance.get(`/admin/analytics/exercise-stats?period=${period}`);
    console.log('✅ [API] getExerciseStats 성공:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getExerciseStats 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 식사 기록 통계 조회
export const getMealStats = async (period: string): Promise<MealStatsDto[]> => {
  console.log('🔍 [API] getMealStats 요청:', { period });
  
  try {
    const response = await axiosInstance.get(`/admin/analytics/meal-stats?period=${period}`);
    console.log('✅ [API] getMealStats 성공:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getMealStats 실패:', error.response?.data || error.message);
    throw error;
  }
};

// 전체 애널리틱스 데이터 한번에 조회
export const getAllAnalytics = async (period: string): Promise<AnalyticsDataDto> => {
  console.log('🔍 [API] getAllAnalytics 요청 시작:', { period, timestamp: new Date().toISOString() });
  
  try {
    const url = `/admin/analytics/all?period=${period}`;
    console.log('🌐 [API] 요청 URL:', url);
    
    const response = await axiosInstance.get(url);
    
    console.log('✅ [API] getAllAnalytics 성공:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataKeys: Object.keys(response.data),
      dataSize: JSON.stringify(response.data).length
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getAllAnalytics 실패:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      },
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

// 서버 연결 상태 확인 헬퍼 함수
export const checkServerHealth = async (): Promise<{
  isOnline: boolean;
  coreApi: boolean;
  details: any;
}> => {
  const results = {
    isOnline: false,
    coreApi: false,
    details: {} as any
  };

  try {
    console.log('🏥 [Health Check] 서버 상태 확인 시작');
    
    // Core API 헬스 체크
    try {
      const coreResponse = await fetch('http://localhost:8080/actuator/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5초 타임아웃
      });
      
      if (coreResponse.ok) {
        results.coreApi = true;
        results.isOnline = true;
        results.details.coreApi = await coreResponse.json();
        console.log('✅ [Health Check] Core API 연결 성공');
      } else {
        results.details.coreApi = `HTTP ${coreResponse.status}: ${coreResponse.statusText}`;
        console.warn('⚠️ [Health Check] Core API 응답 오류:', coreResponse.status);
      }
    } catch (coreError: any) {
      results.details.coreApi = coreError.message;
      console.error('❌ [Health Check] Core API 연결 실패:', coreError.message);
    }

    // Analytics API 직접 테스트
    try {
      const analyticsResponse = await axiosInstance.get('/admin/analytics/all?period=daily');
      results.details.analytics = '연결 성공';
      console.log('✅ [Health Check] Analytics API 연결 성공');
    } catch (analyticsError: any) {
      results.details.analytics = analyticsError.message;
      console.error('❌ [Health Check] Analytics API 연결 실패:', analyticsError.message);
    }

    console.log('🏥 [Health Check] 결과:', results);
    return results;
    
  } catch (error: any) {
    console.error('❌ [Health Check] 전체 실패:', error);
    results.details.error = error.message;
    return results;
  }
};

// 실시간 통계 데이터 조회
export const getRealtimeAnalytics = async (): Promise<AnalyticsDataDto> => {
  console.log('📡 [API] getRealtimeAnalytics 요청');
  
  try {
    const response = await axiosInstance.get('/admin/analytics/realtime');
    console.log('✅ [API] getRealtimeAnalytics 성공:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] getRealtimeAnalytics 실패:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 실시간 접속자 수 조회 (기본)
 */
export const getOnlineUsers = async (): Promise<OnlineUsersDto> => {
  console.log('👥 [API] 실시간 접속자 수 요청');
  
  try {
    const response = await axiosInstance.get('/admin/analytics/online-users');
    console.log('✅ [API] 실시간 접속자 수 수신 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] 실시간 접속자 수 요청 실패:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 실시간 접속자 상세 정보 조회 (페이지별)
 */
export const getOnlineUsersDetail = async (): Promise<OnlineUsersDetailDto> => {
  console.log('👥 [API] 실시간 접속자 상세 정보 요청');
  
  try {
    const response = await axiosInstance.get('/admin/analytics/online-users-detail');
    console.log('✅ [API] 실시간 접속자 상세 정보 수신 성공:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [API] 실시간 접속자 상세 정보 요청 실패:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================================================
// API 함수들 (향후 구현)
// ============================================================================

// AI 건강 분석 리포트 조회
const getHealthAnalyticsReport = async (
  userId: number, 
  period: string
): Promise<AnalyticsApiResponse<HealthAnalyticsReport>> => {
  try {
  console.log('🤖 [AI Analytics] 건강 분석 리포트 요청:', { userId, period });
  
    const response = await aiAxiosInstance.post('/py/analytics/health-report', {
      user_id: userId,
      period: period
    });
    
    return {
      success: true,
      data: response.data.report,
      metadata: {
        timestamp: new Date().toISOString(),
        pipeline_version: '1.0.0',
        model_version: '1.0.0'
      }
    };
  } catch (error: unknown) {
    console.error('❌ [AI Analytics] 건강 분석 리포트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const responseMessage = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail;
    
    return {
        success: false,
        error: {
        code: 'API_ERROR',
        message: responseMessage || '건강 분석 중 오류가 발생했습니다.',
        details: errorMessage
        }
    };
  }
};

// AI 인사이트 조회
const getAIHealthInsights = async (
  userId: number, 
  period: string
): Promise<AnalyticsApiResponse<AIInsights>> => {
  try {
  console.log('🧠 [AI Insights] AI 인사이트 요청:', { userId, period });
  
    const response = await aiAxiosInstance.post('/py/analytics/ai-insights', {
      user_id: userId,
      period: period
    });
    
    return {
      success: true,
      data: response.data.insights,
      metadata: {
        timestamp: new Date().toISOString(),
        pipeline_version: '1.0.0',
        model_version: '1.0.0'
      }
    };
  } catch (error: unknown) {
    console.error('❌ [AI Insights] AI 인사이트 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    const responseMessage = (error as {response?: {data?: {detail?: string}}})?.response?.data?.detail;
    
    return {
        success: false,
        error: {
        code: 'AI_ERROR',
        message: responseMessage || 'AI 인사이트 생성 중 오류가 발생했습니다.',
        details: errorMessage
        }
    };
  }
};

// 체중 트렌드 분석
const getWeightTrendsAnalysis = async (
  userId: number, 
  period: string
): Promise<AnalyticsApiResponse<WeightAnalysis>> => {
  console.log('📊 [Weight Analysis] 체중 트렌드 분석 요청:', { userId, period });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: '체중 예측 모델을 구축 중입니다.'
        }
      });
    }, 800);
  });
};

// 운동 패턴 분석
const getExercisePatternsAnalysis = async (
  userId: number, 
  period: string
): Promise<AnalyticsApiResponse<ExerciseAnalysis>> => {
  console.log('💪 [Exercise Analysis] 운동 패턴 분석 요청:', { userId, period });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: '운동 패턴 분석 알고리즘을 개발 중입니다.'
        }
      });
    }, 1200);
  });
};

// 개인화 추천 조회
const getPersonalizedRecommendations = async (
  userId: number
): Promise<AnalyticsApiResponse<PersonalizedRecommendations>> => {
  console.log('🎯 [Recommendations] 개인화 추천 요청:', { userId });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        error: {
          code: 'NOT_IMPLEMENTED',
          message: '추천 시스템 알고리즘을 구현 중입니다.'
        }
      });
    }, 1000);
  });
};

// ============================================================================
// React Query 훅들 (향후 활성화)
// ============================================================================

// 건강 분석 리포트 훅
export const useHealthAnalyticsReport = (userId: number, period: string) => {
  return useQuery({
    queryKey: ['healthAnalyticsReport', userId, period],
    queryFn: () => getHealthAnalyticsReport(userId, period),
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30분간 캐시 유지
    gcTime: 60 * 60 * 1000, // 1시간간 가비지 컬렉션 지연
  });
};

// AI 인사이트 훅
export const useAIHealthInsights = (userId: number, period: string) => {
  return useQuery({
    queryKey: ['aiHealthInsights', userId, period],
    queryFn: () => getAIHealthInsights(userId, period),
    enabled: false, // 현재는 비활성화
    staleTime: 60 * 60 * 1000, // 1시간간 캐시 유지
    gcTime: 2 * 60 * 60 * 1000, // 2시간간 가비지 컬렉션 지연
  });
};

// 체중 트렌드 분석 훅
export const useWeightTrendsAnalysis = (userId: number, period: string) => {
  return useQuery({
    queryKey: ['weightTrendsAnalysis', userId, period],
    queryFn: () => getWeightTrendsAnalysis(userId, period),
    enabled: false, // 현재는 비활성화
    staleTime: 15 * 60 * 1000, // 15분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 지연
  });
};

// 운동 패턴 분석 훅
export const useExercisePatternsAnalysis = (userId: number, period: string) => {
  return useQuery({
    queryKey: ['exercisePatternsAnalysis', userId, period],
    queryFn: () => getExercisePatternsAnalysis(userId, period),
    enabled: false, // 현재는 비활성화
    staleTime: 20 * 60 * 1000, // 20분간 캐시 유지
    gcTime: 40 * 60 * 1000, // 40분간 가비지 컬렉션 지연
  });
};

// 개인화 추천 훅
export const usePersonalizedRecommendations = (userId: number) => {
  return useQuery({
    queryKey: ['personalizedRecommendations', userId],
    queryFn: () => getPersonalizedRecommendations(userId),
    enabled: false, // 현재는 비활성화
    staleTime: 2 * 60 * 60 * 1000, // 2시간간 캐시 유지
    gcTime: 4 * 60 * 60 * 1000, // 4시간간 가비지 컬렉션 지연
  });
};

// ============================================================================
// 향후 구현 계획 메타데이터
// ============================================================================

export const AI_SYSTEM_ROADMAP = {
  phase1: {
    title: 'Airflow 데이터 파이프라인 구축',
    status: 'planned',
    components: [
      'ETL 파이프라인 설계',
      '데이터 품질 검증',
      '실시간 데이터 수집',
      '데이터 웨어하우스 구축'
    ]
  },
  phase2: {
    title: '머신러닝 모델 개발',
    status: 'planned',
    components: [
      '건강 패턴 분석 모델',
      '체중 예측 모델',
      '개인화 추천 알고리즘',
      '이상 패턴 감지 모델'
    ]
  },
  phase3: {
    title: 'AI 서비스 배포',
    status: 'planned',
    components: [
      'ML 모델 서빙',
      'A/B 테스트 프레임워크',
      '성능 모니터링',
      '지속적 학습 시스템'
    ]
  }
};

// ============================================================================
// 관리자 대시보드 React Query Hooks
// ============================================================================

export const useAccessStats = (period: string) => {
  return useQuery({
    queryKey: ['adminAccessStats', period],
    queryFn: () => getAccessStats(period),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    refetchInterval: 1000 * 60 * 10, // 10분마다 자동 갱신
  });
};

export const useUserActivityStats = (period: string) => {
  return useQuery({
    queryKey: ['adminUserActivity', period],
    queryFn: () => getUserActivityStats(period),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 10,
  });
};

export const useExerciseStats = (period: string) => {
  return useQuery({
    queryKey: ['adminExerciseStats', period],
    queryFn: () => getExerciseStats(period),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 10,
  });
};

export const useMealStats = (period: string) => {
  return useQuery({
    queryKey: ['adminMealStats', period],
    queryFn: () => getMealStats(period),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 10,
  });
};

export const useAllAnalytics = (period: string) => {
  return useQuery({
    queryKey: ['adminAllAnalytics', period],
    queryFn: async () => {
      console.log('🔍 [useAllAnalytics] React Query 호출 시작:', { period });
      try {
        const data = await getAllAnalytics(period);
        console.log('✅ [useAllAnalytics] React Query 성공:', { 
          period, 
          dataKeys: Object.keys(data),
          accessStatsCount: data.accessStats?.length,
          userActivityCount: data.userActivity?.length,
          exerciseStatsCount: data.exerciseStats?.length,
          mealStatsCount: data.mealStats?.length
        });
        return data;
      } catch (error: any) {
        console.error('❌ [useAllAnalytics] React Query 실패:', { 
          period, 
          error: error.message,
          status: error.response?.status,
          details: error.response?.data 
        });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 10,
    retry: (failureCount, error: any) => {
      console.log('🔄 [useAllAnalytics] Retry 시도:', { 
        failureCount, 
        period,
        status: error.response?.status,
        message: error.message 
      });
      
      // 네트워크 에러나 5xx 에러인 경우만 재시도 (최대 2번)
      return failureCount < 2 && (
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNREFUSED' ||
        (error.response?.status >= 500)
      );
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log('⏱️ [useAllAnalytics] Retry 지연:', { attemptIndex, delay });
      return delay;
    },
  });
};

export const useRealtimeAnalytics = () => {
  return useQuery({
    queryKey: ['adminRealtimeAnalytics'],
    queryFn: getRealtimeAnalytics,
    staleTime: 1000 * 30, // 30초
    gcTime: 1000 * 60 * 5, // 5분
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신
  });
};

/**
 * 실시간 접속자 수 React Query Hook (기본)
 */
export const useOnlineUsers = () => {
  return useQuery({
    queryKey: ['adminOnlineUsers'],
    queryFn: getOnlineUsers,
    staleTime: 1000 * 10, // 10초
    gcTime: 1000 * 60 * 2, // 2분
    refetchInterval: 1000 * 30, // 30초마다 자동 갱신
    retry: 2,
    retryDelay: 1000, // 1초 간격으로 재시도
  });
};

/**
 * 실시간 접속자 상세 정보 React Query Hook
 */
export const useOnlineUsersDetail = () => {
  return useQuery({
    queryKey: ['adminOnlineUsersDetail'],
    queryFn: getOnlineUsersDetail,
    staleTime: 1000 * 10, // 10초
    gcTime: 1000 * 60 * 2, // 2분
    refetchInterval: 1000 * 15, // 15초마다 자동 갱신 (더 자주)
    retry: 2,
    retryDelay: 1000,
  });
};

export default {
  useHealthAnalyticsReport,
  useAIHealthInsights,
  useWeightTrendsAnalysis,
  useExercisePatternsAnalysis,
  usePersonalizedRecommendations,
  useAccessStats,
  useUserActivityStats,
  useExerciseStats,
  useMealStats,
  useAllAnalytics,
  useRealtimeAnalytics,
  useOnlineUsers,
  useOnlineUsersDetail,
  AI_SYSTEM_ROADMAP
}; 