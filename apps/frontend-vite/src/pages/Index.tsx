import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Heart } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { sendChatMessage, Message, ChatResponse } from '@/api/chatApi';
import {
  convertTimeToMealType,
  hasTimeInformation,
  getCurrentMealType,
  getMealTimeDescription,
  type MealTimeType
} from '@/utils/mealTimeMapping';
import { getUserIdFromToken, getTokenFromStorage } from '@/utils/auth'; // 또는 정확한 경로
import { useAuth } from '@/AuthContext';
import { searchFoodItems } from '@/api/authApi'; // 실제 경로에 맞게 import
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { toast } = useToast();
  const [recordType, setRecordType] = useState<'exercise' | 'diet' | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [chatIsRecording, setChatIsRecording] = useState(false);
  const [chatIsProcessing, setChatIsProcessing] = useState(false);
  const [chatNetworkError, setChatNetworkError] = useState(false);
  const [chatAiFeedback, setChatAiFeedback] = useState<ChatResponse | null>(null);
  const [chatStructuredData, setChatStructuredData] = useState<ChatResponse['parsed_data'] | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [chatStep, setChatStep] = useState<'extraction' | 'validation' | 'confirmation'>('extraction');

  // 식단 기록용 추가 상태들
  const [currentMealFoods, setCurrentMealFoods] = useState<Array<any>>([]);
  const [isAddingMoreFood, setIsAddingMoreFood] = useState(false);
  const [currentMealTime, setCurrentMealTime] = useState<MealTimeType | null>(null);

  const navigate = useNavigate();

  /**
   * 식단 데이터의 완성도를 검증하는 함수
   */
  const validateDietData = (data: ChatResponse['parsed_data']): { isComplete: boolean; missingInfo: string[] } => {
    const missing: string[] = [];

    if (!data?.food_name) {
      missing.push('음식명');
    }

    if (!data?.amount) {
      missing.push('섭취량');
    }

    if (!data?.meal_time) {
      missing.push('섭취시간');
    }

    return {
      isComplete: missing.length === 0,
      missingInfo: missing
    };
  };

  /**
   * 사용자 입력에서 시간 정보를 추출하고 식사 카테고리로 변환
   */
  const processMealTime = (userInput: string, currentMealTime?: string): { mealTime: MealTimeType; needsTimeConfirmation: boolean } => {
    // 이미 유효한 식사 카테고리가 있는 경우
    if (currentMealTime && ['아침', '점심', '저녁', '야식', '간식'].includes(currentMealTime)) {
      return { mealTime: currentMealTime as MealTimeType, needsTimeConfirmation: false };
    }

    // 사용자 입력에서 시간 정보 추출
    if (hasTimeInformation(userInput)) {
      const convertedTime = convertTimeToMealType(userInput);
      if (convertedTime) {
        return { mealTime: convertedTime, needsTimeConfirmation: false };
      }
    }

    // 시간 정보가 없으면 현재 시간 기준으로 추천
    const currentMeal = getCurrentMealType();
    return { mealTime: currentMeal, needsTimeConfirmation: true };
  };

  /**
   * 식단 확인 메시지를 일관된 스타일로 생성
   */
  const generateDietConfirmationMessage = (data: ChatResponse['parsed_data']): string => {
    if (!data?.food_name) return '식단 정보를 확인해주세요.';

    const foodName = data.food_name;
    const amount = data.amount || '적당량';
    const mealTime = data.meal_time || '식사';

    return `${foodName} ${amount}을(를) ${mealTime}에 드신 것이 맞나요? 영양 정보를 확인해보세요! 🍽️`;
  };

  const handleDummySend = () => {
    console.log('🧪 Index에서 onSendMessage 실행됨');
    // 최소한의 테스트 메시지 → 나중에 자동저장 로직이 완성되면 제거 가능
  };

  const handleSendMessage = async () => {
    if (!chatInputText.trim() || !recordType) return;

    try {
      setChatIsProcessing(true);
      setChatNetworkError(false);

      // 기존 히스토리에 사용자 메시지 추가
      const updatedHistory: Message[] = [
        ...conversationHistory,
        { role: 'user', content: chatInputText }
      ];

      // 백엔드에 메시지 전송
      const response = await sendChatMessage(
        chatInputText,
        updatedHistory,
        recordType,
        chatStep
      );

      // AI 응답을 히스토리에 추가 (백엔드 메시지 그대로 사용)
      const newHistory: Message[] = [
        ...updatedHistory,
        { role: 'assistant', content: response.message }
      ];
      setConversationHistory(newHistory);
      setChatAiFeedback(response);

      // 파싱된 데이터가 있는 경우 처리
      if (response.parsed_data) {
        setChatStructuredData(response.parsed_data);

        if (recordType === 'diet' && response.parsed_data.meal_time) {
          setCurrentMealTime(response.parsed_data.meal_time as MealTimeType);
        }
      }

      // 단계별 처리 로직 수정
      if (response.type === 'incomplete' || response.missingFields?.length) {
        // 정보가 누락된 경우: 검증 → 확인 → 저장
        setChatStep('validation');
      } else if (response.type === 'success' || response.type === 'confirmation') {
        // 완벽한 정보 제공 또는 확인 단계: 확인 → 저장
        setChatStep('confirmation');
      }

      // ✅ 저장 키워드가 포함된 경우 자동 저장 실행
      const saveKeywords = /저장해줘|기록해줘|완료|끝|등록해줘|저장|기록|등록/;
      if (saveKeywords.test(chatInputText.toLowerCase())) {
        console.log('[자동 저장 트리거] 저장 키워드 감지, handleRecordSubmit 실행');
        await handleRecordSubmit(recordType, chatInputText);
      }

    } catch (error) {
      console.error('Failed to process message:', error);
      setChatNetworkError(true);
      toast({
        title: '오류 발생',
        description: '메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive'
      });
    } finally {
      setChatIsProcessing(false);
      setChatInputText('');
    }
  };

  /**
   * 음식 추가 기능
   */
  const handleAddMoreFood = () => {
    if (chatStructuredData && chatStructuredData.food_name && chatStructuredData.amount) {
      // 현재 음식을 리스트에 추가 (타입 변환)
      const foodToAdd = {
        food_name: chatStructuredData.food_name,
        amount: chatStructuredData.amount,
        meal_time: chatStructuredData.meal_time,
        nutrition: chatStructuredData.nutrition
      };
      
      setCurrentMealFoods(prev => [...prev, foodToAdd]);
      setChatStructuredData(null);
      setIsAddingMoreFood(true);
      setChatStep('extraction');

      // 추가 음식 입력 안내 메시지
      const addFoodMessage = `좋아요! ${currentMealTime} 식사에 추가로 드신 음식이 있나요? 🍽️\n\n현재 기록된 음식:\n${currentMealFoods.map((food, idx) => `${idx + 1}. ${food.food_name} ${food.amount}`).join('\n')}\n\n추가 음식을 입력하거나 "완료"라고 말씀해 주세요!`;

      const newHistory: Message[] = [
        ...conversationHistory,
        { role: 'assistant', content: addFoodMessage }
      ];
      setConversationHistory(newHistory);
      setChatAiFeedback({ type: 'initial', message: addFoodMessage });
    }
  };

  const handleRecordSubmit = async (type: 'exercise' | 'diet', content: string) => {
    if (!chatStructuredData) return;
    const userId = getUserIdFromToken();
    const token = getTokenFromStorage();

    if (!userId) {
      console.warn('[⚠️ 유저 ID 없음] 토큰에서 사용자 정보를 가져올 수 없습니다.');
      return;
    }

    if (type === 'exercise') {
      const isCardio = chatStructuredData.category === '유산소';
      const payload = {
        user_id: Number(userId),
        name: chatStructuredData.exercise || '운동기록',
        weight: isCardio ? null : (chatStructuredData.weight ?? 0),
        sets: isCardio ? null : (chatStructuredData.sets ?? 0),
        reps: isCardio ? null : (chatStructuredData.reps ?? 0),
        duration_minutes: chatStructuredData.duration_min ?? 0,
        calories_burned: chatStructuredData.calories_burned ?? 0,
        exercise_date: new Date().toISOString().split('T')[0]
      };
      console.log('[운동기록 저장] payload:', payload);
      try {
        const response = await fetch('/api/py/note/exercise', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('운동 저장 실패');
        console.log('[운동기록 저장 성공]', await response.json());
        toast({
          title: '기록 완료',
          description: '운동 기록이 저장되었습니다.'
        });
      } catch (err) {
        console.error('[운동기록 저장 실패]', err);
        toast({
          title: '저장 오류',
          description: '운동 데이터를 저장하지 못했습니다.',
          variant: 'destructive'
        });
      }
    } else if (type === 'diet') {
      type Nutrition = {
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
        serving_size?: number;
        carbohydrates?: number;
      };
      type DietData = {
        food_item_id?: number;
        foodItemId?: number;
        food_name?: string;
        amount?: number | string;
        meal_time?: string;
        input_source?: string;
        confidence_score?: number;
        original_audio_path?: string;
        validation_status?: string;
        validation_notes?: string;
        created_at?: string;
        log_date?: string;
        nutrition?: Nutrition;
      };
      const dietDataRaw: unknown = chatStructuredData;
      const dietData: DietData = dietDataRaw as DietData;
      let foodItemId: number | undefined = dietData.food_item_id || dietData.foodItemId;
      if (!foodItemId && dietData.food_name) {
        try {
          const searchResults = await searchFoodItems(dietData.food_name);
          foodItemId = searchResults[0]?.foodItemId;
          console.log('[식단기록] food_item_id 검색 결과:', searchResults);
        } catch (err) {
          console.error('[식단기록] food_name으로 food_item_id 검색 실패', err);
        }
      }
      // food_item_id가 없어도 저장 요청을 보냄 (food_name, nutrition 포함)
      if (!foodItemId) {
        console.warn('[식단기록] food_item_id 없이 저장 요청 (자동 등록 시도)');
      }
      // MealInput에 맞는 payload 생성
      function mapMealTimeToEnum(mealTime: string) {
        switch (mealTime) {
          case '아침': return 'breakfast';
          case '점심': return 'lunch';
          case '저녁': return 'dinner';
          case '간식': return 'snack';
          case '야식': return 'snack'; // 임시 매핑
          default: return 'snack';
        }
      }
      function getKSTDateString() {
        const now = new Date();
        now.setHours(now.getHours() + 9); // KST 보정
        return now.toISOString().slice(0, 10);
      }
      function normalizeNutrition(nutrition: Partial<Nutrition>): Nutrition | undefined {
        if (!nutrition) return undefined;
        return {
          calories: nutrition.calories ?? 0,
          carbs: nutrition.carbohydrates ?? nutrition.carbs ?? 0,
          protein: nutrition.protein ?? 0,
          fat: nutrition.fat ?? 0,
          serving_size: nutrition.serving_size,
          carbohydrates: nutrition.carbohydrates,
        };
      }
      // [이중체크] 섭취량 단위 환산 함수 추가
      async function convertAmountToGram(amount: number | string, foodName: string, foodItemId?: number): Promise<number> {
        // 1. foodItemId가 있으면 DB에서 serving_size 조회
        let servingSize = 100;
        if (foodItemId) {
          const searchResults = await searchFoodItems(foodName);
          if (searchResults && searchResults.length > 0) {
            servingSize = searchResults[0].servingSize || 100;
          }
        } else if (dietData.nutrition && dietData.nutrition.serving_size) {
          servingSize = dietData.nutrition.serving_size;
        } else {
          // 계란 등 일부 음식은 하드코딩 (예: 계란 1개=50g)
          if (foodName.includes('계란')) servingSize = 50;
        }
        // 2. amount가 "3개" 등 문자열이면 숫자만 추출
        let num = 1;
        if (typeof amount === 'string') {
          const match = amount.match(/\d+(\.\d+)?/);
          if (match) num = parseFloat(match[0]);
        } else {
          num = Number(amount);
        }
        // 3. "개" 단위면 개수*servingSize, "g" 단위면 그대로, 그 외는 기본 servingSize 곱
        if (typeof amount === 'string' && amount.includes('개')) {
          return num * servingSize;
        } else if (typeof amount === 'string' && amount.includes('g')) {
          return num;
        } else {
          return num * servingSize;
        }
      }
      // [이중체크] nutrition 환산 함수
      function calcNutritionByGram(nutrition: Nutrition | undefined, gram: number, servingSize: number = 100): Nutrition | undefined {
        if (!nutrition) return undefined;
        const baseServing = nutrition.serving_size || servingSize || 100;
        const ratio = gram / baseServing;
        return {
          calories: Math.round((nutrition.calories || 0) * ratio * 10) / 10,
          carbs: Math.round((nutrition.carbs || 0) * ratio * 10) / 10,
          protein: Math.round((nutrition.protein || 0) * ratio * 10) / 10,
          fat: Math.round((nutrition.fat || 0) * ratio * 10) / 10,
          serving_size: gram,
          carbohydrates: nutrition.carbohydrates !== undefined ? Math.round((nutrition.carbohydrates || 0) * ratio * 10) / 10 : undefined,
        };
      }
      // [이중체크] 실제 환산 적용
      const gramAmount = await convertAmountToGram(dietData.amount, dietData.food_name || '', foodItemId);
      const normalizedNutrition = normalizeNutrition(dietData.nutrition);
      const nutritionByGram = calcNutritionByGram(normalizedNutrition, gramAmount, normalizedNutrition?.serving_size);
      const payload = {
        user_id: Number(userId),
        food_item_id: foodItemId ? Number(foodItemId) : undefined,
        quantity: gramAmount, // g 단위로 환산
        log_date: dietData.log_date || getKSTDateString(),
        meal_time: mapMealTimeToEnum(dietData.meal_time),
        food_name: dietData.food_name,
        nutrition: nutritionByGram,
      };
      console.log('[식단기록 저장] payload:', payload);
      try {
        const response = await fetch('/api/py/note/diet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('식단 저장 실패');
        console.log('[식단기록 저장 성공]', await response.json());
        toast({
          title: '기록 완료',
          description: '식단 기록이 저장되었습니다.'
        });
        navigate('/note');
      } catch (err) {
        console.error('[식단기록 저장 실패]', err);
        toast({
          title: '저장 오류',
          description: '식단 데이터를 저장하지 못했습니다.',
          variant: 'destructive'
        });
      }
    } else {
      console.warn('[기록 저장] 알 수 없는 recordType:', type, chatStructuredData);
    }

    // 초기화
    setChatInputText('');
    setChatAiFeedback(null);
    setChatStructuredData(null);
    setShowChat(false);
    setRecordType(null);
    setConversationHistory([]);
    setChatStep('extraction');
    setCurrentMealFoods([]);
    setIsAddingMoreFood(false);
    setCurrentMealTime(null);
  };

  const { user } = useAuth();


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-4 text-foreground">
            AI와 함께하는 건강 관리
          </h1>
          <p className="text-muted-foreground">
            운동과 식단을 간편하게 기록하고 맞춤형 피드백을 받아보세요
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={recordType === 'exercise' ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setRecordType('exercise');
              setShowChat(true);
              setChatInputText('');
              setChatStructuredData(null);
              setConversationHistory([]);
              setChatAiFeedback({ type: 'initial', message: '안녕하세요! 💪 오늘 어떤 운동을 하셨나요?\n\n운동 이름, 무게, 세트수, 회수, 운동시간을 알려주세요!\n\n예시:\n"조깅 40분 동안 했어요"\n"벤치프레스 30kg 10회 3세트 했어요"' });
              setChatStep('extraction');
            }}
            className={`flex items-center gap-2 ${recordType === 'exercise' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
              }`}
          >
            <Activity className="h-5 w-5" />
            운동 기록
          </Button>
          <Button
            variant={recordType === 'diet' ? 'default' : 'outline'}
            size="lg"
            onClick={() => {
              setRecordType('diet');
              setShowChat(true);
              setChatInputText('');
              setChatStructuredData(null);
              setConversationHistory([]);
              setCurrentMealFoods([]);
              setIsAddingMoreFood(false);
              setCurrentMealTime(null);
              setChatAiFeedback({
                type: 'initial',
                message: '안녕하세요! 😊 오늘 어떤 음식을 드셨나요?\n\n언제, 무엇을, 얼마나 드셨는지 자유롭게 말씀해 주세요!\n\n예시: "아침에 계란 2개랑 토스트 1개 먹었어요"'
              });
              setChatStep('extraction');
            }}
            className={`flex items-center gap-2 ${recordType === 'diet' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
              }`}
          >
            <Heart className="h-5 w-5" />
            식단 기록
          </Button>
        </div>

        {showChat && recordType ? (
          <ChatInterface
            recordType={recordType}
            inputText={chatInputText}
            setInputText={setChatInputText}
            isRecording={chatIsRecording}
            isProcessing={chatIsProcessing}
            networkError={chatNetworkError}
            onVoiceToggle={() => setChatIsRecording(!chatIsRecording)}

            // 👇 handleSendMessage 안쓰도록 더미 함수 연결
            onSendMessage={handleSendMessage}

            onRetry={() => {
              setChatNetworkError(false);
              handleSendMessage(); // 오류 재시도 시에도 전송함
            }}
            aiFeedback={chatAiFeedback}
            onSaveRecord={() => handleRecordSubmit(recordType!, chatInputText)}
            structuredData={chatStructuredData}
            conversationHistory={conversationHistory}
            currentMealFoods={currentMealFoods}
            onAddMoreFood={handleAddMoreFood}
            isAddingMoreFood={isAddingMoreFood}
          />
        ) : (
          <div className="text-center text-gray-600 p-8 bg-gray-50 rounded-lg">
            <div className="text-lg font-medium mb-2">운동 또는 식단 기록을 시작하려면</div>
            <div>상단의 '운동 기록' 또는 '식단 기록' 버튼을 클릭해주세요.</div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
