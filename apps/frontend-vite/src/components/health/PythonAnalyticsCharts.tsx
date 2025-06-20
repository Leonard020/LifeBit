/**
 * 파이썬 기반 고급 건강 데이터 분석 차트 컴포넌트
 * - 전문적인 통계 분석 및 시각화
 * - 일/주/월별 운동, 식단, 체중, BMI 목표치와 성취도 표시
 * - Plotly 기반 인터랙티브 차트
 * - AI 기반 개인화된 인사이트
 */

import React, { useState, useMemo } from 'react';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, type ExerciseSession, type MealLog, type HealthRecord } from '../../api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Weight, 
  Brain,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  Info,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  Timer,
  Flame,
  Heart,
  Utensils,
  Dumbbell
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  RadialBarChart,
  RadialBar,
  BarChart
} from 'recharts';

interface PythonAnalyticsChartsProps {
  userId: number;
  period: 'day' | 'week' | 'month' | 'year';
}

// 색상 팔레트
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899'
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export const PythonAnalyticsCharts: React.FC<PythonAnalyticsChartsProps> = ({
  userId,
  period
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'exercise' | 'nutrition' | 'goals'>('overview');
  
  // 실제 건강 데이터 조회
  const { 
    data: healthRecords, 
    isLoading: isHealthLoading, 
    error: healthError,
    refetch: refetchHealth 
  } = useHealthRecords(userId.toString(), period);

  const { 
    data: mealLogs, 
    isLoading: isMealLoading, 
    error: mealError,
    refetch: refetchMeals 
  } = useMealLogs(userId.toString(), period);

  const { 
    data: exerciseSessions, 
    isLoading: isExerciseLoading,
    error: exerciseError,
    refetch: refetchExercise 
  } = useExerciseSessions(userId.toString(), period);

  const { 
    data: userGoals, 
    isLoading: isGoalsLoading,
    error: goalsError,
    refetch: refetchGoals 
  } = useUserGoals(userId.toString());
  
  // 로딩 상태
  const isLoading = isHealthLoading || isMealLoading || isExerciseLoading || isGoalsLoading;
  
  // 오류 상태  
  const hasError = healthError || mealError || exerciseError || goalsError;

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    const healthRecordsData = healthRecords?.data || healthRecords || [];
    const exerciseSessionsData = exerciseSessions?.data || exerciseSessions || [];
    const mealLogsData = mealLogs?.data || mealLogs || [];
    const goalsData = userGoals?.data || userGoals;

    // 기간별 데이터 그룹화
    const groupedData: { [key: string]: {
      label: string;
      date: string;
      weight: number;
      bmi: number;
      exerciseMinutes: number;
      exerciseCalories: number;
      mealCalories: number;
      mealCount: number;
    } } = {};
    
    // 현재 날짜 기준 기간별 라벨 생성
    const now = new Date();
    const labels = [];
    
    if (period === 'day') {
      // 최근 7일
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const key = date.toISOString().split('T')[0];
        labels.push(label);
        groupedData[key] = {
          label,
          date: key,
          weight: 0,
          bmi: 0,
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
          mealCount: 0
        };
      }
    } else if (period === 'week') {
      // 최근 8주
      for (let i = 7; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const label = `${date.getMonth() + 1}월 ${Math.ceil(date.getDate() / 7)}주차`;
        const key = date.toISOString().split('T')[0];
        labels.push(label);
        groupedData[key] = {
          label,
          date: key,
          weight: 0,
          bmi: 0,
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
          mealCount: 0
        };
      }
    } else {
      // 최근 12개월
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' });
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        labels.push(label);
        groupedData[key] = {
          label,
          date: key,
          weight: 0,
          bmi: 0,
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
          mealCount: 0
        };
      }
    }

    // 건강 기록 데이터 매핑
    if (Array.isArray(healthRecordsData)) {
      healthRecordsData.forEach(record => {
        const dateKey = period === 'month' 
          ? record.record_date.substring(0, 7)
          : record.record_date;
        
        if (groupedData[dateKey]) {
          groupedData[dateKey].weight = record.weight;
          groupedData[dateKey].bmi = record.bmi;
        }
      });
    }

    // 운동 세션 데이터 매핑
    if (Array.isArray(exerciseSessionsData)) {
      exerciseSessionsData.forEach(session => {
        const dateKey = period === 'month' 
          ? session.exercise_date.substring(0, 7)
          : session.exercise_date;
        
        if (groupedData[dateKey]) {
          groupedData[dateKey].exerciseMinutes += session.duration_minutes || 0;
          groupedData[dateKey].exerciseCalories += session.calories_burned || 0;
        }
      });
    }

    // 식단 데이터 매핑 (예시)
    if (Array.isArray(mealLogsData)) {
      mealLogsData.forEach(meal => {
        const dateKey = period === 'month' 
          ? meal.log_date.substring(0, 7)
          : meal.log_date;
        
        if (groupedData[dateKey]) {
          groupedData[dateKey].mealCalories += 200; // 임시 칼로리 값
          groupedData[dateKey].mealCount += 1;
        }
      });
    }

    return Object.values(groupedData);
  }, [healthRecords, exerciseSessions, mealLogs, period]);

  // 목표 달성률 계산
  const goalAchievements = useMemo(() => {
    // 안전한 데이터 접근
    const goalsData = userGoals?.success && userGoals?.data ? userGoals.data : null;
    const exerciseData = exerciseSessions?.success && exerciseSessions?.data ? exerciseSessions.data : [];
    const mealData = mealLogs?.success && mealLogs?.data ? mealLogs.data : [];
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayExercise = Array.isArray(exerciseData) 
      ? exerciseData.filter((session: ExerciseSession) => session.exercise_date === today)
      : [];
    
    const todayMeals = Array.isArray(mealData)
      ? mealData.filter((meal: MealLog) => meal.log_date === today)
      : [];

    const exerciseMinutes = todayExercise.reduce((sum: number, session: ExerciseSession) => 
      sum + (session.duration_minutes || 0), 0);
    
    const dailyExerciseTarget = goalsData?.weekly_workout_target 
      ? Math.round(goalsData.weekly_workout_target / 7) 
      : 60;

    return {
      exercise: {
        current: exerciseMinutes,
        target: dailyExerciseTarget,
        percentage: Math.min((exerciseMinutes / dailyExerciseTarget) * 100, 100)
      },
      nutrition: {
        carbs: {
          current: todayMeals.length * 50, // 임시 계산
          target: goalsData?.daily_carbs_target || 300,
          percentage: Math.min((todayMeals.length * 50) / (goalsData?.daily_carbs_target || 300) * 100, 100)
        },
        protein: {
          current: todayMeals.length * 20,
          target: goalsData?.daily_protein_target || 120,
          percentage: Math.min((todayMeals.length * 20) / (goalsData?.daily_protein_target || 120) * 100, 100)
        },
        fat: {
          current: todayMeals.length * 15,
          target: goalsData?.daily_fat_target || 80,
          percentage: Math.min((todayMeals.length * 15) / (goalsData?.daily_fat_target || 80) * 100, 100)
        }
      }
    };
  }, [exerciseSessions, mealLogs, userGoals]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      refetchHealth(), 
      refetchMeals(), 
      refetchExercise(), 
      refetchGoals()
    ]).finally(() => setIsRefreshing(false));
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return '일별';
      case 'week': return '주별';
      case 'month': return '월별';
      case 'year': return '연별';
      default: return '기간별';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">파이썬 고급 분석</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">파이썬 고급 분석</h2>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>분석 오류</AlertTitle>
          <AlertDescription>
            파이썬 분석 데이터를 불러오는 중 오류가 발생했습니다. 새로고침을 시도해보세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">파이썬 고급 분석</h2>
          <p className="text-gray-600">{getPeriodLabel()} 건강 데이터 종합 분석</p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'weight' | 'exercise' | 'nutrition' | 'goals')}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            종합
          </TabsTrigger>
          <TabsTrigger value="weight" className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            체중&BMI
          </TabsTrigger>
          <TabsTrigger value="exercise" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            운동
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            영양
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            목표
          </TabsTrigger>
        </TabsList>

        {/* 종합 분석 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Weight className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">현재 체중</p>
                    <p className="text-2xl font-bold">
                      {chartData[chartData.length - 1]?.weight || 'N/A'}
                      {chartData[chartData.length - 1]?.weight && 'kg'}
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
                    <p className="text-sm font-medium text-gray-600">현재 BMI</p>
                    <p className="text-2xl font-bold">
                      {chartData[chartData.length - 1]?.bmi || 'N/A'}
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
                    <p className="text-sm font-medium text-gray-600">이번 주 운동</p>
                    <p className="text-2xl font-bold">
                      {chartData.reduce((sum, item) => sum + (item.exerciseMinutes || 0), 0)}분
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
                    <p className="text-sm font-medium text-gray-600">소모 칼로리</p>
                    <p className="text-2xl font-bold">
                      {chartData.reduce((sum, item) => sum + (item.exerciseCalories || 0), 0)}
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
                {getPeriodLabel()} 종합 트렌드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="exerciseMinutes" fill={COLORS.primary} name="운동 시간(분)" />
                  <Line yAxisId="right" type="monotone" dataKey="weight" stroke={COLORS.danger} strokeWidth={3} name="체중(kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="bmi" stroke={COLORS.purple} strokeWidth={2} name="BMI" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 체중 & BMI 분석 탭 */}
        <TabsContent value="weight" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 체중 트렌드 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Weight className="h-5 w-5 mr-2 text-blue-600" />
                  체중 변화 추이
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
                      dataKey="weight" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary} 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* BMI 트렌드 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  BMI 변화 추이
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
                      dataKey="bmi" 
                      stroke={COLORS.secondary} 
                      fill={COLORS.secondary} 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 체중 분석 상세 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>체중 분석 상세</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {chartData.length > 0 && chartData[chartData.length - 1]?.weight 
                      ? `${chartData[chartData.length - 1].weight}kg` 
                      : '데이터 없음'
                    }
                  </p>
                  <p className="text-sm text-gray-600">최근 체중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {chartData.length >= 2 
                      ? `${(chartData[chartData.length - 1]?.weight || 0) - (chartData[0]?.weight || 0) > 0 ? '+' : ''}${((chartData[chartData.length - 1]?.weight || 0) - (chartData[0]?.weight || 0)).toFixed(1)}kg`
                      : '0kg'
                    }
                  </p>
                  <p className="text-sm text-gray-600">기간별 변화</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    {chartData.length >= 2 
                      ? (chartData[chartData.length - 1]?.weight || 0) > (chartData[0]?.weight || 0) ? '증가' 
                        : (chartData[chartData.length - 1]?.weight || 0) < (chartData[0]?.weight || 0) ? '감소' 
                        : '변화없음'
                      : '데이터 부족'
                    }
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">트렌드</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 운동 분석 탭 */}
        <TabsContent value="exercise" className="space-y-6">
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
        </TabsContent>

        {/* 영양 분석 탭 */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 칼로리 섭취 트렌드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-purple-600" />
                  칼로리 섭취 추이
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
                      dataKey="mealCalories" 
                      stroke={COLORS.purple} 
                      fill={COLORS.purple} 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 식사 횟수 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  식사 횟수
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="mealCount" fill={COLORS.indigo} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 목표 달성률 탭 */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 운동 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  운동 목표 달성률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>오늘 운동 시간</span>
                    <span className="font-bold">
                      {goalAchievements.exercise.current}분 / {goalAchievements.exercise.target}분
                    </span>
                  </div>
                  <Progress value={goalAchievements.exercise.percentage} className="h-3" />
                  <div className="text-center">
                    <Badge variant={goalAchievements.exercise.percentage >= 100 ? "default" : "secondary"}>
                      {Math.round(goalAchievements.exercise.percentage)}% 달성
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 영양소 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-blue-600" />
                  영양소 목표 달성률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 탄수화물 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>탄수화물</span>
                      <span>{goalAchievements.nutrition.carbs.current}g / {goalAchievements.nutrition.carbs.target}g</span>
                    </div>
                    <Progress value={goalAchievements.nutrition.carbs.percentage} className="h-2" />
                  </div>
                  
                  {/* 단백질 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>단백질</span>
                      <span>{goalAchievements.nutrition.protein.current}g / {goalAchievements.nutrition.protein.target}g</span>
                    </div>
                    <Progress value={goalAchievements.nutrition.protein.percentage} className="h-2" />
                  </div>
                  
                  {/* 지방 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>지방</span>
                      <span>{goalAchievements.nutrition.fat.current}g / {goalAchievements.nutrition.fat.target}g</span>
                    </div>
                    <Progress value={goalAchievements.nutrition.fat.percentage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

          {/* 목표 달성률 원형 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>전체 목표 달성률</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                  { name: '운동', value: goalAchievements.exercise.percentage, fill: COLORS.secondary },
                  { name: '탄수화물', value: goalAchievements.nutrition.carbs.percentage, fill: COLORS.primary },
                  { name: '단백질', value: goalAchievements.nutrition.protein.percentage, fill: COLORS.accent },
                  { name: '지방', value: goalAchievements.nutrition.fat.percentage, fill: COLORS.purple }
                ]}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 실제 데이터 기반 인사이트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
            건강 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 요약 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">종합 분석</h4>
                  <p className="text-sm text-gray-600">
                {period === 'day' ? '최근 7일간' : period === 'week' ? '최근 8주간' : '최근 12개월간'} 
                건강 데이터를 분석한 결과입니다.
                  </p>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 성과 */}
                  <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      성과
                    </h4>
                    <div className="space-y-2">
                  {chartData.filter(item => item.exerciseMinutes > 0).length > 0 && (
                    <div className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {chartData.filter(item => item.exerciseMinutes > 0).length}일 운동 기록 달성
                      </span>
                    </div>
                  )}
                  {goalAchievements.exercise.percentage >= 100 && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">오늘 운동 목표 달성!</span>
                  </div>
                )}
                  {chartData.reduce((sum, item) => sum + item.mealCount, 0) > 0 && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        총 {chartData.reduce((sum, item) => sum + item.mealCount, 0)}회 식사 기록
                      </span>
                        </div>
                  )}
                    </div>
                  </div>

                {/* 권장사항 */}
                  <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-blue-500" />
                      권장사항
                    </h4>
                    <div className="space-y-2">
                  {goalAchievements.exercise.percentage < 100 && (
                    <div className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        운동 목표까지 {goalAchievements.exercise.target - goalAchievements.exercise.current}분 더 필요합니다
                      </span>
                  </div>
                )}
                  {chartData.filter(item => item.exerciseMinutes > 0).length < chartData.length / 2 && (
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">더 꾸준한 운동이 필요합니다</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">균형 잡힌 식단을 유지하세요</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 머신러닝 분석 섹션 - 향후 Airflow 파이프라인 연동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-indigo-600" />
            AI 머신러닝 분석
            <Badge variant="secondary" className="ml-2">준비 중</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* AI 분석 준비 중 안내 */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>AI 분석 시스템 준비 중</AlertTitle>
              <AlertDescription>
                Airflow 데이터 파이프라인과 머신러닝 모델을 통한 개인화된 건강 추천 시스템을 준비하고 있습니다.
                완성되면 더욱 정확하고 개인화된 건강 인사이트를 제공할 예정입니다.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 예정된 AI 기능들 */}
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">트렌드 예측</h3>
                  <p className="text-sm text-gray-500">
                    머신러닝 기반 체중 및 건강 지표 변화 예측
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">개인화 추천</h3>
                  <p className="text-sm text-gray-500">
                    개인 건강 패턴 분석을 통한 맞춤형 운동 및 식단 추천
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">이상 패턴 감지</h3>
                  <p className="text-sm text-gray-500">
                    AI 기반 건강 이상 패턴 조기 감지 및 알림
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">스마트 스케줄링</h3>
                  <p className="text-sm text-gray-500">
                    개인 패턴 학습을 통한 최적 운동 및 식사 시간 제안
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">건강 위험도 평가</h3>
                  <p className="text-sm text-gray-500">
                    종합적 건강 데이터 분석을 통한 위험도 평가 및 예방 방안 제시
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">동기부여 시스템</h3>
                  <p className="text-sm text-gray-500">
                    개인 성향 분석을 통한 맞춤형 동기부여 및 게임화 요소
                  </p>
            </CardContent>
          </Card>
        </div>


          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 