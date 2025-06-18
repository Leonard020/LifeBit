import axiosInstance from '@/utils/axios';
import { removeToken } from '@/utils/auth';

interface ChatResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

export const sendChatMessage = async (
  message: string, 
  conversationHistory: Array<{role: string; content: string}>
): Promise<ChatResponse> => {
  try {
    const response = await axiosInstance.post('/api/chat', {
      message,
      conversation_history: conversationHistory
    });
    return response.data;
  } catch (error) {
    console.error('Chat API Error:', error);
    return {
      status: 'error',
      message: '메시지 전송 중 오류가 발생했습니다.'
    };
  }
}; 