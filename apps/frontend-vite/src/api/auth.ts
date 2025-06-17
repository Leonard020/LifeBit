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
}

// 로그인 API
export const login = async (data: LoginData) => {
    try {
        const response = await axios.post(API_ENDPOINTS.LOGIN, data);
        const { token, userId, email, nickname } = response.data;
        
        if (!token || !userId || !email || !nickname) {
            throw new Error('Invalid response data');
        }

        const userInfo: UserInfo = {
            userId,
            email,
            nickname
        };

        // 토큰과 사용자 정보 저장
        setToken(token);
        setUserInfo(userInfo);
        
        return response.data;
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
export const updateUserProfile = async (profileData: any) => {
    try {
        const response = await axios.put(API_ENDPOINTS.PROFILE, profileData);
        return response.data;
    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
}; 