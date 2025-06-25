import React from 'react';
import { NutritionGoals } from './types/health';

interface AIRecommendationsProps {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  exerciseMinutes: number;
  caloriesBurned: number;
  nutritionGoals: NutritionGoals;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({
  calories,
  carbs,
  protein,
  fat,
  exerciseMinutes,
  caloriesBurned,
  nutritionGoals
}) => {
  
  // AI 추천 로직
  const getRecommendations = () => {
    const recommendations = [];
    
    // 칼로리 기반 추천
    if (nutritionGoals.calories) {
      const calorieRatio = calories / nutritionGoals.calories;
      if (calorieRatio < 0.8) {
        recommendations.push({
          type: 'nutrition',
          icon: '🍎',
          title: '칼로리 부족',
          message: '건강한 간식을 추가해보세요',
          suggestion: '견과류, 바나나, 요거트 등을 섭취하세요',
          priority: 'high'
        });
      } else if (calorieRatio > 1.2) {
        recommendations.push({
          type: 'exercise',
          icon: '🏃‍♂️',
          title: '칼로리 과다',
          message: '추가 운동을 권장합니다',
          suggestion: '30분 걷기나 계단 오르기를 해보세요',
          priority: 'medium'
        });
      }
    }
    
    // 단백질 기반 추천
    if (nutritionGoals.protein) {
      const proteinRatio = protein / nutritionGoals.protein;
      if (proteinRatio < 0.7) {
        recommendations.push({
          type: 'nutrition',
          icon: '🥩',
          title: '단백질 부족',
          message: '근육 건강을 위해 단백질을 더 섭취하세요',
          suggestion: '닭가슴살, 계란, 두부, 콩류를 추가하세요',
          priority: 'high'
        });
      }
    }
    
    // 탄수화물 기반 추천
    if (nutritionGoals.carbs) {
      const carbRatio = carbs / nutritionGoals.carbs;
      if (carbRatio > 1.3) {
        recommendations.push({
          type: 'nutrition',
          icon: '🥗',
          title: '탄수화물 과다',
          message: '균형잡힌 식단을 위해 채소를 늘려보세요',
          suggestion: '브로콜리, 시금치, 양배추 등을 추가하세요',
          priority: 'medium'
        });
      }
    }
    
    // 운동 기반 추천
    if (exerciseMinutes < 30) {
      recommendations.push({
        type: 'exercise',
        icon: '💪',
        title: '운동 부족',
        message: '건강을 위해 더 많은 활동이 필요해요',
        suggestion: '하루 30분 이상 운동하는 것을 목표로 하세요',
        priority: 'high'
      });
    }
    
    // 칼로리 수지 기반 추천
    const calorieBalance = calories - caloriesBurned;
    if (calorieBalance > 500) {
      recommendations.push({
        type: 'balance',
        icon: '⚖️',
        title: '칼로리 수지 불균형',
        message: '섭취 칼로리가 너무 많습니다',
        suggestion: '유산소 운동을 추가하거나 식단량을 조절하세요',
        priority: 'medium'
      });
    }
    
    // 긍정적인 추천도 추가
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'praise',
        icon: '🎉',
        title: '완벽한 균형!',
        message: '오늘 영양 섭취가 매우 좋습니다',
        suggestion: '이 패턴을 유지하시면 건강한 생활을 할 수 있어요',
        priority: 'low'
      });
    }
    
    return recommendations.slice(0, 4); // 최대 4개까지만 표시
  };
  
  const recommendations = getRecommendations();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-50 to-red-100 border-red-200';
      case 'medium': return 'from-amber-50 to-amber-100 border-amber-200';
      case 'low': return 'from-green-50 to-green-100 border-green-200';
      default: return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };
  
  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-amber-700';
      case 'low': return 'text-green-700';
      default: return 'text-blue-700';
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg border-0">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <span className="text-2xl">🤖</span>
          AI 맞춤 추천
        </h3>
        <p className="text-gray-600">당신의 건강 데이터를 분석한 개인 맞춤 조언입니다</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${getPriorityColor(rec.priority)} rounded-xl p-5 border-2 hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{rec.icon}</div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${getPriorityTextColor(rec.priority)}`}>
                  {rec.title}
                </h4>
                <p className="text-gray-700 text-sm mb-2">{rec.message}</p>
                <p className="text-gray-600 text-xs bg-white/50 rounded-lg p-2">
                  💡 {rec.suggestion}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 추가 건강 팁 */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-center mb-4">💡 오늘의 건강 팁</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl mb-2">💧</div>
            <p className="text-sm font-medium text-blue-800">물 충분히 마시기</p>
            <p className="text-xs text-blue-600 mt-1">하루 8잔 이상</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl mb-2">😴</div>
            <p className="text-sm font-medium text-green-800">충분한 수면</p>
            <p className="text-xs text-green-600 mt-1">7-8시간 권장</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl mb-2">🧘‍♀️</div>
            <p className="text-sm font-medium text-purple-800">스트레스 관리</p>
            <p className="text-xs text-purple-600 mt-1">명상, 요가 추천</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 