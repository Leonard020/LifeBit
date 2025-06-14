
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Dumbbell, Utensils, Mic, MicOff } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  onRecordSubmit?: (type: 'exercise' | 'diet', content: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onRecordSubmit }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentRecordType, setCurrentRecordType] = useState<'exercise' | 'diet' | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<{ type: 'exercise' | 'diet', content: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'ai', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
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
    addMessage('ai', "운동을 기록하시려 하시는군요! 예시로 '벤치프레스 60kg 5세트 8회했어요'와 같이 입력해주세요");
  };

  const handleDietClick = () => {
    setCurrentRecordType('diet');
    addMessage('ai', "식단을 기록하시려 하시는군요! 예시를 들어 '아침에 바나나 1개, 계란 2개 먹었어요'와 같이 입력해주세요");
  };

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    // 실제 음성 인식 로직은 여기에 구현
    if (!isRecording) {
      // 음성 인식 시작
      setTimeout(() => {
        setIsRecording(false);
        setInputValue("벤치프레스 60kg 5세트 8회 했어요"); // 예시 음성 인식 결과
      }, 3000);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage('user', inputValue);
    
    if (isAwaitingConfirmation) {
      if (inputValue.includes('네') || inputValue.includes('예') || inputValue.includes('저장')) {
        if (pendingRecord && onRecordSubmit) {
          onRecordSubmit(pendingRecord.type, pendingRecord.content);
        }
        addMessage('ai', "기록이 완료되었습니다! 꾸준한 관리가 멋져요. 💪");
        setIsAwaitingConfirmation(false);
        setPendingRecord(null);
        setCurrentRecordType(null);
      } else {
        addMessage('ai', "기록을 취소했습니다. 다시 입력해주세요.");
        setIsAwaitingConfirmation(false);
        setPendingRecord(null);
      }
    } else if (currentRecordType) {
      const analysis = analyzeInput(inputValue, currentRecordType);
      
      if (analysis.type === 'incomplete') {
        const missingInfo = analysis.missingFields?.join(', ');
        addMessage('ai', `입력해주신 내용에서 ${missingInfo} 정보가 누락되었습니다. 추가로 입력해주세요.`);
      } else {
        // 완전한 정보가 있을 때 확인 요청
        const summary = currentRecordType === 'exercise' 
          ? "운동 기록을 정리하면 다음과 같습니다:"
          : "식단 기록을 정리하면 다음과 같습니다:";
        
        addMessage('ai', `${summary}\n"${inputValue}"\n\n이렇게 저장할까요? (네/아니요)`);
        setIsAwaitingConfirmation(true);
        setPendingRecord({ type: currentRecordType, content: inputValue });
      }
    } else {
      addMessage('ai', "안녕하세요! 운동 기록이나 식단 기록을 위해 위의 뱃지를 클릭해주세요.");
    }

    setInputValue('');
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
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
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
                      <div className={`rounded-lg px-3 py-2 ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
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
              placeholder="메시지를 입력하세요..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            
            {/* 동적 버튼 전환 */}
            {!hasInputText ? (
              // 텍스트가 없을 때: 마이크 버튼
              <Button
                size="icon"
                variant={isRecording ? 'default' : 'ghost'}
                className={`${
                  isRecording 
                    ? 'gradient-bg text-white animate-pulse' 
                    : 'hover:bg-gradient-to-br hover:from-teal-400 hover:to-blue-500 hover:text-white'
                }`}
                onClick={handleVoiceToggle}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            ) : (
              // 텍스트가 있을 때: 전송 버튼
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="gradient-bg hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

