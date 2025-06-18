import { AUTH_CONFIG } from '@/config/env';

export interface UserInfo {
  userId: string;
  email: string;
  nickname: string;
  role?: string;
}

// ✅ AUTH_CONFIG에서 토큰 키 통일 관리

// 토큰 저장
export const setToken = (token: string) => {
  if (token) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
    // 로컬 스토리지 변경 이벤트 발생
    window.dispatchEvent(new Event('storage'));
  }
};

// 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
};

// 토큰 삭제
export const removeToken = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  localStorage.removeItem('nickname');
  localStorage.removeItem('role');
  // 로컬 스토리지 변경 이벤트 발생
  window.dispatchEvent(new Event('storage'));
};

// 사용자 정보 저장
export const setUserInfo = (user: UserInfo) => {
  if (user) {
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
    // 로컬 스토리지 변경 이벤트 발생
    window.dispatchEvent(new Event('storage'));
  }
};

// 사용자 정보 가져오기
export const getUserInfo = () => {
  const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse user info:', error);
    return null;
  }
};

// 관리자 권한 확인
export const isAdmin = () => {
  const userInfo = getUserInfo();
  return userInfo && userInfo.role === 'ADMIN';
};

// 로그인 상태 확인
export const isLoggedIn = () => {
  const token = getToken();
  const userInfo = getUserInfo();
  return !!(token && userInfo);
}; 