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
    HEALTH_RECORDS: '/api/health-records',
    HEALTH_STATISTICS_HEALTH_RECORDS: '/api/health-statistics/health-records',
    EXERCISE_SESSIONS: '/api/exercise-sessions',
    MEAL_LOGS: '/api/meal-logs'
};

// 런타임 API URL 결정 함수 (완전 동적)
const getApiUrls = () => {
    const currentPort = window.location.port;
    const currentHost = window.location.hostname;
    
    // 🔧 Docker Nginx 프록시 환경 (포트 8082)
    if (currentPort === '8082') {
        console.log('🐳 Docker Nginx 프록시 환경 감지 - 통합 엔드포인트 사용');
        return {
            BASE_URL: `http://${currentHost}:8082`,
            AI_API_URL: `http://${currentHost}:8082/ai`
        };
    }
    
    // 🛠️ 로컬 개발 환경 (포트 5173, 3000 등)
    // - 환경변수가 있으면 사용, 없으면 기본값
    console.log('🛠️ 로컬 개발 환경 감지 - 직접 포트 사용');
    
    // 런타임에 환경변수 확인 (빌드 타임이 아닌)
    const coreApiUrl = (window as any).__VITE_CORE_API_URL__ || 'http://localhost:8080';
    const aiApiUrl = (window as any).__VITE_AI_API_URL__ || 'http://localhost:8001';
    
    return {
        BASE_URL: coreApiUrl,
        AI_API_URL: aiApiUrl
    };
};

// 동적 API 설정 객체 (getter 사용)
export const API_CONFIG = {
    get BASE_URL() {
        return getApiUrls().BASE_URL;
    },
    get AI_API_URL() {
        return getApiUrls().AI_API_URL;
    },
    get AI_URL() {
        return getApiUrls().AI_API_URL;
    },
    TIMEOUT: 30000,
} as const;

// 디버깅용 로그 (개발 환경에서만)
if (typeof window !== 'undefined') {
    console.log('🔗 API 설정 초기화:', {
        현재포트: window.location.port,
        현재호스트: window.location.hostname,
    });
    
    // 실제 사용될 URL 확인 (getter 호출)
    setTimeout(() => {
        console.log('🔗 최종 API 설정:', {
            BASE_URL: API_CONFIG.BASE_URL,
            AI_API_URL: API_CONFIG.AI_API_URL,
        });
    }, 100);
}

// 인증 관련 설정
export const AUTH_CONFIG = {
    TOKEN_KEY: 'access_token',  // ✅ 기존 로그인에서 사용하는 키와 통일
    USER_KEY: 'userInfo',       // ✅ 기존 사용자 정보 키와 통일
}; 