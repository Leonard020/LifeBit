import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Utensils, Clock, Zap } from 'lucide-react';

interface StructuredDataPreviewProps {
  structuredData: any;
  isSuccess: boolean;
}

// 식단 데이터를 자연스러운 문장으로 변환하는 함수
const formatDietData = (data: any) => {
  if (!data) return null;

  // 식단 데이터인지 확인
  if (data.food_name && data.meal_time) {
    return {
      type: 'diet',
      title: `${data.meal_time} 식단 기록`,
      items: [
        {
          icon: <Utensils className="h-4 w-4 text-blue-600" />,
          label: "음식",
          value: data.food_name
        },
        {
          icon: <Clock className="h-4 w-4 text-green-600" />,
          label: "식사 시간",
          value: data.meal_time
        },
        {
          icon: <Zap className="h-4 w-4 text-orange-600" />,
          label: "양",
          value: data.amount || "1인분"
        }
      ],
      nutrition: data.nutrition ? {
        calories: data.nutrition.calories,
        carbs: data.nutrition.carbs,
        protein: data.nutrition.protein,
        fat: data.nutrition.fat
      } : null
    };
  }

  // 운동 데이터나 기타 데이터는 기존 방식 유지
  return {
    type: 'other',
    data: data
  };
};

export const StructuredDataPreview: React.FC<StructuredDataPreviewProps> = ({
  structuredData,
  isSuccess
}) => {
  if (!structuredData || !isSuccess) {
    return null;
  }

  const formattedData = formatDietData(structuredData);

  return (
    <Card className="mb-6 border-green-200 bg-green-50 animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <CheckCircle className="mr-2 h-5 w-5" />
          {formattedData?.type === 'diet' ? '식단 기록 미리보기' : '구조화된 데이터'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formattedData?.type === 'diet' ? (
          <div className="space-y-4">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-800 mb-3">{formattedData.title}</h3>
              <div className="space-y-2">
                {formattedData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm text-gray-600 min-w-0 flex-shrink-0">{item.label}:</span>
                    <span className="text-sm font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 영양소 정보 */}
            {formattedData.nutrition && (
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-3">영양소 정보</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-lg font-semibold text-red-600">
                      {formattedData.nutrition.calories}
                    </div>
                    <div className="text-xs text-gray-500">칼로리</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {formattedData.nutrition.carbs}
                    </div>
                    <div className="text-xs text-gray-500">탄수화물</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {formattedData.nutrition.protein}
                    </div>
                    <div className="text-xs text-gray-500">단백질</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-600">
                      {formattedData.nutrition.fat}
                    </div>
                    <div className="text-xs text-gray-500">지방</div>
                  </div>
                </div>
              </div>
            )}

            {/* 저장될 실제 데이터 (개발자용 - 선택적으로 표시) */}
            <details className="bg-gray-50 rounded-lg p-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                저장될 데이터 보기 (개발자용)
              </summary>
              <pre className="text-xs bg-white p-2 rounded border mt-2 overflow-x-auto">
                {JSON.stringify(structuredData, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          // 기존 방식 (운동 등 다른 데이터)
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(structuredData, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};
