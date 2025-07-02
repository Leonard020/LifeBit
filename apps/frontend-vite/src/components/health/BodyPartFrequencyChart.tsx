import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

interface BodyPartData {
  bodyPart: string;
  bodyPartKorean: string;
  count: number;
  duration: number;
  percentage: number;
  color: string;
}

interface BodyPartFrequencyChartProps {
  bodyPartFrequency: BodyPartData[];
  totalExerciseSessions: number;
  period: 'day' | 'week' | 'month' | 'year';
  chartType?: 'bar' | 'pie';
  goals?: Record<string, number>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: BodyPartData }>;
  label?: string;
}

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{`${data.bodyPartKorean} (${data.bodyPart})`}</p>
        <p className="text-blue-600">{`운동 횟수: ${data.count}회`}</p>
        <p className="text-green-600">{`총 시간: ${data.duration}분`}</p>
        <p className="text-purple-600">{`비율: ${data.percentage}%`}</p>
      </div>
    );
  }
  return null;
};

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

// 파이 차트 커스텀 라벨
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomizedLabelProps) => {
  if (percent < 0.05) return null; // 5% 미만은 라벨 숨김
  
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
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const BodyPartFrequencyChart: React.FC<BodyPartFrequencyChartProps> = ({
  bodyPartFrequency,
  totalExerciseSessions,
  period,
  chartType = 'bar',
  goals
}) => {
  // 데이터 정렬 및 처리
  const sortedData = useMemo(() => {
    const sorted = bodyPartFrequency
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // 상위 8개만 표시
    console.log('[BodyPartFrequencyChart] sortedData:', sorted);
    return sorted;
  }, [bodyPartFrequency]);

  // 기간에 따른 제목 설정
  const getPeriodTitle = (period: string) => {
    const periodLabels = {
      day: '일별',
      week: '주별', 
      month: '월별',
      year: '연별'
    };
    return periodLabels[period as keyof typeof periodLabels] || '전체';
  };

  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  // 데이터가 없는 경우
  if (!bodyPartFrequency || bodyPartFrequency.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {getPeriodTitle(period)} 운동 부위별 빈도
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Activity className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-center">
            운동 기록이 없습니다.<br />
            운동을 기록하면 부위별 통계를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 바 차트 렌더링
  if (chartType === 'bar') {
    console.log('[BodyPartFrequencyChart] goals:', goals);
    return (
      <div className={(isDarkMode ? 'bg-card !border-2 !border-[#7c3aed]' : 'bg-white border-none') + ' rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow'}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getPeriodTitle(period)} 운동 부위별 빈도
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>총 {totalExerciseSessions}회 운동</span>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="bodyPartKorean" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {sortedData.map((entry, idx) => (
                goals?.[entry.bodyPart] ? (
                  <ReferenceLine
                    key={`goal-${entry.bodyPart}`}
                    y={goals[entry.bodyPart]}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    label={{
                      value: `목표 ${goals[entry.bodyPart]}회`,
                      position: "right",
                      fill: "#EF4444",
                      fontSize: 12
                    }}
                  />
                ) : null
              ))}
              <Bar 
                dataKey="count" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              >
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 통계 요약 */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">가장 많이 한 운동</div>
            <div className="font-semibold text-gray-900">
              {sortedData[0]?.bodyPartKorean || '-'}
            </div>
            <div className="text-xs text-gray-500">
              {sortedData[0]?.count || 0}회
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">운동 부위 수</div>
            <div className="font-semibold text-gray-900">
              {bodyPartFrequency.length}개
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">평균 운동 시간</div>
            <div className="font-semibold text-gray-900">
              {Math.round(sortedData.reduce((sum, item) => sum + item.duration, 0) / sortedData.length) || 0}분
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 파이 차트 렌더링
  return (
    <div className={(isDarkMode ? 'bg-card !border-2 !border-[#7c3aed]' : 'bg-white border-none') + ' rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow'}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getPeriodTitle(period)} 운동 부위별 비율
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="h-4 w-4" />
          <span>총 {totalExerciseSessions}회 운동</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => {
                if (entry && typeof entry === 'object' && entry.payload && 'bodyPartKorean' in entry.payload) {
                  // @ts-ignore
                  return entry.payload.bodyPartKorean;
                }
                return value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 