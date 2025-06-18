import axiosInstance from '@/utils/axios';
import { removeToken } from '@/utils/auth';

interface ChatResponse {
  status: 'success' | 'error';
  message: string;
  type: 'chat';
}

export const sendChatMessage = async (
  message: string, 
  conversationHistory: Array<{role: string, content: string}>
): Promise<ChatResponse> => {
  try {
    const response = await axiosInstance.post('/api/chat', {
      message,
      conversation_history: conversationHistory
    });
    return response.data;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 토큰이 만료되었거나 유효하지 않은 경우
      removeToken(); // 토큰 제거
      window.location.href = '/login'; // 로그인 페이지로 리다이렉트
      throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
    }
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
}; 