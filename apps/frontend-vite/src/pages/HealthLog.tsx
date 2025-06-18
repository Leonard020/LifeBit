import React, { useState, useEffect } from 'react';
import { StatisticsCharts } from '../components/health/StatisticsCharts';
import { RecommendationPanel } from '../components/health/RecommendationPanel';
import { GoalProgress } from '../components/health/GoalProgress';
import { PeriodSelector } from '../components/health/PeriodSelector';
import { useHealthRealtime } from '../api/healthApi';
import { getHealthStatistics } from '@/api/auth';
import { getToken, getUserInfo } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/Layout';

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
  // 기간 선택 상태 (일/주/월/년)
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [healthStats, setHealthStats] = useState<HealthStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 사용자 정보 가져오기
  const userInfo = getUserInfo();
  const userId = userInfo?.userId;

  // 실시간 업데이트 구독
  useHealthRealtime(userId || '');

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
        setError('건강 데이터를 불러오는데 실패했습니다.');
        toast.error('건강 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchHealthData();
    }
  }, [userId, selectedPeriod, navigate]);

  if (!userId) {
    return null; // 리다이렉트 중
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 섹션 */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">건강 로그</h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  실시간 건강 데이터와 AI 추천을 확인하세요
                </p>
              </div>
              
              {/* 기간 선택기 */}
              <div className="flex-shrink-0">
                <PeriodSelector 
                  selectedPeriod={selectedPeriod}
                  onPeriodChange={setSelectedPeriod}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">건강 데이터를 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 데이터 없음 상태 */}
        {!loading && !error && !healthStats && (
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">건강 데이터가 없습니다.</p>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        {!loading && !error && healthStats && (
          <div className="container mx-auto px-4 py-6 md:py-8">
            {/* 상단 요약 카드들 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
              <SummaryCard
                title="현재 체중"
                value={`${healthStats.currentWeight}kg`}
                change={`${healthStats.weightChange >= 0 ? '+' : ''}${healthStats.weightChange}kg`}
                changeType={healthStats.weightChange > 0 ? 'increase' : healthStats.weightChange < 0 ? 'decrease' : 'success'}
                icon="⚖️"
              />
              <SummaryCard
                title="BMI"
                value={healthStats.currentBMI.toString()}
                change={`${healthStats.bmiChange >= 0 ? '+' : ''}${healthStats.bmiChange}`}
                changeType={healthStats.bmiChange > 0 ? 'increase' : healthStats.bmiChange < 0 ? 'decrease' : 'success'}
                icon="📊"
              />
              <SummaryCard
                title="주간 운동"
                value={`${healthStats.weeklyWorkouts}회`}
                change={healthStats.weeklyWorkouts >= healthStats.workoutGoal ? '목표 달성' : `${healthStats.workoutGoal - healthStats.weeklyWorkouts}회 부족`}
                changeType={healthStats.weeklyWorkouts >= healthStats.workoutGoal ? 'success' : 'increase'}
                icon="🏃‍♂️"
              />
              <SummaryCard
                title="목표 달성률"
                value={`${healthStats.goalAchievementRate}%`}
                change={`${healthStats.goalChange >= 0 ? '+' : ''}${healthStats.goalChange}%`}
                changeType={healthStats.goalChange > 0 ? 'increase' : healthStats.goalChange < 0 ? 'decrease' : 'success'}
                icon="🎯"
              />
            </div>

            {/* 메인 대시보드 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* 왼쪽: 통계 차트 (모바일에서는 전체 너비, 데스크톱에서는 2/3) */}
              <div className="xl:col-span-2">
                <StatisticsCharts 
                  userId={userId} 
                  period={selectedPeriod}
                />
              </div>
              
              {/* 오른쪽: 추천 패널 (모바일에서는 전체 너비, 데스크톱에서는 1/3) */}
              <div className="xl:col-span-1">
                <RecommendationPanel 
                  userId={userId}
                />
              </div>
            </div>
            
            {/* 하단: 목표 진행률 */}
            <div>
              <GoalProgress 
                userId={userId}
                period={selectedPeriod}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// 요약 카드 컴포넌트
interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease' | 'success';
  icon: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-red-500';
      case 'decrease': return 'text-blue-500';
      case 'success': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return '↗️';
      case 'decrease': return '↘️';
      case 'success': return '✅';
      default: return '➖';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 md:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs md:text-sm font-medium text-gray-600 truncate">{title}</h3>
        <span className="text-lg md:text-xl">{icon}</span>
      </div>
      <div className="space-y-1">
        <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{value}</p>
        <p className={`text-xs md:text-sm font-medium flex items-center ${getChangeColor()}`}>
          <span className="mr-1">{getChangeIcon()}</span>
          <span className="truncate">{change}</span>
        </p>
      </div>
    </div>
  );
};

export default HealthLog;
