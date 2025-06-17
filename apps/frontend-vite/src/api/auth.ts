import axios from '@/utils/axios';
import { setToken, setUserInfo, removeToken } from '@/utils/auth';
import { API_ENDPOINTS } from '@/config/env';

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
}

// 프로필 업데이트 타입 정의
export interface ProfileUpdateData {
    nickname?: string;
    password?: string;
    // 필요한 경우 다른 필드도 추가
}

// 로그인 API
export const login = async (data: LoginData) => {
    try {
        console.log('Login request data:', { email: data.email, password: '***' });
        const response = await axios.post(API_ENDPOINTS.LOGIN, {
            email: data.email,
            password: data.password
        });
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
            nickname
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
        const response = await axios.put(API_ENDPOINTS.PROFILE, profileData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
};

// 건강 통계 API
export const getHealthStatistics = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.HEALTH_STATISTICS}/${userId}?period=${period}`);
  return response.data;
};

// 랭킹 API
export const getRanking = async () => {
  const response = await axios.get(API_ENDPOINTS.RANKING);
  return response.data;
};

// 건강 기록 API
export const getHealthRecords = async (userId: string, period: string = 'month') => {
  const response = await axios.get(`${API_ENDPOINTS.HEALTH_RECORDS}/${userId}?period=${period}`);
  return response.data;
};

// 운동 세션 API
export const getExerciseSessions = async (userId: string, startDate: string, endDate: string) => {
  const response = await axios.get(`${API_ENDPOINTS.EXERCISE_SESSIONS}?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};

// 식단 기록 API
export const getMealLogs = async (userId: string, startDate: string, endDate: string) => {
  const response = await axios.get(`${API_ENDPOINTS.MEAL_LOGS}?startDate=${startDate}&endDate=${endDate}`);
  return response.data;
};
