import React, { useState } from 'react';
import { StatisticsCharts } from '../components/health/StatisticsCharts';
import { RecommendationPanel } from '../components/health/RecommendationPanel';
import { GoalProgress } from '../components/health/GoalProgress';
import { PeriodSelector } from '../components/health/PeriodSelector';
import { useHealthRealtime } from '../api/healthApi';

// 임시 사용자 데이터 (나중에 인증 시스템으로 교체)
const TEMP_USER = {
  id: '1',
  name: '테스트 사용자',
  email: 'test@example.com',
};

const HealthLog: React.FC = () => {
  // 기간 선택 상태 (일/주/월/년)
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // 실시간 업데이트 구독
  useHealthRealtime(TEMP_USER.id);

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
            value="70.5kg"
            change="+0.2kg"
            changeType="increase"
            icon="⚖️"
          />
          <SummaryCard
            title="BMI"
            value="22.1"
            change="-0.1"
            changeType="decrease"
            icon="📊"
          />
          <SummaryCard
            title="주간 운동"
            value="3회"
            change="목표 달성"
            changeType="success"
            icon="🏃‍♂️"
          />
          <SummaryCard
            title="목표 달성률"
            value="85%"
            change="+5%"
            changeType="increase"
            icon="🎯"
          />
        </div>

        {/* 메인 대시보드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 왼쪽: 통계 차트 (2/3 공간) */}
          <div className="lg:col-span-2">
            <StatisticsCharts 
              userId={TEMP_USER.id} 
              period={selectedPeriod}
            />
          </div>
          
          {/* 오른쪽: 추천 패널 (1/3 공간) */}
          <div className="lg:col-span-1">
            <RecommendationPanel 
              userId={TEMP_USER.id}
            />
          </div>
        </div>
        
        {/* 하단: 목표 진행률 */}
        <div>
          <GoalProgress 
            userId={TEMP_USER.id}
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
