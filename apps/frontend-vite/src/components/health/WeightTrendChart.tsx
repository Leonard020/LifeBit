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
import { useHealthRecords } from '../../api/auth';

interface WeightTrendChartProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  userId,
  period
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'일간' | '주간' | '월간'>('일간');
  const [currentWeight, setCurrentWeight] = useState([58]); // 슬라이더 값
  const targetWeight = 58; // 목표 체중
  
  const { data: healthRecords } = useHealthRecords(userId, period);

  // 체중 데이터 계산
  const weightData = useMemo(() => {
    const healthRecordsData = healthRecords?.data || healthRecords || [];
    
    if (!Array.isArray(healthRecordsData) || healthRecordsData.length === 0) {
      return {
        current: 58,
        target: 58,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        weeklyData: [58, 57.5, 58.2, 57.8, 58.1, 57.9, 58.0]
      };
    }

    const weights = healthRecordsData.map(record => record.weight).filter(w => w > 0);
    if (weights.length === 0) {
      return {
        current: 58,
        target: 58,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        weeklyData: [58, 57.5, 58.2, 57.8, 58.1, 57.9, 58.0]
      };
    }

    const current = weights[weights.length - 1];
    const previous = weights.length > 1 ? weights[weights.length - 2] : current;
    const change = current - previous;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0.1) trend = 'up';
    else if (change < -0.1) trend = 'down';

    return {
      current,
      target: targetWeight,
      change,
      trend,
      weeklyData: weights.slice(-7).concat(Array(7).fill(current)).slice(0, 7)
    };
  }, [healthRecords, targetWeight]);

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
    if (selectedPeriod === '월간') {
      return `이번 달에 평균 ${Math.abs(weightData.change).toFixed(1)}kg ${weightData.trend === 'up' ? '증가' : weightData.trend === 'down' ? '감소' : '유지'}했어요`;
    } else if (selectedPeriod === '주간') {
      return `이번 주에 평균 ${Math.abs(weightData.change).toFixed(1)}kg ${weightData.trend === 'up' ? '증가' : weightData.trend === 'down' ? '감소' : '유지'}했어요`;
    }
    return `오늘 하루 ${Math.abs(weightData.change).toFixed(1)}kg ${weightData.trend === 'up' ? '증가' : weightData.trend === 'down' ? '감소' : '유지'}했어요`;
  };

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
              <span className="text-sm text-gray-600">목표 {targetWeight}kg</span>
              <span className="text-sm text-gray-400">😊 지금까지 -{Math.abs(targetWeight - weightData.current).toFixed(1)}kg</span>
            </div>
          </div>

          {/* 체중 슬라이더 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">체중</span>
              <span className="text-2xl font-bold text-gray-900">{currentWeight[0]}kg</span>
            </div>
            
            <Slider
              value={currentWeight}
              onValueChange={setCurrentWeight}
              max={80}
              min={40}
              step={0.1}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>40kg</span>
              <span>80kg</span>
            </div>
          </div>

          {/* 칼로리 정보 */}
          <div className="text-center text-sm text-gray-600">
            <span>칼로리 정보는 아직 없어요</span>
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
              {weightData.change > 0 ? '+' : ''}{weightData.change.toFixed(1)}kg
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
                {/* 간단한 막대 차트 */}
                <div className="flex items-end justify-between h-32 px-2">
                  {weightData.weeklyData.map((weight, index) => {
                    const height = ((weight - 55) / (65 - 55)) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center gap-1">
                        <div 
                          className="w-8 bg-green-400 rounded-t-sm transition-all duration-300"
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                        <span className="text-xs text-gray-500">
                          {getPeriodLabels()[index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="주간" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                주간 데이터를 준비 중입니다...
              </div>
            </TabsContent>

            <TabsContent value="월간" className="mt-4">
              <div className="text-center text-gray-500 py-8">
                월간 데이터를 준비 중입니다...
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 