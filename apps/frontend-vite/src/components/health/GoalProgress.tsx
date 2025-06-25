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

  // 실제 API 데이터에서 목표 값 추출
  const goalsData = userGoals?.data || userGoals;
  const statsData = healthStats?.data || healthStats;

  console.log('🎯 [GoalProgress] 사용자 목표 데이터:', goalsData);
  console.log('📊 [GoalProgress] 건강 통계 데이터:', statsData);

  // 목표가 설정되지 않은 경우 처리
  const hasGoals = goalsData && (
    goalsData.weekly_workout_target || 
    goalsData.daily_carbs_target || 
    goalsData.daily_protein_target || 
    goalsData.daily_fat_target
  );

  // 목표 데이터 (DB에서 가져온 실제 데이터만 사용, 기본값 제거)
  const targetGoals = {
    weekly_workout_target: goalsData?.weekly_workout_target ? goalsData.weekly_workout_target * 60 : null, // 횟수를 시간(분)으로 변환
    daily_carbs_target: goalsData?.daily_carbs_target || null,
    daily_protein_target: goalsData?.daily_protein_target || null,
    daily_fat_target: goalsData?.daily_fat_target || null,
  };

  // 현재 진행 상황 (통계 데이터에서 추출)
  const currentProgress = {
    weekly_workout_current: statsData?.weeklyExerciseMinutes || 0,
    daily_carbs_current: statsData?.dailyCarbsIntake || 0,
    daily_protein_current: statsData?.dailyProteinIntake || 0,
    daily_fat_current: statsData?.dailyFatIntake || 0,
  };

  console.log('🎯 [GoalProgress] 목표 값:', targetGoals);
  console.log('📈 [GoalProgress] 현재 진행률:', currentProgress);

  // 목표가 설정된 항목만 필터링
  const goals = [
    {
      id: 'workout',
      title: '주간 운동 시간',
      current: currentProgress.weekly_workout_current,
      target: targetGoals.weekly_workout_target,
      unit: '분',
      icon: '🏃‍♂️',
      color: 'blue',
    },
    {
      id: 'carbs',
      title: '일일 탄수화물',
      current: currentProgress.daily_carbs_current,
      target: targetGoals.daily_carbs_target,
      unit: 'g',
      icon: '🍞',
      color: 'yellow',
    },
    {
      id: 'protein',
      title: '일일 단백질',
      current: currentProgress.daily_protein_current,
      target: targetGoals.daily_protein_target,
      unit: 'g',
      icon: '🥩',
      color: 'red',
    },
    {
      id: 'fat',
      title: '일일 지방',
      current: currentProgress.daily_fat_current,
      target: targetGoals.daily_fat_target,
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

      {/* 목표 설정 상태 표시 */}
      {hasGoals && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center text-sm text-green-700">
            <span className="mr-2">✅</span>
            사용자 목표가 DB 최신 기록에서 연동되었습니다 ({goalsData?.created_at ? new Date(goalsData.created_at).toLocaleDateString('ko-KR') : ''} 설정)
          </div>
        </div>
      )}

      {!hasGoals && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-center">
            <div className="text-amber-600 text-lg mb-2">⚠️ 목표가 설정되지 않았습니다</div>
            <p className="text-sm text-amber-700 mb-3">
              개인 목표를 설정하여 진행률을 확인해보세요!
            </p>
            <button 
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              onClick={() => {
                // 목표 설정 페이지로 이동하는 로직 추가
                console.log('목표 설정 페이지로 이동');
              }}
            >
              목표 설정하기
            </button>
          </div>
        </div>
      )}

      {goals.length > 0 ? (
        <>
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
                      {goal.current >= (goal.target || 0) ? '목표 달성!' : `${(goal.target || 0) - goal.current} ${goal.unit} 남음`}
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
                <p className="text-sm text-gray-600">설정된 목표의 평균 달성률</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(goals.reduce((acc, goal) => acc + calculateProgress(goal.current, goal.target), 0) / goals.length)}%
                </div>
                <div className="text-sm text-gray-500">
                  {goals.filter(goal => calculateProgress(goal.current, goal.target) >= 100).length} / {goals.length} 목표 달성
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-lg font-medium mb-2">표시할 목표가 없습니다</p>
          <p className="text-sm">목표를 설정하여 진행률을 확인해보세요!</p>
        </div>
      )}
    </div>
  );
}; 