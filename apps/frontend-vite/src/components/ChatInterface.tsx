
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface AIFeedback {
  type: 'success' | 'incomplete' | 'clarification' | 'error';
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
  aiFeedback: AIFeedback | null;
  clarificationInput: string;
  setClarificationInput: (input: string) => void;
  onClarificationSubmit: () => void;
  onSaveRecord: () => void;
  structuredData: any;
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
  onSaveRecord,
  structuredData
}) => {
  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-blue-600" />;
    }
  };

  // 입력 텍스트가 있는지 확인
  const hasInputText = inputText.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* AI Coaching Section - KakaoTalk Style Chat */}
      {aiFeedback && (
        <div className="space-y-3">
          {/* AI Message */}
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              {/* AI Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              
              {/* Message Content */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">손진우(ict)</div>
                <div className="bg-white border rounded-lg p-3 shadow-sm relative">
                  <p className="text-sm leading-relaxed text-gray-800">{aiFeedback.message}</p>
                  
                  {aiFeedback.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">💡 제안사항:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {aiFeedback.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiFeedback.missingFields && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-orange-700">📝 누락된 정보:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiFeedback.missingFields.map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-orange-700 border-orange-300">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">오후 5:43</div>
              </div>
            </div>
          </div>

          {/* Success Action */}
          {aiFeedback.type === 'success' && structuredData && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={onSaveRecord}
                className="gradient-bg hover:opacity-90 transition-opacity rounded-full px-6"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                기록 저장하기
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Input Section */}
      <Card className="animate-slide-up" style={{animationDelay: '0.4s'}}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>
              {recordType === 'exercise' ? '운동' : '식단'} 기록
            </span>
            <Badge variant="secondary" className="text-xs">
              {recordType === 'exercise' ? '운동' : '식단'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder={
                recordType === 'exercise'
                  ? "예: 벤치프레스 60kg 5세트 8회 했어요"
                  : "예: 아침에 바나나 1개, 계란 2개 먹었어요"
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={isProcessing}
            />
            
            {/* 단일 버튼 - 텍스트 입력 상태에 따라 변경 */}
            <div className="flex justify-center">
              {!hasInputText ? (
                // 텍스트가 없을 때: 마이크 버튼
                <Button
                  size="icon"
                  variant={isRecording ? 'default' : 'ghost'}
                  className={`h-12 w-12 rounded-full ${
                    isRecording 
                      ? 'bg-gradient-to-br from-teal-400 to-blue-500 text-white animate-pulse' 
                      : 'hover:bg-gradient-to-br hover:from-teal-400 hover:to-blue-500 hover:text-white'
                  }`}
                  onClick={onVoiceToggle}
                  disabled={isProcessing}
                >
                  {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>
              ) : (
                // 텍스트가 있을 때: 전송 버튼
                <Button 
                  onClick={onSendMessage}
                  disabled={isProcessing}
                  className="rounded-full h-12 w-12 gradient-bg hover:opacity-90 transition-opacity p-0"
                  size="icon"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {networkError && (
            <div className="flex justify-center">
              <Button 
                onClick={onRetry}
                variant="outline"
                disabled={isProcessing}
              >
                재시도
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

