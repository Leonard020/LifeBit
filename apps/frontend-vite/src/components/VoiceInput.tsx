
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  recordType: 'exercise' | 'diet';
  inputText: string;
  setInputText: (text: string) => void;
  isRecording: boolean;
  isProcessing: boolean;
  networkError: boolean;
  onVoiceToggle: () => void;
  onAnalyze: () => void;
  onRetry: () => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  recordType,
  inputText,
  setInputText,
  isRecording,
  isProcessing,
  networkError,
  onVoiceToggle,
  onAnalyze,
  onRetry
}) => {
  return (
    <Card className="mb-6 animate-slide-up" style={{animationDelay: '0.4s'}}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {recordType === 'exercise' ? '운동' : '식단'} 기록
          </span>
          <Badge variant="secondary">
            {recordType === 'exercise' ? '운동' : '식단'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder={
              recordType === 'exercise'
                ? "예: 벤치프레스 60kg 5세트 8회 했어요"
                : "예: 아침에 바나나 1개, 계란 2개 먹었어요"
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px] pr-12"
            disabled={isProcessing}
          />
          <Button
            size="icon"
            variant={isRecording ? 'default' : 'ghost'}
            className={`absolute right-2 bottom-2 ${
              isRecording ? 'gradient-bg text-white animate-pulse' : ''
            }`}
            onClick={onVoiceToggle}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={onAnalyze}
            disabled={!inputText.trim() || isProcessing}
            className="flex-1 gradient-bg hover:opacity-90 transition-opacity"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI 분석하기
              </>
            )}
          </Button>
          
          {networkError && (
            <Button 
              onClick={onRetry}
              variant="outline"
              disabled={isProcessing}
            >
              재시도
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
