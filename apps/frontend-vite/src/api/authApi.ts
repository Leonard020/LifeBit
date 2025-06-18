import axiosInstance from '@/utils/axios';
import { setToken, setUserInfo } from '@/utils/auth';

interface LoginResponse {
  access_token: string;
  user_id: string;
  email: string;
  nickname: string;
  role: string;
  provider: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post<LoginResponse>('/api/auth/login', credentials);
    const { access_token, ...userInfo } = response.data;
    
    // 토큰 저장
    setToken(access_token);
    
    // 사용자 정보 저장
    setUserInfo({
      userId: userInfo.user_id,
      email: userInfo.email,
      nickname: userInfo.nickname,
      role: userInfo.role
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('로그인 중 오류가 발생했습니다.');
  }
}; 