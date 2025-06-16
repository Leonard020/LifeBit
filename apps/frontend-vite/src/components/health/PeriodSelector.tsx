import React from 'react';

interface PeriodSelectorProps {
  selectedPeriod: 'day' | 'week' | 'month' | 'year';
  onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const periods = [
    { value: 'day', label: '일', icon: '📅' },
    { value: 'week', label: '주', icon: '📊' },
    { value: 'month', label: '월', icon: '📈' },
    { value: 'year', label: '년', icon: '📋' },
  ] as const;

  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`
            flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
            ${selectedPeriod === period.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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