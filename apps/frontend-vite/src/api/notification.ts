import axios, { AxiosError, AxiosResponse } from 'axios';
import { getToken } from '@/utils/auth';

// 올바른 axios 인스턴스 사용
import axiosInstance from '@/utils/axios';

// 건강 알림 관련 API
export const healthNotificationApi = {
  // 건강 상태 모니터링
  monitorHealth: async (): Promise<HealthMonitoringResult> => {
    try {
      const response: AxiosResponse<HealthMonitoringResult> = await axiosInstance.post('/api/v1/health-notifications/monitor', {}, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message: string }>;
        throw new Error(axiosError.response?.data?.message || '건강 상태 모니터링에 실패했습니다.');
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  },

  // 운동 경고 알림 생성
  createExerciseWarning: async (message: string): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await axiosInstance.post('/api/v1/health-notifications/exercise-warning', {
        message
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message: string }>;
        throw new Error(axiosError.response?.data?.message || '운동 경고 알림 생성에 실패했습니다.');
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  },

  // 영양소 경고 알림 생성
  createNutritionWarning: async (message: string): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await axiosInstance.post('/api/v1/health-notifications/nutrition-warning', {
        message
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message: string }>;
        throw new Error(axiosError.response?.data?.message || '영양소 경고 알림 생성에 실패했습니다.');
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  },

  // 수분 섭취 경고 알림 생성
  createHydrationWarning: async (message: string): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await axiosInstance.post('/api/v1/health-notifications/hydration-warning', {
        message
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message: string }>;
        throw new Error(axiosError.response?.data?.message || '수분 섭취 경고 알림 생성에 실패했습니다.');
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  },

  // 목표 달성 알림 생성
  createGoalAchievement: async (goalType: string, message: string): Promise<{ message: string }> => {
    try {
      const response: AxiosResponse<{ message: string }> = await axiosInstance.post('/api/v1/health-notifications/goal-achievement', {
        goalType,
        message
      }, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error: string; message: string }>;
        throw new Error(axiosError.response?.data?.message || '목표 달성 알림 생성에 실패했습니다.');
      }
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  }
};

// 건강 알림 타입 정의
export interface HealthMonitoringResult {
  success: boolean;
  notificationsCreated: number;
  message: string;
  error?: string;
}

export interface HealthWarningRequest {
  message: string;
}

export interface GoalAchievementRequest {
  goalType: string;
  message: string;
}

// API 응답 타입 정의
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
} 