/**
 * 파이썬 기반 고급 건강 데이터 분석 차트 컴포넌트
 * - 전문적인 통계 분석
 * - Plotly 기반 인터랙티브 차트
 * - AI 기반 개인화된 인사이트
 */

import React, { useState, useEffect } from 'react';
import { 
  useHealthAnalyticsReport, 
  useAIHealthInsights,
  type AnalyticsApiResponse,
  type HealthAnalyticsReport,
  type AIInsights
} from '../../api/analyticsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
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
  Info
} from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface PythonAnalyticsChartsProps {
  userId: number;
  period: 'day' | 'week' | 'month' | 'year';
}

export const PythonAnalyticsCharts: React.FC<PythonAnalyticsChartsProps> = ({
  userId,
  period
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 데이터 조회
  const { 
    data: reportData, 
    isLoading: isReportLoading, 
    error: reportError,
    refetch: refetchReport 
  } = useHealthAnalyticsReport(userId, period);

  const { 
    data: insightsData, 
    isLoading: isInsightsLoading, 
    error: insightsError,
    refetch: refetchInsights 
  } = useAIHealthInsights(userId, period);

  // 안전한 데이터 접근 - 타입 안전성 보장
  const report = reportData && 'report' in reportData ? reportData.report : null;
  const insights = insightsData && 'insights' in insightsData ? insightsData.insights : null;
  
  // 로딩 상태
  const isLoading = isReportLoading || isInsightsLoading;
  
  // 오류 상태  
  const hasError = reportError || insightsError;

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchReport(), refetchInsights()])
      .finally(() => setIsRefreshing(false));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">AI 고급 분석</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
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
          <h2 className="text-2xl font-bold text-gray-900">AI 고급 분석</h2>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>분석 오류</AlertTitle>
          <AlertDescription>
            AI 분석 데이터를 불러오는 중 오류가 발생했습니다. 새로고침을 시도해보세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!report && !insights) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">AI 고급 분석</h2>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>데이터 없음</AlertTitle>
          <AlertDescription>
            분석할 데이터가 없습니다. 건강 기록과 운동 데이터를 추가해보세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI 고급 분석</h2>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 건강 리포트 섹션 */}
      {report?.analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 체중 분석 */}
          {report.analysis.weight && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Weight className="h-5 w-5 mr-2 text-blue-600" />
                  체중 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">현재 체중</span>
                    <span className="text-lg font-semibold">
                      {report.analysis.weight.current_weight || 'N/A'}kg
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">변화량</span>
                    <div className="flex items-center">
                      {(report.analysis.weight.trend_direction || 'stable') === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
                      ) : (report.analysis.weight.trend_direction || 'stable') === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                      ) : null}
                      <span className="text-sm">
                        {report.analysis.weight.change_amount || 0}kg
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Badge variant="outline">
                      {report.analysis.weight.trend_description || '안정적'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 운동 분석 */}
          {report.analysis.exercise && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  운동 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">총 운동 세션</span>
                    <span className="text-lg font-semibold">
                      {report.analysis.exercise.total_sessions || 0}회
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">평균 시간</span>
                    <span className="text-sm">
                      {report.analysis.exercise.avg_duration || 0}분
                    </span>
                  </div>
                  <div className="mt-4">
                    <Badge variant="outline">
                      {report.analysis.exercise.performance_level || '보통'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI 인사이트 섹션 */}
      {insights && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                AI 건강 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 요약 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">종합 분석</h4>
                  <p className="text-sm text-gray-600">
                    {insights.summary || '건강 데이터를 분석하고 있습니다.'}
                  </p>
                </div>

                {/* 성과 */}
                {insights.achievements && insights.achievements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      성과
                    </h4>
                    <div className="space-y-2">
                      {insights.achievements.map((achievement: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 주의사항 */}
                {insights.warnings && insights.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                      주의사항
                    </h4>
                    <div className="space-y-2">
                      {insights.warnings.map((warning: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{warning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 권장사항 */}
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-blue-500" />
                      권장사항
                    </h4>
                    <div className="space-y-2">
                      {insights.recommendations.map((recommendation: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 목표 */}
                {insights.goals && insights.goals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-indigo-500" />
                      추천 목표
                    </h4>
                    <div className="space-y-2">
                      {insights.goals.map((goal: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{goal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 