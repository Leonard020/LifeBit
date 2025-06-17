import axios from 'axios';
import { getToken } from './auth';
// axios 기본 설정
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',  // Core API 서버 (Spring Boot)
  timeout: 15000,  // 타임아웃 시간 증가
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false  // CORS 설정
});

// 요청 인터셉터
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    console.log('JWT Token:', token ? `${token.substring(0, 20)}...` : 'No token');
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
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('서버 연결 실패. 서버가 실행 중인지 확인해주세요.');
    } else if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 