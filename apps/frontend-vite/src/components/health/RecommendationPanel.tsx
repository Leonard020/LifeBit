import React from 'react';
import { useRecommendations } from '../../api/healthApi';
import { Brain, Dumbbell, Apple, Lightbulb, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RecommendationPanelProps {
  userId: string;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  userId,
}) => {
  // AI 추천 데이터 가져오기
  const { data: recommendations, isLoading, error } = useRecommendations(userId);

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

  // 임시 추천 데이터 (나중에 실제 AI 추천으로 교체)
  const mockRecommendations = {
    exercise_recommendations: [
      {
        type: '유산소 운동',
        duration: 30,
        intensity: '중간',
        reason: '체중 감량을 위해 일일 30분 유산소 운동을 권장합니다.',
        icon: '🏃‍♂️',
        color: 'blue'
      },
      {
        type: '근력 운동',
        duration: 20,
        intensity: '높음',
        reason: '근육량 증가를 위한 스쿼트, 데드리프트를 권장합니다.',
        icon: '💪',
        color: 'purple'
      },
    ],
    nutrition_recommendations: [
      {
        type: '단백질 섭취',
        food: '닭가슴살',
        amount: '150g',
        reason: '근육 회복을 위해 단백질 섭취를 늘려보세요.',
        icon: '🍗',
        color: 'green'
      },
      {
        type: '탄수화물 조절',
        food: '현미',
        amount: '100g',
        reason: '혈당 조절을 위해 정제된 탄수화물 대신 현미를 섭취하세요.',
        icon: '🍚',
        color: 'orange'
      },
    ],
    health_tips: [
      {
        tip: '충분한 수면을 취하세요. 하루 7-8시간의 수면이 체중 조절에 도움이 됩니다.',
        priority: 'high' as const,
        icon: '😴',
      },
      {
        tip: '하루 2L 이상의 물을 마시세요. 수분 섭취는 신진대사를 촉진합니다.',
        priority: 'medium' as const,
        icon: '💧',
      },
    ],
  };

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
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Dumbbell className="h-5 w-5 mr-2 text-blue-600" />
          운동 추천
        </h4>
        <div className="space-y-4">
          {mockRecommendations.exercise_recommendations.map((rec, index) => (
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

      {/* 영양 추천 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Apple className="h-5 w-5 mr-2 text-green-600" />
          영양 추천
        </h4>
        <div className="space-y-4">
          {mockRecommendations.nutrition_recommendations.map((rec, index) => (
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

      {/* 건강 팁 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
          건강 팁
        </h4>
        <div className="space-y-3">
          {mockRecommendations.health_tips.map((tip, index) => {
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
    </div>
  );
}; 