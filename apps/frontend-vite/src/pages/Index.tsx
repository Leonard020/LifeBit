
import React from 'react';
import { Layout } from '@/components/Layout';
import { ChatWindow } from '@/components/ChatWindow';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();

  const handleRecordSubmit = (type: 'exercise' | 'diet', content: string) => {
    // 기록 처리 로직
    toast({
      title: "기록 완료",
      description: `${type === 'exercise' ? '운동' : '식단'} 기록이 저장되었습니다.`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Welcome Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-4 text-foreground">
            AI와 함께하는 건강 관리
          </h1>
          <p className="text-muted-foreground">
            운동과 식단을 간편하게 기록하고 맞춤형 피드백을 받아보세요
          </p>
        </div>

        {/* Chat Interface */}
        <ChatWindow onRecordSubmit={handleRecordSubmit} />
      </div>
    </Layout>
  );
};

export default Index;
