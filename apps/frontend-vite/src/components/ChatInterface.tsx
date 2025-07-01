import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, Loader2, AlertCircle, Utensils, Clock, Zap, Plus, Check } from 'lucide-react';
import { Message, ChatResponse } from '@/api/chatApi';
import { getMealTimeDescription, type MealTimeType } from '@/utils/mealTimeMapping';

interface ChatInterfaceProps {
  recordType: 'exercise' | 'diet';
  inputText: string;
  setInputText: (text: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  networkError: boolean;
  onVoiceToggle: () => void;
  onSendMessage: (transcript?: string) => void;
  onRetry: () => void;
  aiFeedback: ChatResponse | null;
  onSaveRecord: () => void;
  structuredData: ChatResponse['parsed_data'] | null;
  conversationHistory: Message[];
  currentMealFoods?: Array<{
    food_name: string;
    amount: string;
    meal_time?: string;
    nutrition?: {
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
    };
  }>;
  onAddMoreFood?: () => void;
  isAddingMoreFood?: boolean;
  hasSaved: boolean;
  setHasSaved: (v: boolean) => void;
}

// 카카오톡 스타일 메시지 컴포넌트
const ChatMessage: React.FC<{
  message: Message;
  isLast: boolean;
  showTime?: boolean;
}> = ({ message, isLast, showTime = true }) => {
  const isUser = message.role === 'user';
  const time = new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 다크모드 감지
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 ml-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">AI</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">LifeBit AI</span>
          </div>
        )}

        <div
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${isUser
            ? 'bg-purple-500 text-white rounded-br-md'
            : 'bg-white dark:bg-[#232946] border border-gray-200 dark:border-[#3a3a5a] rounded-bl-md text-gray-900 dark:text-[#b3b8d8]'
          }`}
        >
          <div
            className="whitespace-pre-wrap text-sm leading-relaxed font-semibold"
          >
            {message.content}
          </div>
        </div>

        {showTime && isLast && (
          <span className={`text-xs text-gray-400 mt-1 ${isUser ? 'mr-2' : 'ml-2'}`}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
};

// 식단 데이터를 카드 형태로 표시하는 함수
const formatStructuredDataDisplay = (data: ChatResponse['parsed_data'], recordType: 'exercise' | 'diet') => {
  if (!data) return null;

  if (recordType === 'diet' && data.food_name) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{data.food_name}</h4>
              <p className="text-xs text-gray-500">{data.amount}</p>
            </div>
          </div>

          {data.meal_time && (
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                {data.meal_time}
              </span>
            </div>
          )}
        </div>

        {data.nutrition && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600">칼로리</span>
              <span className="font-semibold text-red-600">{data.nutrition.calories}kcal</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">탄수화물</span>
              <span className="font-semibold text-blue-600">{data.nutrition.carbs}g</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">단백질</span>
              <span className="font-semibold text-green-600">{data.nutrition.protein}g</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-600">지방</span>
              <span className="font-semibold text-yellow-600">{data.nutrition.fat}g</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 운동 데이터나 기타 데이터는 기존 방식 유지
  return (
    <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded border">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// 타입 정의 (브라우저 호환)
type WebSpeechRecognitionEvent = Event & {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
};

type WebSpeechRecognitionErrorEvent = Event & {
  error: string;
};

// Cross-browser SpeechRecognition type
type SpeechRecognitionType = typeof window.SpeechRecognition extends undefined
  ? typeof window.webkitSpeechRecognition
  : typeof window.SpeechRecognition;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  recordType,
  inputText,
  setInputText,
  isRecording,
  isProcessing,
  networkError,
  onVoiceToggle,
  onSendMessage,
  onRetry,
  aiFeedback,
  onSaveRecord,
  structuredData,
  conversationHistory,
  currentMealFoods = [],
  onAddMoreFood,
  isAddingMoreFood = false,
  hasSaved,
  setHasSaved
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localIsRecording, setLocalIsRecording] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);
  const inputTextRef = useRef(inputText);

  useEffect(() => {
    inputTextRef.current = inputText;
  }, [inputText]);

  // recognition 인스턴스 생성 함수 (컴포넌트 내부에 위치)
  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ko-KR';
    recognition.onresult = (event: WebSpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      console.log('[STT] 인식 결과:', transcript);
      setInputText(transcript);
      setLocalIsRecording(false);
      setTimeout(() => {
        onSendMessage(inputTextRef.current);
      }, 1000);
    };
    recognition.onerror = (event: WebSpeechRecognitionErrorEvent) => {
      console.error('[STT] onerror fired:', event.error, event);
      setLocalIsRecording(false);
      recognition.abort();
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setLocalIsRecording(false);
      recognitionRef.current = null;
    };
    return recognition;
  };

  useEffect(() => {
    // 💬 스크롤 항상 맨 아래로
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, aiFeedback]);

  // 음성인식 로직 추가
  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';
      recognitionRef.current.onresult = (event: WebSpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        console.log('[STT] 인식 결과:', transcript);
        setInputText(transcript);
        setLocalIsRecording(false);
        setTimeout(() => {
          onSendMessage(inputTextRef.current);
        }, 1000);
      };
      recognitionRef.current.onerror = (event: WebSpeechRecognitionErrorEvent) => {
        console.error('[STT] 에러:', event.error);
        setLocalIsRecording(false);
      };
      recognitionRef.current.onend = () => {
        setLocalIsRecording(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [setInputText, onSendMessage]);

  if (!recordType) {
    return (
      <div className="text-center p-8 bg-white dark:bg-[#232946] border border-gray-200 dark:border-[#3a3a5a] rounded-lg">
        <div className="text-lg font-medium text-gray-800 dark:text-[#e0e6f8] mb-2">운동 또는 식단 기록을 시작하려면</div>
        <div className="text-gray-600 dark:text-[#b3b8d8]">상단의 '운동 기록' 또는 '식단 기록' 버튼을 클릭해주세요.</div>
      </div>
    );
  }

  // 전송 버튼/엔터키/자동 전송 모두 transcript 파라미터를 받을 수 있도록 수정
  const handleSendMessageWithFocus = (transcript?: string) => {
    console.log('🟢 [ChatInterface] 전송 버튼 눌림');
    onSendMessage(transcript);
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
    }, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('⌨️ [ChatInterface] Enter 눌림');
      handleSendMessageWithFocus();
    }
  };

  // 마이크 버튼 클릭 핸들러 (로컬)
  const handleVoiceButtonClick = () => {
    console.log('[마이크] ChatInterface 마이크 버튼 클릭됨');
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    if (!localIsRecording) {
      setLocalIsRecording(true);
      if (!recognitionRef.current) {
        recognitionRef.current = createRecognition();
      }
      try {
        recognitionRef.current.start();
        console.log('[마이크] 음성 인식 시작');
      } catch (err) {
        console.error('[마이크] start() 에러:', err);
        setLocalIsRecording(false);
        recognitionRef.current = null;
      }
    } else {
      try {
        recognitionRef.current.stop();
        setLocalIsRecording(false);
        console.log('[마이크] 음성 인식 중지');
      } catch (err) {
        console.error('[마이크] stop() 에러:', err);
        recognitionRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-b from-blue-50 to-purple-50 dark:from-[#181c2b] dark:to-[#232946] rounded-2xl shadow-lg overflow-hidden">
      {/* 카카오톡 스타일 헤더 */}
      <div className="bg-white dark:bg-[#232946] border-b border-gray-200 dark:border-[#3a3a5a] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-[#e0e6f8]">LifeBit AI</h3>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-xs text-green-500">온라인</p>
            </div>
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-[#b3b8d8]">
          {recordType === 'exercise' ? '💪 운동 기록' : '🍽️ 식단 기록'}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* 초기 인사말 */}
        {aiFeedback?.type === 'initial' && aiFeedback.message && (
          <ChatMessage
            message={{ role: 'assistant', content: aiFeedback.message }}
            isLast={conversationHistory.length === 0}
            showTime={conversationHistory.length === 0}
          />
        )}

        {/* 대화 내역 */}
        {conversationHistory.map((message, idx) => (
          <ChatMessage
            key={idx}
            message={message}
            isLast={idx === conversationHistory.length - 1}
            showTime={idx === conversationHistory.length - 1}
          />
        ))}

        {/* 현재 식사에 추가된 음식들 표시 */}
        {currentMealFoods.length > 0 && (
          <div className="my-4 p-4 bg-white dark:bg-[#232946] rounded-xl border border-purple-200 dark:border-[#3a3a5a] shadow-sm">
            <h4 className="font-semibold text-gray-800 dark:text-[#e0e6f8] mb-3 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-purple-600" />
              현재 식사 기록
            </h4>
            <div className="space-y-2">
              {currentMealFoods.map((food, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-[#232946] rounded-lg">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-[#2d1e4a] rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-600 dark:text-[#b3b8d8]">{idx + 1}</span>
                  </div>
                  <span className="flex-1 text-sm dark:text-[#e0e6f8]">{food.food_name} {food.amount}</span>
                  <span className="text-xs text-gray-500 dark:text-[#b3b8d8]">{food.nutrition?.calories}kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {networkError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              네트워크 오류가 발생했습니다.{' '}
              <Button variant="link" onClick={onRetry}>다시 시도</Button>
            </AlertDescription>
          </Alert>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 카카오톡 스타일 입력창 */}
      <div className="bg-white dark:bg-[#232946] border-t border-gray-200 dark:border-[#3a3a5a] p-4">
        <div className="flex items-center gap-3">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`메시지를 입력하세요...`}
            disabled={isProcessing}
            className="flex-1 border-gray-300 dark:border-[#3a3a5a] rounded-full px-4 py-2 focus:border-purple-500 focus:ring-purple-500 bg-white dark:bg-[#232946] text-gray-800 dark:text-[#e0e6f8]"
          />

          {inputText.trim() === '' ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceButtonClick}
              disabled={isProcessing}
              className="rounded-full w-10 h-10 hover:bg-purple-100"
            >
              {localIsRecording ? (
                <Mic className="h-5 w-5 text-red-500 animate-pulse" />
              ) : (
                <MicOff className="h-5 w-5 text-gray-500" />
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleSendMessageWithFocus()}
              disabled={isProcessing}
              size="icon"
              className="rrounded-full w-10 h-10 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
