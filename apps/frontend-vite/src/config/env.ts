/**
 * API 설정
 */

// API 엔드포인트
export const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    PROFILE: '/api/users/profile',
    HEALTH_LOG: '/api/health-log',
    HEALTH_STATISTICS: '/api/health-statistics',
    RANKING: '/api/health-statistics/ranking',
    HEALTH_RECORDS: '/api/health-statistics/health-records',
    EXERCISE_SESSIONS: '/api/exercises/history',
    MEAL_LOGS: '/api/meals/history'
};

// API 기본 설정
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_CORE_API_URL || 'http://localhost:8080',
    AI_API_URL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001',
    TIMEOUT: 10000,
    AI_URL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001',
} as const;

// 인증 관련 설정
export const AUTH_CONFIG = {
    TOKEN_KEY: 'access_token',  // ✅ 기존 로그인에서 사용하는 키와 통일
    USER_KEY: 'userInfo',       // ✅ 기존 사용자 정보 키와 통일
}; 