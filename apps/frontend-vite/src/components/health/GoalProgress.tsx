import React from 'react';
import { useUserGoals, useHealthStatistics } from '../../api/auth';

interface GoalProgressProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  userId,
  period,
}) => {
  // 사용자 목표와 통계 데이터 가져오기
  const { data: userGoals, isLoading: goalsLoading } = useUserGoals(userId);
  const { data: healthStats, isLoading: statsLoading } = useHealthStatistics(userId, period);

  if (goalsLoading || statsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 임시 목표 데이터 (나중에 실제 데이터로 교체)
  const mockGoals = {
    weekly_workout_target: 5, // 주 5회 운동
    daily_carbs_target: 250, // 일일 탄수화물 250g
    daily_protein_target: 120, // 일일 단백질 120g
    daily_fat_target: 65, // 일일 지방 65g
  };

  const mockProgress = {
    weekly_workout_current: 3, // 현재 3회 완료
    daily_carbs_current: 180, // 현재 180g 섭취
    daily_protein_current: 95, // 현재 95g 섭취
    daily_fat_current: 55, // 현재 55g 섭취
  };

  const goals = [
    {
      id: 'workout',
      title: '주간 운동 목표',
      current: mockProgress.weekly_workout_current,
      target: mockGoals.weekly_workout_target,
      unit: '회',
      icon: '🏃‍♂️',
      color: 'blue',
    },
    {
      id: 'carbs',
      title: '일일 탄수화물',
      current: mockProgress.daily_carbs_current,
      target: mockGoals.daily_carbs_target,
      unit: 'g',
      icon: '🍞',
      color: 'yellow',
    },
    {
      id: 'protein',
      title: '일일 단백질',
      current: mockProgress.daily_protein_current,
      target: mockGoals.daily_protein_target,
      unit: 'g',
      icon: '🥩',
      color: 'red',
    },
    {
      id: 'fat',
      title: '일일 지방',
      current: mockProgress.daily_fat_current,
      target: mockGoals.daily_fat_target,
      unit: 'g',
      icon: '🥑',
      color: 'green',
    },
  ];

  const getProgressColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'yellow':
        return 'bg-yellow-500';
      case 'red':
        return 'bg-red-500';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressTextColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'text-red-600';
      case 'green':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return '완료';
    if (progress >= 80) return '거의 완료';
    if (progress >= 50) return '진행 중';
    return '시작 필요';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <div className="text-2xl mr-3">🎯</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">목표 진행률</h3>
          <p className="text-sm text-gray-600">
            {period === 'day' ? '오늘' : period === 'week' ? '이번 주' : period === 'month' ? '이번 달' : '올해'} 목표 달성 현황
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.current, goal.target);
          const status = getProgressStatus(progress);

          return (
            <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{goal.icon}</span>
                  <h4 className="font-medium text-gray-900">{goal.title}</h4>
                </div>
                <span className={`text-sm font-medium ${getProgressTextColor(goal.color)}`}>
                  {status}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>진행률</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(goal.color)} transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{goal.current}</span>
                  <span> / {goal.target} {goal.unit}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {goal.current >= goal.target ? '목표 달성!' : `${goal.target - goal.current} ${goal.unit} 남음`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 목표 달성률 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">전체 목표 달성률</h4>
            <p className="text-sm text-gray-600">모든 목표의 평균 달성률</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {goals.reduce((acc, goal) => acc + calculateProgress(goal.current, goal.target), 0) / goals.length}%
            </div>
            <div className="text-sm text-gray-500">
              {goals.filter(goal => calculateProgress(goal.current, goal.target) >= 100).length} / {goals.length} 목표 달성
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 