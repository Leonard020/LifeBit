import axios from 'axios';
import { getToken, removeToken } from './auth';
import { CORE_API_URL } from '@/config/env';

// axios 기본 설정
const instance = axios.create({
  baseURL: CORE_API_URL,
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
    return Promise.reject(error);
  }
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 