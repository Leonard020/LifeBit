/*헬스로그 개발

 * AI 기반 고급 건강 데이터 분석 차트 컴포넌트
 * - 전문적인 통계 분석 및 시각화
 * - 일/주/월별 운동, 식단, 체중, BMI 목표치와 성취도 표시
 * - Plotly 기반 인터랙티브 차트
 * - AI 기반 개인화된 인사이트
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, type ExerciseSession, type MealLog, type HealthRecord } from '../../api/auth';
import { useHealthAnalyticsReport, useAIHealthInsights } from '../../api/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { BodyPartFrequencyChart } from './BodyPartFrequencyChart';
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
  LineChart as RechartsLineChart,
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
import { getToken, getUserInfo, debugToken, isTokenValid } from '../../utils/auth';

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
  
  // 🔧 인증 상태 디버깅
  useEffect(() => {
    console.group('🔐 [PythonAnalyticsCharts] 인증 상태 디버깅');
    console.log('📝 Props userId:', userId);
    console.log('📝 Props period:', period);
    
    const token = getToken();
    const userInfo = getUserInfo();
    const tokenValid = isTokenValid();
    
    console.log('🔑 토큰 존재:', !!token);
    console.log('👤 사용자 정보:', userInfo);
    console.log('✅ 토큰 유효성:', tokenValid);
    
    if (token) {
      console.log('🔍 토큰 미리보기:', token.substring(0, 50) + '...');
      debugToken(); // 상세 토큰 정보 출력
    }
    
    console.groupEnd();
  }, [userId, period]);
  
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

  const { 
    data: healthStats, 
    isLoading: isHealthStatsLoading,
    error: healthStatsError,
    refetch: refetchHealthStats 
  } = useHealthStatistics(userId.toString(), 'week');

  // 🚀 Python AI Analytics API 호출
  const { 
    data: pythonAnalytics, 
    isLoading: isPythonAnalyticsLoading,
    error: pythonAnalyticsError
  } = useHealthAnalyticsReport(userId, period);

  const { 
    data: aiInsights, 
    isLoading: isAIInsightsLoading,
    error: aiInsightsError
  } = useAIHealthInsights(userId, period);
  
  // 로딩 상태
  const isLoading = isHealthLoading || isMealLoading || isExerciseLoading || isGoalsLoading || isHealthStatsLoading || isPythonAnalyticsLoading || isAIInsightsLoading;
  
  // 오류 상태  
  const hasError = healthError || mealError || exerciseError || goalsError || healthStatsError;

  // 🐛 디버그 로그 추가
  console.log('🔍 [PythonAnalyticsCharts] 데이터 확인:', {
    healthRecords: healthRecords,
    exerciseSessions: exerciseSessions,
    healthRecordsType: typeof healthRecords,
    exerciseSessionsType: typeof exerciseSessions,
    healthRecordsIsArray: Array.isArray(healthRecords),
    exerciseSessionsIsArray: Array.isArray(exerciseSessions),
    healthRecordsLength: Array.isArray(healthRecords) ? healthRecords.length : 'not array',
    exerciseSessionsLength: Array.isArray(exerciseSessions) ? exerciseSessions.length : 'not array',
    period,
    userId,
    healthRecordsSample: Array.isArray(healthRecords) ? healthRecords.slice(0, 2) : 'no data',
    exerciseSessionsSample: Array.isArray(exerciseSessions) ? exerciseSessions.slice(0, 2) : 'no data',
    healthError,
    exerciseError,
    isHealthLoading,
    isExerciseLoading,
    // 🔧 에러 상세 정보 추가
    healthErrorMessage: healthError?.message || 'Unknown error',
    exerciseErrorMessage: exerciseError?.message || 'Unknown error'
  });

  // 차트 데이터 준비 (Forward Fill 방식으로 자연스러운 트렌드 생성)
  const chartData = useMemo(() => {
    // API 응답이 직접 배열인 경우와 data 속성을 가진 경우 모두 처리
    const healthRecordsData = Array.isArray(healthRecords) 
      ? healthRecords 
      : (healthRecords?.data && Array.isArray(healthRecords.data) ? healthRecords.data : []);
    
    const exerciseSessionsData = Array.isArray(exerciseSessions) 
      ? exerciseSessions 
      : (exerciseSessions?.data && Array.isArray(exerciseSessions.data) ? exerciseSessions.data : []);
    
    const mealLogsData = Array.isArray(mealLogs) 
      ? mealLogs 
      : (mealLogs?.data && Array.isArray(mealLogs.data) ? mealLogs.data : []);
    
    const goalsData = userGoals?.data || userGoals;

    // 기간별 데이터 그룹화를 위한 헬퍼 함수
    const getDateKey = (dateStr: string, period: string): string => {
      const date = new Date(dateStr);
      switch (period) {
        case 'day':
          return dateStr; // YYYY-MM-DD 그대로 사용
        case 'week': {
          // 일요일 기준 주의 시작 날짜 반환
          const dayOfWeek = date.getDay();
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - dayOfWeek);
          const result = weekStart.toISOString().split('T')[0];
          
          // 디버깅용 로그
          if (period === 'week') {
            console.log(`🔧 주별 키 생성:`, {
              originalDate: dateStr,
              dayOfWeek,
              weekStart: result
            });
          }
          
          return result;
        }
        case 'month':
          return dateStr.substring(0, 7); // YYYY-MM
        default:
          return dateStr;
      }
    };

    // 기간별 라벨 생성 함수
    const generatePeriodLabel = (baseDate: Date, period: string, index: number): string => {
      switch (period) {
        case 'day':
          return baseDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        case 'week': {
          const weekEnd = new Date(baseDate);
          weekEnd.setDate(baseDate.getDate() + 6);
          return `${baseDate.getMonth() + 1}/${baseDate.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
        }
        case 'month':
          return baseDate.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' });
        default:
          return baseDate.toLocaleDateString('ko-KR');
      }
    };

    // 🔧 확장된 기간 설정 (3개월 전 데이터까지 포함하여 Forward Fill 적용)
    const getExtendedPeriod = () => {
      const now = new Date();
      const extendedData: { [key: string]: {
      label: string;
      date: string;
        weightValues: number[];
        bmiValues: number[];
      exerciseMinutes: number;
      exerciseCalories: number;
      mealCalories: number;
      mealCount: number;
        isDisplayPeriod: boolean; // 실제 표시할 기간인지 구분
    } } = {};
    
    if (period === 'day') {
        // 표시할 최근 7일 + 3개월 전 데이터 (97일)
        for (let i = 96; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
          const label = generatePeriodLabel(date, period, i);
          extendedData[key] = {
          label,
          date: key,
            weightValues: [],
            bmiValues: [],
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
            mealCount: 0,
            isDisplayPeriod: i <= 6 // 최근 7일만 표시
        };
      }
    } else if (period === 'week') {
        // 표시할 최근 8주 + 3개월 전 데이터 (20주)
        for (let i = 19; i >= 0; i--) {
          // 현재 주의 일요일 기준으로 i주 전 계산
          const currentWeekStart = new Date(now);
          const currentDayOfWeek = now.getDay();
          currentWeekStart.setDate(now.getDate() - currentDayOfWeek);
          
          // i주 전의 주 시작일 계산
          const weekStart = new Date(currentWeekStart);
          weekStart.setDate(currentWeekStart.getDate() - (i * 7));
          
          const key = weekStart.toISOString().split('T')[0];
          const label = generatePeriodLabel(weekStart, period, i);
          
          console.log(`🔧 [week] 주별 그룹 생성:`, {
            i,
            currentWeekStart: currentWeekStart.toISOString().split('T')[0],
            weekStart: key,
            label,
            isDisplayPeriod: i <= 7
          });
          
          extendedData[key] = {
          label,
          date: key,
            weightValues: [],
            bmiValues: [],
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
            mealCount: 0,
            isDisplayPeriod: i <= 7 // 최근 8주만 표시
        };
      }
    } else {
        // 표시할 최근 12개월 + 3개월 전 데이터 (15개월)
        for (let i = 14; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const label = generatePeriodLabel(date, period, i);
          extendedData[key] = {
          label,
          date: key,
            weightValues: [],
            bmiValues: [],
          exerciseMinutes: 0,
          exerciseCalories: 0,
          mealCalories: 0,
            mealCount: 0,
            isDisplayPeriod: i <= 11 // 최근 12개월만 표시
        };
      }
    }

      return extendedData;
    };

    const groupedData = getExtendedPeriod();

    // 건강 기록 데이터 매핑 (3개월 전 데이터까지 포함)
    if (Array.isArray(healthRecordsData)) {
      console.log(`🔧 [${period}] 건강 기록 데이터 매핑 시작:`, healthRecordsData.length);
      
      healthRecordsData.forEach(record => {
        const dateKey = getDateKey(record.record_date, period);
        
        console.log(`🔧 [${period}] 매핑 시도:`, {
          record_date: record.record_date,
          dateKey,
          hasGroup: !!groupedData[dateKey],
          weight: record.weight,
          bmi: record.bmi
        });
        
        if (groupedData[dateKey]) {
          if (record.weight) {
            groupedData[dateKey].weightValues.push(record.weight);
            console.log(`✅ [${period}] 체중 데이터 추가:`, dateKey, record.weight);
          }
          if (record.bmi) {
            groupedData[dateKey].bmiValues.push(record.bmi);
            console.log(`✅ [${period}] BMI 데이터 추가:`, dateKey, record.bmi);
          }
        } else {
          // 🔧 정확한 키가 없으면 가장 가까운 주별 그룹 찾기
          if (period === 'week') {
            const recordDate = new Date(record.record_date);
            const availableKeys = Object.keys(groupedData).sort();
            
            // 기록 날짜가 포함되는 주를 찾기
            let targetKey = null;
            for (const key of availableKeys) {
              const weekStart = new Date(key);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              
              if (recordDate >= weekStart && recordDate <= weekEnd) {
                targetKey = key;
                break;
              }
            }
            
            if (targetKey && groupedData[targetKey]) {
              if (record.weight) {
                groupedData[targetKey].weightValues.push(record.weight);
                console.log(`✅ [${period}] 대체 체중 매핑:`, {
                  original: dateKey,
                  target: targetKey,
                  record_date: record.record_date,
                  weight: record.weight
                });
              }
              if (record.bmi) {
                groupedData[targetKey].bmiValues.push(record.bmi);
                console.log(`✅ [${period}] 대체 BMI 매핑:`, {
                  original: dateKey,
                  target: targetKey,
                  record_date: record.record_date,
                  bmi: record.bmi
                });
              }
            } else {
              console.log(`❌ [${period}] 매핑 실패:`, {
                dateKey,
                record_date: record.record_date,
                availableKeys: availableKeys.slice(0, 5)
              });
            }
          } else {
            console.log(`❌ [${period}] 그룹 없음:`, dateKey, '사용 가능한 키:', Object.keys(groupedData).slice(0, 5));
          }
        }
      });
    }

    // 운동 세션 데이터 매핑 (3개월 전 데이터까지 포함)
    if (Array.isArray(exerciseSessionsData)) {
      console.log(`🔧 [${period}] 운동 세션 데이터 매핑 시작:`, exerciseSessionsData.length);
      
      exerciseSessionsData.forEach(session => {
        const dateKey = getDateKey(session.exercise_date, period);
        
        console.log(`🔧 [${period}] 운동 매핑 시도:`, {
          exercise_date: session.exercise_date,
          dateKey,
          hasGroup: !!groupedData[dateKey],
          duration_minutes: session.duration_minutes,
          calories_burned: session.calories_burned
        });
        
        if (groupedData[dateKey]) {
          groupedData[dateKey].exerciseMinutes += session.duration_minutes || 0;
          groupedData[dateKey].exerciseCalories += session.calories_burned || 0;
          console.log(`✅ [${period}] 운동 데이터 추가:`, dateKey, `${session.duration_minutes}분, ${session.calories_burned}kcal`);
        } else {
          // 🔧 정확한 키가 없으면 가장 가까운 주별 그룹 찾기
          if (period === 'week') {
            const exerciseDate = new Date(session.exercise_date);
            const availableKeys = Object.keys(groupedData).sort();
            
            // 운동 날짜가 포함되는 주를 찾기
            let targetKey = null;
            for (const key of availableKeys) {
              const weekStart = new Date(key);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              
              if (exerciseDate >= weekStart && exerciseDate <= weekEnd) {
                targetKey = key;
                break;
              }
            }
            
            if (targetKey && groupedData[targetKey]) {
              groupedData[targetKey].exerciseMinutes += session.duration_minutes || 0;
              groupedData[targetKey].exerciseCalories += session.calories_burned || 0;
              console.log(`✅ [${period}] 대체 운동 매핑:`, {
                original: dateKey,
                target: targetKey,
                exercise_date: session.exercise_date,
                duration: session.duration_minutes,
                calories: session.calories_burned
              });
            } else {
              console.log(`❌ [${period}] 운동 매핑 실패:`, {
                dateKey,
                exercise_date: session.exercise_date,
                availableKeys: availableKeys.slice(0, 5)
              });
            }
          } else {
            console.log(`❌ [${period}] 운동 그룹 없음:`, dateKey, '사용 가능한 키:', Object.keys(groupedData).slice(0, 5));
          }
        }
      });
    }

    // 식단 데이터 매핑
    if (Array.isArray(mealLogsData)) {
      mealLogsData.forEach(meal => {
        const dateKey = getDateKey(meal.log_date, period);
        
        if (groupedData[dateKey]) {
          const mealCalories = meal.food_item ? 
            (meal.food_item.calories_per_100g * (meal.amount || 100) / 100) : 
            200;
          groupedData[dateKey].mealCalories += mealCalories;
          groupedData[dateKey].mealCount += 1;
        }
      });
    }

    // 🔧 Forward Fill 방식으로 자연스러운 데이터 처리
    const sortedKeys = Object.keys(groupedData).sort();
    let lastValidWeight: number | null = null;
    let lastValidBmi: number | null = null;

    // 🔧 먼저 전체 데이터에서 가장 최근 유효값을 찾기 (시드 데이터)
    const allHealthData = Array.isArray(healthRecordsData) ? healthRecordsData : [];
    if (allHealthData.length > 0) {
      // 날짜순 정렬하여 가장 최근 데이터 사용
      const sortedHealthData = allHealthData.sort((a, b) => 
        new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
      );
      
      const latestRecord = sortedHealthData[0];
      if (latestRecord.weight) lastValidWeight = latestRecord.weight;
      if (latestRecord.bmi) lastValidBmi = latestRecord.bmi;
      
      console.log(`🔧 [${period}] 시드 데이터 설정:`, {
        latestRecord: latestRecord.record_date,
        seedWeight: lastValidWeight,
        seedBmi: lastValidBmi
      });
    }

    const processedData = sortedKeys.map(key => {
      const group = groupedData[key];
      
      // 현재 기간의 평균값 계산
      let currentWeight = group.weightValues.length > 0 ? 
        Math.round((group.weightValues.reduce((sum, val) => sum + val, 0) / group.weightValues.length) * 10) / 10 : null;
      
      let currentBmi = group.bmiValues.length > 0 ? 
        Math.round((group.bmiValues.reduce((sum, val) => sum + val, 0) / group.bmiValues.length) * 10) / 10 : null;

      // Forward Fill 적용: 데이터가 없으면 이전 유효값 사용
      if (currentWeight !== null) {
        lastValidWeight = currentWeight;
      } else if (lastValidWeight !== null) {
        currentWeight = lastValidWeight;
      }

      if (currentBmi !== null) {
        lastValidBmi = currentBmi;
      } else if (lastValidBmi !== null) {
        currentBmi = lastValidBmi;
      }

      return {
        label: group.label,
        date: group.date,
        // 🔧 차트 연결을 위해 Forward Fill 값 또는 null 사용
        weight: currentWeight,
        bmi: currentBmi,
        exerciseMinutes: group.exerciseMinutes,
        exerciseCalories: group.exerciseCalories,
        mealCalories: Math.round(group.mealCalories),
        mealCount: group.mealCount,
        isDisplayPeriod: group.isDisplayPeriod,
        // 🔧 데이터 존재 여부 표시 (점선/실선 구분용)
        hasWeightData: group.weightValues.length > 0,
        hasBmiData: group.bmiValues.length > 0,
        hasExerciseData: group.exerciseMinutes > 0
      };
    });

    // 표시할 기간만 필터링하여 반환
    const displayData = processedData.filter(item => item.isDisplayPeriod);
    
    // 🔧 상세 로그로 데이터 확인
    console.log(`📊 [${period}] 원본 건강 데이터 개수:`, allHealthData.length);
    console.log(`📊 [${period}] 그룹핑된 데이터 키:`, Object.keys(groupedData));
    console.log(`📊 [${period}] 처리된 차트 데이터:`, displayData.map(d => ({
      label: d.label,
      weight: d.weight,
      bmi: d.bmi,
      exerciseMinutes: d.exerciseMinutes,
      hasWeightData: d.hasWeightData,
      hasBmiData: d.hasBmiData,
      isDisplayPeriod: d.isDisplayPeriod
    })));

    return displayData;
  }, [healthRecords, exerciseSessions, mealLogs, period, userGoals]);

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

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI 스마트 분석</h2>
            <p className="text-gray-600 mt-2">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="ml-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태일 때 표시할 컴포넌트
  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">데이터를 불러올 수 없습니다</h3>
          <p className="text-muted-foreground mb-6">
            네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI 스마트 분석</h2>
          <p className="text-gray-600 mt-2">
            {getPeriodLabel()} 건강 데이터를 종합 분석하여 맞춤형 인사이트를 제공합니다.
          </p>
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
                    <p className="text-sm font-medium text-gray-600">{getPeriodLabel()} 평균 체중</p>
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
                    <p className="text-sm font-medium text-gray-600">{getPeriodLabel()} 평균 BMI</p>
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
                    <p className="text-sm font-medium text-gray-600">{getPeriodLabel()} 총 운동</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        // exercise_sessions 테이블에서 기간별 운동 시간 계산
                        // API 응답이 직접 배열인 경우와 data 속성을 가진 경우 모두 처리
                        const exerciseSessionsData = Array.isArray(exerciseSessions) 
                          ? exerciseSessions 
                          : (exerciseSessions?.data && Array.isArray(exerciseSessions.data) ? exerciseSessions.data : []);
                        
                        const totalMinutes = exerciseSessionsData.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
                        
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
                    <p className="text-sm font-medium text-gray-600">{getPeriodLabel()} 총 칼로리</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        // exercise_sessions 테이블에서 기간별 소모 칼로리 계산
                        // API 응답이 직접 배열인 경우와 data 속성을 가진 경우 모두 처리
                        const exerciseSessionsData = Array.isArray(exerciseSessions) 
                          ? exerciseSessions 
                          : (exerciseSessions?.data && Array.isArray(exerciseSessions.data) ? exerciseSessions.data : []);
                        
                        const totalCalories = exerciseSessionsData.reduce((sum, session) => sum + (session.calories_burned || 0), 0);
                        
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
                {getPeriodLabel()} 종합 트렌드
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
                    domain={[(dataMin) => Math.max(dataMin - 3, 40), (dataMax) => dataMax + 3]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="bmi" 
                    orientation="right" 
                    label={{ value: 'BMI', angle: 90, position: 'outside', style: { textAnchor: 'middle' } }}
                    domain={[(dataMin) => Math.max(dataMin - 2, 15), (dataMax) => Math.min(dataMax + 2, 35)]}
                    tick={{ fontSize: 12 }}
                    hide={true}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
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
                    dot={(props) => {
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
                    dot={(props) => {
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
                    dot={(props) => {
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
                              운동 시간을 늘려보세요. {getPeriodLabel()} 권장량은 {recommendedExercise}분 이상입니다.
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
                          <div key="exercise-consistency" className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-amber-500 mt-0.5" />
                            <span>
                              꾸준한 운동 기록을 위해 노력해보세요. 현재 {dataQuality.exercise}/{dataQuality.total} 기간에만 운동했습니다.
                            </span>
                          </div>
                        );
                      }

                      // 🔧 Forward Fill 적용된 데이터 안내
                      const forwardFilledData = chartData.filter(point => 
                        (point.weight > 0 && !point.hasWeightData) || 
                        (point.bmi > 0 && !point.hasBmiData)
                      ).length;

                      if (forwardFilledData > 0) {
                        recommendations.push(
                          <div key="forward-fill" className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                            <span className="text-gray-600">
                              일부 구간은 이전 데이터를 기반으로 추정되었습니다. (점선 표시)
                            </span>
                          </div>
                        );
                      }

                      return recommendations.length > 0 ? recommendations : (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>전반적으로 건강한 패턴과 꾸준한 기록을 보이고 있습니다!</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
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
                    {(() => {
                      // health_records 테이블에서 최신 체중 데이터 가져오기
                      const healthRecordsData = Array.isArray(healthRecords) 
                        ? healthRecords 
                        : (healthRecords?.data && Array.isArray(healthRecords.data) ? healthRecords.data : []);
                      
                      const latestRecord = healthRecordsData.length > 0 
                        ? healthRecordsData[healthRecordsData.length - 1] 
                        : null;
                      
                      if (latestRecord?.weight) {
                        return `${latestRecord.weight}kg`;
                      }
                      return '데이터 없음';
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">최근 체중</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {(() => {
                      // health_records 테이블에서 체중 변화 계산
                      const healthRecordsData = Array.isArray(healthRecords) 
                        ? healthRecords 
                        : (healthRecords?.data && Array.isArray(healthRecords.data) ? healthRecords.data : []);
                      
                      if (healthRecordsData.length < 2) {
                        return '0kg';
                      }
                      
                      const latestWeight = healthRecordsData[healthRecordsData.length - 1]?.weight || 0;
                      const firstWeight = healthRecordsData[0]?.weight || 0;
                      const change = latestWeight - firstWeight;
                      
                      const sign = change > 0 ? '+' : '';
                      return `${sign}${change.toFixed(1)}kg`;
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">기간별 변화</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    {(() => {
                      // health_records 테이블에서 체중 트렌드 계산
                      const healthRecordsData = Array.isArray(healthRecords) 
                        ? healthRecords 
                        : (healthRecords?.data && Array.isArray(healthRecords.data) ? healthRecords.data : []);
                      
                      if (healthRecordsData.length < 2) {
                        return '데이터 부족';
                      }
                      
                      const latestWeight = healthRecordsData[healthRecordsData.length - 1]?.weight || 0;
                      const firstWeight = healthRecordsData[0]?.weight || 0;
                      
                      if (latestWeight > firstWeight) {
                        return '증가';
                      } else if (latestWeight < firstWeight) {
                        return '감소';
                      } else {
                        return '변화없음';
                      }
                    })()}
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