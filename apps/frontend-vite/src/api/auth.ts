import axios from '@/utils/axios';
import { setToken, setUserInfo, removeToken } from '@/utils/auth';
import { API_ENDPOINTS } from '@/config/env';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// 기존 인증 관련 타입들
// ============================================================================

// 로그인 데이터 타입
export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

// 회원가입 데이터 타입
export interface SignUpData {
    email: string;
    nickname: string;
    password: string;
}

// 사용자 정보 타입
export interface UserInfo {
    userId: string;
    email: string;
    nickname: string;
    role?: string;
    provider?: string;
    profileImageUrl?: string;
    height?: number;
    weight?: number;
    age?: number;
    gender?: string;
}

// 프로필 업데이트 타입 정의
export interface ProfileUpdateData {
    nickname?: string;
    password?: string;
    height?: number | null;
    weight?: number | null;
    age?: number | null;
    gender?: string;
    profileImage?: File | null;
    removeProfileImage?: boolean;
}

// ============================================================================
// 헬스 관련 타입들 (healthApi.tsx에서 이동)
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

// ============================================================================
// 기존 인증 관련 API 함수들
// ============================================================================

// 로그인 API
export const login = async (data: LoginData) => {
    try {
        console.log('[DEBUG] login() called with:', data);

        console.log('Login request data:', { email: data.email, password: '***' });
        const response = await axios.post(API_ENDPOINTS.LOGIN, {
            email: data.email,
            password: data.password
        });
        console.log('[DEBUG] login() response:', response.data);

        console.log('Login response:', response.data);
        const {
            access_token,
            user_id,
            email,
            nickname,
            role,
            provider
        } = response.data;

        if (!access_token || !user_id || !email || !nickname) {
            console.error('Invalid login response:', response.data);
            throw new Error('Invalid response data');
        }

        const userInfo: UserInfo = {
            userId: user_id.toString(),
            email,
            nickname,
            role,
            provider,
        };

        // 토큰과 사용자 정보 저장
        setToken(access_token);
        setUserInfo(userInfo);

        return {
            access_token,
            user_id,
            email,
            nickname,
            role,
            provider
        };
    } catch (error) {
        console.error('Login failed:', error);
        throw error;
    }
};

// 회원가입 API
export const signUp = async (data: SignUpData) => {
    const response = await axios.post(API_ENDPOINTS.SIGNUP, data);
    return response.data;
};

// 로그아웃 API
export const logout = () => {
    removeToken(); // 토큰과 사용자 정보만 삭제
};

// 사용자 프로필 조회 API
export const getUserProfile = async () => {
    try {
        const response = await axios.get(API_ENDPOINTS.PROFILE);
        return response.data;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        throw error;
    }
};

// 사용자 프로필 업데이트 API
export const updateUserProfile = async (profileData: ProfileUpdateData) => {
    try {
        const formData = new FormData();

        const { profileImage, ...updateRequest } = profileData;

        formData.append('updateData', new Blob([JSON.stringify(updateRequest)], { type: "application/json"}));

        if (profileImage) {
            formData.append('profileImage', profileImage);
        }
        
        const response = await axios.put(API_ENDPOINTS.PROFILE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
};

// 사용자 계정 삭제 API
export const deleteUser = async () => {
    try {
        const response = await axios.delete(API_ENDPOINTS.PROFILE);
        // On successful deletion, remove token and user info
        removeToken();
        return response.data;
    } catch (error) {
        console.error('Failed to delete user:', error);
        throw error;
    }
};

// ============================================================================
// 헬스 관련 React Query Hooks (healthApi.tsx에서 이동 + 개선)
// ============================================================================

// 건강 기록 조회 Hook
export const useHealthRecords = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['healthRecords', userId, period],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.HEALTH_RECORDS}/${userId}`, { 
        params: { period } 
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 사용자 목표 조회 Hook
export const useUserGoals = (userId: string) => {
  return useQuery({
    queryKey: ['userGoals', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/user-goals/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 지연
  });
};

// 운동 세션 조회 Hook
export const useExerciseSessions = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['exerciseSessions', userId, period],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.EXERCISE_SESSIONS}/${userId}`, { 
        params: { period } 
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 식단 기록 조회 Hook
export const useMealLogs = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['mealLogs', userId, period],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.MEAL_LOGS}/${userId}`, { 
        params: { period } 
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 지연
  });
};

// 건강 통계 조회 Hook (기존 함수를 React Query로 교체)
export const useHealthStatistics = (userId: string, period: string = 'month') => {
  return useQuery({
    queryKey: ['healthStatistics', userId, period],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINTS.HEALTH_STATISTICS}/${userId}`, { 
        params: { period } 
      });
      return response.data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
    gcTime: 30 * 60 * 1000, // 30분간 가비지 컬렉션 지연
  });
};

// 추천 정보 조회 Hook
export const useRecommendations = (userId: string) => {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      const response = await axios.get(`/api/recommendations/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 60 * 1000, // 30분간 캐시 유지
    gcTime: 60 * 60 * 1000, // 1시간간 가비지 컬렉션 지연
  });
};

// 랭킹 API (기존 유지)
export const getRanking = async () => {
  const response = await axios.get(API_ENDPOINTS.RANKING);
  return response.data;
};

// ============================================================================
// 레거시 함수들 (하위 호환성을 위해 유지, 추후 제거 예정)
// ============================================================================

// 건강 통계 API (레거시 - useHealthStatistics 사용 권장)
export const getHealthStatistics = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.HEALTH_STATISTICS}/${userId}?period=${period}`);
  return response.data;
};

// 건강 기록 API (레거시 - useHealthRecords 사용 권장)
export const getHealthRecords = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.HEALTH_RECORDS}/${userId}?period=${period}`);
  return response.data;
};

// 운동 세션 API (레거시 - useExerciseSessions 사용 권장)
export const getExerciseSessions = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.EXERCISE_SESSIONS}/${userId}?period=${period}`);
  return response.data;
};

// 식단 기록 API (레거시 - useMealLogs 사용 권장)
export const getMealLogs = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.MEAL_LOGS}/${userId}?period=${period}`);
  return response.data;
};

export const verifyPassword = async (password: string): Promise<boolean> => {
    try {
        const response = await axios.post('/api/auth/verify-password', { password });
        return response.data.valid;
    } catch (error) {
        return false;
    }
};
