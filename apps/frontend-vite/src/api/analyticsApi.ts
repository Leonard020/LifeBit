/**
 * 파이썬 기반 건강 데이터 분석 API 클라이언트
 * - 고급 통계 분석
 * - 전문적 차트 생성
 * - AI 기반 인사이트 제공
 */

import { API_CONFIG } from '../config/env';

const AI_API_BASE_URL = API_CONFIG.AI_API_URL || 'http://localhost:8001';

// 분석 요청 타입
export interface AnalyticsRequest {
  user_id: number;
  period: 'day' | 'week' | 'month' | 'year';
}

// 체중 분석 결과 타입
export interface WeightAnalysis {
  current_weight: number;
  average_weight: number;
  weight_std: number;
  trend_slope: number;
  trend_direction: '증가' | '감소' | '안정' | '데이터 부족';
  weight_change_7d: number;
  weight_change_30d: number;
  predicted_weights: number[];
  data_points: number;
  status: 'success' | 'no_data' | 'error';
  message?: string;
}

// BMI 분석 결과 타입
export interface BMIAnalysis {
  current_bmi: number;
  average_bmi: number;
  category: '저체중' | '정상' | '과체중' | '비만';
  trend: '증가' | '감소' | '안정';
  risk_level: '낮음' | '중간' | '높음';
  ideal_range: string;
  status: 'success' | 'no_data' | 'error';
  message?: string;
}

// 운동 분석 결과 타입
export interface ExerciseAnalysis {
  total_sessions: number;
  total_duration: number;
  total_calories: number;
  avg_duration: number;
  avg_calories: number;
  weekly_frequency: number;
  body_part_distribution: Record<string, number>;
  avg_intensity: number;
  current_streak: number;
  max_streak: number;
  status: 'success' | 'no_data' | 'error';
  message?: string;
}

// AI 인사이트 타입
export interface AIInsights {
  summary: string;
  recommendations: string[];
  achievements: string[];
  warnings: string[];
  goals: string[];
}

// 종합 분석 리포트 타입
export interface HealthAnalyticsReport {
  status: 'success' | 'error';
  generated_at: string;
  period: string;
  user_id: number;
  analysis: {
    weight: WeightAnalysis;
    bmi: BMIAnalysis;
    exercise: ExerciseAnalysis;
  };
  charts: {
    weight_chart: string;  // HTML 차트
    exercise_chart: string;  // HTML 차트
  };
  insights: AIInsights;
  data_summary: {
    health_records_count: number;
    exercise_sessions_count: number;
    analysis_period: string;
  };
  message?: string;
  error?: string;
}

// API 응답 타입
export interface AnalyticsApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  report?: T;
  analysis?: any;
  chart?: string;
  insights?: AIInsights;
  analysis_summary?: any;
}

/**
 * 종합 건강 분석 리포트 요청
 */
export const getHealthAnalyticsReport = async (
  userId: number, 
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsApiResponse<HealthAnalyticsReport>> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/py/analytics/health-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        period: period
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[ERROR] 건강 분석 리포트 요청 실패:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
};

/**
 * 체중 트렌드 분석만 요청
 */
export const getWeightTrendsAnalysis = async (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsApiResponse<WeightAnalysis>> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/py/analytics/weight-trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        period: period
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[ERROR] 체중 분석 요청 실패:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '체중 분석 요청에 실패했습니다.'
    };
  }
};

/**
 * 운동 패턴 분석만 요청
 */
export const getExercisePatternsAnalysis = async (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsApiResponse<ExerciseAnalysis>> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/py/analytics/exercise-patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        period: period
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[ERROR] 운동 분석 요청 실패:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '운동 분석 요청에 실패했습니다.'
    };
  }
};

/**
 * AI 기반 건강 인사이트 요청
 */
export const getAIHealthInsights = async (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<AnalyticsApiResponse<AIInsights>> => {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/py/analytics/ai-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        period: period
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[ERROR] AI 인사이트 요청 실패:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'AI 인사이트 요청에 실패했습니다.'
    };
  }
};

/**
 * React Query용 훅들
 */
import { useQuery } from '@tanstack/react-query';

export const useHealthAnalyticsReport = (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['healthAnalyticsReport', userId, period],
    queryFn: () => getHealthAnalyticsReport(userId, period),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useWeightTrendsAnalysis = (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['weightTrendsAnalysis', userId, period],
    queryFn: () => getWeightTrendsAnalysis(userId, period),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useExercisePatternsAnalysis = (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['exercisePatternsAnalysis', userId, period],
    queryFn: () => getExercisePatternsAnalysis(userId, period),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useAIHealthInsights = (
  userId: number,
  period: 'day' | 'week' | 'month' | 'year' = 'month',
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['aiHealthInsights', userId, period],
    queryFn: () => getAIHealthInsights(userId, period),
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // AI 인사이트는 좀 더 오래 캐시
    cacheTime: 30 * 60 * 1000, // 30분
    retry: 1, // AI 요청은 재시도 적게
  });
}; 