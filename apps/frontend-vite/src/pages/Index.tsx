import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
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
import { safeConvertMealTime } from '../utils/mealTimeConverter';
import { getUserIdFromToken, getToken } from '@/utils/auth';
import { useAuth } from '@/AuthContext';
import { searchFoodItems } from '@/api/authApi';
import { useNavigate } from 'react-router-dom';
import { createFoodItemFromGPT, type NutritionData, parseAmountToGrams } from '@/utils/nutritionUtils';



type DietData = {
  food_item_id?: number;
  foodItemId?: number;
  food_name: string;
  amount: number | string;
  meal_time?: string;
  input_source?: string;
  confidence_score?: number;
  original_audio_path?: string;
  validation_status?: string;
  validation_notes?: string;
  created_at?: string;
  log_date?: string;
  // nutrition 필드 제거: Spring Boot CRUD API 사용으로 영양성분 계산 불필요
};

type SimpleDietData = Omit<DietData, 'amount'> & { amount: string };

// 🕐 현재 시간대 판단 함수 (DB ENUM에 맞춤)
const getCurrentTimePeriod = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 8) return 'dawn';      // 새벽 4-8시
  if (hour >= 8 && hour < 12) return 'morning';   // 오전 8-12시
  if (hour >= 12 && hour < 18) return 'afternoon'; // 오후 12-18시
  if (hour >= 18 && hour < 22) return 'evening';   // 저녁 18-22시
  return 'night'; // 밤 22-4시
};

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
  const [currentMealFoods, setCurrentMealFoods] = useState<SimpleDietData[]>([]);
  const [isAddingMoreFood, setIsAddingMoreFood] = useState(false);
  const [currentMealTime, setCurrentMealTime] = useState<MealTimeType | null>(null);

  const navigate = useNavigate();

  const [hasSaved, setHasSaved] = useState(false);

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

  const handleSendMessage = async (retryCount = 0) => {
    const maxRetries = 2;
    
    if (!chatInputText.trim() || !recordType) return;

    try {
      console.log(`📤 [Index handleSendMessage] 시작 (시도: ${retryCount + 1}/${maxRetries + 1})`);
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

      // ✅ AI 응답이 JSON(객체)로 보이면 콘솔에만 출력, 사용자에겐 자연어만 노출
      let displayMessage = response.message;
      try {
        // JSON 문자열이거나 객체라면 콘솔에만 출력
        if (typeof response.message === 'string' && response.message.trim().startsWith('{') && response.message.trim().endsWith('}')) {
          console.log('[AI 응답 JSON]', response.message);
          // user_message.text가 있으면 그걸, 없으면 기본 안내
          if (response.parsed_data && response.parsed_data.food_name) {
            displayMessage = `${response.parsed_data.food_name}을(를) 드신 것으로 기록할까요?`; // 예시 프롬프트
          } else {
            displayMessage = '식단 정보를 확인해주세요.';
          }
        }
      } catch (e) {
        // 무시
      }

      // AI 응답을 히스토리에 추가 (자연어만)
      const newHistory: Message[] = [
        ...updatedHistory,
        { role: 'assistant', content: displayMessage }
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

      console.log('✅ [Index handleSendMessage] 성공');

      // 단계별 처리 로직 수정
      if (response.type === 'incomplete') {
        setChatStep('extraction');
      } else if (response.type === 'success') {
        setChatStep('confirmation');
      }
    } catch (error) {
      console.error(`❌ [Index handleSendMessage] 실패 (시도: ${retryCount + 1}):`, error);
      
      // 재시도 가능한 오류인지 확인
      const isRetryableError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network Error') ||
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('서버 연결에 실패')
      );
      
      // 재시도 횟수가 남아있고 재시도 가능한 오류인 경우
      if (retryCount < maxRetries && isRetryableError) {
        console.log(`🔄 [Index handleSendMessage] 재시도 중... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        return handleSendMessage(retryCount + 1);
      }
      
      // 최대 재시도 횟수 초과 또는 재시도 불가능한 오류
      console.log('❌ [Index handleSendMessage] 재시도 중단');
      setChatNetworkError(true);
      setChatAiFeedback({
        type: 'error',
        message: retryCount >= maxRetries ? 
          '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' : 
          '메시지 전송 중 오류가 발생했습니다.'
      });
    } finally {
      setChatIsProcessing(false);
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

  const deduplicateFoods = (foods) => {
    const seen = new Set();
    return foods.filter(food => {
      const key = `${food.food_name}|${food.amount}|${food.meal_time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleRecordSubmit = useCallback(async (type: 'exercise' | 'diet', content: string) => {
    if (!chatStructuredData) return;
    const userId = getUserIdFromToken();
    const token = getToken();
    if (!userId) {
      console.warn('[⚠️ 유저 ID 없음] 토큰에서 사용자 정보를 가져올 수 없습니다.');
      return;
    }
    if (type === 'exercise') {
      const isCardio = chatStructuredData.category === '유산소';
      const exerciseName = chatStructuredData.exercise || '운동기록';
      
      console.log('💪 [Index 운동기록] 운동명 확인:', exerciseName);
      
      try {
        // 🔍 1단계: 운동 검색 또는 자동 생성
        let exerciseCatalogId = 1; // 기본값
        
        if (exerciseName && exerciseName !== '운동기록') {
          console.log('🔍 [Index 운동기록] 운동 카탈로그 찾기/생성 시도:', exerciseName);
          
          const findOrCreateResponse = await fetch('/api/exercises/find-or-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: exerciseName,
              bodyPart: isCardio ? 'cardio' : 'muscle',
              description: `${exerciseName} 운동`
            })
          });
          
          if (findOrCreateResponse.ok) {
            const exerciseCatalog = await findOrCreateResponse.json();
            exerciseCatalogId = exerciseCatalog.exerciseCatalogId;
            console.log('✅ [Index 운동기록] 운동 카탈로그 ID 확인:', exerciseCatalogId, exerciseCatalog.name);
          } else {
            console.warn('⚠️ [Index 운동기록] 운동 카탈로그 생성 실패, 기본값 사용');
          }
        }
        
        // ✅ 2단계: Spring Boot API에 맞는 payload 형식
        const payload = {
          exercise_catalog_id: exerciseCatalogId,
          duration_minutes: chatStructuredData.duration_min ?? 30,
          calories_burned: chatStructuredData.calories_burned ?? 0,
          notes: exerciseName,
          sets: chatStructuredData.sets ?? 0,
          reps: chatStructuredData.reps ?? 0,
          weight: chatStructuredData.weight ?? 0,
          exercise_date: new Date().toISOString().split('T')[0],
          // 🔧 DB 스키마에 맞는 필수 필드들 추가
          time_period: getCurrentTimePeriod(), // 현재 시간대 자동 판단
          input_source: 'TYPING', // DB ENUM: VOICE, TYPING
          confidence_score: 1.0,  // 1.0 = 100% 확신
          validation_status: 'VALIDATED' // DB ENUM: PENDING, VALIDATED, REJECTED, NEEDS_REVIEW
        };
        console.log('💪 [Index 운동기록] Spring Boot API 저장 시작:', payload);
        
        // ✅ 3단계: 운동 세션 저장
        const response = await fetch('/api/exercise-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('운동 저장 실패');
        const result = await response.json();
        console.log('💪 [Index 운동기록] Spring Boot API 저장 성공:', result);
        toast({
          title: '기록 완료',
          description: `${exerciseName} 운동이 저장되었습니다.`
        });
      } catch (err) {
        console.error('💪 [Index 운동기록] Spring Boot API 저장 실패:', err);
        toast({
          title: '저장 오류',
          description: '운동 데이터를 저장하지 못했습니다.',
          variant: 'destructive'
        });
      }
    } else if (type === 'diet') {
      const foods = Array.isArray(chatStructuredData) ? chatStructuredData : [chatStructuredData];
      const uniqueFoods = deduplicateFoods(foods);
      console.log('Foods to save:', uniqueFoods);
      for (const dietData of uniqueFoods) {
        if (!dietData.food_name || !dietData.amount || !dietData.meal_time) {
          toast({ title: '저장 오류', description: '음식명, 섭취량, 식사시간이 필요합니다.', variant: 'destructive' });
          console.error('[식단기록] 필수 정보 부족:', dietData);
          continue;
        }
        try {
          let foodItemId = dietData.food_item_id || dietData.foodItemId;
          if (!foodItemId && dietData.food_name) {
            const searchResults = await searchFoodItems(dietData.food_name);
            if (searchResults && searchResults.length > 0) {
              foodItemId = searchResults[0].foodItemId;
            } else {
              const createdFoodItemId = await createFoodItemFromGPT(dietData.food_name);
              if (createdFoodItemId) {
                foodItemId = createdFoodItemId;
                toast({ title: "새로운 음식 추가 완료", description: `"${dietData.food_name}"이 GPT 분석으로 자동 추가되었습니다.` });
              } else {
                toast({ title: "음식 정보 생성 실패", description: `"${dietData.food_name}"의 정보를 생성할 수 없습니다.`, variant: "destructive" });
                continue;
              }
            }
          }
          const englishMealTime = safeConvertMealTime(dietData.meal_time);
          const response = await fetch('/api/diet/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              food_item_id: foodItemId,
              quantity: parseAmountToGrams(String(dietData.amount), dietData.food_name),
              meal_time: englishMealTime,
              input_source: "TYPING",
              confidence_score: dietData.confidence_score || 1.0,
              validation_status: "VALIDATED"
            })
          });
          if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
          await response.json();
        } catch (err) {
          toast({ title: '저장 오류', description: '식단 데이터를 저장하지 못했습니다.', variant: 'destructive' });
          console.error('[식단기록] Spring Boot API 저장 실패:', err);
        }
      }
      toast({ title: '기록 완료', description: '식단이 성공적으로 저장되었습니다.' });
      setHasSaved(true);
      navigate('/note', { state: { refreshDiet: true } });
    } else {
      console.warn('[기록 저장] 알 수 없는 recordType:', type, chatStructuredData);
    }
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
  }, [chatStructuredData, getUserIdFromToken, getToken, toast, navigate]);

  const { user } = useAuth();

  // Only reset hasSaved when a new chat session starts (e.g., when recordType changes)
  useEffect(() => {
    setHasSaved(false);
  }, [recordType]);

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
                message: '안녕하세요! 😊 오늘 어떤 음식을 드셨나요?\n\n언제, 무엇을, 얼마나 드셨는지 자유롭게 말씀해 주세요!\n\n예시: "아침에 계란후라이 2개랑 식빵 1개 먹었어요"\n\n📝 음식명, 섭취량, 식사시간 3가지 정보만 수집합니다.\n정보 저장이 필요하면 "저장", "기록해줘", "완료", "끝" 중 하나의 문구를 입력해 주세요.'
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
              handleSendMessage(0); // 재시도 시 카운터 초기화
            }}
            aiFeedback={chatAiFeedback}
            onSaveRecord={() => handleRecordSubmit(recordType!, chatInputText)}
            structuredData={chatStructuredData}
            conversationHistory={conversationHistory}
            currentMealFoods={currentMealFoods}
            onAddMoreFood={handleAddMoreFood}
            isAddingMoreFood={isAddingMoreFood}
            hasSaved={hasSaved}
            setHasSaved={setHasSaved}
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
