import axios from 'axios';
import { getToken } from './auth';
import { API_CONFIG } from '../config/env';

// axios 기본 설정
const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,  // ✅ 환경변수 우선 사용 (http://localhost:8080)
  timeout: API_CONFIG.TIMEOUT,   // ✅ 설정 파일에서 관리
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false  // CORS 설정
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    console.log('🚀 [axios] API 요청:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      params: config.params,
      data: config.data,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ [axios] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ [axios] API 응답 성공:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      dataType: typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
      hasData: !!response.data,
      sampleData: Array.isArray(response.data) ? response.data.slice(0, 2) : response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ [axios] API Response Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data
    });

    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 서버 연결 실패. 서버가 실행 중인지 확인해주세요.');
    } else if (error.response?.status === 401) {
      console.warn('🔐 401 Unauthorized - 로그인 페이지로 리다이렉트');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.warn('🚫 403 Forbidden - 권한 없음 또는 토큰 문제');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 