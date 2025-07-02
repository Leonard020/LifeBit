import React from 'react';
import { Button } from '@/components/ui/button';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface StatsPeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export const StatsPeriodSelector: React.FC<StatsPeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange
}) => {
  const periods: { key: PeriodType; label: string }[] = [
    { key: 'daily', label: '일간' },
    { key: 'weekly', label: '주간' },
    { key: 'monthly', label: '월간' },
    { key: 'yearly', label: '년간' }
  ];

  return (
    <div className="flex justify-between items-center mb-6">
      {/* 왼쪽: 제목 */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          접속자 통계
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          선택한 기간별 사용자 활동 및 서비스 이용 현황
        </p>
      </div>

      {/* 오른쪽: 기간 선택 버튼들 */}
      <div className="flex items-center gap-2">
        {periods.map((period) => (
          <Button
            key={period.key}
            onClick={() => onPeriodChange(period.key)}
            variant={selectedPeriod === period.key ? 'default' : 'outline'}
            size="sm"
            className={`flex items-center gap-1.5 transition-all duration-200 ${
              selectedPeriod === period.key
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
                      >
            <span className="font-medium">{period.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default StatsPeriodSelector; 