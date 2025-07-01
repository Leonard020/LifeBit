import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Weight, 
  Brain,
  AlertTriangle,
  CheckCircle,
  Info,
  LineChart,
  Heart,
  Flame
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart,
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, COLORS } from '../types/analytics';
import { getPeriodLabel, calculateExerciseScore, calculateNutritionScore } from '../utils/analyticsUtils';

interface OverviewTabProps {
  chartData: ChartDataPoint[];
  period: string;
  exerciseSessions: { data?: Array<{ duration_minutes?: number; calories_burned?: number }> } | Array<{ duration_minutes?: number; calories_burned?: number }> | null;
  nutritionStats: { totalCalories?: number; totalCarbs?: number; totalProtein?: number; totalFat?: number } | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  chartData,
  period,
  exerciseSessions,
  nutritionStats
}) => {
  return (
    <div className="space-y-6">
      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Weight className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{getPeriodLabel(period)} 평균 체중</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    // 기간별 평균 체중 계산
                    const validWeights = chartData
                      .filter(item => item.weight !== null && item.hasWeightData)
                      .map(item => item.weight);
                    
                    if (validWeights.length > 0) {
                      const avgWeight = validWeights.reduce((sum, weight) => sum + weight, 0) / validWeights.length;
                      return `${avgWeight.toFixed(1)}kg`;
                    }
                    return '데이터 없음';
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{getPeriodLabel(period)} 평균 BMI</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    // 기간별 평균 BMI 계산
                    const validBmis = chartData
                      .filter(item => item.bmi !== null && item.hasBmiData)
                      .map(item => item.bmi);
                    
                    if (validBmis.length > 0) {
                      const avgBmi = validBmis.reduce((sum, bmi) => sum + bmi, 0) / validBmis.length;
                      return avgBmi.toFixed(1);
                    }
                    return 'N/A';
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{getPeriodLabel(period)} 총 운동</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    // exercise_sessions 테이블에서 기간별 운동 시간 계산
                    // API 응답이 직접 배열인 경우와 data 속성을 가진 경우 모두 처리
                    const exerciseSessionsData = Array.isArray(exerciseSessions) 
                      ? exerciseSessions 
                      : (exerciseSessions?.data && Array.isArray(exerciseSessions.data) ? exerciseSessions.data : []);
                    
                    const totalMinutes = exerciseSessionsData.reduce((sum: number, session: { duration_minutes?: number }) => sum + (session.duration_minutes || 0), 0);
                    
                    return `${totalMinutes}분`;
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Flame className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{getPeriodLabel(period)} 총 칼로리</p>
                <p className="text-2xl font-bold">
                  {(() => {
                    // exercise_sessions 테이블에서 기간별 소모 칼로리 계산
                    // API 응답이 직접 배열인 경우와 data 속성을 가진 경우 모두 처리
                    const exerciseSessionsData = Array.isArray(exerciseSessions) 
                      ? exerciseSessions 
                      : (exerciseSessions?.data && Array.isArray(exerciseSessions.data) ? exerciseSessions.data : []);
                    
                    const totalCalories = exerciseSessionsData.reduce((sum: number, session: { calories_burned?: number }) => sum + (session.calories_burned || 0), 0);
                    
                    return `${totalCalories}kcal`;
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 종합 트렌드 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-blue-600" />
            {getPeriodLabel(period)} 종합 트렌드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <RechartsLineChart 
              data={chartData}
              margin={{
                top: 20,
                right: 60,
                left: 20,
                bottom: 80
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                yAxisId="exercise" 
                label={{ value: '운동 시간(분)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                domain={[0, 'dataMax + 20']}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="weight" 
                orientation="right" 
                label={{ value: '체중(kg)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                domain={['dataMin - 3', 'dataMax + 3']}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="bmi" 
                orientation="right" 
                label={{ value: 'BMI', angle: 90, position: 'outside', style: { textAnchor: 'middle' } }}
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 12 }}
                hide={true}
              />
              <Tooltip 
                formatter={(value: number | string, name: string) => {
                  if (name === '운동 시간(분)') return [`${value}분`, name];
                  if (name === '체중(kg)') return [`${value}kg`, name];
                  if (name === 'BMI') return [value, name];
                  return [value, name];
                }}
                labelFormatter={(label) => `기간: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="line"
                wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
              />
              <Line 
                yAxisId="exercise" 
                type="monotone" 
                dataKey="exerciseMinutes" 
                stroke={COLORS.primary} 
                strokeWidth={2} 
                name="운동 시간(분)" 
                dot={(props: { cx?: number; cy?: number; payload?: ChartDataPoint; index?: number }) => {
                  const { cx, cy, payload, index } = props;
                  const key = `exercise-dot-${index}`;
                  
                  if (payload?.hasExerciseData) {
                    return <circle key={key} cx={cx} cy={cy} r={3} stroke={COLORS.primary} strokeWidth={2} fill="#fff" />;
                  }
                  return <circle key={key} cx={cx} cy={cy} r={1.5} stroke={COLORS.primary} strokeWidth={1} fill={COLORS.primary} opacity={0.5} />;
                }}
                activeDot={{ r: 5, strokeWidth: 2, fill: COLORS.primary }}
              />
              <Line 
                yAxisId="weight" 
                type="monotone" 
                dataKey="weight" 
                stroke={COLORS.danger} 
                strokeWidth={3} 
                name="체중(kg)" 
                dot={(props: { cx?: number; cy?: number; payload?: ChartDataPoint; index?: number }) => {
                  const { cx, cy, payload, index } = props;
                  const key = `weight-dot-${index}`;
                  // 체중이 null/undefined면 점 표시하지 않음
                  if (payload?.weight == null) return null;
                  
                  if (payload?.hasWeightData) {
                    return <circle key={key} cx={cx} cy={cy} r={4} stroke={COLORS.danger} strokeWidth={2} fill="#fff" />;
                  }
                  return <circle key={key} cx={cx} cy={cy} r={2} stroke={COLORS.danger} strokeWidth={1} fill={COLORS.danger} opacity={0.5} />;
                }}
                activeDot={{ r: 6, strokeWidth: 2, fill: COLORS.danger }}
                connectNulls={false}
              />
              <Line 
                yAxisId="bmi" 
                type="monotone" 
                dataKey="bmi" 
                stroke={COLORS.purple} 
                strokeWidth={2} 
                name="BMI" 
                dot={(props: { cx?: number; cy?: number; payload?: ChartDataPoint; index?: number }) => {
                  const { cx, cy, payload, index } = props;
                  const key = `bmi-dot-${index}`;
                  // BMI가 null/undefined면 점 표시하지 않음
                  if (payload?.bmi == null) return null;
                  
                  if (payload?.hasBmiData) {
                    return <circle key={key} cx={cx} cy={cy} r={3} stroke={COLORS.purple} strokeWidth={2} fill="#fff" />;
                  }
                  return <circle key={key} cx={cx} cy={cy} r={1.5} stroke={COLORS.purple} strokeWidth={1} fill={COLORS.purple} opacity={0.5} />;
                }}
                activeDot={{ r: 5, strokeWidth: 2, fill: COLORS.purple }}
                connectNulls={false}
                strokeDasharray="5 5"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 개선된 분석 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            데이터 분석 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 트렌드 분석 */}
            <div>
              <h4 className="font-semibold mb-3">📈 트렌드 분석</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const firstPoint = chartData[0];
                  const lastPoint = chartData[chartData.length - 1];
                  
                  if (!firstPoint || !lastPoint) {
                    return <p className="text-gray-500">충분한 데이터가 없습니다.</p>;
                  }

                  const weightTrend = lastPoint.weight - firstPoint.weight;
                  const bmiTrend = lastPoint.bmi - firstPoint.bmi;
                  const avgExercise = chartData.reduce((sum, point) => sum + point.exerciseMinutes, 0) / chartData.length;

                  return (
                    <>
                      <div className="flex items-center gap-2">
                        {weightTrend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : weightTrend < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-gray-300" />
                        )}
                        <span>
                          체중 변화: {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)}kg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {bmiTrend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : bmiTrend < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-gray-300" />
                        )}
                        <span>
                          BMI 변화: {bmiTrend > 0 ? '+' : ''}{bmiTrend.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span>평균 운동 시간: {avgExercise.toFixed(0)}분</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 개선 권장사항 */}
            <div>
              <h4 className="font-semibold mb-3">💡 개선 권장사항</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const totalExercise = chartData.reduce((sum, point) => sum + point.exerciseMinutes, 0);
                  const avgExercise = totalExercise / chartData.length;
                  const recommendations = [];

                  // 🔧 기간별 운동 권장량 계산
                  const periodMultiplier = period === 'day' ? 1 : period === 'week' ? 7 : 30;
                  const recommendedExercise = 30 * periodMultiplier; // 일일 30분 기준

                  if (avgExercise < recommendedExercise) {
                    recommendations.push(
                      <div key="exercise" className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span>
                          운동 시간을 늘려보세요. {getPeriodLabel(period)} 권장량은 {recommendedExercise}분 이상입니다.
                          (현재 평균: {Math.round(avgExercise)}분)
                        </span>
                      </div>
                    );
                  } else {
                    recommendations.push(
                      <div key="exercise-good" className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>운동 습관이 좋습니다! 현재 수준을 유지하세요. (평균: {Math.round(avgExercise)}분)</span>
                      </div>
                    );
                  }

                  // 🔧 데이터 품질 분석 개선
                  const dataQuality = {
                    weight: chartData.filter(point => point.hasWeightData).length,
                    exercise: chartData.filter(point => point.hasExerciseData).length,
                    total: chartData.length
                  };

                  if (dataQuality.weight < dataQuality.total * 0.5) {
                    recommendations.push(
                      <div key="weight-data" className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>
                          체중 기록을 더 자주 해보세요. 현재 {dataQuality.weight}/{dataQuality.total} 기간에만 기록되었습니다.
                        </span>
                      </div>
                    );
                  }

                  if (dataQuality.exercise < dataQuality.total * 0.3) {
                    recommendations.push(
                      <div key="exercise-data" className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>
                          운동 기록을 더 꾸준히 해보세요. 현재 {dataQuality.exercise}/{dataQuality.total} 기간에만 기록되었습니다.
                        </span>
                      </div>
                    );
                  }

                  return recommendations.length > 0 ? recommendations : (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>모든 지표가 양호합니다! 현재 습관을 유지하세요.</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 