import React from 'react';

interface PeriodSelectorProps {
  selectedPeriod: 'day' | 'week' | 'month';
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const periods = [
    { value: 'day', label: '일', icon: '📅' },
    { value: 'week', label: '주', icon: '📊' },
    { value: 'month', label: '월', icon: '📈' },
  ] as const;

  return (
    <div className="flex bg-gray-100 dark:bg-[#232946] rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`
            flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
            ${selectedPeriod === period.value
              ? 'bg-white text-blue-600 shadow-sm dark:bg-[#181c2a] dark:text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#232946]'
            }
          `}
        >
          <span className="mr-2">{period.icon}</span>
          {period.label}
        </button>
      ))}
    </div>
  );
}; 