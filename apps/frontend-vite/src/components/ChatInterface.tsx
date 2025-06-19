import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Message, ChatResponse } from '@/api/chatApi';

interface AIFeedback {
  type: 'success' | 'incomplete' | 'clarification' | 'error' | 'initial';
  message: string;
  suggestions?: string[];
  missingFields?: string[];
}

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
  clarificationInput: string;
  setClarificationInput: (input: string) => void;
  onClarificationSubmit: () => void;
  onSaveRecord: () => void;
  structuredData: ChatResponse['parsed_data'] | null;
  conversationHistory: Message[];
}

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
  clarificationInput,
  setClarificationInput,
  onClarificationSubmit,
  onSaveRecord,
  structuredData,
  conversationHistory
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, aiFeedback]);

  // 운동/식단 기록 버튼이 클릭되지 않은 경우 안내 메시지 표시
  if (!recordType) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 text-gray-600">
          <p className="text-lg font-medium mb-2">운동 또는 식단 기록을 시작하려면</p>
          <p>상단의 '운동 기록' 또는 '식단 기록' 버튼을 클릭해주세요.</p>
        </div>
      </div>
    );
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Conversation History */}
        {conversationHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Current AI Feedback */}
        {aiFeedback && (
          <div className="flex justify-start">
           <div className="max-w-[80%] bg-gray-100 rounded-lg p-3 text-gray-900 whitespace-pre-line">

              {aiFeedback.message}
              
              {/* Suggestions */}
              {aiFeedback?.suggestions?.length > 0 && showSuggestions && (
                <div className="mt-2 space-y-2">
                  {aiFeedback.suggestions.map((suggestion: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="mr-2 text-sm"
                      onClick={() => {
                        setInputText(suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Network Error */}
        {networkError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              네트워크 오류가 발생했습니다.{' '}
              <Button
                variant="link"
                className="text-white underline p-0 h-auto"
                onClick={onRetry}
              >
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Structured Data Preview */}
        {structuredData && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h3 className="font-medium mb-2">
              {recordType === 'exercise' ? '운동 기록' : '식단 기록'} 미리보기
            </h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(structuredData, null, 2)}
            </pre>
            {aiFeedback?.type === 'success' && !aiFeedback?.missingFields?.length && (
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={onSaveRecord}
              >
                저장하기
              </Button>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`${
              recordType === 'exercise' ? '운동을' : '식단을'
            } 자유롭게 입력하세요...`}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={onVoiceToggle}
            disabled={isProcessing}
          >
            <Mic className={isRecording ? 'text-red-500' : ''} />
          </Button>
          <Button
            onClick={onSendMessage}
            disabled={!inputText.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

