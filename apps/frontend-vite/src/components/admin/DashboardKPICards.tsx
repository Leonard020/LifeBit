import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIData {
  title: string;
  value: number;
  previousValue: number;
  icon: string;
  color: string;
  unit?: string;
}

interface DashboardKPICardsProps {
  totalUsers: number;
  activeUsers: number;
  recordingUsers: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({
  totalUsers,
  activeUsers,
  recordingUsers,
  period
}) => {
  // 이전 기간 대비 변화 계산 (시뮬레이션)
  const calculateChange = (current: number): number => {
    const changePercent = (Math.random() - 0.5) * 20; // -10% ~ +10% 랜덤
    return Math.round(changePercent * 10) / 10;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return '어제 대비';
      case 'weekly': return '지난주 대비';
      case 'monthly': return '지난달 대비';
      case 'yearly': return '작년 대비';
      default: return '이전 대비';
    }
  };

  const kpiCards: KPIData[] = [
    {
      title: '총 회원수',
      value: totalUsers,
      previousValue: totalUsers - Math.floor(totalUsers * 0.05),
      icon: '',
      color: 'from-blue-500 to-blue-600',
      unit: '명'
    },
    {
      title: `${period === 'daily' ? '일일' : period === 'weekly' ? '주간' : period === 'monthly' ? '월간' : '년간'} 접속자`,
      value: activeUsers,
      previousValue: activeUsers - Math.floor(activeUsers * 0.1),
      icon: '/LifeBitLogo1.png',
      color: 'from-green-500 to-green-600',
      unit: '명'
    },
    {
      title: '활동 사용자',
      value: recordingUsers,
      previousValue: recordingUsers - Math.floor(recordingUsers * 0.15),
      icon: '',
      color: 'from-purple-500 to-purple-600',
      unit: '명'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {kpiCards.map((kpi, index) => {
        const changePercent = calculateChange(kpi.value);
        const changeValue = kpi.value - kpi.previousValue;
        
        return (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
            {/* 배경 그라데이션 */}
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-10`} />
            
            <CardHeader className="relative pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                <span>{kpi.title}</span>
                {kpi.icon && kpi.icon.startsWith('/') ? (
                  <img 
                    src={kpi.icon} 
                    alt="접속자 아이콘" 
                    className="w-8 h-8 object-contain"
                  />
                ) : kpi.icon ? (
                  <span className="text-2xl">{kpi.icon}</span>
                ) : null}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative">
              {/* 메인 수치 */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {kpi.value.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {kpi.unit}
                </span>
              </div>
              
              {/* 변화량 표시 */}
              <div className="flex items-center gap-2">
                {getTrendIcon(changePercent)}
                <span className={`text-sm font-medium ${getTrendColor(changePercent)}`}>
                  {changePercent > 0 ? '+' : ''}{changePercent}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getPeriodLabel()}
                </span>
              </div>
              
              {/* 변화량 수치 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {changeValue > 0 ? '+' : ''}{changeValue.toLocaleString()}명 변화
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardKPICards; 