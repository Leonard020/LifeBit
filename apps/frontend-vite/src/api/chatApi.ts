
import axiosInstance from '@/utils/axios';
import { removeToken } from '@/utils/auth';

interface ChatResponse {
  status: 'success' | 'error';
  message: string;
  type?: string;
  parsed_data?: {
    exercise: string;
    category: string;
    target?: string;
    explanation: string;
  };
}

export const sendChatMessage = async (
  message: string, 
  conversationHistory: Array<{role: string; content: string}>
): Promise<ChatResponse> => {
  try {
    console.log('Sending chat message:', { message, conversationHistory });
    const response = await axiosInstance.post('/api/chat', {
      message,
      conversation_history: conversationHistory
    });
    console.log('API Response:', response.data);
    
    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Chat API Error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      status: 'error',
      message: error.response?.data?.message || '메시지 전송 중 오류가 발생했습니다.'
    };
  }
}; 