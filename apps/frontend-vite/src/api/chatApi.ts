import axios from 'axios';
import axiosInstance from '@/utils/axios';
import { removeToken } from '@/utils/auth';
import { API_CONFIG } from '@/config/env';

// AI API 전용 axios 인스턴스 생성
const aiAxiosInstance = axios.create({
  baseURL: API_CONFIG.AI_API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

interface ChatResponse {
  type: 'success' | 'incomplete' | 'clarification' | 'error' | 'initial';
  message: string;
  suggestions?: string[];
  missingFields?: string[];
  parsed_data?: {
    // 운동 기록 데이터
    exercise?: string;
    category?: string;
    subcategory?: string;
    time_period?: string;
    weight?: number | string;
    sets?: number;
    reps?: number;
    duration_min?: number;
    calories_burned?: number;
    
    // 식단 기록 데이터
    food_name?: string;
    amount?: string;
    meal_time?: string;
    nutrition?: {
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    };
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = async (
  message: string, 
  conversationHistory: Message[],
  recordType: 'exercise' | 'diet' | null = null
): Promise<ChatResponse> => {
  try {
    console.log('Sending chat message:', { message, conversationHistory, recordType });
    const response = await aiAxiosInstance.post('/api/chat', {
      message,
      conversation_history: conversationHistory,
      record_type: recordType
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
      type: 'error',
      message: error.response?.data?.message || '메시지 전송 중 오류가 발생했습니다.'
    };
  }
};

export const processUserInput = async (
  recordType: 'exercise' | 'diet',
  input: string,
  chatStep: ChatStep = 'extraction'
): Promise<ChatResponse> => {
  try {
    const response = await aiAxiosInstance.post('/api/chat', {
      message: input,
      record_type: recordType,
      chat_step: chatStep
    });

    return response.data;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}; 