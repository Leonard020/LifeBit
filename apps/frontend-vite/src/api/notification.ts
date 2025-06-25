import axios, { AxiosError, AxiosResponse } from 'axios';
import { getToken } from '@/utils/auth';

// 올바른 axios 인스턴스 사용
import axiosInstance from '@/utils/axios';

// [DEPRECATED] 건강 알림 관련 API는 auth.ts의 getNotifications 등으로 통합되었습니다.
// 이 파일의 healthNotificationApi 등은 더 이상 사용하지 않습니다.

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