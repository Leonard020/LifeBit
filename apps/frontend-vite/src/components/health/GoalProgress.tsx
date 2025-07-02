import React from 'react';
import { useHealthStatistics, useHealthLogStatistics, useUserGoals } from '../../api/auth';

interface GoalProgressProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  useHealthLogData?: boolean; // 건강로그 전용 데이터 사용 여부
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  userId,
  period,
  useHealthLogData = false,
}) => {
  // 기본 통계 데이터
  const { data: userGoals, isLoading: goalsLoading } = useUserGoals(userId);
  const { data: healthStats, isLoading: statsLoading } = useHealthStatistics(userId, period);
  
  // 건강로그 페이지에서는 건강로그 전용 API 사용, 다른 페이지에서는 일반 API 사용
  const { data: weeklyHealthStats, isLoading: weeklyStatsLoading } = useHealthLogData 
    ? useHealthLogStatistics(userId)
    : useHealthStatistics(userId, 'week');

  if (goalsLoading || statsLoading || weeklyStatsLoading) {
    return (
      <div className="bg-card rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // 목표 데이터 처리
  const goalsData = userGoals?.data;
  const statsData = healthStats?.data;
  const weeklyStatsData = weeklyHealthStats?.data;

  // 진행률 계산 함수
  const calculateProgress = (current: number, target: number | null) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  // 진행률 상태 반환
  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return '달성!';
    if (progress >= 80) return '거의 달성';
    if (progress >= 50) return '진행 중';
    if (progress >= 20) return '시작함';
    return '미시작';
  };

  // 색상 반환 함수들
  const getProgressColor = (color: string) => {
    const colors = {
      red: 'bg-red-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      yellow: 'bg-yellow-500',
      cyan: 'bg-cyan-500',
    };
    return colors[color as keyof typeof colors] || 'bg-gray-500';
  };

  const getProgressTextColor = (color: string) => {
    const colors = {
      red: 'text-red-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      pink: 'text-pink-600',
      yellow: 'text-yellow-600',
      cyan: 'text-cyan-600',
    };
    return colors[color as keyof typeof colors] || 'text-gray-600';
  };

  // 전체 달성률 계산
  const calculateOverallProgress = (goals: any[]) => {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => sum + calculateProgress(goal.current, goal.target), 0);
    return Math.round(totalProgress / goals.length);
  };

  // 달성한 목표 수 계산
  const getCompletedGoalsCount = (goals: any[]) => {
    return goals.filter(goal => calculateProgress(goal.current, goal.target) >= 100).length;
  };

  // 운동 목표 데이터 (주간 기준, 건강로그 모드에서는 횟수, 일반 모드에서는 횟수)
  const exerciseGoals = [
    {
      id: 'chest',
      title: '가슴 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyChestCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyChest || 0),
      target: goalsData?.weekly_chest || null,
      unit: '회',
      icon: '💪',
      color: 'red',
    },
    {
      id: 'back',
      title: '등 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyBackCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyBack || 0),
      target: goalsData?.weekly_back || null,
      unit: '회',
      icon: '🏋️‍♂️',
      color: 'green',
    },
    {
      id: 'legs',
      title: '다리 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyLegsCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyLegs || 0),
      target: goalsData?.weekly_legs || null,
      unit: '회',
      icon: '🦵',
      color: 'purple',
    },
    {
      id: 'shoulders',
      title: '어깨 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyShouldersCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyShoulders || 0),
      target: goalsData?.weekly_shoulders || null,
      unit: '회',
      icon: '🤸‍♂️',
      color: 'orange',
    },
    {
      id: 'arms',
      title: '팔 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyArmsCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyArms || 0),
      target: goalsData?.weekly_arms || null,
      unit: '회',
      icon: '💪',
      color: 'pink',
    },
    {
      id: 'abs',
      title: '복근 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyAbsCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyAbs || 0),
      target: goalsData?.weekly_abs || null,
      unit: '회',
      icon: '🏃‍♀️',
      color: 'yellow',
    },
    {
      id: 'cardio',
      title: '유산소 운동',
      current: useHealthLogData 
        ? (weeklyStatsData?.weeklyCardioCounts_healthloguse || 0)
        : (weeklyStatsData?.weeklyCardio || 0),
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
      title: '칼로리',
      current: statsData?.dailyCalories || 0,
      target: goalsData?.daily_calories_target || null,
      unit: 'kcal',
      icon: '🔥',
      color: 'orange',
    },
    {
      id: 'carbs',
      title: '탄수화물',
      current: statsData?.dailyCarbs || 0,
      target: goalsData?.daily_carbs_target || null,
      unit: 'g',
      icon: '🍞',
      color: 'yellow',
    },
    {
      id: 'protein',
      title: '단백질',
      current: statsData?.dailyProtein || 0,
      target: goalsData?.daily_protein_target || null,
      unit: 'g',
      icon: '🥩',
      color: 'red',
    },
    {
      id: 'fat',
      title: '지방',
      current: statsData?.dailyFat || 0,
      target: goalsData?.daily_fat_target || null,
      unit: 'g',
      icon: '🥑',
      color: 'green',
    },
  ].filter(goal => goal.target !== null); // 목표가 설정된 항목만 표시

  return (
    <div className="space-y-6">
      {/* 운동 목표 섹션 */}
      {exerciseGoals.length > 0 && (
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🏋️‍♂️</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">운동 목표 달성률</h3>
              <p className="text-sm text-muted-foreground">이번 주 운동 횟수 목표 달성 현황 (주간 기준)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exerciseGoals.map((goal) => {
              const progress = calculateProgress(goal.current, goal.target);
              const status = getProgressStatus(progress);

              return (
                <div key={goal.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{goal.icon}</span>
                      <h4 className="font-medium text-foreground">{goal.title}</h4>
                    </div>
                    <span className={`text-sm font-medium ${getProgressTextColor(goal.color)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>진행률</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(goal.color)} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{goal.current}</span>
                    <span> / {goal.target} {goal.unit}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {goal.current >= (goal.target || 0) ? '목표 달성!' : `${(goal.target || 0) - goal.current} ${goal.unit} 남음`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 운동 목표 전체 달성률 */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">운동 목표 전체 달성률</h4>
                <p className="text-sm text-muted-foreground">설정된 운동 목표의 평균 달성률</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {calculateOverallProgress(exerciseGoals)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {getCompletedGoalsCount(exerciseGoals)} / {exerciseGoals.length} 목표 달성
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 식단 목표 섹션 */}
      {nutritionGoals.length > 0 && (
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="text-2xl mr-3">🍽️</div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">식단 목표 달성률</h3>
              <p className="text-sm text-muted-foreground">오늘의 영양소 섭취 목표 달성 현황 (일간 기준)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {nutritionGoals.map((goal) => {
              const progress = calculateProgress(goal.current, goal.target);
              const status = getProgressStatus(progress);

              return (
                <div key={goal.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{goal.icon}</span>
                      <h4 className="font-medium text-foreground">{goal.title}</h4>
                    </div>
                    <span className={`text-sm font-medium ${getProgressTextColor(goal.color)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>진행률</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(goal.color)} transition-all duration-300`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{Math.round(goal.current)}</span>
                    <span> / {goal.target} {goal.unit}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {goal.current >= (goal.target || 0) ? '목표 달성!' : `${Math.round((goal.target || 0) - goal.current)} ${goal.unit} 남음`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 식단 목표 전체 달성률 */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">식단 목표 전체 달성률</h4>
                <p className="text-sm text-muted-foreground">설정된 영양소 목표의 평균 달성률</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {calculateOverallProgress(nutritionGoals)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {getCompletedGoalsCount(nutritionGoals)} / {nutritionGoals.length} 목표 달성
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 목표가 설정되지 않은 경우 */}
      {exerciseGoals.length === 0 && nutritionGoals.length === 0 && (
        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium mb-2">목표가 설정되지 않았습니다</h3>
            <p className="text-sm">프로필 페이지에서 운동 및 식단 목표를 설정해보세요!</p>
          </div>
        </div>
      )}
    </div>
  );
}; 