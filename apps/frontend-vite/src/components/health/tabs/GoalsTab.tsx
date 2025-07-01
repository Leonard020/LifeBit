import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Target, Activity, Info } from 'lucide-react';
import { GoalAchievements } from '../types/analytics';
import { getDateRange, getExerciseTarget, getNutritionTarget, calculateExerciseScore, calculateNutritionScore } from '../utils/analyticsUtils';

interface GoalsTabProps {
  goalAchievements: GoalAchievements;
  goalsData: {
    user_goal_id?: number;
    created_at?: string;
    weekly_workout_target?: number;
    exercise_minutes_per_day?: number;
    calories_per_day?: number;
    carbs_per_day?: number;
    protein_per_day?: number;
    fat_per_day?: number;
  } | null;
  healthStats: {
    weeklyTotalSets?: number;
  } | null;
  chartData: Array<{ exerciseMinutes: number }>;
  nutritionStats: {
    totalCalories?: number;
    totalCarbs?: number;
    totalProtein?: number;
    totalFat?: number;
  } | null;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goalAchievements,
  goalsData,
  healthStats,
  chartData,
  nutritionStats
}) => {
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>('day');

  // 상세 운동 데이터 계산 함수
  const calculateDetailedExerciseData = () => {
    const exerciseDetails = {
      chest: { current: 0, target: 0, hasTarget: false },
      back: { current: 0, target: 0, hasTarget: false },
      legs: { current: 0, target: 0, hasTarget: false },
      shoulders: { current: 0, target: 0, hasTarget: false },
      arms: { current: 0, target: 0, hasTarget: false },
      abs: { current: 0, target: 0, hasTarget: false }
    };

    // 실제 데이터가 있다면 계산
    if (goalAchievements?.bodyParts) {
      Object.keys(exerciseDetails).forEach(bodyPart => {
        const key = bodyPart as keyof typeof exerciseDetails;
        const data = goalAchievements.bodyParts[key];
        if (data) {
          exerciseDetails[key] = {
            current: data.current,
            target: data.target,
            hasTarget: data.hasTarget
          };
        }
      });
    }

    return exerciseDetails;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-purple-600" />
            목표 달성률 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p>목표 달성률 차트가 여기에 표시됩니다.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 📊 상세 운동 목표 달성률 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              상세 운동 목표 달성률 (주간)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 전체 운동 목표 */}
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">주간 총 운동 세트 수</span>
                  <span className="text-2xl font-bold text-green-600">
                    {healthStats?.weeklyTotalSets || 0}세트
                  </span>
                </div>
                <div className="relative">
                  <Progress value={goalsData?.weekly_workout_target 
                    ? Math.min(((healthStats?.weeklyTotalSets || 0) / goalsData.weekly_workout_target) * 100, 100)
                    : 0} className="h-4" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white drop-shadow">
                      {goalsData?.weekly_workout_target 
                        ? Math.round(((healthStats?.weeklyTotalSets || 0) / goalsData.weekly_workout_target) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0세트</span>
                  <span>목표: {goalsData?.weekly_workout_target || 0}세트</span>
                </div>
              </div>

              {/* 운동 부위별 목표 달성률 */}
              {(() => {
                const exerciseDetails = calculateDetailedExerciseData();
                const hasAnyTarget = Object.values(exerciseDetails).some(detail => detail.hasTarget);
                
                if (!hasAnyTarget) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Info className="h-8 w-8 mx-auto mb-2" />
                      <p>운동 부위별 목표가 설정되지 않았습니다.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">운동 부위별 달성률 (세트 수 기준)</h4>
                    
                    {Object.entries(exerciseDetails).map(([bodyPart, detail]) => {
                      if (!detail.hasTarget) return null;
                      
                      const bodyPartNames: Record<string, string> = {
                        chest: '가슴',
                        back: '등',
                        legs: '다리',
                        shoulders: '어깨',
                        arms: '팔',
                        abs: '복근'
                      };
                      
                      const bodyPartEmojis: Record<string, string> = {
                        chest: '💪',
                        back: '🏋️',
                        legs: '🦵',
                        shoulders: '🤲',
                        arms: '💪',
                        abs: '🎯'
                      };

                      return (
                        <div key={bodyPart} className="bg-red-50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {bodyPartEmojis[bodyPart]} {bodyPartNames[bodyPart]} 운동
                            </span>
                            <span className="text-sm font-bold text-red-600">
                              {detail.current}세트 / {detail.target}세트
                            </span>
                          </div>
                          <Progress 
                            value={Math.min((detail.current / detail.target) * 100, 100)} 
                            className="h-2" 
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* 🏋️ 운동 부위별 주간 목표 달성률 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-600" />
              운동 부위별 주간 목표 달성률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* 가슴 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">💪</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">가슴</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.chest.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.chest.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.chest.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.chest.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.chest.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.chest.hasTarget 
                    ? `${goalAchievements.bodyParts.chest.current}분 / ${goalAchievements.bodyParts.chest.target}분`
                    : `${goalAchievements.bodyParts.chest.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 등 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🏋️</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">등</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.back.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.back.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.back.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.back.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.back.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.back.hasTarget 
                    ? `${goalAchievements.bodyParts.back.current}분 / ${goalAchievements.bodyParts.back.target}분`
                    : `${goalAchievements.bodyParts.back.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 다리 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🦵</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">다리</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.legs.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.legs.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.legs.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.legs.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.legs.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.legs.hasTarget 
                    ? `${goalAchievements.bodyParts.legs.current}분 / ${goalAchievements.bodyParts.legs.target}분`
                    : `${goalAchievements.bodyParts.legs.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 어깨 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🤲</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">어깨</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.shoulders.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.shoulders.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.shoulders.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.shoulders.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.shoulders.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.shoulders.hasTarget 
                    ? `${goalAchievements.bodyParts.shoulders.current}분 / ${goalAchievements.bodyParts.shoulders.target}분`
                    : `${goalAchievements.bodyParts.shoulders.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 팔 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">💪</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">팔</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.arms.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.arms.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.arms.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.arms.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.arms.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.arms.hasTarget 
                    ? `${goalAchievements.bodyParts.arms.current}분 / ${goalAchievements.bodyParts.arms.target}분`
                    : `${goalAchievements.bodyParts.arms.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 복근 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">복근</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.abs.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.abs.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.abs.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.abs.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.abs.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.abs.hasTarget 
                    ? `${goalAchievements.bodyParts.abs.current}분 / ${goalAchievements.bodyParts.abs.target}분`
                    : `${goalAchievements.bodyParts.abs.current}분 / 미설정`
                  }
                </p>
              </div>

              {/* 유산소 */}
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🏃</div>
                <h4 className="font-medium text-sm text-gray-800 mb-2">유산소</h4>
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                    <circle 
                      cx="50" cy="50" r="40" fill="none" 
                      stroke={
                        !goalAchievements.bodyParts.cardio.hasTarget ? "#d1d5db" :
                        goalAchievements.bodyParts.cardio.percentage >= 100 ? "#10b981" : 
                        goalAchievements.bodyParts.cardio.percentage >= 50 ? "#f59e0b" : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.cardio.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-800">
                      {Math.round(goalAchievements.bodyParts.cardio.percentage)}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {goalAchievements.bodyParts.cardio.hasTarget 
                    ? `${goalAchievements.bodyParts.cardio.current}분 / ${goalAchievements.bodyParts.cardio.target}분`
                    : `${goalAchievements.bodyParts.cardio.current}분 / 미설정`
                  }
                </p>
              </div>
            </div>

            {/* 부위별 목표 설정 안내 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-sm text-blue-700">
                <Info className="h-4 w-4 mr-2" />
                <span>
                  운동 부위별 목표는 주간 단위로 설정됩니다. 
                  exercise_catalog 테이블의 target_body_part 정보를 기반으로 계산됩니다.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 