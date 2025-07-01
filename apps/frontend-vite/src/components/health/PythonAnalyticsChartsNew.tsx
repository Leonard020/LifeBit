/*헬스로그 개발

 * AI 기반 고급 건강 데이터 분석 차트 컴포넌트 (리팩토링 버전)
 * - 전문적인 통계 분석 및 시각화
 * - 일/주/월별 운동, 식단, 체중, BMI 목표치와 성취도 표시
 * - Plotly 기반 인터랙티브 차트
 * - AI 기반 개인화된 인사이트
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useHealthRecords, useMealLogs, useExerciseSessions, useUserGoals, useHealthStatistics, updateAchievementScore } from '../../api/auth';
import { useHealthAnalyticsReport, useAIHealthInsights } from '../../api/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  RefreshCw,
  BarChart3,
  Weight,
  Dumbbell,
  Utensils,
  Target
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { getToken, getUserInfo, debugToken, isTokenValid } from '../../utils/auth';

// 분리된 탭 컴포넌트들 import
import { OverviewTab } from './tabs/OverviewTab';
import { WeightTab } from './tabs/WeightTab';
import { ExerciseTab } from './tabs/ExerciseTab';
import { NutritionTab } from './tabs/NutritionTab';
import { GoalsTab } from './tabs/GoalsTab';

// 타입과 유틸리티 import
import { PythonAnalyticsChartsProps, ChartDataPoint, GoalAchievements, MealLogWithFoodItem } from './types/analytics';
import { getDateKey, generatePeriodLabel, getExtendedPeriod, getPeriodLabel, getDateRange, getExerciseTarget, getNutritionTarget, calculateExerciseScore, calculateNutritionScore } from './utils/analyticsUtils';

export const PythonAnalyticsChartsNew: React.FC<PythonAnalyticsChartsProps> = ({
  userId,
  period
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'exercise' | 'nutrition' | 'goals'>('overview');

  // 임시 데이터
  const chartData = [];
  const goalAchievements = {
    exercise: { current: 0, target: 0, percentage: 0, hasTarget: false },
    weight: { current: 0, target: 0, percentage: 0, hasTarget: false },
    calories: { current: 0, target: 0, percentage: 0, hasTarget: false },
    carbs: { current: 0, target: 0, percentage: 0, hasTarget: false },
    protein: { current: 0, target: 0, percentage: 0, hasTarget: false },
    fat: { current: 0, target: 0, percentage: 0, hasTarget: false },
    bodyParts: {
      chest: { current: 0, target: 0, percentage: 0, hasTarget: false },
      back: { current: 0, target: 0, percentage: 0, hasTarget: false },
      legs: { current: 0, target: 0, percentage: 0, hasTarget: false },
      shoulders: { current: 0, target: 0, percentage: 0, hasTarget: false },
      arms: { current: 0, target: 0, percentage: 0, hasTarget: false },
      abs: { current: 0, target: 0, percentage: 0, hasTarget: false },
      cardio: { current: 0, target: 0, percentage: 0, hasTarget: false }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI 스마트 분석 (리팩토링 버전)</h2>
        <p className="text-gray-600 mt-2">
          컴포넌트가 분리된 새로운 버전입니다.
        </p>
      </div>

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

        <TabsContent value="overview">
          <OverviewTab 
            chartData={chartData}
            period={period}
            exerciseSessions={null}
            nutritionStats={null}
          />
        </TabsContent>

        <TabsContent value="weight">
          <WeightTab 
            chartData={chartData}
            healthRecords={null}
          />
        </TabsContent>

        <TabsContent value="exercise">
          <ExerciseTab 
            chartData={chartData}
            healthStats={null}
            period={period}
          />
        </TabsContent>

        <TabsContent value="nutrition">
          <NutritionTab 
            chartData={chartData}
            nutritionStats={null}
          />
        </TabsContent>

        <TabsContent value="goals">
          <div className="text-center p-8">
            <p className="text-gray-500">목표 탭은 추후 구현 예정입니다.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 