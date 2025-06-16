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

// 로그인 API
export const login = async (data: LoginData) => {
    const response = await axios.post(API_ENDPOINTS.LOGIN, data);
    const { token, user } = response.data;
    
    // 토큰과 사용자 정보 저장
    setToken(token);
    setUserInfo(user);
    
    return response.data;
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