import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Timer, Flame } from 'lucide-react';
import { 
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, COLORS } from '../types/analytics';
import { BodyPartFrequencyChart } from '../BodyPartFrequencyChart';

interface BodyPartData {
  bodyPart: string;
  bodyPartKorean: string;
  count: number;
  duration: number;
  percentage: number;
  color: string;
}

interface ExerciseTabProps {
  chartData: ChartDataPoint[];
  healthStats: {
    bodyPartFrequency?: BodyPartData[];
    totalExerciseSessions?: number;
  } | null;
  period: 'day' | 'week' | 'month' | 'year';
}

export const ExerciseTab: React.FC<ExerciseTabProps> = ({
  chartData,
  healthStats,
  period
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 운동 시간 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="h-5 w-5 mr-2 text-green-600" />
              운동 시간 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exerciseMinutes" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 칼로리 소모 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Flame className="h-5 w-5 mr-2 text-orange-600" />
              칼로리 소모량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="exerciseCalories" 
                  stroke={COLORS.accent} 
                  fill={COLORS.accent} 
                  fillOpacity={0.6} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 운동 분석 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>운동 분석 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {chartData.reduce((sum, item) => sum + (item.exerciseMinutes > 0 ? 1 : 0), 0)}회
              </p>
              <p className="text-sm text-gray-600">운동 일수</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {chartData.length > 0 
                  ? Math.round(chartData.reduce((sum, item) => sum + item.exerciseMinutes, 0) / chartData.filter(item => item.exerciseMinutes > 0).length || 0)
                  : 0
                }분
              </p>
              <p className="text-sm text-gray-600">평균 운동시간</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {chartData.reduce((sum, item) => sum + item.exerciseCalories, 0)}
              </p>
              <p className="text-sm text-gray-600">총 칼로리</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {chartData.reduce((streak, item, index) => {
                  if (item.exerciseMinutes > 0) {
                    return index === chartData.length - 1 || chartData[index + 1]?.exerciseMinutes === 0 ? streak + 1 : streak + 1;
                  }
                  return 0;
                }, 0)}일
              </p>
              <p className="text-sm text-gray-600">최근 연속기록</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🏋️ 운동 부위별 빈도 차트 추가 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BodyPartFrequencyChart 
          bodyPartFrequency={healthStats?.bodyPartFrequency || []}
          totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
          period={period}
          chartType="bar"
        />
        <BodyPartFrequencyChart 
          bodyPartFrequency={healthStats?.bodyPartFrequency || []}
          totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
          period={period}
          chartType="pie"
        />
      </div>
    </div>
  );
}; 