import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Send, Loader2, AlertCircle, Utensils, Clock, Zap } from 'lucide-react';
import { Message, ChatResponse } from '@/api/chatApi';

interface ChatInterfaceProps {
  recordType: 'exercise' | 'diet';
  inputText: string;
  setInputText: (text: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  networkError: boolean;
  onVoiceToggle: () => void;
  onSendMessage: () => void;
  onRetry: () => void;
  aiFeedback: ChatResponse | null;
  onSaveRecord: () => void;
  structuredData: ChatResponse['parsed_data'] | null;
  conversationHistory: Message[];
}

// 식단 데이터를 사용자 친화적으로 표시하는 함수
const formatStructuredDataDisplay = (data: any, recordType: 'exercise' | 'diet') => {
  if (!data) return null;

  if (recordType === 'diet' && data.food_name && data.meal_time) {
    return (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Utensils className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-800">{data.meal_time} 식단</span>
          </div>
          <div className="text-sm text-gray-700">
            <p><strong>음식:</strong> {data.food_name}</p>
            <p><strong>양:</strong> {data.amount || "1인분"}</p>
          </div>
        </div>
        
        {data.nutrition && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">영양소 정보</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>칼로리:</span>
                <span className="font-medium text-red-600">{data.nutrition.calories}</span>
              </div>
              <div className="flex justify-between">
                <span>탄수화물:</span>
                <span className="font-medium text-blue-600">{data.nutrition.carbs}</span>
              </div>
              <div className="flex justify-between">
                <span>단백질:</span>
                <span className="font-medium text-green-600">{data.nutrition.protein}</span>
              </div>
              <div className="flex justify-between">
                <span>지방:</span>
                <span className="font-medium text-yellow-600">{data.nutrition.fat}</span>
              </div>
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
  conversationHistory
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, aiFeedback]);

  if (!recordType) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium mb-2">운동 또는 식단 기록을 시작하려면</p>
        <p>상단의 '운동 기록' 또는 '식단 기록' 버튼을 클릭해주세요.</p>
      </div>
    );
  }

  const handleSendMessageWithFocus = () => {
    onSendMessage();
    // 약간의 딜레이를 주어 DOM 업데이트 후 포커스 시도
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // 커서를 텍스트 끝에 위치시킴 (UX 개선)
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      });
    }, 50);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageWithFocus();
    }
  };

  // Merge AI feedback at start of history
  const mergedHistory: Message[] = [
    ...(aiFeedback ? [{ role: 'assistant' as const, content: aiFeedback.message }] : []),
    ...conversationHistory
  ];

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 인사말(초기 aiFeedback)만 맨 위에 고정 */}
        {aiFeedback?.type === 'initial' && aiFeedback.message && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 whitespace-pre-line bg-gray-100 text-gray-900">
              {aiFeedback.message}
            </div>
          </div>
        )}
        {/* 실제 대화 내역 */}
        {conversationHistory.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 whitespace-pre-line ${
                message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {aiFeedback?.suggestions?.length > 0 && showSuggestions && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-100 rounded-lg p-3">
              {aiFeedback.suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInputText(suggestion);
                    setShowSuggestions(false);
                  }}
                >{suggestion}</Button>
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

        {structuredData && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium mb-3 text-gray-800">
              {recordType === 'exercise' ? '운동 기록' : '식단 기록'} 미리보기
            </h3>
            {formatStructuredDataDisplay(structuredData, recordType)}
            {aiFeedback?.type === 'success' && !aiFeedback.missingFields?.length && (
              <Button className="mt-4 w-full" onClick={onSaveRecord}>저장하기</Button>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 flex items-center gap-2">
        <Input
          ref={inputRef}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`${recordType === 'exercise' ? '운동을' : '식단을'} 자유롭게 입력하세요...`}
          disabled={isProcessing}
          className="flex-1"
        />
        {inputText.trim() === '' ? (
          <Button variant="outline" size="icon" onClick={onVoiceToggle} disabled={isProcessing}>
            {isRecording ? <Mic className="text-red-500" /> : <MicOff />}
          </Button>
        ) : (
          <Button onClick={handleSendMessageWithFocus} disabled={isProcessing} className="gradient-bg hover:opacity-90 transition-opacity">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};
