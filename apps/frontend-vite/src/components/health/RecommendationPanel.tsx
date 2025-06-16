import React from 'react';
import { useRecommendations } from '../../api/healthApi';

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>추천을 불러오는 중 오류가 발생했습니다.</p>
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
      },
      {
        type: '근력 운동',
        duration: 20,
        intensity: '높음',
        reason: '근육량 증가를 위한 스쿼트, 데드리프트를 권장합니다.',
      },
    ],
    nutrition_recommendations: [
      {
        type: '단백질 섭취',
        food: '닭가슴살',
        amount: '150g',
        reason: '근육 회복을 위해 단백질 섭취를 늘려보세요.',
      },
      {
        type: '탄수화물 조절',
        food: '현미',
        amount: '100g',
        reason: '혈당 조절을 위해 정제된 탄수화물 대신 현미를 섭취하세요.',
      },
    ],
    health_tips: [
      {
        tip: '충분한 수면을 취하세요. 하루 7-8시간의 수면이 체중 조절에 도움이 됩니다.',
        priority: 'high' as const,
      },
      {
        tip: '하루 2L 이상의 물을 마시세요. 수분 섭취는 신진대사를 촉진합니다.',
        priority: 'medium' as const,
      },
    ],
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityText = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      case 'low':
        return '낮음';
      default:
        return '보통';
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">🤖</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI 건강 추천</h3>
            <p className="text-sm text-gray-600">개인 맞춤 건강 관리 팁</p>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 운동 추천 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🏃‍♂️</span>
          운동 추천
        </h4>
        <div className="space-y-4">
          {mockRecommendations.exercise_recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900">{rec.type}</h5>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {rec.duration}분
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                강도: <span className="font-medium">{rec.intensity}</span>
              </p>
              <p className="text-sm text-gray-700">{rec.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 영양 추천 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🥗</span>
          영양 추천
        </h4>
        <div className="space-y-4">
          {mockRecommendations.nutrition_recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900">{rec.type}</h5>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  {rec.amount}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                추천 음식: <span className="font-medium">{rec.food}</span>
              </p>
              <p className="text-sm text-gray-700">{rec.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 건강 팁 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💡</span>
          건강 팁
        </h4>
        <div className="space-y-3">
          {mockRecommendations.health_tips.map((tip, index) => (
            <div
              key={index}
              className={`border-l-4 p-4 ${getPriorityColor(tip.priority)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-900">
                  우선순위: {getPriorityText(tip.priority)}
                </span>
              </div>
              <p className="text-sm text-gray-700">{tip.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 