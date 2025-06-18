import React, { useMemo } from 'react';
import { useRecommendations, useHealthRecords, useExerciseSessions } from '../../api/healthApi';
import { Brain, Dumbbell, Apple, Lightbulb, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecommendationPanelProps {
  userId: string;
}

interface SmartRecommendation {
  exercise_recommendations: Array<{
    type: string;
    duration: number;
    intensity: string;
    reason: string;
    icon: string;
    color: string;
  }>;
  nutrition_recommendations: Array<{
    type: string;
    food: string;
    amount: string;
    reason: string;
    icon: string;
    color: string;
  }>;
  health_tips: Array<{
    tip: string;
    priority: 'high' | 'medium' | 'low';
    icon: string;
  }>;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  userId,
}) => {
  // 실제 API 데이터 가져오기
  const { data: recommendations, isLoading: recLoading, error: recError } = useRecommendations(userId);
  const { data: healthRecords, isLoading: healthLoading } = useHealthRecords(userId, 'month');
  const { data: exerciseData, isLoading: exerciseLoading } = useExerciseSessions(userId, 'month');

  const isLoading = recLoading || healthLoading || exerciseLoading;
  const error = recError;

  // 건강 데이터 기반 스마트 추천 생성
  const smartRecommendations: SmartRecommendation = useMemo(() => {
    // 데이터 타입 안전성 검사 추가
    const safeHealthRecords = Array.isArray(healthRecords) ? healthRecords : [];
    const safeExerciseData = Array.isArray(exerciseData) ? exerciseData : [];
    
    if (safeHealthRecords.length === 0 && safeExerciseData.length === 0) {
      // 데이터가 없을 때 기본 추천 반환
      return {
        exercise_recommendations: [{
          type: '기본 운동',
          duration: 30,
          intensity: '낮음',
          reason: '건강한 생활을 위해 규칙적인 운동을 시작해보세요.',
          icon: '🏃‍♂️',
          color: 'blue'
        }],
        nutrition_recommendations: [{
          type: '균형 식단',
          food: '다양한 영양소',
          amount: '적정량',
          reason: '균형 잡힌 식단으로 건강을 관리하세요.',
          icon: '🥗',
          color: 'green'
        }],
        health_tips: [{
          tip: '건강한 생활습관을 만들어보세요. 작은 변화부터 시작하는 것이 중요합니다.',
          priority: 'medium' as const,
          icon: '💡'
        }]
      };
    }

    // 최근 건강 기록 가져오기
    const recentHealthRecord = safeHealthRecords.length > 0 
      ? safeHealthRecords[safeHealthRecords.length - 1] 
      : null;
    
    const recentWeight = recentHealthRecord?.weight || 70;
    const recentBMI = recentHealthRecord?.bmi || 23;

    // 체중 변화 계산
    const weightTrend = safeHealthRecords.length >= 2
      ? safeHealthRecords[safeHealthRecords.length - 1]?.weight - safeHealthRecords[0]?.weight 
      : 0;

    // 최근 한 달 운동 빈도 계산
    const monthlyExerciseCount = safeExerciseData.length;
    const weeklyExerciseAvg = monthlyExerciseCount / 4;

    // 총 운동 시간 계산
    const totalExerciseTime = safeExerciseData.reduce((sum: number, session: { duration_minutes: number }) => 
      sum + session.duration_minutes, 0);

    // 스마트 추천 생성
    const exerciseRecommendations = [];
    const nutritionRecommendations = [];
    const healthTips = [];

    // 운동 추천 로직
    if (weeklyExerciseAvg < 3) {
      exerciseRecommendations.push({
        type: '운동 빈도 증가',
        duration: 30,
        intensity: '낮음',
        reason: `현재 주 ${Math.round(weeklyExerciseAvg)}회 운동 중입니다. 주 3회 이상 운동을 권장합니다.`,
        icon: '📈',
        color: 'blue'
      });
    }

    if (recentBMI > 25) {
      exerciseRecommendations.push({
        type: '유산소 운동',
        duration: 45,
        intensity: '중간',
        reason: `BMI ${recentBMI}로 체중 관리를 위한 유산소 운동을 권장합니다.`,
        icon: '🏃‍♂️',
        color: 'purple'
      });
    } else if (recentBMI < 18.5) {
      exerciseRecommendations.push({
        type: '근력 운동',
        duration: 30,
        intensity: '중간',
        reason: `BMI ${recentBMI}로 근육량 증가를 위한 근력 운동을 권장합니다.`,
        icon: '💪',
        color: 'orange'
      });
    } else {
      exerciseRecommendations.push({
        type: '균형 운동',
        duration: 30,
        intensity: '중간',
        reason: `현재 BMI ${recentBMI}로 정상 범위입니다. 균형 잡힌 운동을 계속하세요.`,
        icon: '⚖️',
        color: 'green'
      });
    }

    // 영양 추천 로직
    if (weightTrend > 2) {
      nutritionRecommendations.push({
        type: '칼로리 조절',
        food: '저칼로리 식품',
        amount: '적정량',
        reason: `최근 ${weightTrend.toFixed(1)}kg 증가했습니다. 칼로리 섭취를 조절해보세요.`,
        icon: '🥬',
        color: 'green'
      });
    } else if (weightTrend < -2) {
      nutritionRecommendations.push({
        type: '영양 보충',
        food: '고단백 식품',
        amount: '충분한 양',
        reason: `최근 ${Math.abs(weightTrend).toFixed(1)}kg 감소했습니다. 충분한 영양 섭취가 필요합니다.`,
        icon: '🥩',
        color: 'orange'
      });
    }

    if (recentBMI > 25) {
      nutritionRecommendations.push({
        type: '식이섬유 섭취',
        food: '채소와 과일',
        amount: '하루 5회 이상',
        reason: '체중 관리를 위해 식이섬유가 풍부한 음식을 섭취하세요.',
        icon: '🥕',
        color: 'green'
      });
    }

    // 기본 영양 추천
    if (nutritionRecommendations.length === 0) {
      nutritionRecommendations.push({
        type: '단백질 섭취',
        food: '닭가슴살, 두부',
        amount: '체중 1kg당 1g',
        reason: '근육 유지와 회복을 위해 적절한 단백질 섭취가 중요합니다.',
        icon: '🍗',
        color: 'blue'
      });
    }

    // 건강 팁 로직
    if (monthlyExerciseCount < 8) {
      healthTips.push({
        tip: '운동 습관을 만들어보세요. 하루 10분부터 시작해도 좋습니다.',
        priority: 'high' as const,
        icon: '🎯'
      });
    }

    if (recentBMI > 25 || recentBMI < 18.5) {
      healthTips.push({
        tip: '정기적인 건강 검진을 받고 전문가와 상담하세요.',
        priority: 'high' as const,
        icon: '🏥'
      });
    }

    // 기본 건강 팁
    healthTips.push({
      tip: '충분한 수면을 취하세요. 하루 7-8시간의 수면이 건강에 도움됩니다.',
      priority: 'medium' as const,
      icon: '😴'
    });

    healthTips.push({
      tip: '하루 2L 이상의 물을 마시세요. 수분 섭취는 신진대사를 촉진합니다.',
      priority: 'medium' as const,
      icon: '💧'
    });

    return {
      exercise_recommendations: exerciseRecommendations,
      nutrition_recommendations: nutritionRecommendations,
      health_tips: healthTips
    };
  }, [healthRecords, exerciseData]);

  const getPriorityConfig = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return {
          color: 'border-l-red-500 bg-red-50',
          badge: 'bg-red-100 text-red-800',
          text: '높음',
          icon: AlertCircle
        };
      case 'medium':
        return {
          color: 'border-l-yellow-500 bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800',
          text: '보통',
          icon: Clock
        };
      case 'low':
        return {
          color: 'border-l-green-500 bg-green-50',
          badge: 'bg-green-100 text-green-800',
          text: '낮음',
          icon: CheckCircle2
        };
      default:
        return {
          color: 'border-l-gray-500 bg-gray-50',
          badge: 'bg-gray-100 text-gray-800',
          text: '보통',
          icon: Clock
        };
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center text-red-600">
          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>추천을 불러오는 중 오류가 발생했습니다.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <div className="bg-white rounded-lg p-2 mr-3 shadow-sm">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI 건강 추천</h3>
            <p className="text-sm text-gray-600">개인 맞춤 건강 관리 팁</p>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="h-4 w-4 mr-1" />
          마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 운동 추천 */}
      {smartRecommendations.exercise_recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Dumbbell className="h-5 w-5 mr-2 text-blue-600" />
            운동 추천
          </h4>
          <div className="space-y-4">
            {smartRecommendations.exercise_recommendations.map((rec, index) => (
              <div key={index} className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${getColorClasses(rec.color)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rec.icon}</span>
                    <h5 className="font-medium text-gray-900">{rec.type}</h5>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {rec.duration}분
                    </span>
                    <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                      <Zap className="h-3 w-3 inline mr-1" />
                      {rec.intensity}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 영양 추천 */}
      {smartRecommendations.nutrition_recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Apple className="h-5 w-5 mr-2 text-green-600" />
            영양 추천
          </h4>
          <div className="space-y-4">
            {smartRecommendations.nutrition_recommendations.map((rec, index) => (
              <div key={index} className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${getColorClasses(rec.color)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{rec.icon}</span>
                    <h5 className="font-medium text-gray-900">{rec.type}</h5>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded-full font-medium">
                    {rec.amount}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  추천 음식: <span className="font-medium text-gray-900">{rec.food}</span>
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 건강 팁 */}
      {smartRecommendations.health_tips.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
            건강 팁
          </h4>
          <div className="space-y-3">
            {smartRecommendations.health_tips.map((tip, index) => {
              const config = getPriorityConfig(tip.priority);
              const IconComponent = config.icon;
              
              return (
                <div
                  key={index}
                  className={`border-l-4 rounded-r-lg p-4 ${config.color} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{tip.icon}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.badge}`}>
                        우선순위: {config.text}
                      </span>
                    </div>
                    <IconComponent className="h-4 w-4 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{tip.tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 