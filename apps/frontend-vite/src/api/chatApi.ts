import { AxiosError } from 'axios';
import axiosInstance from '@/utils/axios';
import { convertTimeToMealType, hasTimeInformation } from '@/utils/mealTimeMapping';

// 대화 메시지 타입
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 요청 바디 타입 정의
interface ChatRequestBody {
  message: string;
  conversation_history: Message[];
  record_type: 'exercise' | 'diet';
  chat_step?: 'extraction' | 'validation' | 'confirmation';
  meal_time_mapping?: {
    detected_time?: string;
    mapped_meal_type?: string;
    has_time_info: boolean;
  };
}

// API 응답 타입
export interface ChatResponse {
  type: 'initial' | 'success' | 'incomplete' | 'clarification' | 'error' | 'modified' | 'confirmation';
  message: string;
  suggestions?: string[];
  missingFields?: string[];
  parsed_data?: {
    exercise?: string;
    category?: string;
    subcategory?: string;
    time_period?: string;
    weight?: number | string;
    sets?: number;
    reps?: number;
    duration_min?: number;
    calories_burned?: number;
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

// 현재 상태 데이터 타입 정의
interface ExerciseState {
  exercise?: string;
  category?: string;
  target?: string;
  sets?: number;
  reps?: number;
  duration_min?: number;
  weight?: number;
}

interface DietState {
  food_name?: string;
  amount?: string;
  meal_time?: string;
  nutrition?: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
  };
}

// 현재 데이터 타입 (any 대신 union 타입 사용)
type CurrentDataType = ExerciseState | DietState | null;

/**
 * 챗 메시지를 전송하고 응답을 반환합니다.
 * @param message - 사용자 입력 텍스트
 * @param conversationHistory - 전체 대화 기록
 * @param recordType - 'exercise' | 'diet'
 * @param chatStep - 'extraction' | 'validation' | 'confirmation'
 * @param currentData - 현재 상태 데이터 (운동 또는 식단)
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: Message[],
  recordType: 'exercise' | 'diet',
  chatStep?: 'extraction' | 'validation' | 'confirmation',
  currentData?: CurrentDataType
): Promise<ChatResponse> => {
  try {
    const body: ChatRequestBody = {
      message,
      conversation_history: conversationHistory,
      record_type: recordType,
      ...(chatStep && { chat_step: chatStep }),
    };

    // 식단 기록인 경우 시간 매핑 정보 추가
    if (recordType === 'diet') {
      const hasTime = hasTimeInformation(message);
      const mappedTime = hasTime ? convertTimeToMealType(message) : null;
      
      body.meal_time_mapping = {
        has_time_info: hasTime,
        ...(mappedTime && { 
          detected_time: message,
          mapped_meal_type: mappedTime 
        })
      };
    }

    const response = await axiosInstance.post<ChatResponse>('/api/chat', body);
    return response.data;
  } catch (error) {
    let errorMessage = '메시지 전송 중 오류가 발생했습니다.';
    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { type: 'error', message: errorMessage };
  }
};


// 운동 기록 저장 API 호출
export const saveExerciseRecord = async (exerciseData: any) => {
  try {
    const res = await axiosInstance.post('/api/note/exercise', {
      user_id: 1,
      name: exerciseData.exercise,
      weight: exerciseData.weight,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      time: `${exerciseData.duration_min}분`,
      calories_burned: exerciseData.calories_burned || 0,
      exercise_date: new Date().toISOString().split('T')[0]
    });
    return res.data;
  } catch (err) {
    console.error('❌ 운동 기록 저장 실패:', err);
    throw err;
  }
};
