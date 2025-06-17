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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">건강 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">건강 로그</h1>
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!healthStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">건강 로그</h1>
            <p className="text-gray-600">건강 데이터가 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">건강 로그</h1>
              <p className="text-gray-600 mt-2">
                실시간 건강 데이터와 AI 추천을 확인하세요
              </p>
            </div>
            
            {/* 기간 선택기 */}
            <div className="mt-4 sm:mt-0">
              <PeriodSelector 
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {/* 상단 요약 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 왼쪽: 통계 차트 (2/3 공간) */}
          <div className="lg:col-span-2">
            <StatisticsCharts 
              userId={userId} 
              period={selectedPeriod}
            />
          </div>
          
          {/* 오른쪽: 추천 패널 (1/3 공간) */}
          <div className="lg:col-span-1">
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
    </div>
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
      case 'increase':
        return 'text-red-600';
      case 'decrease':
        return 'text-green-600';
      case 'success':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return '↗️';
      case 'decrease':
        return '↘️';
      case 'success':
        return '✅';
      default:
        return '➡️';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className="flex items-center mt-2">
            <span className="text-sm mr-1">{getChangeIcon()}</span>
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {change}
            </span>
          </div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
};

export default HealthLog;
