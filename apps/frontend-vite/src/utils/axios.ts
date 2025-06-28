import axios from 'axios';
import { getToken } from './auth';
import { API_CONFIG, getApiUrl } from '../config/env';

// 환경별 axios 인스턴스 생성
const createAxiosInstance = () => {
  const currentPort = window.location.port;
  const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '' || 
                      process.env.NODE_ENV === 'production';

  let baseURL: string;
  
  if (isProduction) {
    // 프로덕션: 프록시 경로 사용 (상대 경로)
    baseURL = '/api';
    console.log('🚀 [axios] 프로덕션 환경 - 프록시 경로 사용:', baseURL);
  } else {
    // 개발: 직접 URL 사용
    baseURL = API_CONFIG.BASE_URL;
    console.log('🛠️ [axios] 개발 환경 - 직접 URL 사용:', baseURL);
  }

  return axios.create({
    baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: isProduction ? true : false,  // 프로덕션에서는 쿠키 포함
  });
};

// axios 인스턴스 생성
const axiosInstance = createAxiosInstance();

// AI API용 별도 인스턴스
export const createAiAxiosInstance = () => {
  const currentPort = window.location.port;
  const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '' || 
                      process.env.NODE_ENV === 'production';

  let baseURL: string;
  
  if (isProduction) {
    // 프로덕션: AI API 프록시 경로 사용
    baseURL = '/ai-api';
    console.log('🤖 [axios-ai] 프로덕션 환경 - AI API 프록시 경로 사용:', baseURL);
  } else {
    // 개발: AI API 직접 URL 사용
    baseURL = API_CONFIG.AI_API_URL;
    console.log('🤖 [axios-ai] 개발 환경 - AI API 직접 URL 사용:', baseURL);
  }

  return axios.create({
    baseURL,
    timeout: 60000,  // AI API는 응답 시간이 길 수 있음
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: isProduction ? true : false,
  });
};

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
      tokenLength: token?.length || 0,
      환경: config.baseURL?.startsWith('/') ? '프로덕션' : '개발'
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

// 응답 인터셉터 (재시도 로직 추가)
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
      sampleData: Array.isArray(response.data) ? response.data.slice(0, 2) : response.data,
      환경: response.config.baseURL?.startsWith('/') ? '프로덕션' : '개발'
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ [axios] API Response Error:', {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      fullUrl: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      환경: error.config?.baseURL?.startsWith('/') ? '프로덕션' : '개발'
    });

    // 네트워크 오류 처리
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('🔌 서버 연결 실패. 서버가 실행 중인지 확인해주세요.');
      
      // 프로덕션 환경에서 연결 실패 시 재시도
      const currentPort = window.location.port;
      const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '';
      
      if (isProduction && !originalRequest._retry) {
        originalRequest._retry = true;
        console.log('🔄 [axios] 프로덕션 환경에서 재시도 중...');
        
        // 1초 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
        return axiosInstance(originalRequest);
      }
    } 
    // 인증 오류 처리
    else if (error.response?.status === 401) {
      console.warn('🔐 401 Unauthorized - 로그인 페이지로 리다이렉트');
      window.location.href = '/login';
    } 
    // 권한 오류 처리
    else if (error.response?.status === 403) {
      console.warn('🚫 403 Forbidden - 권한 없음 또는 토큰 문제');
    }
    // 서버 오류 처리 (5xx)
    else if (error.response?.status >= 500) {
      console.error('🚨 서버 오류 발생:', error.response.status);
      
      // 프로덕션에서 서버 오류 시 한 번 재시도
      const currentPort = window.location.port;
      const isProduction = currentPort === '80' || currentPort === '443' || currentPort === '';
      
      if (isProduction && !originalRequest._retry && originalRequest.method?.toLowerCase() === 'get') {
        originalRequest._retry = true;
        console.log('🔄 [axios] 서버 오류로 인한 재시도 중...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return axiosInstance(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 