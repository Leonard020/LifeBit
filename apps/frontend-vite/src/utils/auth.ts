import { AUTH_CONFIG } from '@/config/env';

// 토큰 관련 상수
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

// 토큰 저장
export const setToken = (token: string) => {
  localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
};

// 토큰 가져오기
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
};

// 토큰 삭제
export const removeToken = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
};

// 사용자 정보 저장
export const setUserInfo = (user: any) => {
  localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
};

// 사용자 정보 가져오기
export const getUserInfo = () => {
  const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

// 로그인 상태 확인
export const isAuthenticated = (): boolean => {
  return !!getToken();
}; 