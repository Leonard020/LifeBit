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
  ChevronRight,
  Minus
} from 'lucide-react';
import { useHealthRecords, useUserGoals } from '../../api/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeightTrendChartProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      weight: number;
      count?: number;
    };
  }>;
  label?: string;
}

type PeriodType = '일간' | '주간' | '월간';

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({
  userId,
  period
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('일간');
  
  const { data: healthRecords } = useHealthRecords(userId, 'year');
  const { data: userGoals } = useUserGoals(userId);

  // 체중 데이터 계산
  const weightData = useMemo(() => {
    const healthRecordsData = healthRecords?.data || healthRecords || [];
    
    // 가장 최근 체중 찾기
    const latestWeight = healthRecordsData.length > 0 
      ? healthRecordsData[healthRecordsData.length - 1].weight || 0
      : 0;

    if (!Array.isArray(healthRecordsData) || healthRecordsData.length === 0) {
      return {
        current: latestWeight,
        target: userGoals?.data?.weight_target || latestWeight || 70,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        dailyData: [],
        weeklyData: [],
        monthlyData: [],
        hasData: false
      };
    }

    // 날짜별로 정렬된 체중 데이터 생성
    const sortedRecords = [...healthRecordsData]
      .filter(record => record.weight && record.weight > 0)
      .sort((a, b) => new Date(a.record_date).getTime() - new Date(b.record_date).getTime());

    if (sortedRecords.length === 0) {
      return {
        current: latestWeight,
        target: userGoals?.data?.weight_target || latestWeight || 70,
        change: 0,
        trend: 'stable' as 'up' | 'down' | 'stable',
        dailyData: [],
        weeklyData: [],
        monthlyData: [],
        hasData: false
      };
    }

    const current = sortedRecords[sortedRecords.length - 1].weight;
    const previous = sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2].weight : current;
    const change = current - previous;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change > 0.1) trend = 'up';
    else if (change < -0.1) trend = 'down';

    // 일간 데이터 생성 (최근 7일)
    const dailyData = sortedRecords.slice(-7).map(record => ({
      date: new Date(record.record_date).toLocaleDateString(),
      weight: record.weight
    }));

    // 주간 데이터 생성 (최근 7주)
    const weeklyData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekRecords = sortedRecords.filter(record => {
        const recordDate = new Date(record.record_date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      if (weekRecords.length > 0) {
        const weekAvg = weekRecords.reduce((sum, record) => sum + record.weight, 0) / weekRecords.length;
        weeklyData.push({
          date: `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
          weight: weekAvg
        });
      }
    }

    // 월간 데이터 생성 (최근 7개월)
    const monthlyData = [];
    for (let i = 6; i >= 0; i--) {
      const monthEnd = new Date(today);
      monthEnd.setMonth(monthEnd.getMonth() - i);
      const monthStart = new Date(monthEnd);
      monthStart.setDate(1);

      const monthRecords = sortedRecords.filter(record => {
        const recordDate = new Date(record.record_date);
        return recordDate.getMonth() === monthEnd.getMonth() &&
               recordDate.getFullYear() === monthEnd.getFullYear();
      });

      if (monthRecords.length > 0) {
        const monthAvg = monthRecords.reduce((sum, record) => sum + record.weight, 0) / monthRecords.length;
        monthlyData.push({
          date: `${monthEnd.getFullYear()}년 ${monthEnd.getMonth() + 1}월`,
          weight: monthAvg
        });
      }
    }

    return {
      current,
      target: userGoals?.data?.weight_target || current,
      change,
      trend,
      dailyData,
      weeklyData,
      monthlyData,
      hasData: true
    };
  }, [healthRecords, userGoals]);

  // 체중 범위 동적 계산
  const weightRange = useMemo(() => {
    if (!weightData.hasData || weightData.dailyData.length === 0) {
      return { min: 40, max: 100 };
    }
    
    const allWeights = weightData.dailyData.map(d => d.weight);
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
    return Array(7).fill(null).map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
  };

  // 트렌드 아이콘 선택
  const getTrendIcon = () => {
    if (weightData.trend === 'up') {
      return <TrendingUp className="h-5 w-5 text-red-500" />;
    } else if (weightData.trend === 'down') {
      return <TrendingDown className="h-5 w-5 text-green-500" />;
    }
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  // 변화량 텍스트
  const getChangeText = () => {
    if (weightData.change === 0) {
      return '변화 없음';
    }
    const changeText = weightData.trend === 'up' ? '증가' : '감소';
    return `최근 ${Math.abs(weightData.change).toFixed(1)}kg ${changeText}했어요`;
  };

  // 그래프 데이터 포맷팅
  const formatGraphData = (data: Array<{ weight: number; date: Date }>, period: PeriodType) => {
    switch (period) {
      case '일간':
        return weightData.dailyData.map((weight, index) => ({
          name: weight.date,
          weight: weight.weight
        }));
      case '주간':
        return weightData.weeklyData.map((weight, index) => ({
          name: weight.date,
          weight: weight.weight
        }));
      case '월간':
        return weightData.monthlyData.map((weight, index) => ({
          name: weight.date,
          weight: weight.weight
        }));
      default:
        return [];
    }
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-gray-600">
            체중: {payload[0].value.toFixed(1)}kg
          </p>
        </div>
      );
    }
    return null;
  };

  // 데이터가 없을 때 안내 메시지
  if (!weightData.hasData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Weight className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>아직 체중 데이터가 없어요.</p>
          <p className="text-sm text-gray-500 mt-1">체중을 기록하고 변화를 확인해보세요!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 현재 체중 상태 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-gray-500" />
              <span className="font-medium">현재 체중</span>
            </div>
            <Badge variant="outline" className="font-normal">
              {getChangeText()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {weightData.current.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-500 mt-1">
                목표까지 {Math.abs(weightData.current - weightData.target).toFixed(1)}kg 남았어요
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-400" />
              <div className="text-lg font-medium text-gray-600">
                {weightData.target.toFixed(1)}kg
              </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodType)} className="mb-6">
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

            {(['일간', '주간', '월간'] as const).map((period) => (
              <TabsContent key={period} value={period} className="mt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formatGraphData(weightData.dailyData, period as PeriodType)}
                      margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 14 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        domain={['dataMin - 1', 'dataMax + 1']}
                        tick={{ fontSize: 14 }}
                        width={50}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 5 }}
                        activeDot={{ r: 7, fill: '#16a34a' }}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 