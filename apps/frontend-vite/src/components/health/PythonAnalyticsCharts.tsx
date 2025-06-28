/*헬스로그 개발

 * AI 기반 고급 건강 데이터 분석 차트 컴포넌트
 * - 전문적인 통계 분석 및 시각화
 * - 일/주/월별 운동, 식단, 체중, BMI 목표치와 성취도 표시
 * - Plotly 기반 인터랙티브 차트
 * - AI 기반 개인화된 인사이트
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, type ExerciseSession, type MealLog, type HealthRecord } from '../../api/auth';

// ✅ 조인된 식단 데이터를 위한 확장 타입
interface MealLogWithFoodItem extends MealLog {
  food_item?: {
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  };
}
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
  PieChart as PieChartIcon,
  Calendar,
  Timer,
  Flame,
  Heart,
  Utensils,
  Dumbbell,
  X
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
  PieChart,
  Pie,
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
  // ✅ 목표 달성률 기간 선택 상태 추가
  const [goalPeriod, setGoalPeriod] = useState<'day' | 'week' | 'month'>('day');
  
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
    
    console.log('현재 사용자:', localStorage.getItem('userInfo'));
    console.log('토큰:', localStorage.getItem('access_token'));
    
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

  // ✅ 실제 영양소 통계를 위한 day period 호출 추가
  const { 
    data: nutritionStats, 
    isLoading: isNutritionStatsLoading,
    error: nutritionStatsError,
    refetch: refetchNutritionStats 
  } = useHealthStatistics(userId.toString(), 'day');

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
  const isLoading = isHealthLoading || isMealLoading || isExerciseLoading || isGoalsLoading || isHealthStatsLoading || isNutritionStatsLoading || isPythonAnalyticsLoading || isAIInsightsLoading;
  
  // 오류 상태  
  const hasError = healthError || mealError || exerciseError || goalsError || healthStatsError || nutritionStatsError;

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
          // ✅ 실제 API 응답 구조에 맞게 수정
          const mealCalories = meal.food_item ? 
            (meal.food_item.calories * (meal.quantity || 100) / 100) : 
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

  // 목표 달성률 계산 (기간별 지원)
  const goalAchievements = useMemo(() => {
    // 안전한 데이터 접근
    const goalsData = userGoals?.success && userGoals?.data ? userGoals.data : null;
    const exerciseData = exerciseSessions?.success && exerciseSessions?.data ? exerciseSessions.data : [];
    const mealData = mealLogs?.success && mealLogs?.data ? mealLogs.data : [];
    
    // ✅ 기간별 영양소 통계 데이터 활용
    const actualNutrition = nutritionStats?.data || nutritionStats || null;
    
    // 🔍 디버깅: nutritionStats 상세 확인
    console.log('🔍 [goalAchievements] 영양소 통계:', {
      goalPeriod,
      hasData: !!nutritionStats,
      actualNutrition: actualNutrition,
      loading: isNutritionStatsLoading,
      error: nutritionStatsError
    });
    
    // ✅ 기간별 날짜 범위 계산
    const getDateRange = (period: 'day' | 'week' | 'month') => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'day': {
          return {
            start: today.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          };
        }
        case 'week': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // 일요일부터
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return {
            start: startOfWeek.toISOString().split('T')[0],
            end: endOfWeek.toISOString().split('T')[0]
          };
        }
        case 'month': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return {
            start: startOfMonth.toISOString().split('T')[0],
            end: endOfMonth.toISOString().split('T')[0]
          };
        }
        default:
          return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
      }
    };

    const dateRange = getDateRange(goalPeriod);
    
    // ✅ 기간별 운동 데이터 필터링
    const periodExercise = Array.isArray(exerciseData) 
      ? exerciseData.filter((session: ExerciseSession) => {
          const sessionDate = session.exercise_date;
          return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
        })
      : [];
    
    // ✅ 기간별 식단 데이터 필터링
    const periodMeals = Array.isArray(mealData)
      ? mealData.filter((meal: MealLog) => {
          const mealDate = meal.log_date;
          return mealDate >= dateRange.start && mealDate <= dateRange.end;
        })
      : [];

    // ✅ 기간별 운동 시간 계산
    const exerciseMinutes = periodExercise.reduce((sum: number, session: ExerciseSession) => 
      sum + (session.duration_minutes || 0), 0);
    
    // ✅ 실제 DB 목표 데이터 기반 운동 목표 계산 (하드코딩 제거)
    const weeklyWorkoutTarget = goalsData?.weekly_workout_target;
    const getExerciseTarget = (period: 'day' | 'week' | 'month') => {
      if (!weeklyWorkoutTarget) return null; // DB에 목표가 없으면 null 반환
      
      switch (period) {
        case 'day': {
          return Math.round(weeklyWorkoutTarget / 7); // 하루 목표
        }
        case 'week': {
          return weeklyWorkoutTarget; // 주간 목표
        }
        case 'month': {
          return weeklyWorkoutTarget * 4; // 월간 목표 (주간 × 4)
        }
        default:
          return weeklyWorkoutTarget;
      }
    };
    
    const exerciseTarget = getExerciseTarget(goalPeriod);

    // ✅ 기간별 영양소 데이터 계산 (실제 섭취량)
    let periodCalories = 0;
    let periodCarbs = 0;
    let periodProtein = 0;
    let periodFat = 0;

    // 기간이 'day'인 경우 실제 영양소 통계를 우선 사용
    if (goalPeriod === 'day' && actualNutrition) {
      periodCalories = actualNutrition.dailyCalories || 0;
      periodCarbs = actualNutrition.dailyCarbs || 0;
      periodProtein = actualNutrition.dailyProtein || 0;
      periodFat = actualNutrition.dailyFat || 0;
    } else {
      // 주간/월간의 경우 meal_logs에서 직접 계산
      periodMeals.forEach((meal: MealLogWithFoodItem) => {
        // API 응답에서 조인된 food_item 데이터가 포함될 수 있음
        const foodItem = meal.food_item;
        if (foodItem && meal.quantity) {
          const quantity = meal.quantity / 100; // 100g 기준으로 변환
          periodCalories += (foodItem.calories || 0) * quantity;
          periodCarbs += (foodItem.carbs || 0) * quantity;
          periodProtein += (foodItem.protein || 0) * quantity;
          periodFat += (foodItem.fat || 0) * quantity;
        }
      });
    }

    // ✅ 실제 DB 목표 데이터 기반 영양소 목표 계산 (하드코딩 제거)
    const carbsTargetDaily = goalsData?.daily_carbs_target;
    const proteinTargetDaily = goalsData?.daily_protein_target;
    const fatTargetDaily = goalsData?.daily_fat_target;
    const caloriesTargetDaily = goalsData?.daily_calories_target;

    const getNutritionTarget = (dailyTarget: number | undefined, period: 'day' | 'week' | 'month') => {
      if (!dailyTarget) return null; // DB에 목표가 없으면 null 반환
      
      switch (period) {
        case 'day': {
          return dailyTarget;
        }
        case 'week': {
          return dailyTarget * 7;
        }
        case 'month': {
          return dailyTarget * 30; // 월간 목표 (일간 × 30)
        }
        default:
          return dailyTarget;
      }
    };

    const carbsTarget = getNutritionTarget(carbsTargetDaily, goalPeriod);
    const proteinTarget = getNutritionTarget(proteinTargetDaily, goalPeriod);
    const fatTarget = getNutritionTarget(fatTargetDaily, goalPeriod);
    const caloriesTarget = getNutritionTarget(caloriesTargetDaily, goalPeriod);

    // ✅ 운동 부위별 주간 목표 및 실제 수행 시간 계산
    const bodyPartTargets = {
      chest: goalsData?.weekly_chest,
      back: goalsData?.weekly_back,
      legs: goalsData?.weekly_legs,
      shoulders: goalsData?.weekly_shoulders,
      arms: goalsData?.weekly_arms,
      abs: goalsData?.weekly_abs,
      cardio: goalsData?.weekly_cardio
    };

    // 운동 부위별 실제 수행 시간 계산 (주간 데이터만 사용)
    const calculateBodyPartMinutes = () => {
      const bodyPartMinutes = {
        chest: 0,
        back: 0,
        legs: 0,
        shoulders: 0,
        arms: 0,
        abs: 0,
        cardio: 0
      };

      // 주간 운동 데이터만 사용 (goalPeriod가 week일 때만 의미있음)
      if (goalPeriod === 'week') {
        periodExercise.forEach((session: ExerciseSession) => {
          // 운동 카탈로그 정보를 통해 부위별 분류 (임시로 시간을 균등 배분)
          // 실제로는 exercise_catalog와 조인하여 target_body_part를 가져와야 함
          const duration = session.duration_minutes || 0;
          
          // 임시 로직: exercise_catalog_id를 기반으로 부위 분류
          // 실제로는 백엔드에서 exercise_catalog와 조인된 데이터를 받아야 함
          const catalogId = session.exercise_catalog_id;
          
          // 임시 매핑 (실제로는 exercise_catalog 테이블에서 target_body_part 조회 필요)
          if (catalogId >= 1 && catalogId <= 10) {
            bodyPartMinutes.chest += duration;
          } else if (catalogId >= 11 && catalogId <= 20) {
            bodyPartMinutes.back += duration;
          } else if (catalogId >= 21 && catalogId <= 30) {
            bodyPartMinutes.legs += duration;
          } else if (catalogId >= 31 && catalogId <= 40) {
            bodyPartMinutes.shoulders += duration;
          } else if (catalogId >= 41 && catalogId <= 50) {
            bodyPartMinutes.arms += duration;
          } else if (catalogId >= 51 && catalogId <= 60) {
            bodyPartMinutes.abs += duration;
          } else if (catalogId >= 61 && catalogId <= 70) {
            bodyPartMinutes.cardio += duration;
          } else {
            // 분류되지 않은 운동은 전체 운동에 균등 배분
            const parts = Object.keys(bodyPartMinutes);
            const perPart = duration / parts.length;
            parts.forEach(part => {
              bodyPartMinutes[part as keyof typeof bodyPartMinutes] += perPart;
            });
          }
        });
      }

      return bodyPartMinutes;
    };

    const bodyPartActual = calculateBodyPartMinutes();

    // 🔍 디버깅: 최종 계산 값 확인
    console.log('🔍 [goalAchievements] 최종 계산:', {
      goalPeriod,
      dateRange,
      운동시간: exerciseMinutes,
      운동목표: exerciseTarget,
      칼로리: Math.round(periodCalories),
      칼로리목표: caloriesTarget,
      탄수화물: Math.round(periodCarbs * 10) / 10,
      탄수화물목표: carbsTarget,
      단백질: Math.round(periodProtein * 10) / 10,
      단백질목표: proteinTarget,
      지방: Math.round(periodFat * 10) / 10,
      지방목표: fatTarget,
      periodExerciseCount: periodExercise.length,
      periodMealsCount: periodMeals.length
    });

    return {
      period: goalPeriod,
      dateRange,
      exercise: {
        current: exerciseMinutes,
        target: exerciseTarget,
        percentage: exerciseTarget ? Math.min((exerciseMinutes / exerciseTarget) * 100, 100) : 0,
        hasTarget: !!exerciseTarget
      },
      nutrition: {
        carbs: {
          current: Math.round(periodCarbs * 10) / 10,
          target: carbsTarget,
          percentage: carbsTarget ? Math.min((periodCarbs / carbsTarget) * 100, 100) : 0,
          hasTarget: !!carbsTarget
        },
        protein: {
          current: Math.round(periodProtein * 10) / 10,
          target: proteinTarget,
          percentage: proteinTarget ? Math.min((periodProtein / proteinTarget) * 100, 100) : 0,
          hasTarget: !!proteinTarget
        },
        fat: {
          current: Math.round(periodFat * 10) / 10,
          target: fatTarget,
          percentage: fatTarget ? Math.min((periodFat / fatTarget) * 100, 100) : 0,
          hasTarget: !!fatTarget
        },
        calories: {
          current: Math.round(periodCalories),
          target: caloriesTarget,
          percentage: caloriesTarget ? Math.min((periodCalories / caloriesTarget) * 100, 100) : 0,
          hasTarget: !!caloriesTarget
        }
      },
      // ✅ 운동 부위별 목표 달성률 (주간만)
      bodyParts: goalPeriod === 'week' ? {
        chest: {
          current: Math.round(bodyPartActual.chest),
          target: bodyPartTargets.chest,
          percentage: bodyPartTargets.chest ? Math.min((bodyPartActual.chest / bodyPartTargets.chest) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.chest
        },
        back: {
          current: Math.round(bodyPartActual.back),
          target: bodyPartTargets.back,
          percentage: bodyPartTargets.back ? Math.min((bodyPartActual.back / bodyPartTargets.back) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.back
        },
        legs: {
          current: Math.round(bodyPartActual.legs),
          target: bodyPartTargets.legs,
          percentage: bodyPartTargets.legs ? Math.min((bodyPartActual.legs / bodyPartTargets.legs) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.legs
        },
        shoulders: {
          current: Math.round(bodyPartActual.shoulders),
          target: bodyPartTargets.shoulders,
          percentage: bodyPartTargets.shoulders ? Math.min((bodyPartActual.shoulders / bodyPartTargets.shoulders) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.shoulders
        },
        arms: {
          current: Math.round(bodyPartActual.arms),
          target: bodyPartTargets.arms,
          percentage: bodyPartTargets.arms ? Math.min((bodyPartActual.arms / bodyPartTargets.arms) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.arms
        },
        abs: {
          current: Math.round(bodyPartActual.abs),
          target: bodyPartTargets.abs,
          percentage: bodyPartTargets.abs ? Math.min((bodyPartActual.abs / bodyPartTargets.abs) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.abs
        },
        cardio: {
          current: Math.round(bodyPartActual.cardio),
          target: bodyPartTargets.cardio,
          percentage: bodyPartTargets.cardio ? Math.min((bodyPartActual.cardio / bodyPartTargets.cardio) * 100, 100) : 0,
          hasTarget: !!bodyPartTargets.cardio
        }
      } : null,
      // ✅ 전체 목표 설정 여부 확인
      hasAnyTargets: !!(exerciseTarget || carbsTarget || proteinTarget || fatTarget || caloriesTarget)
    };
  }, [exerciseSessions, mealLogs, userGoals, nutritionStats, goalPeriod, isNutritionStatsLoading, nutritionStatsError]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([
      refetchHealth(), 
      refetchMeals(), 
      refetchExercise(), 
      refetchGoals(),
      refetchNutritionStats() // ✅ 영양소 통계 새로고침 추가
    ]).finally(() => setIsRefreshing(false));
  };

  // 🔧 디버깅용 테스트 함수
  const handleDebugTest = async () => {
    console.log('=== 디버깅 테스트 시작 ===');
    console.log('1. userGoals:', userGoals);
    console.log('2. nutritionStats:', nutritionStats);
    console.log('3. exerciseSessions:', exerciseSessions);
    console.log('4. mealLogs:', mealLogs);
    
    // 영양소 통계 강제 새로고침
    const result = await refetchNutritionStats();
    console.log('5. 강제 새로고침 결과:', result);
    console.log('=== 디버깅 테스트 완료 ===');
    console.log('테스트 성공!');
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
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={handleDebugTest} variant="outline" className="ml-2">
            🔧 디버깅
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
        <Button onClick={handleDebugTest} variant="outline" className="ml-2">
          🔧 디버깅
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
          {/* ✅ 기간 선택 탭 추가 */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center text-2xl">
                <Target className="h-6 w-6 mr-2 text-blue-600" />
                목표 달성률
              </CardTitle>
              <div className="text-sm text-gray-600 mb-4">
                {goalPeriod === 'day' && new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
                {goalPeriod === 'week' && `이번 주 (${goalAchievements.dateRange.start} ~ ${goalAchievements.dateRange.end})`}
                {goalPeriod === 'month' && `이번 달 (${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })})`}
              </div>
              
              {/* ✅ 일/주/월 선택 탭 */}
              <Tabs value={goalPeriod} onValueChange={(value) => setGoalPeriod(value as 'day' | 'week' | 'month')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="day" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    일
                  </TabsTrigger>
                  <TabsTrigger value="week" className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    주
                  </TabsTrigger>
                  <TabsTrigger value="month" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    월
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* 운동 목표 미니 카드 */}
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      {/* 배경 원 */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                      {/* 진행 원 */}
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={
                          !goalAchievements.exercise.hasTarget ? "#d1d5db" : // 목표 없으면 회색
                          goalAchievements.exercise.percentage >= 100 ? "#10b981" : 
                          goalAchievements.exercise.percentage >= 50 ? "#f59e0b" : "#ef4444"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.exercise.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">
                        {Math.round(goalAchievements.exercise.percentage)}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">운동</h3>
                  <p className="text-sm text-gray-600">
                    {goalAchievements.exercise.hasTarget 
                      ? `${goalAchievements.exercise.current}분 / ${goalAchievements.exercise.target}분`
                      : `${goalAchievements.exercise.current}분 / 목표 미설정`
                    }
                  </p>
                  <Badge 
                    variant={
                      !goalAchievements.exercise.hasTarget ? "outline" :
                      goalAchievements.exercise.percentage >= 100 ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {!goalAchievements.exercise.hasTarget ? "목표 미설정" :
                     goalAchievements.exercise.percentage >= 100 ? "달성!" : "진행중"}
                  </Badge>
                </div>

                {/* 탄수화물 목표 미니 카드 */}
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={
                          !goalAchievements.nutrition.carbs.hasTarget ? "#d1d5db" : // 목표 없으면 회색
                          goalAchievements.nutrition.carbs.percentage >= 100 ? "#10b981" : 
                          goalAchievements.nutrition.carbs.percentage >= 50 ? "#3b82f6" : "#f59e0b"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.nutrition.carbs.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">
                        {Math.round(goalAchievements.nutrition.carbs.percentage)}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">탄수화물</h3>
                  <p className="text-sm text-gray-600">
                    {goalAchievements.nutrition.carbs.hasTarget 
                      ? `${goalAchievements.nutrition.carbs.current}g / ${goalAchievements.nutrition.carbs.target}g`
                      : `${goalAchievements.nutrition.carbs.current}g / 목표 미설정`
                    }
                  </p>
                  <Badge 
                    variant={
                      !goalAchievements.nutrition.carbs.hasTarget ? "outline" :
                      goalAchievements.nutrition.carbs.percentage >= 100 ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {!goalAchievements.nutrition.carbs.hasTarget ? "목표 미설정" :
                     goalAchievements.nutrition.carbs.percentage >= 100 ? "달성!" : "진행중"}
                  </Badge>
                </div>

                {/* 단백질 목표 미니 카드 */}
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={
                          !goalAchievements.nutrition.protein.hasTarget ? "#d1d5db" : // 목표 없으면 회색
                          goalAchievements.nutrition.protein.percentage >= 100 ? "#10b981" : 
                          goalAchievements.nutrition.protein.percentage >= 50 ? "#8b5cf6" : "#f59e0b"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.nutrition.protein.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">
                        {Math.round(goalAchievements.nutrition.protein.percentage)}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">단백질</h3>
                  <p className="text-sm text-gray-600">
                    {goalAchievements.nutrition.protein.hasTarget 
                      ? `${goalAchievements.nutrition.protein.current}g / ${goalAchievements.nutrition.protein.target}g`
                      : `${goalAchievements.nutrition.protein.current}g / 목표 미설정`
                    }
                  </p>
                  <Badge 
                    variant={
                      !goalAchievements.nutrition.protein.hasTarget ? "outline" :
                      goalAchievements.nutrition.protein.percentage >= 100 ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {!goalAchievements.nutrition.protein.hasTarget ? "목표 미설정" :
                     goalAchievements.nutrition.protein.percentage >= 100 ? "달성!" : "진행중"}
                  </Badge>
                </div>

                {/* 지방 목표 미니 카드 */}
                <div className="text-center p-4 bg-white rounded-xl shadow-sm border">
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                      <circle 
                        cx="50" cy="50" r="40" fill="none" 
                        stroke={
                          !goalAchievements.nutrition.fat.hasTarget ? "#d1d5db" : // 목표 없으면 회색
                          goalAchievements.nutrition.fat.percentage >= 100 ? "#10b981" : 
                          goalAchievements.nutrition.fat.percentage >= 50 ? "#ec4899" : "#f59e0b"
                        }
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.nutrition.fat.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">
                        {Math.round(goalAchievements.nutrition.fat.percentage)}%
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">지방</h3>
                  <p className="text-sm text-gray-600">
                    {goalAchievements.nutrition.fat.hasTarget 
                      ? `${goalAchievements.nutrition.fat.current}g / ${goalAchievements.nutrition.fat.target}g`
                      : `${goalAchievements.nutrition.fat.current}g / 목표 미설정`
                    }
                  </p>
                  <Badge 
                    variant={
                      !goalAchievements.nutrition.fat.hasTarget ? "outline" :
                      goalAchievements.nutrition.fat.percentage >= 100 ? "default" : "secondary"
                    }
                    className="mt-2"
                  >
                    {!goalAchievements.nutrition.fat.hasTarget ? "목표 미설정" :
                     goalAchievements.nutrition.fat.percentage >= 100 ? "달성!" : "진행중"}
                  </Badge>
                </div>
              </div>

              {/* ✅ 기간별 목표 달성률 요약 정보 */}
              <div className="mt-6 p-4 bg-white rounded-lg border">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    {goalPeriod === 'day' && '오늘의'}
                    {goalPeriod === 'week' && '이번 주'}
                    {goalPeriod === 'month' && '이번 달'} 
                    전체 목표 달성률
                  </h4>
                  
                  {goalAchievements.hasAnyTargets ? (
                    <>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {Math.round((
                          (goalAchievements.exercise.hasTarget ? goalAchievements.exercise.percentage : 0) +
                          (goalAchievements.nutrition.carbs.hasTarget ? goalAchievements.nutrition.carbs.percentage : 0) +
                          (goalAchievements.nutrition.protein.hasTarget ? goalAchievements.nutrition.protein.percentage : 0) +
                          (goalAchievements.nutrition.fat.hasTarget ? goalAchievements.nutrition.fat.percentage : 0)
                        ) / [
                          goalAchievements.exercise.hasTarget,
                          goalAchievements.nutrition.carbs.hasTarget,
                          goalAchievements.nutrition.protein.hasTarget,
                          goalAchievements.nutrition.fat.hasTarget
                        ].filter(Boolean).length)}%
                      </div>
                      <p className="text-sm text-gray-600">
                        {[
                          goalAchievements.exercise.hasTarget,
                          goalAchievements.nutrition.carbs.hasTarget,
                          goalAchievements.nutrition.protein.hasTarget,
                          goalAchievements.nutrition.fat.hasTarget
                        ].filter(Boolean).length}개 목표 중 {[
                          goalAchievements.exercise.hasTarget && goalAchievements.exercise.percentage >= 100 ? 1 : 0,
                          goalAchievements.nutrition.carbs.hasTarget && goalAchievements.nutrition.carbs.percentage >= 100 ? 1 : 0,
                          goalAchievements.nutrition.protein.hasTarget && goalAchievements.nutrition.protein.percentage >= 100 ? 1 : 0,
                          goalAchievements.nutrition.fat.hasTarget && goalAchievements.nutrition.fat.percentage >= 100 ? 1 : 0
                        ].reduce((a, b) => a + b, 0)}개 달성 완료
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-400 mb-2">
                        목표 미설정
                      </div>
                      <p className="text-sm text-gray-500">
                        건강 목표를 설정하여 진행률을 확인해보세요
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 📊 상세 운동 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  상세 운동 목표 달성률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 메인 운동 목표 */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">오늘 운동 시간</span>
                      <span className="text-2xl font-bold text-green-600">
                        {goalAchievements.exercise.current}분
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={goalAchievements.exercise.percentage} className="h-4" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white drop-shadow">
                          {Math.round(goalAchievements.exercise.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>0분</span>
                      <span>목표: {goalAchievements.exercise.target}분</span>
                    </div>
                  </div>

                  {/* 운동 상태 메시지 */}
                  <div className={`p-4 rounded-lg border-l-4 ${
                    goalAchievements.exercise.percentage >= 100 
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : goalAchievements.exercise.percentage >= 50
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                      : 'bg-red-50 border-red-500 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {goalAchievements.exercise.percentage >= 100 ? (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      ) : goalAchievements.exercise.percentage >= 50 ? (
                        <AlertTriangle className="h-5 w-5 mr-2" />
                      ) : (
                        <X className="h-5 w-5 mr-2" />
                      )}
                      <span className="font-medium">
                        {goalAchievements.exercise.percentage >= 100 
                          ? '🎉 오늘 운동 목표를 달성했습니다!'
                          : goalAchievements.exercise.percentage >= 50
                          ? `💪 조금만 더! ${goalAchievements.exercise.target - goalAchievements.exercise.current}분 더 운동하면 목표 달성!`
                          : `🔥 화이팅! ${goalAchievements.exercise.target - goalAchievements.exercise.current}분 운동으로 목표를 달성해보세요!`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🍎 상세 영양소 목표 달성률 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="h-5 w-5 mr-2 text-blue-600" />
                  상세 영양소 목표 달성률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 탄수화물 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center">
                        🍞 탄수화물
                      </span>
                      <span className="font-bold text-blue-600">
                        {goalAchievements.nutrition.carbs.current}g / {goalAchievements.nutrition.carbs.target}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={goalAchievements.nutrition.carbs.percentage} className="h-3" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white drop-shadow">
                          {Math.round(goalAchievements.nutrition.carbs.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 단백질 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center">
                        🥩 단백질
                      </span>
                      <span className="font-bold text-purple-600">
                        {goalAchievements.nutrition.protein.current}g / {goalAchievements.nutrition.protein.target}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={goalAchievements.nutrition.protein.percentage} className="h-3" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white drop-shadow">
                          {Math.round(goalAchievements.nutrition.protein.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 지방 */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium flex items-center">
                        🥑 지방
                      </span>
                      <span className="font-bold text-pink-600">
                        {goalAchievements.nutrition.fat.current}g / {goalAchievements.nutrition.fat.target}g
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={goalAchievements.nutrition.fat.percentage} className="h-3" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white drop-shadow">
                          {Math.round(goalAchievements.nutrition.fat.percentage)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 영양소 상태 요약 */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">📈 영양소 섭취 현황</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`p-2 rounded ${goalAchievements.nutrition.carbs.percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="text-xs">탄수화물</div>
                        <div className="font-bold">{Math.round(goalAchievements.nutrition.carbs.percentage)}%</div>
                      </div>
                      <div className={`p-2 rounded ${goalAchievements.nutrition.protein.percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="text-xs">단백질</div>
                        <div className="font-bold">{Math.round(goalAchievements.nutrition.protein.percentage)}%</div>
                      </div>
                      <div className={`p-2 rounded ${goalAchievements.nutrition.fat.percentage >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        <div className="text-xs">지방</div>
                        <div className="font-bold">{Math.round(goalAchievements.nutrition.fat.percentage)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ✅ 운동 부위별 목표 달성률 (주간만 표시) */}
          {goalPeriod === 'week' && goalAchievements.bodyParts && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-orange-600" />
                  주간 운동 부위별 목표 달성률
                </CardTitle>
                <p className="text-sm text-gray-600">
                  이번 주 각 부위별 운동 목표 진행 현황
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {/* 가슴 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">💪</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">가슴</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.chest.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.chest.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.chest.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.chest.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.chest.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.chest.hasTarget 
                        ? `${goalAchievements.bodyParts.chest.current}분 / ${goalAchievements.bodyParts.chest.target}분`
                        : `${goalAchievements.bodyParts.chest.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 등 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🏋️</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">등</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.back.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.back.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.back.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.back.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.back.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.back.hasTarget 
                        ? `${goalAchievements.bodyParts.back.current}분 / ${goalAchievements.bodyParts.back.target}분`
                        : `${goalAchievements.bodyParts.back.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 다리 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🦵</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">다리</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.legs.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.legs.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.legs.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.legs.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.legs.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.legs.hasTarget 
                        ? `${goalAchievements.bodyParts.legs.current}분 / ${goalAchievements.bodyParts.legs.target}분`
                        : `${goalAchievements.bodyParts.legs.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 어깨 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🤲</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">어깨</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.shoulders.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.shoulders.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.shoulders.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.shoulders.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.shoulders.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.shoulders.hasTarget 
                        ? `${goalAchievements.bodyParts.shoulders.current}분 / ${goalAchievements.bodyParts.shoulders.target}분`
                        : `${goalAchievements.bodyParts.shoulders.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 팔 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">💪</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">팔</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.arms.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.arms.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.arms.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.arms.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.arms.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.arms.hasTarget 
                        ? `${goalAchievements.bodyParts.arms.current}분 / ${goalAchievements.bodyParts.arms.target}분`
                        : `${goalAchievements.bodyParts.arms.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 복근 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">복근</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.abs.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.abs.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.abs.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.abs.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.abs.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.abs.hasTarget 
                        ? `${goalAchievements.bodyParts.abs.current}분 / ${goalAchievements.bodyParts.abs.target}분`
                        : `${goalAchievements.bodyParts.abs.current}분 / 미설정`
                      }
                    </p>
                  </div>

                  {/* 유산소 */}
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">🏃</div>
                    <h4 className="font-medium text-sm text-gray-800 mb-2">유산소</h4>
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                        <circle 
                          cx="50" cy="50" r="40" fill="none" 
                          stroke={
                            !goalAchievements.bodyParts.cardio.hasTarget ? "#d1d5db" :
                            goalAchievements.bodyParts.cardio.percentage >= 100 ? "#10b981" : 
                            goalAchievements.bodyParts.cardio.percentage >= 50 ? "#f59e0b" : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 40 * Math.min(goalAchievements.bodyParts.cardio.percentage, 100) / 100} ${2 * Math.PI * 40}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-800">
                          {Math.round(goalAchievements.bodyParts.cardio.percentage)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {goalAchievements.bodyParts.cardio.hasTarget 
                        ? `${goalAchievements.bodyParts.cardio.current}분 / ${goalAchievements.bodyParts.cardio.target}분`
                        : `${goalAchievements.bodyParts.cardio.current}분 / 미설정`
                      }
                    </p>
                  </div>
                </div>

                {/* 부위별 목표 설정 안내 */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-sm text-blue-700">
                    <Info className="h-4 w-4 mr-2" />
                    <span>
                      운동 부위별 목표는 주간 단위로 설정됩니다. 
                      exercise_catalog 테이블의 target_body_part 정보를 기반으로 계산됩니다.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 🎯 전체 목표 달성률 종합 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-xl">
                <PieChartIcon className="h-6 w-6 mr-2 text-indigo-600" />
                전체 목표 달성률 종합
              </CardTitle>
              <div className="text-center text-sm text-gray-600">
                오늘의 전반적인 건강 목표 달성 현황
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: '운동', 
                        value: Math.round(goalAchievements.exercise.percentage),
                        fill: goalAchievements.exercise.percentage >= 100 ? '#10b981' : goalAchievements.exercise.percentage >= 50 ? '#f59e0b' : '#ef4444',
                        icon: '💪'
                      },
                      { 
                        name: '탄수화물', 
                        value: Math.round(goalAchievements.nutrition.carbs.percentage),
                        fill: goalAchievements.nutrition.carbs.percentage >= 100 ? '#10b981' : goalAchievements.nutrition.carbs.percentage >= 50 ? '#3b82f6' : '#f59e0b',
                        icon: '🍞'
                      },
                      { 
                        name: '단백질', 
                        value: Math.round(goalAchievements.nutrition.protein.percentage),
                        fill: goalAchievements.nutrition.protein.percentage >= 100 ? '#10b981' : goalAchievements.nutrition.protein.percentage >= 50 ? '#8b5cf6' : '#f59e0b',
                        icon: '🥩'
                      },
                      { 
                        name: '지방', 
                        value: Math.round(goalAchievements.nutrition.fat.percentage),
                        fill: goalAchievements.nutrition.fat.percentage >= 100 ? '#10b981' : goalAchievements.nutrition.fat.percentage >= 50 ? '#ec4899' : '#f59e0b',
                        icon: '🥑'
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, name]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#f9fafb', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* 종합 달성률 점수 */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white">
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round((goalAchievements.exercise.percentage + goalAchievements.nutrition.carbs.percentage + goalAchievements.nutrition.protein.percentage + goalAchievements.nutrition.fat.percentage) / 4)}%
                    </div>
                    <div className="text-xs">종합점수</div>
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {Math.round((goalAchievements.exercise.percentage + goalAchievements.nutrition.carbs.percentage + goalAchievements.nutrition.protein.percentage + goalAchievements.nutrition.fat.percentage) / 4) >= 80 
                      ? '🎉 훌륭한 하루였습니다!'
                      : Math.round((goalAchievements.exercise.percentage + goalAchievements.nutrition.carbs.percentage + goalAchievements.nutrition.protein.percentage + goalAchievements.nutrition.fat.percentage) / 4) >= 50
                      ? '👍 좋은 진전이 있었네요!'
                      : '💪 내일은 더 화이팅!'
                    }
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    전체 목표 대비 {Math.round((goalAchievements.exercise.percentage + goalAchievements.nutrition.carbs.percentage + goalAchievements.nutrition.protein.percentage + goalAchievements.nutrition.fat.percentage) / 4)}% 달성
                  </p>
                </div>
              </div>
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