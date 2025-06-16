/**
 * API 설정
 */

// API 엔드포인트
export const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    PROFILE: '/api/users/profile',
    HEALTH_LOG: '/api/health-log',
};

// API 기본 설정
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_CORE_API_URL || 'http://localhost:8080',
    TIMEOUT: 10000,
    AI_URL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001',
};

// 인증 관련 설정
export const AUTH_CONFIG = {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_info',
}; 