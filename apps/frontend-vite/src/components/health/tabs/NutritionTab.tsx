import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Utensils, PieChart as PieChartIcon } from 'lucide-react';
import { 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, COLORS, PIE_COLORS } from '../types/analytics';

interface NutritionTabProps {
  chartData: ChartDataPoint[];
  nutritionStats: {
    totalCalories?: number;
    totalCarbs?: number;
    totalProtein?: number;
    totalFat?: number;
    averageCalories?: number;
    averageCarbs?: number;
    averageProtein?: number;
    averageFat?: number;
  } | null;
}

export const NutritionTab: React.FC<NutritionTabProps> = ({
  chartData,
  nutritionStats
}) => {
  // 영양소 분포 데이터 생성
  const nutritionDistribution = React.useMemo(() => {
    if (!nutritionStats) return [];
    
    const data = [
      { name: '탄수화물', value: nutritionStats.totalCarbs || 0, color: PIE_COLORS[0] },
      { name: '단백질', value: nutritionStats.totalProtein || 0, color: PIE_COLORS[1] },
      { name: '지방', value: nutritionStats.totalFat || 0, color: PIE_COLORS[2] }
    ];
    
    return data.filter(item => item.value > 0);
  }, [nutritionStats]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 칼로리 섭취 트렌드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Utensils className="h-5 w-5 mr-2 text-orange-600" />
              칼로리 섭취 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="nutritionCalories" 
                  stroke={COLORS.accent} 
                  strokeWidth={2}
                  name="칼로리 섭취"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 영양소 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2 text-purple-600" />
              영양소 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nutritionDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nutritionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 영양 분석 상세 */}
      <Card>
        <CardHeader>
          <CardTitle>영양 분석 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {nutritionStats?.totalCalories || 0}
              </p>
              <p className="text-sm text-gray-600">총 칼로리</p>
              <p className="text-xs text-gray-500">
                평균: {Math.round(nutritionStats?.averageCalories || 0)}kcal
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {nutritionStats?.totalCarbs || 0}g
              </p>
              <p className="text-sm text-gray-600">탄수화물</p>
              <p className="text-xs text-gray-500">
                평균: {Math.round(nutritionStats?.averageCarbs || 0)}g
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {nutritionStats?.totalProtein || 0}g
              </p>
              <p className="text-sm text-gray-600">단백질</p>
              <p className="text-xs text-gray-500">
                평균: {Math.round(nutritionStats?.averageProtein || 0)}g
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {nutritionStats?.totalFat || 0}g
              </p>
              <p className="text-sm text-gray-600">지방</p>
              <p className="text-xs text-gray-500">
                평균: {Math.round(nutritionStats?.averageFat || 0)}g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 영양 균형 분석 */}
      <Card>
        <CardHeader>
          <CardTitle>영양 균형 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 탄수화물 비율 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>탄수화물 (권장: 45-65%)</span>
                <span>
                  {(() => {
                    if (!nutritionStats?.totalCalories || !nutritionStats?.totalCarbs) return '0%';
                    const ratio = (nutritionStats.totalCarbs * 4) / nutritionStats.totalCalories * 100;
                    return `${ratio.toFixed(1)}%`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(
                      ((nutritionStats?.totalCarbs || 0) * 4) / (nutritionStats?.totalCalories || 1) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>

            {/* 단백질 비율 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>단백질 (권장: 10-35%)</span>
                <span>
                  {(() => {
                    if (!nutritionStats?.totalCalories || !nutritionStats?.totalProtein) return '0%';
                    const ratio = (nutritionStats.totalProtein * 4) / nutritionStats.totalCalories * 100;
                    return `${ratio.toFixed(1)}%`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(
                      ((nutritionStats?.totalProtein || 0) * 4) / (nutritionStats?.totalCalories || 1) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>

            {/* 지방 비율 */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>지방 (권장: 20-35%)</span>
                <span>
                  {(() => {
                    if (!nutritionStats?.totalCalories || !nutritionStats?.totalFat) return '0%';
                    const ratio = (nutritionStats.totalFat * 9) / nutritionStats.totalCalories * 100;
                    return `${ratio.toFixed(1)}%`;
                  })()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(
                      ((nutritionStats?.totalFat || 0) * 9) / (nutritionStats?.totalCalories || 1) * 100, 
                      100
                    )}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 