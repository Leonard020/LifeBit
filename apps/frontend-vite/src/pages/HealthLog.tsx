import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StatisticsCharts } from '../components/health/StatisticsCharts';
import { PythonAnalyticsCharts } from '../components/health/PythonAnalyticsCharts';
import { EnhancedHealthDashboard } from '../components/health/EnhancedHealthDashboard';
import { RecommendationPanel } from '../components/health/RecommendationPanel';
import { GoalProgress } from '../components/health/GoalProgress';
import { PeriodSelector } from '../components/health/PeriodSelector';
import { RecordTypeSelector } from '../components/RecordTypeSelector';
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
import { useHealthRealtime } from '../api/healthApi';
import { getHealthStatistics } from '@/api/auth';
import { getToken, getUserInfo, isLoggedIn } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import ErrorBoundary from '../components/ErrorBoundary';
import { AuthContext } from '../AuthContext';
import { WeightTrendChart } from '../components/health/WeightTrendChart';

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
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [recordType, setRecordType] = useState<'exercise' | 'diet'>('exercise');
  const [showChat, setShowChat] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhanced' | 'react' | 'python'>('enhanced');
  const [healthStats, setHealthStats] = useState<HealthStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const userId = useMemo(() => {
    return user?.id ? parseInt(user.id.toString()) : 1;
  }, [user?.id]);

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

  // 인증 상태 확인
  useEffect(() => {
    const authenticated = isLoggedIn();
    
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    if (!authenticated) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // 실시간 업데이트 구독
  useHealthRealtime(userId.toString());
  
  // 실시간 업데이트 기능
  const { isConnected, refreshData, requestNotificationPermission } = useRealTimeUpdates({
    userId: userId.toString(),
    enabled: !!userId
  });

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
        
        const data = await getHealthStatistics(userId, selectedPeriod);
        setHealthStats(data);
      } catch (error) {
        console.error('Failed to fetch health statistics:', error);
        if (error.response?.status === 403) {
          setError('인증이 필요합니다. 다시 로그인해주세요.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('건강 데이터를 불러오는데 실패했습니다.');
        }
        toast.error('건강 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHealthData();
    }
  }, [userId, selectedPeriod, navigate]);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">로그인이 필요합니다</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600">
                건강 로그를 확인하려면 로그인해주세요.
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
                  userId={userId.toString()} 
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
                      userId={userId.toString()} 
                      period={selectedPeriod}
                    />
                  </ErrorBoundary>
                </div>
                
                {/* 오른쪽: 추천 패널 (모바일에서는 전체 너비, 데스크톱에서는 1/3) */}
                <div className="xl:col-span-1">
                  <ErrorBoundary>
                    <RecommendationPanel 
                      userId={userId.toString()}
                    />
                  </ErrorBoundary>
                </div>
              </div>
              
              {/* 하단: 목표 진행률 */}
              <div>
                <ErrorBoundary>
                  <GoalProgress 
                    userId={userId.toString()}
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
                  userId={userId.toString()} 
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
                  <ChatInterface userId={userId.toString()} />
                </div>
              </div>
            </div>
          )}

          {/* 음성 입력 */}
          {showVoiceInput && (
            <VoiceInput
              onResult={handleVoiceResult}
              onClose={() => setShowVoiceInput(false)}
            />
          )}

          {/* AI 피드백 */}
          {showAIFeedback && parsedData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
                <AIFeedbackComponent
                  aiFeedback={{
                    type: 'success',
                    message: '데이터가 성공적으로 처리되었습니다.',
                    suggestions: []
                  }}
                  clarificationInput=""
                  setClarificationInput={() => {}}
                  onClarificationSubmit={() => {}}
                  onSaveRecord={() => {}}
                  structuredData={parsedData}
                />
              </div>
            </div>
          )}

          {/* 구조화된 데이터 미리보기 */}
          {parsedData && (
            <div className="mt-6">
              <StructuredDataPreview data={parsedData} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HealthLog;
