import React, { useMemo, memo, useCallback } from 'react';
import { useHealthRecords, useExerciseSessions, useUserGoals } from '../../api/healthApi';
import { TrendingUp, TrendingDown, Activity, Weight, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

interface StatisticsChartsProps {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
}

interface ChartDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

// 메모이제이션된 커스텀 툴팁 컴포넌트
const CustomTooltip = memo(({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    unit?: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`날짜: ${label}`}</p>
        <p className="text-blue-600">
          {`${payload[0].name}: ${payload[0].value}${payload[0].unit || ''}`}
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

export const StatisticsCharts: React.FC<StatisticsChartsProps> = memo(({
  userId,
  period,
}) => {
  // React Query로 데이터 가져오기 (Hook은 항상 최상단에)
  const { data: healthRecords, isLoading: healthLoading, error: healthError } = useHealthRecords(userId.toString(), period);
  const { data: exerciseData, isLoading: exerciseLoading, error: exerciseError } = useExerciseSessions(userId.toString(), period);
  const { data: userGoals, isLoading: goalsLoading, error: goalsError } = useUserGoals(userId.toString());

  // 날짜 포맷팅 함수 메모이제이션
  const formatDateForChart = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
  }, []);

  // 차트 데이터 변환 및 계산
  const chartData = useMemo(() => {
    // 데이터 타입 안전성 검사 추가
    const safeHealthRecords = Array.isArray(healthRecords) ? healthRecords : [];
    const safeExerciseData = Array.isArray(exerciseData) ? exerciseData : [];
    
    if (safeHealthRecords.length === 0 && safeExerciseData.length === 0) {
      // 데이터가 없을 때 기본값 반환
      return {
        weight: [],
        bmi: [],
        exercise: [],
        stats: {
          avgWeight: 0,
          avgBMI: 0,
          totalExerciseTime: 0,
          weightTrend: 0,
          bmiTrend: 0
        }
      };
    }

    // 건강 기록 데이터 변환
    const weightData: ChartDataPoint[] = safeHealthRecords.map((record: {
      record_date: string;
      weight: number;
      bmi: number;
    }) => ({
      date: record.record_date,
      value: record.weight,
      displayDate: formatDateForChart(record.record_date)
    }));

    const bmiData: ChartDataPoint[] = safeHealthRecords.map((record: {
      record_date: string;
      weight: number;
      bmi: number;
    }) => ({
      date: record.record_date,
      value: record.bmi,
      displayDate: formatDateForChart(record.record_date)
    }));

    // 운동 데이터 변환
    const exerciseChartData: ChartDataPoint[] = safeExerciseData.map((session: {
      exercise_date: string;
      duration_minutes: number;
      calories_burned: number;
      notes: string;
    }) => ({
      date: session.exercise_date,
      value: session.duration_minutes,
      displayDate: formatDateForChart(session.exercise_date)
    }));

    // 통계 계산
    const avgWeight = weightData.length > 0 
      ? weightData.reduce((sum, item) => sum + item.value, 0) / weightData.length 
      : 0;
    
    const avgBMI = bmiData.length > 0 
      ? bmiData.reduce((sum, item) => sum + item.value, 0) / bmiData.length 
      : 0;
    
    const totalExerciseTime = exerciseChartData.reduce((sum, item) => sum + item.value, 0);
    
    // 트렌드 계산 (최근 7일 vs 이전 7일)
    const recentWeight = weightData.slice(-7);
    const previousWeight = weightData.slice(-14, -7);
    
    const weightTrend = recentWeight.length > 0 && previousWeight.length > 0
      ? ((recentWeight.reduce((sum, item) => sum + item.value, 0) / recentWeight.length) - 
         (previousWeight.reduce((sum, item) => sum + item.value, 0) / previousWeight.length))
      : 0;
    
    const recentBMI = bmiData.slice(-7);
    const previousBMI = bmiData.slice(-14, -7);
    
    const bmiTrend = recentBMI.length > 0 && previousBMI.length > 0
      ? ((recentBMI.reduce((sum, item) => sum + item.value, 0) / recentBMI.length) - 
         (previousBMI.reduce((sum, item) => sum + item.value, 0) / previousBMI.length))
      : 0;

    return {
      weight: weightData,
      bmi: bmiData,
      exercise: exerciseChartData,
      stats: {
        avgWeight: Number(avgWeight.toFixed(1)),
        avgBMI: Number(avgBMI.toFixed(1)),
        totalExerciseTime,
        weightTrend: Number(weightTrend.toFixed(1)),
        bmiTrend: Number(bmiTrend.toFixed(2))
      }
    };
  }, [healthRecords, exerciseData, formatDateForChart]);

  // 목표 대비 진행률 계산
  const progressData = useMemo(() => {
    // 안전한 기본값 설정
    const defaultGoals = {
      weekly_workout_target: 3,
      daily_carbs_target: 250,
      daily_protein_target: 150,
      daily_fat_target: 67
    };

    const safeUserGoals = userGoals?.data || defaultGoals;

    const weeklyExerciseCount = chartData.exercise.length;
    const exerciseProgress = safeUserGoals.weekly_workout_target > 0 
      ? Math.min((weeklyExerciseCount / safeUserGoals.weekly_workout_target) * 100, 100)
      : 0;

    return {
      weeklyExercise: {
        current: weeklyExerciseCount,
        target: safeUserGoals.weekly_workout_target,
        percentage: exerciseProgress
      }
    };
  }, [chartData.exercise, userGoals]);

  // 차트 색상 설정
  const getWeightTrendColor = useCallback((trend: number): string => {
    if (trend > 0.5) return '#ef4444'; // 빨간색 (증가)
    if (trend < -0.5) return '#22c55e'; // 초록색 (감소)
    return '#6b7280'; // 회색 (안정)
  }, []);

  const getBMITrendColor = useCallback((trend: number): string => {
    if (Math.abs(trend) < 0.1) return '#22c55e'; // 초록색 (안정)
    return '#f59e0b'; // 주황색 (변화)
  }, []);

  // BMI 카테고리 계산
  const getBMICategory = useMemo(() => (bmi: number): string => {
    if (bmi < 18.5) return '저체중';
    if (bmi < 25) return '정상';
    if (bmi < 30) return '과체중';
    return '비만';
  }, []);

  // 로딩 상태
  if (healthLoading || exerciseLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    );
  }

  // 에러 처리 및 데이터 없음 처리
  const hasErrors = healthError || exerciseError || goalsError;
  const hasNoData = chartData.weight.length === 0 && chartData.exercise.length === 0;

  // 데이터가 없을 때 안내 메시지 표시
  if (hasNoData && !hasErrors) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-blue-600 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            아직 기록된 데이터가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            건강 데이터를 입력하시면 상세한 통계와 차트를 확인할 수 있습니다.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>• 체중과 키를 기록하여 BMI 변화를 추적하세요</p>
            <p>• 운동 세션을 기록하여 운동량을 모니터링하세요</p>
            <p>• 꾸준한 기록으로 건강 목표를 달성해보세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 에러 알림 */}
      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 text-sm">
              ⚠️ 일부 데이터를 불러오는 중 문제가 발생했습니다.
              {goalsError && ' 사용자 목표 데이터를 확인해주세요.'}
            </div>
          </div>
        </div>
      )}

      {/* 데이터가 부족할 때 안내 */}
      {(chartData.weight.length === 0 || chartData.exercise.length === 0) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-gray-600 text-sm">
              💡 더 정확한 통계를 위해 {chartData.weight.length === 0 ? '건강 기록' : ''}
              {chartData.weight.length === 0 && chartData.exercise.length === 0 ? '과 ' : ''}
              {chartData.exercise.length === 0 ? '운동 기록' : ''}을 추가해보세요.
            </div>
          </div>
        </div>
      )}

      {/* 체중 변화 차트 */}
      {chartData.weight.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                체중 변화 추이
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {chartData.stats.weightTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={getWeightTrendColor(chartData.stats.weightTrend)}>
                {chartData.stats.weightTrend > 0 ? '+' : ''}{chartData.stats.weightTrend}kg
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weight}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={chartData.stats.avgWeight} 
                  stroke="#3b82f6" 
                  strokeDasharray="5 5"
                  label={{ value: "평균", position: "insideTopRight" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                  name="체중"
                  unit="kg"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-sm mt-4">
            <span className="text-gray-600">
              평균: <span className="font-semibold text-gray-900">{chartData.stats.avgWeight}kg</span>
            </span>
            <span className="text-gray-500">최근 {chartData.weight.length}회 기록</span>
          </div>
        </div>
      )}

      {/* BMI 변화 차트 */}
      {chartData.bmi.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                BMI 변화 추이
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {chartData.stats.bmiTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500" />
              )}
              <span className={getBMITrendColor(chartData.stats.bmiTrend)}>
                {chartData.stats.bmiTrend > 0 ? '+' : ''}{chartData.stats.bmiTrend}
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.bmi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={[15, 35]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={18.5} 
                  stroke="#fbbf24" 
                  strokeDasharray="5 5"
                  label={{ value: "저체중", position: "insideTopLeft" }}
                />
                <ReferenceLine 
                  y={25} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5"
                  label={{ value: "과체중", position: "insideTopLeft" }}
                />
                <ReferenceLine 
                  y={30} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5"
                  label={{ value: "비만", position: "insideTopLeft" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  name="BMI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-sm mt-4">
            <span className="text-gray-600">
              평균: <span className="font-semibold text-gray-900">{chartData.stats.avgBMI}</span>
            </span>
            <span className="text-gray-500">정상 범위 (18.5-24.9)</span>
          </div>
        </div>
      )}

      {/* 운동 시간 차트 */}
      {chartData.exercise.length > 0 && (
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
              <span className="text-purple-600">{chartData.stats.totalExerciseTime}분/총합</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.exercise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={30} 
                  stroke="#8b5cf6" 
                  strokeDasharray="5 5"
                  label={{ value: "권장 시간", position: "insideTopRight" }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#exerciseGradient)"
                  radius={[4, 4, 0, 0]}
                  name="운동 시간"
                  unit="분"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-sm mt-4">
            <span className="text-gray-600">
              총 운동 시간: <span className="font-semibold text-gray-900">{chartData.stats.totalExerciseTime}분</span>
            </span>
            <span className="text-gray-500">
              평균: {Math.round(chartData.stats.totalExerciseTime / chartData.exercise.length)}분/일
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

StatisticsCharts.displayName = 'StatisticsCharts'; 