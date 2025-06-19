import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Heart } from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { sendChatMessage, Message, ChatResponse } from '@/api/chatApi';

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

      // 백엔드(Main.py)에 정의된 프롬프트를 사용하도록, 프론트엔드에서는 히스토리와 chatStep만 전달
      const response = await sendChatMessage(
        chatInputText,
        updatedHistory,
        recordType,
        chatStep
      );

      // AI 응답을 히스토리에 추가
      const newHistory: Message[] = [
        ...updatedHistory,
        { role: 'assistant', content: response.message }
      ];
      setConversationHistory(newHistory);
      setChatAiFeedback(response);
      if (response.parsed_data) setChatStructuredData(response.parsed_data);

      // 다음 단계 전환 로직
      if (response.missingFields?.length) {
        setChatStep('validation');
      } else if (chatStep === 'extraction') {
        setChatStep('confirmation');
      }

      // 확인 단계 완료 시 입력 초기화
      if (chatStep === 'confirmation' && response.type === 'success') {
        setChatInputText('');
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
    }
  };

  const handleRecordSubmit = (type: 'exercise' | 'diet', content: string) => {
    toast({
      title: '기록 완료',
      description: `${type === 'exercise' ? '운동' : '식단'} 기록이 저장되었습니다.`
    });

    // 초기화
    setChatInputText('');
    setChatAiFeedback(null);
    setChatStructuredData(null);
    setShowChat(false);
    setRecordType(null);
    setConversationHistory([]);
    setChatStep('extraction');
  };

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
              setChatAiFeedback({ type: 'initial', message: '안녕하세요! 오늘 어떤 운동을 하셨나요?' });
              setChatStep('extraction');
            }}
            className={`flex items-center gap-2 ${
              recordType === 'exercise' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
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
              setChatAiFeedback({ type: 'initial', message: '안녕하세요! 오늘 어떤 음식을 드셨나요?' });
              setChatStep('extraction');
            }}
            className={`flex items-center gap-2 ${
              recordType === 'diet' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
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
            onSendMessage={handleSendMessage}
            onRetry={() => { setChatNetworkError(false); handleSendMessage(); }}
            aiFeedback={chatAiFeedback}
            clarificationInput={''}
            setClarificationInput={() => {}}
            onClarificationSubmit={() => {}}
            onSaveRecord={() => handleRecordSubmit(recordType!, chatInputText)}
            structuredData={chatStructuredData}
            conversationHistory={conversationHistory}
          />
        ) : (
          <div className="text-center text-gray-600 p-8 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium mb-2">운동 또는 식단 기록을 시작하려면</p>
            <p>상단의 '운동 기록' 또는 '식단 기록' 버튼을 클릭해주세요.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
