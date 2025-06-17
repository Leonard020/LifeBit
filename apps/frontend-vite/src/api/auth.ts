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
<<<<<<< Updated upstream
    role: string;
=======
    role?: string;
    provider?: string;
}

// 프로필 업데이트 타입 정의
export interface ProfileUpdateData {
    nickname?: string;
    password?: string;
    // 필요한 경우 다른 필드도 추가
>>>>>>> Stashed changes
}

// 로그인 API
export const login = async (data: LoginData) => {
    try {
        const response = await axios.post(API_ENDPOINTS.LOGIN, data);
<<<<<<< Updated upstream
        const { token, userId, email, nickname, role } = response.data;
        
        if (!token || !userId || !email || !nickname || !role) {
            throw new Error('Invalid response data');
        }

        const userInfo = {
            userId,
            email,
            nickname,
            role
=======
        const {
            token,
            userId,
            email,
            nickname,
            role,
            provider
        } = response.data;

        if (!token || !userId || !email || !nickname) {
            console.error('Invalid login response:', response.data);  // ✅ 어떤 필드가 문제인지 보기 쉽게

            throw new Error('Invalid response data');
        }

        const userInfo: UserInfo = {
            userId: userId.toString(),
            email,
            nickname,
            role,
            provider,
>>>>>>> Stashed changes
        };

        // 토큰과 사용자 정보 저장
        setToken(token);
        setUserInfo(userInfo);

        return {
            access_token: token,
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
