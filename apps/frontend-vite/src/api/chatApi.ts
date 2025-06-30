import { AxiosError } from 'axios';
import axiosInstance, { createAiAxiosInstance } from '@/utils/axios';
import { convertTimeToMealType, hasTimeInformation } from '@/utils/mealTimeMapping';
import { getToken } from '@/utils/auth';

// AI API 전용 인스턴스 생성
const aiAxiosInstance = createAiAxiosInstance();

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
  current_data?: CurrentDataType;
  meal_time_mapping?: {
    detected_time?: string;
    mapped_meal_type?: string;
    has_time_info: boolean;
  };
  user_id?: number; // user_id 추가
}

// 운동 데이터 타입
interface ExerciseData {
  exercise?: string;
  category?: string;
  subcategory?: string;
  weight?: number;
  sets?: number;
  reps?: number;
  duration_minutes?: number;
  exercise_date?: string;
}

// 식단 데이터 타입
interface DietData {
  meal_type?: string;
  food_items?: Array<{
    food_name: string;
    quantity_g: number;
    calories?: number;
  }>;
  total_calories?: number;
}

// 현재 데이터 타입 (운동 또는 식단)
type CurrentDataType = ExerciseData | DietData;

// 응답 타입
export interface ChatResponse {
  type: 'extraction' | 'validation' | 'confirmation' | 'complete' | 'error' | 'incomplete' | 'initial';
  message: string;
  data?: CurrentDataType;
  suggestions?: string[];
  missing_fields?: string[];
  next_step?: string;
  parsed_data?: any;
}

/**
 * 챗 메시지를 전송하고 응답을 반환합니다.
 * @param message - 사용자 입력 텍스트
 * @param conversationHistory - 전체 대화 기록
 * @param recordType - 'exercise' | 'diet'
 * @param chatStep - 'extraction' | 'validation' | 'confirmation'
 * @param currentData - 현재 상태 데이터 (운동 또는 식단)
 * @param userId - 사용자 ID
 * @param retryCount - 재시도 횟수 (내부 사용)
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: Message[],
  recordType: 'exercise' | 'diet',
  chatStep?: 'extraction' | 'validation' | 'confirmation',
  currentData?: CurrentDataType,
  userId?: number,
  retryCount = 0
): Promise<ChatResponse> => {
  const maxRetries = 2;
  
  try {
    console.log(`📤 [Chat API] 메시지 전송 시작 (시도: ${retryCount + 1}/${maxRetries + 1})`);
    const token = getToken();

    const body: ChatRequestBody = {
      message,
      conversation_history: conversationHistory,
      record_type: recordType,
      ...(chatStep && { chat_step: chatStep }),
      ...(currentData && { current_data: currentData }),
      ...(userId && { user_id: userId }),
    };

    // ✅ 식단 기록인 경우 시간 매핑 정보 포함
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

    // ✅ AI API 전용 인스턴스 사용 (인터셉터에서 자동으로 Authorization 헤더 추가)
    const response = await aiAxiosInstance.post<ChatResponse>('/api/py/chat', body);

    console.log('✅ [Chat API] 메시지 전송 성공');
    return response.data;
  } catch (error: unknown) {
    console.error(`❌ [Chat API] 메시지 전송 실패 (시도: ${retryCount + 1}):`, error);
    
    // 재시도 가능한 네트워크 오류인지 확인
    const isRetryableError = error instanceof AxiosError && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network Error') ||
      (error.response?.status && error.response.status >= 500)
    );
    
    // 재시도 횟수가 남아있고 재시도 가능한 오류인 경우
    if (retryCount < maxRetries && isRetryableError) {
      console.log(`🔄 [Chat API] 재시도 중... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5초 대기
      return sendChatMessage(message, conversationHistory, recordType, chatStep, currentData, userId, retryCount + 1);
    }
    
    // 최대 재시도 횟수 초과 또는 재시도 불가능한 오류
    console.log('❌ [Chat API] 재시도 중단 또는 비재시도 오류');
    let errorMessage = '메시지 전송 중 오류가 발생했습니다.';
    
    if (error instanceof AxiosError) {
      if (retryCount >= maxRetries && isRetryableError) {
        errorMessage = '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errorMessage = error.response?.data?.message || error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return { type: 'error', message: errorMessage };
  }
};

// 운동 기록 저장 API 호출
export const saveExerciseRecord = async (exerciseData: ExerciseData) => {
  try {
    const res = await axiosInstance.post('/api/py/note/exercise', {
      user_id: 1,
      name: exerciseData.exercise,
      category: exerciseData.category,
      subcategory: exerciseData.subcategory,
      weight: exerciseData.weight,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      duration_minutes: exerciseData.duration_minutes,
      exercise_date: exerciseData.exercise_date || new Date().toISOString().split('T')[0]
    });
    return res.data;
  } catch (err) {
    console.error('❌ 운동 기록 저장 실패:', err);
    throw err;
  }
};
