import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Dumbbell, Utensils, Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage } from '../api/chatApi';
import { saveExerciseRecord } from '@/api/chatApi'; 

// Speech Recognition 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
  }
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onRecordSubmit?: (type: 'exercise' | 'diet', content: string) => void;
}

interface ExerciseState {
  exercise?: string;
  category?: string;
  target?: string;
  sets?: number;
  reps?: number;
  duration_min?: number;
  weight?: number;
}

// 식단 상태 인터페이스 추가
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

interface ChatResponse {
  status: 'success' | 'error';
  type: 'success' | 'error' | 'incomplete';
  message: string;
  parsed_data?: {
    exercise?: string;
    category?: string;
    target?: string;
    subcategory?: string;
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

// 식단 저장 함수 추가
const saveDietRecord = async (dietData: DietState) => {
  try {
    // healthApi에서 가져온 함수 사용
    const response = await fetch('/api/py/foods/find-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name: dietData.food_name,
        calories: dietData.nutrition?.calories || 0,
        carbs: dietData.nutrition?.carbs || 0,
        protein: dietData.nutrition?.protein || 0,
        fat: dietData.nutrition?.fat || 0
      })
    });

    if (!response.ok) {
      throw new Error('음식 정보 저장 실패');
    }

    const foodItem = await response.json();

    // 식단 로그 저장
    const mealResponse = await fetch('/api/py/meals/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        foodItemId: foodItem.food_item_id,
        quantity: parseFloat(dietData.amount) || 1.0,
        mealTime: dietData.meal_time || 'lunch'
      })
    });

    if (!mealResponse.ok) {
      throw new Error('식단 기록 저장 실패');
    }

    return await mealResponse.json();
  } catch (error) {
    console.error('Diet record save error:', error);
    throw error;
  }
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ onRecordSubmit }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-message',
      type: 'ai',
      content: '안녕하세요! 운동이나 식단을 기록하시려면 위의 버튼을 클릭해주세요.',
      timestamp: new Date()
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [currentRecordType, setCurrentRecordType] = useState<'exercise' | 'diet' | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<{ type: 'exercise' | 'diet', content: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'validation' | 'confirmation'>('input');
  const [validationStep, setValidationStep] = useState<string | null>(null);
  const [exerciseState, setExerciseState] = useState<ExerciseState>({});
  const [dietState, setDietState] = useState<DietState>({}); // 식단 상태 추가
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [introMessage, setIntroMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 다크모드 감지 (컴포넌트 내부로 이동)
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 마이크 권한 요청 함수
  const requestMicrophonePermission = useCallback(async () => {
    try {
      // 사용 가능한 오디오 장치 확인
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      if (audioDevices.length === 0) {
        toast({
          title: "마이크 장치 없음",
          description: "마이크가 연결되어 있지 않습니다. 마이크를 연결해주세요.",
          variant: "destructive",
        });
        return;
      }

      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // 스트림 해제
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "마이크 권한 허용됨",
        description: "이제 음성 인식을 사용할 수 있습니다.",
      });
    } catch (error) {
      console.error('Microphone permission error:', error);
      let errorMessage = "마이크 권한을 얻을 수 없습니다.";
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotFoundError':
            errorMessage = "마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.";
            break;
          case 'NotAllowedError':
            errorMessage = "마이크 사용 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.";
            break;
          case 'NotReadableError':
            errorMessage = "마이크에 접근할 수 없습니다. 다른 프로그램이 마이크를 사용 중일 수 있습니다.";
            break;
        }
      }
      
      toast({
        title: "마이크 권한 오류",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Speech Recognition 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        setInputValue(transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = "음성 인식 중 오류가 발생했습니다.";
        switch (event.error) {
          case 'no-speech':
            errorMessage = "음성이 감지되지 않았습니다. 다시 시도해주세요.";
            break;
          case 'audio-capture':
            errorMessage = "마이크에 접근할 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.";
            break;
          case 'not-allowed':
            errorMessage = "마이크 사용 권한이 거부되었습니다.";
            break;
        }
        
        toast({
          title: "음성 인식 오류",
          description: errorMessage,
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    if (type === 'user') {
      setInputValue(''); // 입력창 초기화
    }
  };


  const analyzeInput = (input: string, type: 'exercise' | 'diet') => {
    // 간단한 분석 로직 (실제로는 더 복잡한 AI 분석이 필요)
    const exerciseKeywords = ['kg', '세트', '회', '분', '운동'];
    const dietKeywords = ['개', '그램', 'g', '먹었', '섭취'];
    
    if (type === 'exercise') {
      const hasWeight = /\d+kg/i.test(input);
      const hasSets = /\d+세트/i.test(input);
      const hasReps = /\d+회/i.test(input);
      
      if (!hasWeight || !hasSets || !hasReps) {
        return {
          type: 'incomplete',
          missingFields: [
            ...(!hasWeight ? ['무게'] : []),
            ...(!hasSets ? ['세트 수'] : []),
            ...(!hasReps ? ['반복 횟수'] : [])
          ]
        };
      }
    } else {
      const hasQuantity = /\d+개|[\d.]+그램|[\d.]+g/i.test(input);
      if (!hasQuantity) {
        return {
          type: 'incomplete',
          missingFields: ['섭취량']
        };
      }
    }
    
    return { type: 'complete' };
  };

  const handleExerciseClick = () => {
    setCurrentRecordType('exercise');
    setCurrentStep('input');
    setExerciseState({});
    setValidationStep(null);
    setIsAwaitingConfirmation(false);
    setPendingRecord(null);
    addMessage('ai', "운동을 기록하시려 하시는군요! 예시로 '스쿼트 30kg 3세트 10회 했어요' 또는 '런닝머신으로 30분 뛰었어요'와 같이 입력해주세요.");
  };

  const handleDietClick = () => {
    setCurrentRecordType('diet');
    setCurrentStep('input');
    setDietState({});
    setValidationStep(null);
    setIsAwaitingConfirmation(false);
    setPendingRecord(null);
    addMessage('ai', "식단을 기록하시려 하시는군요! 예시를 들어 '아침에 바나나 1개, 계란 2개 먹었어요' 또는 '점심에 볶음밥 1인분 먹었어요'와 같이 입력해주세요.");
  };

  const handleVoiceToggle = async () => {
    console.log('[마이크] 마이크 버튼 클릭됨');
    if (!recognitionRef.current) {
      toast({
        title: "음성 인식 지원 안됨",
        description: "이 브라우저는 음성 인식을 지원하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isRecording) {
        // 마이크 권한 확인 및 요청
        await requestMicrophonePermission();
        
        setIsRecording(true);
        recognitionRef.current.start();
        toast({
          title: "음성 인식 시작",
          description: "말씀해주세요...",
        });
      } else {
        recognitionRef.current.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error('Voice toggle error:', error);
      setIsRecording(false);
    }
  };

  // 대화 기록 업데이트 함수
  const updateConversationHistory = (role: 'user' | 'assistant', content: string) => {
    setConversationHistory(prev => [
      ...prev,
      { role, content }
    ]);
  };

  // 운동 입력 처리 함수 수정 (420줄 부근)
  const handleExerciseInput = async (input: string) => {
    try {
      setIsProcessing(true);
      console.log('🏋️ Starting exercise input processing:', input);
      console.log('🔄 Current exercise state:', exerciseState);

      // 🚨 백엔드가 자동으로 단계를 판단하도록 chat_step 제거
      const response = await sendChatMessage(
        input,
        [
          ...conversationHistory,
          { role: 'assistant', content: '운동 기록을 분석하여 처리합니다.' }
        ],
        currentRecordType!,
        undefined, // ← 백엔드가 current_data를 보고 자동 판단
        exerciseState
      );

      console.log('🤖 AI Response:', response);

      if (response.type === 'success') {
        console.log('✅ Success response received');
        
        if (response.message) {
          addMessage('ai', response.message.replace(/<EOL>/g, '\n'));
          updateConversationHistory('assistant', response.message);
        }

        if (response.parsed_data) {
          console.log('📊 Parsed data:', response.parsed_data);
          
          // 운동 상태 업데이트 (기존 상태와 새 데이터 누적)
          const newExerciseState: ExerciseState = {
            ...exerciseState, // ← 기존 상태 유지
            exercise: response.parsed_data.exercise || exerciseState.exercise,
            category: response.parsed_data.category || exerciseState.category,
            target: response.parsed_data.subcategory || exerciseState.target,
            sets: response.parsed_data.sets || exerciseState.sets,
            reps: response.parsed_data.reps || exerciseState.reps,
            duration_min: response.parsed_data.duration_min || exerciseState.duration_min,
            weight: (typeof response.parsed_data.weight === 'string' 
              ? parseFloat(response.parsed_data.weight) || undefined
              : response.parsed_data.weight) || exerciseState.weight
          };
          
          console.log('🔄 New exercise state:', newExerciseState);
          setExerciseState(newExerciseState);
        }

        // 🚨 백엔드 응답 타입에 따라 단계 결정 (프론트엔드 자체 판단 제거)
        if (response.type === 'success') {
														
		  
									   
										  
																			   
										 
											  
																
				  
          // 데이터가 완성되었으면 확인 단계로
          console.log('✅ Data complete, moving to confirmation');
          setCurrentStep('confirmation');
          const confirmationMessage = formatConfirmationMessage(exerciseState);
          addMessage('ai', confirmationMessage);
          setPendingRecord({ type: 'exercise', content: JSON.stringify(exerciseState) });
          setIsAwaitingConfirmation(true);
        } else if (response.type === 'incomplete') {
          // 데이터가 부족하면 validation 단계로
          console.log('📝 Data incomplete, staying in validation');
          setCurrentStep('validation');
          // 백엔드가 이미 적절한 질문을 보냈으므로 추가 처리 불필요
        }
      } else if (response.type === 'incomplete') {
        console.log('⚠️ Incomplete response');
        // 정보가 부족한 경우
        addMessage('ai', response.message || '추가 정보가 필요합니다. 더 자세히 입력해주세요.');
        updateConversationHistory('assistant', response.message || '추가 정보가 필요합니다.');
        // 계속 입력을 받기 위해 상태 유지
      } else if (response.type === 'error') {
        console.log('❌ Error response:', response.message);
        addMessage('ai', response.message);
        updateConversationHistory('assistant', response.message);
      } else {
        console.log('❌ Unknown response type:', response.type);
        addMessage('ai', '운동 정보를 파악하지 못했습니다. 다시 입력해주세요.\n\n예시: "스쿼트 60kg 3세트 10회 했어요" 또는 "런닝머신으로 30분 뛰었어요"');
      }
    } catch (error) {
      console.error('❌ Exercise input processing error:', error);
      addMessage('ai', '죄송합니다. 운동 기록 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 부족한 운동 정보 확인 함수
  const checkMissingExerciseInfo = (exerciseState: ExerciseState): string[] => {
    const missing: string[] = [];
    
    // 운동명과 카테고리는 기본적으로 필요
    if (!exerciseState.exercise) missing.push('exercise');
    if (!exerciseState.category) missing.push('category');
    
    // 카테고리별 필수 정보 확인
    if (exerciseState.category === 'strength' || exerciseState.category === '근력') {
      // 근력 운동의 경우
      if (!exerciseState.sets) missing.push('sets');
      if (!exerciseState.reps) missing.push('reps');
      
      // 맨몸 운동이 아닌 경우 무게도 필요 (추후 is_bodyweight 필드로 판별)
      // 현재는 푸시업, 풀업, 플랭크, 크런치, 싯업은 맨몸운동으로 간주
      const bodyweightExercises = ['푸시업', '풀업', '플랭크', '크런치', '싯업', '버피'];
      const isBodyweight = bodyweightExercises.some(exercise => 
        exerciseState.exercise?.toLowerCase().includes(exercise.toLowerCase())
      );
      
      if (!isBodyweight && !exerciseState.weight) {
        missing.push('weight');
      }
    } else if (exerciseState.category === 'cardio' || exerciseState.category === '유산소') {
      // 유산소 운동의 경우
      if (!exerciseState.duration_min) missing.push('duration');
    }
    
    return missing;
  };

  // 부족한 정보에 대한 질문 생성
  const askForMissingInfo = (missingType: string, exerciseState: ExerciseState) => {
    let question = '';
    
    switch (missingType) {
      case 'weight':
        question = `${exerciseState.exercise} 운동을 몇 kg으로 하셨나요? 💪`;
        break;
      case 'sets':
        question = `${exerciseState.exercise} 운동을 몇 세트 하셨나요? 💪`;
        break;
      case 'reps':
        question = `한 세트당 몇 회씩 하셨나요? 💪`;
        break;
      case 'duration':
        question = `${exerciseState.exercise} 운동을 몇 분 동안 하셨나요? ⏱️`;
        break;
      default:
        question = '추가 정보가 필요합니다. 다시 입력해주세요.';
    }
    
    addMessage('ai', question);
    updateConversationHistory('assistant', question);
  };

  // 검증 단계 처리 함수 수정
  const handleValidationResponse = async (input: string) => {
    try {
      setIsProcessing(true);
      console.log('🔍 Validation processing:', { input, validationStep, exerciseState });

      const updatedExerciseState = { ...exerciseState };
      let processed = false;
      
      if (validationStep === 'weight') {
        const weight = parseFloat(input.match(/[\d.]+/)?.[0] || '0');
        console.log('🏋️ Extracted weight:', weight);
        
        if (weight > 0) {
          updatedExerciseState.weight = weight;
          setExerciseState(updatedExerciseState);
          processed = true;
          
          // 다음 필요한 정보 확인
          const missingInfo = checkMissingExerciseInfo(updatedExerciseState);
          console.log('❓ Next missing info:', missingInfo);
          
          if (missingInfo.length > 0) {
            setValidationStep(missingInfo[0]);
            askForMissingInfo(missingInfo[0], updatedExerciseState);
          } else {
            // 모든 정보 수집 완료, 칼로리 계산 중 메시지 표시
            addMessage('ai', '모든 정보가 수집되었습니다! 🔥 칼로리를 계산하는 중입니다...');
            
            // 칼로리 계산 후 확인 단계로
            setTimeout(() => {
              console.log('✅ All validation complete, moving to confirmation');
              setCurrentStep('confirmation');
              const confirmationMessage = formatConfirmationMessage(updatedExerciseState);
              addMessage('ai', confirmationMessage);
              setPendingRecord({ type: 'exercise', content: JSON.stringify(updatedExerciseState) });
              setIsAwaitingConfirmation(true);
            }, 1500); // 1.5초 딜레이로 계산 시뮬레이션
          }
        } else {
          addMessage('ai', '올바른 무게를 입력해주세요. (예: 60)');
        }
      } else if (validationStep === 'sets') {
        const sets = parseInt(input.match(/\d+/)?.[0] || '0');
        console.log('📊 Extracted sets:', sets);
        
        if (sets > 0) {
          updatedExerciseState.sets = sets;
          setExerciseState(updatedExerciseState);
          processed = true;
          
          // 다음 필요한 정보 확인
          const missingInfo = checkMissingExerciseInfo(updatedExerciseState);
          console.log('❓ Next missing info:', missingInfo);
          
          if (missingInfo.length > 0) {
            setValidationStep(missingInfo[0]);
            askForMissingInfo(missingInfo[0], updatedExerciseState);
          } else {
            // 모든 정보 수집 완료, 칼로리 계산 중 메시지 표시
            addMessage('ai', '모든 정보가 수집되었습니다! 🔥 칼로리를 계산하는 중입니다...');
            
            // 칼로리 계산 후 확인 단계로
            setTimeout(() => {
              console.log('✅ All validation complete, moving to confirmation');
              setCurrentStep('confirmation');
              const confirmationMessage = formatConfirmationMessage(updatedExerciseState);
              addMessage('ai', confirmationMessage);
              setPendingRecord({ type: 'exercise', content: JSON.stringify(updatedExerciseState) });
              setIsAwaitingConfirmation(true);
            }, 1500); // 1.5초 딜레이로 계산 시뮬레이션
          }
        } else {
          addMessage('ai', '올바른 세트 수를 입력해주세요. (예: 3)');
        }
      } else if (validationStep === 'reps') {
        const reps = parseInt(input.match(/\d+/)?.[0] || '0');
        console.log('📊 Extracted reps:', reps);
        
        if (reps > 0) {
          updatedExerciseState.reps = reps;
          setExerciseState(updatedExerciseState);
          processed = true;
          
          // 모든 정보 수집 완료, 칼로리 계산 중 메시지 표시
          addMessage('ai', '모든 정보가 수집되었습니다! 🔥 칼로리를 계산하는 중입니다...');
          
          // 칼로리 계산 후 확인 단계로
          setTimeout(() => {
            console.log('✅ Reps validation complete, moving to confirmation');
            setCurrentStep('confirmation');
            const confirmationMessage = formatConfirmationMessage(updatedExerciseState);
            addMessage('ai', confirmationMessage);
            setPendingRecord({ type: 'exercise', content: JSON.stringify(updatedExerciseState) });
            setIsAwaitingConfirmation(true);
          }, 1500); // 1.5초 딜레이로 계산 시뮬레이션
        } else {
          addMessage('ai', '올바른 횟수를 입력해주세요. (예: 10)');
        }
      } else if (validationStep === 'duration') {
        const duration = parseInt(input.match(/\d+/)?.[0] || '0');
        console.log('📊 Extracted duration:', duration);
        
        if (duration > 0) {
          updatedExerciseState.duration_min = duration;
          setExerciseState(updatedExerciseState);
          processed = true;
          
          // 칼로리 계산 중 메시지 표시
          addMessage('ai', '운동 시간이 기록되었습니다! 🔥 칼로리를 계산하는 중입니다...');
          
          // 칼로리 계산 후 확인 단계로
          setTimeout(() => {
            console.log('✅ Duration validation complete, moving to confirmation');
            setCurrentStep('confirmation');
            const confirmationMessage = formatConfirmationMessage(updatedExerciseState);
            addMessage('ai', confirmationMessage);
            setPendingRecord({ type: 'exercise', content: JSON.stringify(updatedExerciseState) });
            setIsAwaitingConfirmation(true);
          }, 1500); // 1.5초 딜레이로 계산 시뮬레이션
        } else {
          addMessage('ai', '올바른 시간을 입력해주세요. (예: 30)');
        }
      } else {
        console.log('❌ Unknown validation step:', validationStep);
        addMessage('ai', '알 수 없는 검증 단계입니다. 처음부터 다시 입력해주세요.');
        setCurrentStep('input');
        setValidationStep(null);
      }
      
      console.log('🔄 Validation result:', { processed, updatedExerciseState });
      
    } catch (error) {
      console.error('❌ Validation response error:', error);
      addMessage('ai', '죄송합니다. 정보 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 식단 입력 처리 함수 수정 (699줄 부근)
  const handleDietInput = async (input: string) => {
    try {
      setIsProcessing(true);

      // currentStep에 따라 올바른 chat_step 전달
      const chatStep = currentStep === 'input' ? 'extraction' :
                      currentStep === 'validation' ? 'validation' : 
                      'confirmation';

      const response = await sendChatMessage(
        input,
        [
          ...conversationHistory,
          { role: 'assistant', content: '식단 기록을 분석하여 영양소를 계산합니다.' }
        ],
        currentRecordType!,
        chatStep, // ← 동적으로 설정
        dietState
      );

      if (response.type === 'success' || response.type === 'modified') {
        if (response.message) {
          addMessage('ai', response.message.replace(/<EOL>/g, '\n'));
          updateConversationHistory('assistant', response.message);
        }

        if (response.parsed_data) {
          // 영양소가 자동 계산된 경우 즉시 확인 단계로
          if (response.parsed_data.nutrition && 
              response.parsed_data.food_name && 
              response.parsed_data.amount && 
              response.parsed_data.meal_time) {
            
            setDietState({
              food_name: response.parsed_data.food_name,
              amount: response.parsed_data.amount,
              meal_time: response.parsed_data.meal_time,
              nutrition: response.parsed_data.nutrition
            });

            setCurrentStep('confirmation');
            
            // 자동 계산된 영양소와 함께 확인 메시지 표시
            const confirmationMessage = formatDietConfirmationMessage({
              food_name: response.parsed_data.food_name,
              amount: response.parsed_data.amount,
              meal_time: response.parsed_data.meal_time,
              nutrition: response.parsed_data.nutrition
            });
            
            // 잠시 후에 확인 메시지 표시 (계산 완료 느낌)
            setTimeout(() => {
              addMessage('ai', '영양소 계산이 완료되었습니다! 🔥\n\n' + confirmationMessage);
              setPendingRecord({ type: 'diet', content: JSON.stringify(response.parsed_data) });
              setIsAwaitingConfirmation(true);
            }, 1000);
            
          } else {
            // 정보가 부족한 경우 계속 수집
            setDietState(prev => ({
              ...prev,
              ...response.parsed_data
            }));
          }
        }
      } else if (response.type === 'incomplete') {
        if (response.message) {
          addMessage('ai', response.message);
          updateConversationHistory('assistant', response.message);
        }
        
        // 부족한 정보가 있는 경우 validation 단계로
        setCurrentStep('validation');
      } else if (response.type === 'error') {
        addMessage('ai', response.message || '식단 처리 중 오류가 발생했습니다.');
        updateConversationHistory('assistant', response.message || '오류 발생');
      }
    } catch (error) {
      console.error('Diet input processing error:', error);
      addMessage('ai', '죄송합니다. 식단 기록 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 식단 확인 메시지 포맷팅 함수 개선
  const formatDietConfirmationMessage = (data: DietState): string => {
    let message = '📊 계산된 식단 정보를 확인해주세요!\n\n';
    
    message += `🍽️ **${data.food_name}**\n`;
    if (data.amount) message += `📏 섭취량: ${data.amount}\n`;
    if (data.meal_time) message += `⏰ 섭취시간: ${data.meal_time}\n\n`;
    
    if (data.nutrition) {
      message += `📊 **자동 계산된 영양 정보:**\n`;
      message += `🔥 칼로리: ${data.nutrition.calories}kcal\n`;
      message += `🍞 탄수화물: ${data.nutrition.carbs}g\n`;
      message += `🥩 단백질: ${data.nutrition.protein}g\n`;
      message += `🧈 지방: ${data.nutrition.fat}g\n\n`;
    }
    
    message += '✅ 맞으면 "네", 수정이 필요하시면 구체적으로 말씀해주세요.\n';
    message += '예) "칼로리를 200으로 바꿔줘", "양을 1개로 바꿔줘"';
    
    return message;
  };

  // 메시지 전송 처리 함수
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
  
    try {
      setIsProcessing(true);
      const userMessage = inputValue.trim();
  
      // 디버깅 로그
      console.log('🔍 Message Send Debug:', {
        userMessage,
        currentRecordType,
        currentStep,
        validationStep,
        exerciseState
      });
  
      // 대화에 사용자 메시지 추가
      addMessage('user', userMessage);
      setIntroMessage(null);
      updateConversationHistory('user', userMessage);
  
      if (currentRecordType === 'exercise') {
        console.log('🏋️ Exercise processing - Current step:', currentStep);
  
        if (currentStep === 'validation') {
          console.log('🔍 Validation step:', validationStep);
          await handleValidationResponse(userMessage);
  
                } else if (currentStep === 'confirmation') {
          console.log('✅ Confirmation step');

          const lowered = userMessage.toLowerCase();
          const isConfirmed = /^(네|예|yes|저장|저장해|저장해줘)$/i.test(lowered);

          if (isConfirmed && pendingRecord?.type === 'exercise') {
            try {
              const exerciseData = JSON.parse(pendingRecord.content);
              
              // Index.tsx의 handleRecordSubmit 콜백 호출
              if (onRecordSubmit) {
                onRecordSubmit('exercise', JSON.stringify(exerciseData));
              }
  
              addMessage('ai', '운동 기록을 저장했어요! 수고하셨습니다 💪');
              updateConversationHistory('assistant', '운동 기록을 저장했어요!');
  
              // 상태 초기화
              setExerciseState({});
              setPendingRecord(null);
              setIsAwaitingConfirmation(false);
              setCurrentStep('input');
            } catch (err) {
              console.error('❌ 저장 실패:', err);
              addMessage('ai', '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
            return; // 저장 완료 후 종료
          }
  
          // "아니오" 등 일반 확인 응답 처리
          await handleConfirmation(isConfirmed);
  
        } else {
          console.log('📝 Initial exercise input processing');
          await handleExerciseInput(userMessage);
        }
  
      } else if (currentRecordType === 'diet') {
        console.log('🍽️ Diet processing - Current step:', currentStep);
  
        if (currentStep === 'confirmation') {
          const isConfirmed = /^(네|예|yes)/i.test(userMessage.toLowerCase());
          await handleConfirmation(isConfirmed);
        } else {
          await handleDietInput(userMessage);
        }
  
      } else {
        // 일반 챗 처리
        console.log('💬 General chat processing');
        const response = await sendChatMessage(
          userMessage,
          conversationHistory,
          'exercise',
          'extraction',
          {}
        );
  
        if (response && response.message) {
          addMessage('ai', response.message);
          updateConversationHistory('assistant', response.message);
        } else {
          addMessage('ai', '죄송합니다. 응답을 처리할 수 없습니다. 다시 시도해주세요.');
        }
      }
  
    } catch (error) {
      console.error('❌ Message processing error:', error);
      toast({
        title: '처리 오류',
        description: '메시지 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
      addMessage('ai', '죄송합니다. 메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
      setInputValue('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // 입력 텍스트가 있는지 확인
  const hasInputText = inputValue.trim().length > 0;

  // 확인 메시지 포맷팅 함수 추가
  const formatConfirmationMessage = (data: ExerciseState): string => {
    let message = '운동 기록이 완료되었습니다! 🏆\n\n';
    
    // 실제 칼로리 계산 함수 (백엔드와 동일한 로직)
    const calculateCalories = (exerciseData: ExerciseState): number => {
      try {
        const category = exerciseData.category?.toLowerCase() || '';
        const exercise = exerciseData.exercise?.toLowerCase() || '';
        
        if (category === 'cardio' || category === '유산소') {
          // 유산소 운동 칼로리 계산
          const duration = exerciseData.duration_min || 0;
          if (!duration) return 0;
          
          // 운동별 칼로리 계수
          if (['달리기', '조깅', 'running'].some(keyword => exercise.includes(keyword))) {
            return duration * 11;
          } else if (['걷기', '워킹', 'walking'].some(keyword => exercise.includes(keyword))) {
            return duration * 5;
          } else if (['수영', 'swimming'].some(keyword => exercise.includes(keyword))) {
            return duration * 9;
          } else if (['자전거', 'cycling', '사이클'].some(keyword => exercise.includes(keyword))) {
            return duration * 7;
          } else {
            return duration * 8; // 기타 유산소
          }
        } else if (category === 'strength' || category === '근력') {
          // 근력 운동 칼로리 계산
          const sets = exerciseData.sets || 0;
          const reps = exerciseData.reps || 0;
          const weight = exerciseData.weight || 0;
          const bodyPart = exerciseData.target?.toLowerCase() || '';
          
          if (!sets || !reps) return 0;
          
          // 맨몸 운동 판별
          const bodyweightExercises = ['푸시업', '풀업', '플랭크', '크런치', '싯업', '버피'];
          const isBodyweight = bodyweightExercises.some(bwExercise => 
            exercise.includes(bwExercise.toLowerCase())
          );
          
          if (isBodyweight) {
            // 맨몸 운동: (세트 × 횟수 × 체중70kg기준 × 0.03)
            return Math.round(sets * reps * 70 * 0.03);
          } else {
            // 기구/중량 운동: (무게 × 세트 × 횟수 × 0.045) + 운동강도계수
            if (!weight) return 0;
            
            const baseCalories = weight * sets * reps * 0.045;
            
            // 운동 부위별 계수 적용
            let multiplier = 1.0;
            if (['가슴', '등', '하체', 'chest', 'back', 'legs'].includes(bodyPart)) {
              multiplier = 1.2; // 대근육
            } else if (['어깨', '팔', 'shoulders', 'arms'].includes(bodyPart)) {
              multiplier = 1.0; // 소근육
            } else if (bodyPart.includes('복근') || bodyPart.includes('abs')) {
              multiplier = 0.8; // 코어
            }
            
            return Math.round(baseCalories * multiplier);
          }
        }
        
        return 0;
      } catch (error) {
        console.error('칼로리 계산 오류:', error);
        return 0;
      }
    };

    // 현재 시간 기준 시간대 자동 설정
    const getCurrentTimePeriod = (): string => {
      const currentHour = new Date().getHours();
      
      if (currentHour >= 6 && currentHour < 12) {
        return "오전";
      } else if (currentHour >= 12 && currentHour < 18) {
        return "오후";
      } else if (currentHour >= 18 && currentHour < 24) {
        return "저녁";
      } else {
        return "새벽";
      }
    };

    // 실제 칼로리 계산
    const calculatedCalories = calculateCalories(data);
    const timePeriod = getCurrentTimePeriod();
    
    if (data.category === 'cardio' || data.category === '유산소') {
      // 유산소 운동
      message += `✅ 운동명: ${data.exercise}\n`;
      message += `🏃 분류: 유산소\n`;
      message += `⏰ 시간대: ${timePeriod} (자동설정)\n`;
      message += `⏱️ 운동시간: ${data.duration_min}분\n`;
      message += `🔥 소모 칼로리: ${calculatedCalories}kcal\n\n`;
    } else {
      // 근력 운동
      const bodyweightExercises = ['푸시업', '풀업', '플랭크', '크런치', '싯업', '버피'];
      const isBodyweight = bodyweightExercises.some(exercise => 
        data.exercise?.toLowerCase().includes(exercise.toLowerCase())
      );
      
      message += `✅ 운동명: ${data.exercise}\n`;
      message += `💪 분류: 근력운동 (${getBodyPartKorean(data.target || '')}${isBodyweight ? ', 맨몸' : ''})\n`;
      message += `⏰ 시간대: ${timePeriod} (자동설정)\n`;
      
      if (!isBodyweight && data.weight) {
        message += `🏋️ 무게: ${data.weight}kg\n`;
      }
      
      message += `🔢 세트: ${data.sets}세트\n`;
      message += `🔄 횟수: ${data.reps}회\n`;
      message += `🔥 소모 칼로리: ${calculatedCalories}kcal\n\n`;
    }
    
    message += '맞으면 "네", 수정이 필요하면 "아니오"라고 해주세요!';
    
    return message;
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (confirmed && pendingRecord) {
      try {
        if (pendingRecord.type === 'exercise') {
          const exerciseData = JSON.parse(pendingRecord.content);
          // TODO: 운동 저장 API 호출 필요
          console.log('Exercise data to save:', exerciseData);
          addMessage('ai', '운동 기록이 저장되었습니다! 다른 운동을 기록하시겠습니까?');
          setExerciseState({});
        } else if (pendingRecord.type === 'diet') {
          const dietData = JSON.parse(pendingRecord.content);
          await saveDietRecord(dietData);
          addMessage('ai', '식단 기록이 저장되었습니다! 다른 식단을 기록하시겠습니까?');
          setDietState({});
        }
        
        setValidationStep(null);
        setIsAwaitingConfirmation(false);
        setPendingRecord(null);
        setCurrentStep('input');
      } catch (error) {
        console.error('Save error:', error);
        addMessage('ai', '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } else {
      addMessage('ai', '기록을 취소했습니다. 다시 입력해주세요.');
      setExerciseState({});
      setDietState({});
      setValidationStep(null);
      setIsAwaitingConfirmation(false);
      setPendingRecord(null);
      setCurrentStep('input');
    }
  };

  // 운동 부위 한글 변환
  const getBodyPartKorean = (bodyPart: string) => {
    const bodyPartMap: { [key: string]: string } = {
      chest: "가슴",
      back: "등",
      legs: "하체",
      shoulders: "어깨",
      arms: "팔",
      abs: "복근"
    };
    return bodyPartMap[bodyPart] || bodyPart;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      {/* 뱃지 섹션 */}
      <div className="flex gap-3 mb-6 justify-center">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2 text-sm"
          onClick={handleExerciseClick}
        >
          <Dumbbell className="w-4 h-4 mr-2" />
          운동 기록
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2 text-sm"
          onClick={handleDietClick}
        >
          <Utensils className="w-4 h-4 mr-2" />
          식단 기록
        </Badge>
      </div>

      {/* 채팅 메시지 영역 */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="gradient-bg w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-2xl">L</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">LifeBit AI와 대화하세요</h3>
              <p className="text-sm">운동 기록이나 식단 기록을 위해 위의 뱃지를 클릭해주세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
            {/* 전체 메시지 리스트를 순회하면서 렌더링 */}
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {/* 사용자 메시지면 오른쪽, AI 메시지면 왼쪽 */}
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* 말풍선 내부: 아바타 + 메시지내용*/}

                    {/* 아바타 영역 */}
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      {/* AI일 경우 AI 아이콘, 사용자는 "나" 표시 */}
                      {message.type === 'ai' ? (
                        <div className="w-full h-full gradient-bg rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          나
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`space-y-1 ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className="rounded-lg px-3 py-2"
                        style={{
                          background: '#f7f7fa',
                          border: '1px solid #eee',
                        }}
                      >
                        <p style={{ color: '#222', fontWeight: 600 }}>
                          테스트용 텍스트입니다. 이 문장이 보이면 message.content에 문제가 있습니다.
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        {/* 입력 영역 */}
        <div className="border-t p-4">
          <div className="flex space-x-2 items-end">
            <Input
              ref={inputRef}
              placeholder="메시지를 입력하세요..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isProcessing}
            />
            
            {/* 동적 버튼 전환 */}
            {!hasInputText ? (
              // 텍스트가 없을 때: 마이크 버튼
              <>
                <span style={{ color: 'red', fontWeight: 'bold' }}>마이크버튼</span>
              <Button
                size="icon"
                variant={isRecording ? 'default' : 'ghost'}
                  className={`$
                  isRecording 
                    ? 'gradient-bg text-white animate-pulse' 
                    : 'hover:bg-gradient-to-br hover:from-teal-400 hover:to-blue-500 hover:text-white'
                }`}
                  onClick={() => {
                    console.log('[마이크] 버튼 onClick 직접 호출됨');
                    handleVoiceToggle();
                  }}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              </>
            ) : (
              // 텍스트가 있을 때: 전송 버튼
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="gradient-bg hover:opacity-90 transition-opacity"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

