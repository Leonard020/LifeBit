import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  useAllAnalytics, 
  checkServerHealth,
  type AccessStatsDto, 
  type UserActivityDto, 
  type ExerciseStatsDto, 
  type MealStatsDto 
} from '@/api/analyticsApi';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface AdminDashboardChartsProps {
  period: PeriodType;
}

export const AdminDashboardCharts: React.FC<AdminDashboardChartsProps> = ({ period }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  // 실제 API 데이터 사용
  const { data: analyticsData, isLoading, error, refetch } = useAllAnalytics(period);
  
  // 디버깅용 로그 추가
  useEffect(() => {
    console.log('🔍 [AdminDashboardCharts] 상태 변화:', {
      period,
      isLoading,
      hasData: !!analyticsData,
      error: error?.message || error,
      timestamp: new Date().toISOString()
    });
    
    if (analyticsData) {
      console.log('📊 [AdminDashboardCharts] 수신된 데이터:', {
        accessStats: analyticsData.accessStats?.length || 0,
        userActivity: analyticsData.userActivity?.length || 0,
        exerciseStats: analyticsData.exerciseStats?.length || 0,
        mealStats: analyticsData.mealStats?.length || 0,
        fullData: analyticsData
      });
    }
    
    if (error) {
      console.error('❌ [AdminDashboardCharts] 에러 상세:', {
        error,
        type: typeof error,
        message: error?.message,
        stack: error?.stack,
        response: (error as any)?.response?.data
      });
    }
  }, [period, isLoading, analyticsData, error]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartHeight = isMobile ? 250 : 320;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toLocaleString()}${entry.dataKey.includes('자') ? '명' : '건'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getPeriodTitle = (baseTitle: string) => {
    const periodMap = {
      daily: '일간',
      weekly: '주간', 
      monthly: '월간',
      yearly: '년간'
    };
    return `${periodMap[period]} ${baseTitle}`;
  };

  const getExerciseTitle = () => {
    switch (period) {
      case 'daily': return '일간 종류별 운동 기록 통계';
      case 'weekly': return '주간 요일별 운동 기록 통계';
      case 'monthly': return '월간 주차별 운동 기록 통계';
      case 'yearly': return '년간 월별 운동 기록 통계';
    }
  };

  const getMealTitle = () => {
    switch (period) {
      case 'daily': return '일간 끼니별 식사 기록 통계';
      case 'weekly': return '주간 요일별 식사 기록 통계';
      case 'monthly': return '월간 주차별 식사 기록 통계';
      case 'yearly': return '년간 월별 식사 기록 통계';
    }
  };

  const renderMealChart = (mealData: MealStatsDto[]) => {
    // 주간은 라인 차트로 유지 (깔끔한 4줄 트렌드)
    if (period === 'weekly') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={mealData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="날짜" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="아침" stroke="#FF6B6B" strokeWidth={3} dot={{ fill: '#FF6B6B', r: 4 }} />
            <Line type="monotone" dataKey="점심" stroke="#4ECDC4" strokeWidth={3} dot={{ fill: '#4ECDC4', r: 4 }} />
            <Line type="monotone" dataKey="저녁" stroke="#45B7D1" strokeWidth={3} dot={{ fill: '#45B7D1', r: 4 }} />
            <Line type="monotone" dataKey="간식" stroke="#96CEB4" strokeWidth={3} dot={{ fill: '#96CEB4', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // 일간 - 파이 차트로 표시 (크고 내부 라벨)
    if (period === 'daily') {
      const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
          <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
            fontSize="15"
            fontWeight="bold"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="0.5"
          >
            <tspan x={x} dy="-0.3em">{name}</tspan>
            <tspan x={x} dy="1.2em">{`${(percent * 100).toFixed(0)}%`}</tspan>
          </text>
        );
      };

      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart margin={{ left: 15, right: 15, top: 15, bottom: 15 }}>
            <Pie
              data={mealData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={chartHeight * 0.38}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
            >
              {mealData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [`${value.toLocaleString()}건`, '기록 수']}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // 월간/년간 - 단순 막대 차트 (기록자 수)
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={mealData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip 
            formatter={(value: any) => [`${value.toLocaleString()}명`, '기록자 수']}
            labelStyle={{ color: '#333', fontWeight: 'bold' }}
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            name="기록자"
          >
            {mealData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-4">
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 에러 상태 - 더 자세한 정보 표시
  if (error) {
    return (
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="shadow-lg border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">데이터 로딩 실패</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                차트 데이터를 불러오는 중 오류가 발생했습니다.
              </p>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="font-medium text-gray-700">에러 정보:</p>
                <p className="text-red-600 font-mono text-xs">
                  {error?.message || JSON.stringify(error)}
                </p>
                {(error as any)?.response?.data && (
                  <div className="mt-2">
                    <p className="font-medium text-gray-700">응답 데이터:</p>
                    <p className="text-red-600 font-mono text-xs">
                      {JSON.stringify((error as any).response.data, null, 2)}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 p-3 rounded border mt-3">
                <p className="font-medium text-blue-700">점검 사항:</p>
                <ul className="list-disc list-inside text-blue-600 text-xs mt-1">
                  <li>백엔드 서버(localhost:8080)가 실행 중인지 확인</li>
                  <li>네트워크 연결 상태 확인</li>
                  <li>브라우저 개발자 도구의 Network 탭 확인</li>
                  <li>CORS 설정 확인</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => {
                  console.log('🔄 [Manual Refresh] 수동 새로고침 시작');
                  refetch();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                다시 시도
              </button>
              <button 
                onClick={async () => {
                  console.log('🌐 [Backend Check] 백엔드 연결 테스트 시작');
                  try {
                    const healthResult = await checkServerHealth();
                    
                    if (healthResult.isOnline) {
                      console.log('✅ [Backend Health] 서버 상태 양호:', healthResult);
                      alert(`✅ 서버 연결 성공!\n\nCore API: ${healthResult.coreApi ? '정상' : '오류'}\nAnalytics: ${healthResult.details.analytics || '미확인'}`);
                    } else {
                      console.warn('⚠️ [Backend Health] 서버 연결 문제:', healthResult);
                      alert(`⚠️ 서버 연결 문제 발견\n\n${JSON.stringify(healthResult.details, null, 2)}`);
                    }
                  } catch (err: any) {
                    console.error('❌ [Backend Health] 연결 테스트 실패:', err);
                    alert(`❌ 연결 테스트 실패\n\n${err.message}\n\n다음을 확인해보세요:\n- 백엔드 서버(localhost:8080) 실행 상태\n- 네트워크 연결\n- 방화벽 설정`);
                  }
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                서버 연결 테스트
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!analyticsData) {
    return (
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">데이터가 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { accessStats, userActivity, exerciseStats, mealStats } = analyticsData;

  return (
    <div className="space-y-6 mb-8">
      {/* 기존 차트들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. 접속 현황 (주차 표현 통일) */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {getPeriodTitle('접속 현황')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={accessStats} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval={period === 'daily' ? 3 : period === 'monthly' ? 0 : 0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="접속자" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. 사용자 활동 비교 (활동 사용자 vs 전체 접속자) */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {getPeriodTitle('사용자 활동 비교')}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={userActivity} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }} 
                interval={period === 'daily' ? 3 : 0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="총접속자" 
                stroke="#94A3B8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#94A3B8', strokeWidth: 2, r: 4 }}
                name="총 접속자"
              />
              <Line 
                type="monotone" 
                dataKey="활동사용자" 
                stroke="#10B981" 
                strokeWidth={4}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2 }}
                name="활동 사용자"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. 운동 참여자 (색깔 구분) */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {getExerciseTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={exerciseStats} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="참여자" 
                radius={[6, 6, 0, 0]}
                name="운동 참여자"
              >
                {exerciseStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 4. 식사 기록 (색깔 구분, 기록자 중심) */}
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            {getMealTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pt-0 pb-4">
          {renderMealChart(mealStats)}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AdminDashboardCharts; 