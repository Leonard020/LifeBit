import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StatisticsCharts } from '../components/health/StatisticsCharts';
import { PythonAnalyticsCharts } from '../components/health/PythonAnalyticsCharts';
import { EnhancedHealthDashboard } from '../components/health/EnhancedHealthDashboard';
import { RecommendationPanel } from '../components/health/RecommendationPanel';
import { GoalProgress } from '../components/health/GoalProgress';
import { PeriodSelector } from '../components/health/PeriodSelector';
import { ChatInterface } from '../components/ChatInterface';
import { VoiceInput } from '../components/VoiceInput';
import { StructuredDataPreview } from '../components/StructuredDataPreview';
import { AIFeedbackComponent } from '../components/AIFeedback';
import { useAuth } from '../AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  BarChart3, 
  MessageSquare, 
  Mic, 
  Activity,
  TrendingUp,
  Brain,
  Zap,
  Smartphone,
  Heart
} from 'lucide-react';
import { getHealthStatistics } from '@/api/auth';
import { getToken, getUserInfo, isLoggedIn, getUserIdFromToken } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import ErrorBoundary from '../components/ErrorBoundary';
import { useToast } from '../components/ui/use-toast';

interface HealthStatistics {
  currentWeight: number;
  weightChange: number;
  currentBMI: number;
  bmiChange: number;
  weeklyWorkouts: number;
  workoutGoal: number;
  goalAchievementRate: number;
  goalChange: number;
  totalCaloriesBurned: number;
  averageDailyCalories: number;
  streak: number;
  totalWorkoutDays: number;
}

const HealthLog: React.FC = () => {
  // 🔧 모든 Hook을 최상단에 배치 (조건부 호출 금지!)
  const { user, isLoggedIn, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State hooks
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'day'>('month');
  const [activeTab, setActiveTab] = useState<'enhanced' | 'react' | 'python'>('enhanced');
  const [recordType, setRecordType] = useState<'exercise' | 'diet'>('exercise');
  const [showChat, setShowChat] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ChatInterface 상태
  const [chatInputText, setChatInputText] = useState('');
  const [chatIsRecording, setChatIsRecording] = useState(false);
  const [chatIsProcessing, setChatIsProcessing] = useState(false);
  const [chatNetworkError, setChatNetworkError] = useState(false);
  const [chatAiFeedback, setChatAiFeedback] = useState<Record<string, unknown> | null>(null);
  const [chatClarificationInput, setChatClarificationInput] = useState('');
  const [chatStructuredData, setChatStructuredData] = useState<Record<string, unknown> | null>(null);

  // VoiceInput 상태
  const [voiceInputText, setVoiceInputText] = useState('');
  const [voiceIsRecording, setVoiceIsRecording] = useState(false);
  const [voiceIsProcessing, setVoiceIsProcessing] = useState(false);
  const [voiceNetworkError, setVoiceNetworkError] = useState(false);

  // 토큰에서 올바른 사용자 ID 가져오기
  const userId = useMemo(() => {
    const tokenUserId = getUserIdFromToken();
    console.log('🔍 [HealthLog] 토큰에서 사용자 ID:', tokenUserId);
    console.log('🔍 [HealthLog] user 객체:', user);
    
    if (tokenUserId) {
      console.log('✅ [HealthLog] 토큰에서 사용자 ID 사용:', tokenUserId);
      return tokenUserId;
    }
    // 토큰에서 가져올 수 없는 경우 user 객체에서 가져오기
    const userUserId = user?.userId ? parseInt(user.userId) : null;
    console.log('🔍 [HealthLog] user 객체에서 사용자 ID:', userUserId);
    return userUserId;
  }, [user?.userId]);

  // 🔧 실시간 업데이트 Hook을 항상 호출 (조건부 호출 금지!)
  const { isConnected, refreshData, requestNotificationPermission } = useRealTimeUpdates({
    userId: userId?.toString() || '',
    enabled: true // 폴링 방식으로 활성화
  });

  const handleVoiceResult = useCallback((result: Record<string, unknown>) => {
    console.log('음성 처리 결과:', result);
    setParsedData(result);
    setShowVoiceInput(false);
    setShowAIFeedback(true);
  }, []);

  const handleCloseAIFeedback = useCallback(() => {
    setShowAIFeedback(false);
    setParsedData(null);
  }, []);

  // 인증 상태 확인 (새로고침 시 토큰 재검증)
  useEffect(() => {
    // 로딩 중이면 대기
    if (isLoading) {
      console.log('⏳ [HealthLog] AuthContext 로딩 중...');
      return;
    }
    
    console.log('🔍 [HealthLog] 인증 상태 확인:', { 
      isLoggedIn, 
      user: !!user, 
      token: !!getToken(),
      userInfo: !!getUserInfo(),
      isLoading
    });
    
    // 토큰과 사용자 정보 재검증
    const token = getToken();
    const userInfo = getUserInfo();
    
    if (!token || !userInfo || !isLoggedIn) {
      console.warn('🚨 [HealthLog] 인증 정보 부족으로 로그인 페이지로 이동');
      navigate('/login');
      return;
    }
    
    console.log('✅ [HealthLog] 인증 상태 확인 완료');
  }, [navigate, isLoggedIn, user, isLoading]);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const token = getToken();
        
        if (!token || !userId) {
          navigate('/login');
          return;
        }

        setLoading(true);
        setError(null);
        
        const data = await getHealthStatistics(userId.toString(), selectedPeriod);
        setHealthStats(data);
      } catch (error) {
        console.error('Failed to fetch health statistics:', error);
        if ((error as { response?: { status?: number } }).response?.status === 403) {
          setError('인증이 필요합니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('건강 데이터를 불러오는데 실패했습니다.');
        }
        toast({
          title: "오류",
          description: "건강 데이터를 불러오는데 실패했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHealthData();
    }
  }, [userId, selectedPeriod, navigate, toast]);

  // 🔧 조건부 렌더링을 Hook 호출 이후로 이동
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">로딩 중...</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                사용자 정보를 확인하고 있습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!user || !userId) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">
                {!user ? '로그인이 필요합니다' : '사용자 정보 로딩 중...'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                {!user 
                  ? '건강 로그를 확인하려면 로그인해주세요.'
                  : '사용자 정보를 불러오는 중입니다.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          {/* 헤더 */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  건강 로그
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  나의 건강 데이터를 한눈에 확인하고 분석해보세요
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  사용자 ID: {userId}
                </Badge>
                <Badge 
                  variant={isConnected ? "default" : "secondary"} 
                  className="text-xs flex items-center gap-1"
                >
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {isConnected ? '자동 새로고침 활성' : '비활성'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                  className="flex items-center gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  AI 채팅
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVoiceInput(true)}
                  className="flex items-center gap-1"
                >
                  <Mic className="h-4 w-4" />
                  음성 입력
                </Button>
              </div>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="mb-6">
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
          </div>

          {/* 차트 분석 탭 */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'enhanced' | 'react' | 'python')} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="enhanced" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                향상된 UI
                <Badge variant="secondary" className="text-xs ml-1">
                  NEW
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="react" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                기본 차트
              </TabsTrigger>
              <TabsTrigger value="python" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI 고급 분석
                <Badge variant="secondary" className="text-xs ml-1">
                  Python
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* 향상된 UI 탭 */}
            <TabsContent value="enhanced" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border p-1 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
                  <Heart className="h-4 w-4" />
                  <span className="font-medium">사용자 제공 UI를 반영한 향상된 건강 대시보드</span>
                </div>
              </div>
              
              <ErrorBoundary>
                <EnhancedHealthDashboard 
                  userId={userId?.toString() || ''} 
                  period={selectedPeriod}
                />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="react" className="mt-6">
              {/* 기존 React 차트 */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* 왼쪽: 통계 차트 (모바일에서는 전체 너비, 데스크톱에서는 2/3) */}
                <div className="xl:col-span-2">
                  <ErrorBoundary>
                    <StatisticsCharts 
                      userId={userId?.toString() || ''} 
                      period={selectedPeriod}
                    />
                  </ErrorBoundary>
                </div>
                
                {/* 오른쪽: 추천 패널 (모바일에서는 전체 너비, 데스크톱에서는 1/3) */}
                <div className="xl:col-span-1">
                  <ErrorBoundary>
                    <RecommendationPanel 
                      userId={userId?.toString() || ''}
                    />
                  </ErrorBoundary>
                </div>
              </div>
              
              {/* 하단: 목표 진행률 */}
              <div>
                <ErrorBoundary>
                  <GoalProgress 
                    userId={userId?.toString() || ''}
                    period={selectedPeriod}
                  />
                </ErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="python" className="mt-6">
              {/* Python AI 분석 차트 */}
              <div className="bg-white rounded-xl shadow-sm border p-1 mb-4">
                <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 rounded-lg p-3">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Python 기반 고급 데이터 분석 및 AI 인사이트</span>
                </div>
              </div>
              
              <ErrorBoundary>
                <PythonAnalyticsCharts 
                  userId={userId || 0} 
                  period={selectedPeriod}
                />
              </ErrorBoundary>
            </TabsContent>
          </Tabs>

          {/* 채팅 인터페이스 */}
          {showChat && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl h-96 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">AI 건강 상담</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChat(false)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex-1">
                  <ChatInterface 
                    recordType={recordType}
                    inputText={chatInputText}
                    setInputText={setChatInputText}
                    isRecording={chatIsRecording}
                    isProcessing={chatIsProcessing}
                    networkError={chatNetworkError}
                    onVoiceToggle={() => setChatIsRecording(!chatIsRecording)}
                    onSendMessage={() => {}}
                    onRetry={() => setChatNetworkError(false)}
                    aiFeedback={null}
                    clarificationInput={chatClarificationInput}
                    setClarificationInput={setChatClarificationInput}
                    onClarificationSubmit={() => {}}
                    onSaveRecord={() => {}}
                    structuredData={chatStructuredData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 음성 입력 */}
          {showVoiceInput && (
            <VoiceInput
              recordType={recordType}
              inputText={voiceInputText}
              setInputText={setVoiceInputText}
              isRecording={voiceIsRecording}
              isProcessing={voiceIsProcessing}
              networkError={voiceNetworkError}
              onVoiceToggle={() => setVoiceIsRecording(!voiceIsRecording)}
              onAnalyze={() => handleVoiceResult({ type: 'exercise', data: voiceInputText })}
              onRetry={() => setVoiceNetworkError(false)}
            />
          )}

          {/* AI 피드백 */}
          {showAIFeedback && parsedData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">AI 피드백</h3>
                  <p>데이터가 성공적으로 처리되었습니다.</p>
                  <Button onClick={handleCloseAIFeedback} className="mt-4">
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 구조화된 데이터 미리보기 */}
          {parsedData && (
            <div className="mt-6">
              <StructuredDataPreview 
                structuredData={parsedData} 
                isSuccess={true}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HealthLog;
