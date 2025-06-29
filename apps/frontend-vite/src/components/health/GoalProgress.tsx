import React from 'react';
import { useHealthStatistics, useUserGoals } from '../../api/auth';

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
  const { data: weeklyHealthStats, isLoading: weeklyStatsLoading } = useHealthStatistics(userId, 'week');

  if (goalsLoading || statsLoading || weeklyStatsLoading) {
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

  // 실제 API 데이터에서 목표 값 추출
  const goalsData = userGoals?.data || userGoals;
  const statsData = healthStats?.data || healthStats;
  const weeklyStatsData = weeklyHealthStats?.data || weeklyHealthStats;

  console.log('🎯 [GoalProgress] 사용자 목표 데이터:', goalsData);
  console.log('📊 [GoalProgress] 건강 통계 데이터:', statsData);
  console.log('📊 [GoalProgress] 주간 건강 통계 데이터:', weeklyStatsData);

  // 목표가 설정되지 않은 경우 처리
  const hasGoals = goalsData && (
    goalsData.weekly_workout_target || 
    goalsData.daily_carbs_target || 
    goalsData.daily_protein_target || 
    goalsData.daily_fat_target ||
    goalsData.weekly_chest ||
    goalsData.weekly_back ||
    goalsData.weekly_legs ||
    goalsData.weekly_shoulders ||
    goalsData.weekly_arms ||
    goalsData.weekly_abs ||
    goalsData.weekly_cardio
  );

  // 운동 목표 데이터 (주간 기준, 횟수)
  const exerciseGoals = [
    {
      id: 'total_workout',
      title: '주간 총 운동 횟수',
      current: (weeklyStatsData?.weeklyChestCount || 0) + (weeklyStatsData?.weeklyBackCount || 0) + 
               (weeklyStatsData?.weeklyLegsCount || 0) + (weeklyStatsData?.weeklyShouldersCount || 0) + 
               (weeklyStatsData?.weeklyArmsCount || 0) + (weeklyStatsData?.weeklyAbsCount || 0) + 
               (weeklyStatsData?.weeklyCardioCount || 0),
      target: goalsData?.weekly_workout_target || null,
      unit: '회',
      icon: '🏃‍♂️',
      color: 'blue',
    },
    {
      id: 'chest',
      title: '가슴 운동',
      current: weeklyStatsData?.weeklyChestCount || 0,
      target: goalsData?.weekly_chest || null,
      unit: '회',
      icon: '💪',
      color: 'red',
    },
    {
      id: 'back',
      title: '등 운동',
      current: weeklyStatsData?.weeklyBackCount || 0,
      target: goalsData?.weekly_back || null,
      unit: '회',
      icon: '🏋️‍♂️',
      color: 'green',
    },
    {
      id: 'legs',
      title: '다리 운동',
      current: weeklyStatsData?.weeklyLegsCount || 0,
      target: goalsData?.weekly_legs || null,
      unit: '회',
      icon: '🦵',
      color: 'purple',
    },
    {
      id: 'shoulders',
      title: '어깨 운동',
      current: weeklyStatsData?.weeklyShouldersCount || 0,
      target: goalsData?.weekly_shoulders || null,
      unit: '회',
      icon: '🤸‍♂️',
      color: 'orange',
    },
    {
      id: 'arms',
      title: '팔 운동',
      current: weeklyStatsData?.weeklyArmsCount || 0,
      target: goalsData?.weekly_arms || null,
      unit: '회',
      icon: '💪',
      color: 'pink',
    },
    {
      id: 'abs',
      title: '복근 운동',
      current: weeklyStatsData?.weeklyAbsCount || 0,
      target: goalsData?.weekly_abs || null,
      unit: '회',
      icon: '🏃‍♀️',
      color: 'yellow',
    },
    {
      id: 'cardio',
      title: '유산소 운동',
      current: weeklyStatsData?.weeklyCardioCount || 0,
      target: goalsData?.weekly_cardio || null,
      unit: '회',
      icon: '🏃',
      color: 'cyan',
    },
  ].filter(goal => goal.target !== null); // 목표가 설정된 항목만 표시

  // 식단 목표 데이터 (일간 기준)
  const nutritionGoals = [
    {
      id: 'calories',
      title: '일일 칼로리',
      current: statsData?.dailyCalories || 0,
      target: goalsData?.daily_calories_target || null,
      unit: 'kcal',
      icon: '🔥',
      color: 'red',
    },
    {
      id: 'carbs',
      title: '일일 탄수화물',
      current: statsData?.dailyCarbs || 0,
      target: goalsData?.daily_carbs_target || null,
      unit: 'g',
      icon: '🍞',
      color: 'yellow',
    },
    {
      id: 'protein',
      title: '일일 단백질',
      current: statsData?.dailyProtein || 0,
      target: goalsData?.daily_protein_target || null,
      unit: 'g',
      icon: '🥩',
      color: 'red',
    },
    {
      id: 'fat',
      title: '일일 지방',
      current: statsData?.dailyFat || 0,
      target: goalsData?.daily_fat_target || null,
      unit: 'g',
      icon: '🥑',
      color: 'green',
    },
  ].filter(goal => goal.target !== null); // 목표가 설정된 항목만 표시

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
      case 'purple':
        return 'bg-purple-500';
      case 'orange':
        return 'bg-orange-500';
      case 'pink':
        return 'bg-pink-500';
      case 'cyan':
        return 'bg-cyan-500';
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
      case 'purple':
        return 'text-purple-600';
      case 'orange':
        return 'text-orange-600';
      case 'pink':
        return 'text-pink-600';
      case 'cyan':
        return 'text-cyan-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateProgress = (current: number, target: number | null) => {
    if (target === null || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return '완료';
    if (progress >= 80) return '거의 완료';
    if (progress >= 50) return '진행 중';
    return '시작 필요';
  };

  const calculateOverallProgress = (goals: typeof exerciseGoals) => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((acc, goal) => acc + calculateProgress(goal.current, goal.target), 0);
    return Math.round(totalProgress / goals.length);
  };

  const getCompletedGoalsCount = (goals: typeof exerciseGoals) => {
    return goals.filter(goal => calculateProgress(goal.current, goal.target) >= 100).length;
  };

  return (
    <div className="space-y-8">
      {/* 목표 설정 상태 표시 */}
      {hasGoals && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center text-sm text-green-700">
            <span className="mr-2">✅</span>
            사용자 목표가 DB 최신 기록에서 연동되었습니다 ({goalsData?.created_at ? new Date(goalsData.created_at).toLocaleDateString('ko-KR') : ''} 설정)
          </div>
        </div>
      )}

      {/* 운동 목표 섹션 */}
      {exerciseGoals.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🏋️‍♂️</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">운동 목표 달성률</h3>
              <p className="text-sm text-gray-600">이번 주 운동 목표 달성 현황 (주간 기준)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exerciseGoals.map((goal) => {
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

                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{goal.current}</span>
                    <span> / {goal.target} {goal.unit}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {goal.current >= (goal.target || 0) ? '목표 달성!' : `${(goal.target || 0) - goal.current} ${goal.unit} 남음`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 운동 목표 전체 달성률 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">운동 목표 전체 달성률</h4>
                <p className="text-sm text-gray-600">설정된 운동 목표의 평균 달성률</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateOverallProgress(exerciseGoals)}%
                </div>
                <div className="text-sm text-gray-500">
                  {getCompletedGoalsCount(exerciseGoals)} / {exerciseGoals.length} 목표 달성
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 식단 목표 섹션 */}
      {nutritionGoals.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🍽️</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">식단 목표 달성률</h3>
              <p className="text-sm text-gray-600">오늘 식단 목표 달성 현황 (일간 기준)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nutritionGoals.map((goal) => {
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

                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{Math.round(goal.current * 10) / 10}</span>
                    <span> / {goal.target} {goal.unit}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {goal.current >= (goal.target || 0) ? '목표 달성!' : `${Math.round(((goal.target || 0) - goal.current) * 10) / 10} ${goal.unit} 남음`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 식단 목표 전체 달성률 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">식단 목표 전체 달성률</h4>
                <p className="text-sm text-gray-600">설정된 식단 목표의 평균 달성률</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {calculateOverallProgress(nutritionGoals)}%
                </div>
                <div className="text-sm text-gray-500">
                  {getCompletedGoalsCount(nutritionGoals)} / {nutritionGoals.length} 목표 달성
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 목표가 설정되지 않은 경우 */}
      {exerciseGoals.length === 0 && nutritionGoals.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-lg font-medium mb-2">표시할 목표가 없습니다</p>
            <p className="text-sm">목표를 설정하여 진행률을 확인해보세요!</p>
          </div>
        </div>
      )}
    </div>
  );
}; 