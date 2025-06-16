import React from 'react';
import { useHealthRecords } from '../../api/healthApi';

interface StatisticsChartsProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

export const StatisticsCharts: React.FC<StatisticsChartsProps> = ({
  userId,
  period,
}) => {
  // 건강 데이터 가져오기
  const { data: healthData, isLoading, error } = useHealthRecords(userId, period);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  // 임시 차트 데이터 (나중에 실제 차트 라이브러리로 교체)
  const mockChartData = {
    weight: [
      { date: '2024-01-01', value: 70.2 },
      { date: '2024-01-02', value: 70.1 },
      { date: '2024-01-03', value: 70.3 },
      { date: '2024-01-04', value: 70.0 },
      { date: '2024-01-05', value: 69.8 },
      { date: '2024-01-06', value: 69.9 },
      { date: '2024-01-07', value: 70.1 },
    ],
    bmi: [
      { date: '2024-01-01', value: 22.3 },
      { date: '2024-01-02', value: 22.2 },
      { date: '2024-01-03', value: 22.4 },
      { date: '2024-01-04', value: 22.1 },
      { date: '2024-01-05', value: 21.9 },
      { date: '2024-01-06', value: 22.0 },
      { date: '2024-01-07', value: 22.2 },
    ],
    exercise: [
      { date: '2024-01-01', value: 30 },
      { date: '2024-01-02', value: 0 },
      { date: '2024-01-03', value: 45 },
      { date: '2024-01-04', value: 0 },
      { date: '2024-01-05', value: 60 },
      { date: '2024-01-06', value: 0 },
      { date: '2024-01-07', value: 40 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* 체중 변화 차트 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          체중 변화 추이
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {mockChartData.weight.map((point, index) => {
            const maxValue = Math.max(...mockChartData.weight.map(p => p.value));
            const minValue = Math.min(...mockChartData.weight.map(p => p.value));
            const range = maxValue - minValue;
            const height = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-500 rounded-t w-full transition-all hover:bg-blue-600"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {point.value}kg
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          최근 7일간 평균: 70.1kg
        </div>
      </div>

      {/* BMI 변화 차트 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          BMI 변화 추이
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {mockChartData.bmi.map((point, index) => {
            const maxValue = Math.max(...mockChartData.bmi.map(p => p.value));
            const minValue = Math.min(...mockChartData.bmi.map(p => p.value));
            const range = maxValue - minValue;
            const height = range > 0 ? ((point.value - minValue) / range) * 100 : 50;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-green-500 rounded-t w-full transition-all hover:bg-green-600"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {point.value}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          최근 7일간 평균: 22.1
        </div>
      </div>

      {/* 운동 시간 차트 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          일일 운동 시간
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {mockChartData.exercise.map((point, index) => {
            const maxValue = Math.max(...mockChartData.exercise.map(p => p.value));
            const height = maxValue > 0 ? (point.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-purple-500 rounded-t w-full transition-all hover:bg-purple-600"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {point.value}분
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          주간 총 운동 시간: 175분
        </div>
      </div>
    </div>
  );
}; 