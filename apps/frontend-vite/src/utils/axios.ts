import axios from 'axios';
import { getToken } from './auth';
import { API_CONFIG } from '@/config/env';

// axios 기본 설정
const instance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버가 응답을 반환한 경우
      console.error('Response error:', error.response.data);
      
      // 401 Unauthorized 에러 처리
      if (error.response.status === 401) {
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('No response received:', error.request);
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance; 