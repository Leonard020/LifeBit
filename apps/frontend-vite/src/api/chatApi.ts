import axiosInstance from '@/utils/axios';

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
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
}; 