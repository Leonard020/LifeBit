import React from 'react';
import { useHealthRecords } from '../../api/healthApi';
import { TrendingUp, TrendingDown, Activity, Weight, BarChart3 } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center text-red-600">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
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

  // 임시 차트 데이터 (나중에 실제 차트 라이브러리로 교체)
  const mockChartData = {
    weight: [
      { date: '1/1', value: 70.2 },
      { date: '1/2', value: 70.1 },
      { date: '1/3', value: 70.3 },
      { date: '1/4', value: 70.0 },
      { date: '1/5', value: 69.8 },
      { date: '1/6', value: 69.9 },
      { date: '1/7', value: 70.1 },
    ],
    bmi: [
      { date: '1/1', value: 22.3 },
      { date: '1/2', value: 22.2 },
      { date: '1/3', value: 22.4 },
      { date: '1/4', value: 22.1 },
      { date: '1/5', value: 21.9 },
      { date: '1/6', value: 22.0 },
      { date: '1/7', value: 22.2 },
    ],
    exercise: [
      { date: '1/1', value: 30 },
      { date: '1/2', value: 0 },
      { date: '1/3', value: 45 },
      { date: '1/4', value: 0 },
      { date: '1/5', value: 60 },
      { date: '1/6', value: 0 },
      { date: '1/7', value: 40 },
    ],
  };

  const getPeriodText = () => {
    switch (period) {
      case 'day': return '일별';
      case 'week': return '주별';
      case 'month': return '월별';
      case 'year': return '연별';
      default: return '월별';
    }
  };

  return (
    <div className="space-y-6">
      {/* 체중 변화 차트 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Weight className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              체중 변화 추이
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-green-600">-0.1kg</span>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-2 mb-4">
          {mockChartData.weight.map((point, index) => {
            const maxValue = Math.max(...mockChartData.weight.map(p => p.value));
            const minValue = Math.min(...mockChartData.weight.map(p => p.value));
            const range = maxValue - minValue || 1;
            const height = ((point.value - minValue) / range) * 80 + 20;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div 
                    className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md w-full transition-all duration-300 hover:from-blue-600 hover:to-blue-500 group-hover:shadow-lg"
                    style={{ height: `${height}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.value}kg
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 font-medium">
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {getPeriodText()} 평균: <span className="font-semibold text-gray-900">70.1kg</span>
          </span>
          <span className="text-gray-500">최근 7일</span>
        </div>
      </div>

      {/* BMI 변화 차트 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              BMI 변화 추이
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-600">정상 범위</span>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-2 mb-4">
          {mockChartData.bmi.map((point, index) => {
            const maxValue = Math.max(...mockChartData.bmi.map(p => p.value));
            const minValue = Math.min(...mockChartData.bmi.map(p => p.value));
            const range = maxValue - minValue || 1;
            const height = ((point.value - minValue) / range) * 80 + 20;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div 
                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-md w-full transition-all duration-300 hover:from-green-600 hover:to-green-500 group-hover:shadow-lg"
                    style={{ height: `${height}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.value}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 font-medium">
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {getPeriodText()} 평균: <span className="font-semibold text-gray-900">22.1</span>
          </span>
          <span className="text-gray-500">정상 범위 (18.5-24.9)</span>
        </div>
      </div>

      {/* 운동 시간 차트 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              일일 운동 시간
            </h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-purple-600">175분/주</span>
          </div>
        </div>
        
        <div className="h-48 flex items-end justify-between gap-2 mb-4">
          {mockChartData.exercise.map((point, index) => {
            const maxValue = Math.max(...mockChartData.exercise.map(p => p.value)) || 60;
            const height = (point.value / maxValue) * 160 + 8;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div 
                    className={`rounded-t-md w-full transition-all duration-300 group-hover:shadow-lg ${
                      point.value > 0 
                        ? 'bg-gradient-to-t from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500' 
                        : 'bg-gray-200'
                    }`}
                    style={{ height: `${height}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.value > 0 ? `${point.value}분` : '휴식'}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 font-medium">
                  {point.date}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            주간 총 운동 시간: <span className="font-semibold text-gray-900">175분</span>
          </span>
          <span className="text-gray-500">목표: 150분/주</span>
        </div>
      </div>
    </div>
  );
}; 