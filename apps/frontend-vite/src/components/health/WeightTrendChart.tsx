import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Weight, 
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useHealthRecords, useUserGoals } from '../../api/auth';

interface WeightTrendChartProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  userId,
  period
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'일간' | '주간' | '월간'>('일간');
  
  const { data: healthRecords } = useHealthRecords(userId, 'year'); // 더 많은 데이터 조회
  const { data: userGoals } = useUserGoals(userId);

  // 체중 데이터 계산
  const weightData = useMemo(() => {
    const healthRecordsData = healthRecords?.data || healthRecords || [];
    
    if (!Array.isArray(healthRecordsData) || healthRecordsData.length === 0) {
      return {
        current: 0,
        target: userGoals?.data?.weight_target || 70,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        weeklyData: [],
        weights: [],
        hasData: false
      };
    }

    const weights = healthRecordsData
      .filter(record => record.weight && record.weight > 0)
      .map(record => ({
        weight: record.weight,
        date: new Date(record.record_date)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (weights.length === 0) {
      return {
        current: 0,
        target: userGoals?.data?.weight_target || 70,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        weeklyData: [],
        weights: [],
        hasData: false
      };
    }

    const current = weights[weights.length - 1].weight;
    const previous = weights.length > 1 ? weights[weights.length - 2].weight : current;
    const change = current - previous;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0.1) trend = 'up';
    else if (change < -0.1) trend = 'down';

    // 최근 7일 데이터 생성
    const today = new Date();
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      // 해당 날짜에 가장 가까운 체중 데이터 찾기
      const dateWeight = weights.find(w => {
        const weightDate = w.date;
        return weightDate.toDateString() === targetDate.toDateString();
      });
      
      if (dateWeight) {
        weeklyData.push(dateWeight.weight);
      } else if (weeklyData.length > 0) {
        // 이전 데이터가 있으면 마지막 값 사용
        weeklyData.push(weeklyData[weeklyData.length - 1]);
      } else {
        // 첫 번째 데이터가 없으면 전체 데이터의 첫 번째 값 사용
        weeklyData.push(weights[0].weight);
      }
    }

    return {
      current,
      target: userGoals?.data?.weight_target || current,
      change,
      trend,
      weeklyData,
      weights,
      hasData: true
    };
  }, [healthRecords, userGoals]);

  // 체중 범위 동적 계산
  const weightRange = useMemo(() => {
    if (!weightData.hasData || weightData.weights.length === 0) {
      return { min: 40, max: 100 };
    }
    
    const allWeights = weightData.weights.map(w => w.weight);
    const minWeight = Math.min(...allWeights);
    const maxWeight = Math.max(...allWeights);
    const buffer = (maxWeight - minWeight) * 0.1 || 5; // 10% 버퍼 또는 최소 5kg
    
    return {
      min: Math.max(30, Math.floor(minWeight - buffer)),
      max: Math.min(150, Math.ceil(maxWeight + buffer))
    };
  }, [weightData]);

  // 현재 체중 상태 (슬라이더용)
  const [currentWeight, setCurrentWeight] = useState(() => [weightData.current || 70]);
  
  // weightData가 변경되면 슬라이더 값도 업데이트
  React.useEffect(() => {
    if (weightData.current > 0) {
      setCurrentWeight([weightData.current]);
    }
  }, [weightData.current]);

  // 기간별 라벨 생성
  const getPeriodLabels = () => {
    const today = new Date();
    const labels: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      
      if (selectedPeriod === '일간') {
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}.${date.getDate()}`);
      } else if (selectedPeriod === '주간') {
        date.setDate(date.getDate() - (i * 7));
        labels.push(`~${date.getMonth() + 1}.${date.getDate()}`);
      } else {
        date.setMonth(date.getMonth() - i);
        labels.push(`${date.getMonth() + 1}월`);
      }
    }
    
    return labels;
  };

  const getTrendIcon = () => {
    switch (weightData.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendMessage = () => {
    if (!weightData.hasData) {
      return "체중 데이터가 없습니다. 건강 기록을 추가해보세요!";
    }

    const changeText = weightData.trend === 'up' ? '증가' : weightData.trend === 'down' ? '감소' : '유지';
    
    if (selectedPeriod === '월간') {
      return `이번 달에 평균 ${Math.abs(weightData.change).toFixed(1)}kg ${changeText}했어요`;
    } else if (selectedPeriod === '주간') {
      return `이번 주에 평균 ${Math.abs(weightData.change).toFixed(1)}kg ${changeText}했어요`;
    }
    return `최근 ${Math.abs(weightData.change).toFixed(1)}kg ${changeText}했어요`;
  };

  // 데이터가 없을 때 안내 메시지
  if (!weightData.hasData) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-0">
          <CardContent className="p-6 text-center">
            <Weight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-600 mb-2">
              체중 데이터가 없습니다
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              건강 기록을 추가하여 체중 변화 추이를 확인해보세요
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/note'}>
              건강 기록 추가하기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 메인 체중 표시 카드 */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {getTrendMessage()}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Weight className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">목표 {weightData.target}kg</span>
              <span className="text-sm text-gray-400">
                😊 목표까지 {Math.abs(weightData.target - weightData.current).toFixed(1)}kg
              </span>
            </div>
          </div>

          {/* 체중 슬라이더 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">현재 체중</span>
              <span className="text-2xl font-bold text-gray-900">{weightData.current.toFixed(1)}kg</span>
            </div>
            
            <Slider
              value={[weightData.current]}
              max={weightRange.max}
              min={weightRange.min}
              step={0.1}
              className="w-full"
              disabled={true} // 실제 데이터 표시용이므로 비활성화
            />
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{weightRange.min}kg</span>
              <span>{weightRange.max}kg</span>
            </div>
          </div>

          {/* 체중 통계 정보 */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-900">{weightData.current.toFixed(1)}kg</div>
              <div className="text-gray-600">현재</div>
            </div>
            <div>
              <div className="font-semibold text-blue-600">{weightData.target.toFixed(1)}kg</div>
              <div className="text-gray-600">목표</div>
            </div>
            <div>
              <div className={`font-semibold ${weightData.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {weightData.change > 0 ? '+' : ''}{weightData.change.toFixed(1)}kg
              </div>
              <div className="text-gray-600">변화</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기간별 트렌드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getTrendIcon()}
              체중 변화 추이
            </CardTitle>
            <Badge variant="outline">
              총 {weightData.weights.length}회 기록
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* 기간 선택 탭 */}
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as '일간' | '주간' | '월간')} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-full p-1">
              <TabsTrigger 
                value="일간" 
                className="rounded-full data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                일간
              </TabsTrigger>
              <TabsTrigger 
                value="주간"
                className="rounded-full data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                주간
              </TabsTrigger>
              <TabsTrigger 
                value="월간"
                className="rounded-full data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                월간
              </TabsTrigger>
            </TabsList>

            <TabsContent value="일간" className="mt-4">
              <div className="space-y-4">
                {/* 체중 변화 막대 차트 */}
                <div className="flex items-end justify-between h-32 px-2">
                  {weightData.weeklyData.map((weight, index) => {
                    const minWeight = Math.min(...weightData.weeklyData);
                    const maxWeight = Math.max(...weightData.weeklyData);
                    const range = maxWeight - minWeight || 1; // 0으로 나누기 방지
                    const height = ((weight - minWeight) / range) * 80 + 20; // 20-100% 범위
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div className="text-xs text-gray-700 font-medium">
                          {weight.toFixed(1)}
                        </div>
                        <div 
                          className="w-8 bg-green-400 rounded-t-sm transition-all duration-300 relative"
                          style={{ height: `${height}%` }}
                          title={`${weight.toFixed(1)}kg`}
                        />
                        <span className="text-xs text-gray-500">
                          {getPeriodLabels()[index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* 추가 통계 */}
                <div className="grid grid-cols-2 gap-4 text-center text-sm bg-gray-50 rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {Math.min(...weightData.weeklyData).toFixed(1)}kg
                    </div>
                    <div className="text-gray-600">최근 7일 최저</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {Math.max(...weightData.weeklyData).toFixed(1)}kg
                    </div>
                    <div className="text-gray-600">최근 7일 최고</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="주간" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                <Weight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>주간 데이터 분석 기능을 준비 중입니다.</p>
                <p className="text-xs mt-1">더 많은 데이터가 쌓이면 제공됩니다.</p>
              </div>
            </TabsContent>

            <TabsContent value="월간" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                <Weight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>월간 데이터 분석 기능을 준비 중입니다.</p>
                <p className="text-xs mt-1">더 많은 데이터가 쌓이면 제공됩니다.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 