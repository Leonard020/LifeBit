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
    const currentProtocol = window.location.protocol;
    
    // 🔧 프로덕션 환경 감지 (포트 80, 443, 또는 빌드된 환경)
    const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '' || 
                        process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        console.log('🚀 프로덕션 환경 감지 - Nginx 프록시 사용');
        // 프로덕션에서는 Nginx를 통해 프록시되므로 같은 도메인 사용
        const baseUrl = `${currentProtocol}//${currentHost}${currentPort ? ':' + currentPort : ''}`;
        return {
            BASE_URL: `${baseUrl}/api`,        // Core API는 /api로 프록시
            AI_API_URL: `${baseUrl}/ai-api`    // AI API는 /ai-api로 프록시
        };
    }
    
    // 🛠️ 로컬 개발 환경
    console.log('🛠️ 로컬 개발 환경 감지 - 직접 포트 사용');
    
    // 환경변수에서 URL 가져오기 (빌드 타임)
    const coreApiUrl = import.meta.env.VITE_CORE_API_URL || 'http://localhost:8080';
    const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:8001';
    
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

// 프록시 경로 설정 (프로덕션용)
export const PROXY_PATHS = {
    CORE_API: '/api',
    AI_API: '/ai-api',
    HEALTH: '/health'
} as const;

// 환경별 API 호출 헬퍼
export const getApiUrl = (endpoint: string, isAiApi: boolean = false) => {
    const currentPort = window.location.port;
    const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '' || 
                        process.env.NODE_ENV === 'production';
    
    if (isProduction) {
        // 프로덕션: 프록시 경로 사용
        const proxyPath = isAiApi ? PROXY_PATHS.AI_API : PROXY_PATHS.CORE_API;
        return `${proxyPath}${endpoint}`;
    } else {
        // 개발: 직접 URL 사용
        const baseUrl = isAiApi ? API_CONFIG.AI_API_URL : API_CONFIG.BASE_URL;
        return `${baseUrl}${endpoint}`;
    }
};

// 디버깅용 로그 (개발 환경에서만)
if (typeof window !== 'undefined') {
    const currentPort = window.location.port;
    const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '' || 
                        process.env.NODE_ENV === 'production';
    
    console.log('🔗 API 설정 초기화:', {
        환경: isProduction ? '프로덕션' : '개발',
        현재포트: currentPort,
        현재호스트: window.location.hostname,
    });
    
    // 실제 사용될 URL 확인 (getter 호출)
    setTimeout(() => {
        console.log('🔗 최종 API 설정:', {
            BASE_URL: API_CONFIG.BASE_URL,
            AI_API_URL: API_CONFIG.AI_API_URL,
            환경: isProduction ? '프로덕션' : '개발'
        });
    }, 100);
}

// 인증 관련 설정
export const AUTH_CONFIG = {
    TOKEN_KEY: 'access_token',  // ✅ 기존 로그인에서 사용하는 키와 통일
    USER_KEY: 'userInfo',       // ✅ 기존 사용자 정보 키와 통일
}; 