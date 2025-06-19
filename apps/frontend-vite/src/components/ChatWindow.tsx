
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Dumbbell, Utensils, Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage } from '../api/chatApi';
import { saveExerciseRecord } from '../api/healthApi';



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
}

interface ChatResponse {
  status: 'success' | 'error';
  message: string;
  parsed_data?: {
    exercise: string;
    category: string;
    target?: string;
    explanation: string;
  };
}

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
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Speech Recognition 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'ko-KR';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputValue(transcript);
          setIsRecording(false);
          toast({
            title: "음성 인식 완료",
            description: "음성이 텍스트로 변환되었습니다.",
          });
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          
          let errorMessage = "음성 인식 중 오류가 발생했습니다.";
          
          switch (event.error) {
            case 'not-allowed':
            case 'permission-denied':
              errorMessage = "마이크 사용 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.";
              // 권한 요청 다이얼로그 표시
              requestMicrophonePermission();
              break;
            case 'no-speech':
              errorMessage = "음성이 감지되지 않았습니다. 다시 시도해주세요.";
              break;
            case 'audio-capture':
              errorMessage = "마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.";
              break;
            case 'network':
              errorMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
              break;
            default:
              errorMessage = "음성 인식 중 오류가 발생했습니다. 다시 시도해주세요.";
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
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  // 마이크 권한 요청 함수
  const requestMicrophonePermission = async () => {
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
  };

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
    setIntroMessage("운동을 기록하시려 하시는군요! 예시로 '스쿼트 30kg 3세트 10회했어요'와 같이 입력해주세요");
  };

  const handleDietClick = () => {
    setCurrentRecordType('diet');
    addMessage('ai', "식단을 기록하시려 하시는군요! 예시를 들어 '아침에 바나나 1개, 계란 2개 먹었어요'와 같이 입력해주세요");
  };

  const handleVoiceToggle = async () => {
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
  const updateConversationHistory = (role: string, content: string) => {
    setConversationHistory(prev => [...prev, { role, content }]);
  };

  // 운동 입력 처리 함수

      // 사용자 메시지는 handleSendMessage에서 이미 추가되었으므로 여기서는 제거
      
      // 운동 분석 요청


// handleExerciseInput 내…
const handleExerciseInput = async (input: string) => {
  try {
    setIsProcessing(true);

    // 1) sendChatMessage 시그니처에 맞춰 인자 4개 전달
    const response = await sendChatMessage(
      input,
      [
        ...conversationHistory,
        { role: 'assistant', content: '운동 기록을 분석하여 JSON 형태로 변환합니다.' }
      ],
      currentRecordType!,
      'extraction'
    );

    // 2) response.status → response.type 으로 변경
    if (response.type === 'success') {
      if (response.message) {
        addMessage('ai', response.message.replace(/<EOL>/g, '\n'));
        updateConversationHistory('assistant', response.message);
      }

      if (response.parsed_data) {
        // 3) parsed_data.target → parsed_data.subcategory 으로 필드명 일치
        setExerciseState({
          exercise: response.parsed_data.exercise!,
          category: response.parsed_data.category!,
          target: response.parsed_data.subcategory
        });

        setCurrentStep('validation');
        if (response.parsed_data.category === 'strength') {
          setValidationStep('sets_reps');
        } else {
          setValidationStep('duration');
        }
      }
    }
  } catch (error) {
    console.error('Exercise input processing error:', error);
    addMessage('ai', '죄송합니다. 운동 기록 처리 중 오류가 발생했습니다.');
  } finally {
    setIsProcessing(false);
  }
};



  // 검증 단계 처리 함수
  const handleValidationResponse = async (input: string) => {
    try {
      setIsProcessing(true);
      // 사용자 메시지는 handleSendMessage에서 이미 추가되었으므로 여기서는 제거

      const updatedExerciseState = { ...exerciseState };
      
      if (validationStep === 'sets_reps') {
        // 세트와 횟수 파싱
        const numbers = input.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          updatedExerciseState.sets = parseInt(numbers[0]);
          updatedExerciseState.reps = parseInt(numbers[1]);
        }
      } else if (validationStep === 'duration') {
        // 시간 파싱
        const minutes = input.match(/\d+/);
        if (minutes) {
          updatedExerciseState.duration_min = parseInt(minutes[0]);
        }
      }

      setExerciseState(updatedExerciseState);
      setCurrentStep('confirmation');
      
      // 확인 메시지 표시
      const confirmationMessage = formatConfirmationMessage(updatedExerciseState);
      addMessage('ai', confirmationMessage);
      updateConversationHistory('assistant', confirmationMessage);
      setIsAwaitingConfirmation(true);
      setPendingRecord({ type: 'exercise', content: JSON.stringify(updatedExerciseState) });
    } catch (error) {
      console.error('Validation response error:', error);
      addMessage('ai', '죄송합니다. 검증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 메시지 전송 처리 함수
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
  
    try {
      setIsProcessing(true);
      const userMessage = inputValue.trim();
      
      // 사용자 메시지를 먼저 대화창에 추가
      addMessage('user', userMessage);
      setIntroMessage(null); // ⬅️ 인사말은 이제 숨긴다
      updateConversationHistory('user', userMessage);
  
      if (currentRecordType === 'exercise') {
        if (currentStep === 'validation') {
          await handleValidationResponse(userMessage);
        } else if (currentStep === 'confirmation') {
          const isConfirmed = /^(네|예|yes)/i.test(userMessage.toLowerCase());
          await handleConfirmation(isConfirmed);
        } else {
          await handleExerciseInput(userMessage);
        }
      } else if (currentRecordType === 'diet') {
        // 식단 기록 처리 로직
        const response = await sendChatMessage(
          userMessage, 
          [
            ...conversationHistory,
            { role: "system", content: "식단 기록을 분석하여 JSON 형태로 변환합니다." }
          ],
          currentRecordType!,  // 'diet'
          'extraction'
        );
  
        if (response && response.message) {
          addMessage('ai', response.message);
          updateConversationHistory('assistant', response.message);
        }
      } else {
        // 일반 채팅 처리 로직
        const response = await sendChatMessage(
          userMessage, 
          conversationHistory,
          currentRecordType!,
          'extraction'
        );
        console.log('Chat response:', response);
  
        if (response && response.message) {
          addMessage('ai', response.message);
          updateConversationHistory('assistant', response.message);
        } else {
          addMessage('ai', '죄송합니다. 응답을 처리할 수 없습니다. 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('Message processing error:', error);
      toast({
        title: "처리 오류",
        description: "메시지 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      addMessage('ai', '죄송합니다. 메시지 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
      setInputValue('');
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
    let message = '다음과 같이 운동을 기록하시겠습니까?\n\n';
    
    if (data.category === 'strength') {
      message += `🏋️‍♂️ ${data.exercise}\n`;
      message += `- 운동 종류: 근력운동`;
      if (data.target) {
        message += ` (${getBodyPartKorean(data.target)})\n`;
      } else {
        message += '\n';
      }
      if (data.sets) message += `- 세트: ${data.sets}세트\n`;
      if (data.reps) message += `- 횟수: ${data.reps}회\n`;
    } else {
      message += `🏃‍♂️ ${data.exercise}\n`;
      message += `- 운동 종류: 유산소운동\n`;
      if (data.duration_min) message += `- 시간: ${data.duration_min}분\n`;
    }
    
    message += '\n확인하시면 "네", 수정이 필요하시면 "아니오"를 입력해주세요.';
    
    return message;
  };

  const handleConfirmation = async (confirmed: boolean) => {
    if (confirmed && pendingRecord) {
      try {
        if (pendingRecord.type === 'exercise') {
          const exerciseData = JSON.parse(pendingRecord.content);
          await saveExerciseRecord(exerciseData);
          addMessage('ai', '운동 기록이 저장되었습니다! 다른 운동을 기록하시겠습니까?');
        }
        setExerciseState({});
        setValidationStep(null);
        setIsAwaitingConfirmation(false);
        setPendingRecord(null);
      } catch (error) {
        console.error('Save error:', error);
        addMessage('ai', '저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } else {
      addMessage('ai', '기록을 취소했습니다. 다시 입력해주세요.');
      setExerciseState({});
      setValidationStep(null);
      setIsAwaitingConfirmation(false);
      setPendingRecord(null);
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
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isProcessing}
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

