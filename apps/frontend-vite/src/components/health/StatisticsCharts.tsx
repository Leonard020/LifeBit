import React, { useMemo, memo, useCallback } from 'react';
import { useHealthRecords, useExerciseSessions, useUserGoals, useHealthStatistics } from '../../api/auth';
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

interface ChartDataItem {
  date: string;
  value: number;
  displayDate: string;
  calories?: number;
}

interface BackendHealthDataItem {
  date: string;
  weight: number | null;
  bmi: number | null;
  height: number | null;
}

interface BackendExerciseDataItem {
  date: string;
  duration_minutes: number | null;
  calories_burned: number | null;
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
  // 디버그 로그 추가
  console.log('📊 StatisticsCharts - period:', period, 'userId:', userId);

  // API 호출 시 사용할 period 매핑
  const apiPeriod = useMemo(() => {
    console.log('🔄 API Period mapping:', period, '→', period === 'week' ? 'month' : period);
    // 주간 데이터의 경우 한 달치 데이터를 가져와서 필터링
    return period === 'week' ? 'month' : period;
  }, [period]);

  // API 호출 상태 관리
  const {
    data: healthRecords,
    isLoading: healthLoading,
    error: healthError
  } = useHealthRecords(userId, apiPeriod);

  const {
    data: exerciseData,
    isLoading: exerciseLoading,
    error: exerciseError
  } = useExerciseSessions(userId, apiPeriod);

  const {
    data: userGoals,
    isLoading: goalsLoading,
    error: goalsError
  } = useUserGoals(userId);

  const {
    data: healthStatistics,
    isLoading: statsLoading,
    error: statsError
  } = useHealthStatistics(userId, apiPeriod);

  console.log('🔍 [StatisticsCharts] API 호출 상태:', {
    userId,
    apiPeriod,
    healthRecords,
    exerciseData,
    userGoals,
    healthStatistics
  });

  // 날짜 포맷팅 함수
  const formatDateForChart = useCallback((dateStr: string, period: 'day' | 'week' | 'month' | 'year'): string => {
    const date = new Date(dateStr);
    switch (period) {
      case 'day':
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      case 'week':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case 'month':
        return date.toLocaleDateString('ko-KR', { month: 'short' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return dateStr;
    }
  }, []);

  // 데이터 그룹핑 함수
  const groupDataByPeriod = useCallback((data: Record<string, unknown>[], period: 'day' | 'week' | 'month' | 'year', dateField: string, valueField: string) => {
    if (!Array.isArray(data)) return [];

    // 현재 날짜 기준으로 기간별 시작일/종료일 계산
    const today = new Date();
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(today.getDate() - 7); // 최근 7일
        break;
      case 'week':
        startDate.setDate(today.getDate() - 28); // 최근 4주
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 6); // 최근 6개월
        break;
      case 'year':
        startDate.setFullYear(today.getFullYear() - 1); // 최근 1년
        break;
    }

    // 데이터 필터링 및 그룹핑
    const filteredData = data
      .sort((a, b) => new Date(b[dateField] as string).getTime() - new Date(a[dateField] as string).getTime()) // 최신 데이터부터 정렬
      .slice(0, period === 'day' ? 7 : period === 'week' ? 6 : 6) // 일별 7일, 주별 6주, 월별 6개월
      .reverse() // 다시 오름차순으로
      .filter(item => {
        const itemDate = new Date(item[dateField] as string);
        return itemDate >= startDate && itemDate <= today;
      });

    // 날짜별 그룹핑
    const grouped: Record<string, { dates: string[]; values: number[] }> = {};
    
    filteredData.forEach(item => {
      const date = new Date(item[dateField] as string);
      let groupKey: string;
      
      if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        groupKey = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        groupKey = date.toISOString().slice(0, 7); // YYYY-MM
      } else if (period === 'year') {
        groupKey = date.getFullYear().toString();
      } else {
        groupKey = date.toISOString().split('T')[0];
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          dates: [],
          values: []
        };
      }

      grouped[groupKey].dates.push(item[dateField] as string);
      grouped[groupKey].values.push(Number(item[valueField]) || 0);
    });

    // 그룹별 합계 또는 평균값 계산하여 차트 데이터 생성
    const result = Object.entries(grouped)
      .map(([key, group]) => {
        // 운동 시간은 합계, 체중/BMI는 평균
        const isExerciseData = valueField === 'duration_minutes';
        const value = isExerciseData 
          ? group.values.reduce((sum, val) => sum + val, 0) // 합계
          : group.values.reduce((sum, val) => sum + val, 0) / group.values.length; // 평균
        
        return {
          date: key,
          value: Number(value.toFixed(2)),
          displayDate: formatDateForChart(group.dates[0], period),
          count: group.values.length // 해당 기간의 데이터 개수
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log(`📊 [${period}] 데이터 처리 결과:`, result);
    return result;
  }, [formatDateForChart]);

  // ✨ 백엔드 차트 데이터 우선 사용, 없으면 기존 로직으로 폴백
  const chartData = useMemo(() => {
    console.log('🔄 Chart data recalculating with period:', period);
    
    // 1️⃣ 백엔드에서 제공하는 차트 데이터 확인
    if (healthStatistics?.healthChartData || healthStatistics?.exerciseChartData) {
      console.log('✨ Using backend chart data from HealthStatistics API');
      
      const backendHealthData = (healthStatistics.healthChartData || []) as BackendHealthDataItem[];
      const backendExerciseData = (healthStatistics.exerciseChartData || []) as BackendExerciseDataItem[];
      
      // 기간별 최대 데이터 포인트 수를 반환하는 함수
      function getMaxDataPoints(chartPeriod: string) {
        switch (chartPeriod) {
          case 'day':
            return 7;  // 일별 7일
          case 'week':
            return 6;  // 주별 6주
          case 'month':
            return 6;  // 월별 6개월
          default:
            return 7;
        }
      }

      // 데이터 정렬 및 필터링 함수
      function processDataPoints<T extends { date: string }>(
        data: T[],
        valueField: keyof T,
        maxPoints: number
      ) {
        const now = new Date();
        let startDate: Date;
        
        // 기간별 시작 날짜 계산
        switch (period) {
          case 'day':
            startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 7일 전
            break;
          case 'week':
            startDate = new Date(now.getTime() - 5 * 7 * 24 * 60 * 60 * 1000); // 6주 전
            break;
          case 'month':
            startDate = new Date(now.getTime() - 5 * 30 * 24 * 60 * 60 * 1000); // 6개월 전
            break;
          default:
            startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        }

        return data
          .filter(item => new Date(item.date) >= startDate) // 시작 날짜 이후 데이터만 필터링
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // 과거에서 최신 순으로 정렬
          .slice(-maxPoints) // 최대 포인트 수만큼 최신 데이터 선택
          .map(item => ({
            date: item.date,
            value: Number(item[valueField]),
            displayDate: formatDateForChart(item.date, period)
          }));
      }

      const maxPoints = getMaxDataPoints(period);

      // 체중 데이터 처리
      const weightData = processDataPoints(
        backendHealthData.filter(item => item.weight !== null),
        'weight',
        maxPoints
      );

      // BMI 데이터 처리
      const bmiData = processDataPoints(
        backendHealthData.filter(item => item.bmi !== null),
        'bmi',
        maxPoints
      );

      // 운동 데이터 처리
      const exerciseData = processDataPoints(
        backendExerciseData.filter(item => item.duration_minutes !== null),
        'duration_minutes',
        maxPoints
      );

      const avgWeight = weightData.length > 0
        ? weightData.reduce((sum, item) => sum + item.value, 0) / weightData.length
        : 0;

      const avgBMI = bmiData.length > 0
        ? bmiData.reduce((sum, item) => sum + item.value, 0) / bmiData.length
        : 0;

      console.log(`📊 Backend chart data processed for ${period}:`, {
        weightData: weightData.length,
        bmiData: bmiData.length,
        exerciseData: exerciseData.length,
        maxPoints,
        avgWeight,
        avgBMI,
      });

      return {
        weight: weightData,
        bmi: bmiData,
        exercise: exerciseData,
        stats: {
          avgWeight: Number(avgWeight.toFixed(2)),
          avgBMI: Number(avgBMI.toFixed(2)),
          totalExerciseTime: exerciseData.reduce((sum, item) => sum + item.value, 0)
        }
      };
    }
    
    // 2️⃣ 백엔드 차트 데이터가 없으면 기존 로직 사용 (폴백)
    console.log('📊 Using fallback chart data processing');
    
    const safeHealthRecords = Array.isArray(healthRecords) ? healthRecords : [];
    const safeExerciseData = Array.isArray(exerciseData) ? exerciseData : [];
    
    if (safeHealthRecords.length === 0 && safeExerciseData.length === 0) {
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

    // Period별 데이터 그룹핑 사용 (기존 로직)
    const weightData = groupDataByPeriod(safeHealthRecords, period, 'record_date', 'weight');
    const bmiData = groupDataByPeriod(safeHealthRecords, period, 'record_date', 'bmi');
    const fallbackExerciseData = groupDataByPeriod(safeExerciseData, period, 'exercise_date', 'duration_minutes');

    const avgWeight = weightData.length > 0 
      ? weightData.reduce((sum, item) => sum + item.value, 0) / weightData.length 
      : 0;
    
    const avgBMI = bmiData.length > 0 
      ? bmiData.reduce((sum, item) => sum + item.value, 0) / bmiData.length 
      : 0;
    
    const totalExerciseTime = fallbackExerciseData.reduce((sum, item) => sum + item.value, 0);

    return {
      weight: weightData,
      bmi: bmiData,
      exercise: fallbackExerciseData,
      stats: {
        avgWeight: Number(avgWeight.toFixed(1)),
        avgBMI: Number(avgBMI.toFixed(1)),
        totalExerciseTime: Number(totalExerciseTime.toFixed(0)),
        weightTrend: 0,
        bmiTrend: 0
      }
    };
  }, [healthStatistics, healthRecords, exerciseData, groupDataByPeriod, period, formatDateForChart]);

  // Period에 따른 차트 제목 생성
  const getChartTitle = useCallback((baseTitle: string, period: 'day' | 'week' | 'month' | 'year'): string => {
    const periodLabels = {
      day: '일별',
      week: '주별', 
      month: '월별',
      year: '연별'
    };
    
    return `${periodLabels[period]} ${baseTitle}`;
  }, []);

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
                {getChartTitle('체중 변화 추이', period)}
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
                  dataKey="displayDate" 
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
            <span className="text-gray-500">
              {period === 'day' ? '최근' : period === 'week' ? '주별' : period === 'month' ? '월별' : '연별'} {chartData.weight.length}회 기록
            </span>
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
                {getChartTitle('BMI 변화 추이', period)}
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
                  dataKey="displayDate" 
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
                {getChartTitle('운동 시간', period)}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-purple-600">{chartData.stats.totalExerciseTime}분/총합</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.exercise}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  domain={[0, 'dataMax + 30']}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={30} 
                  stroke="#8b5cf6" 
                  strokeDasharray="5 5"
                  label={{ value: "일일 권장 시간", position: "insideTopRight" }}
                />
                {period === 'week' && (
                  <ReferenceLine 
                    y={720 / 7} // 주간 목표를 일평균으로 변환
                    stroke="#4c1d95" 
                    strokeDasharray="5 5"
                    label={{ value: "주간 목표 (일평균)", position: "insideTopLeft" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                  name="운동 시간"
                  unit="분"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center text-sm mt-4">
            <span className="text-gray-600">
              총 운동 시간: <span className="font-semibold text-gray-900">{chartData.stats.totalExerciseTime}분</span>
            </span>
            <span className="text-gray-500">
              평균: {chartData.exercise.length > 0 ? Math.round(chartData.stats.totalExerciseTime / chartData.exercise.length) : 0}분/{period === 'day' ? '일' : period === 'week' ? '주' : period === 'month' ? '월' : '년'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

StatisticsCharts.displayName = 'StatisticsCharts'; 