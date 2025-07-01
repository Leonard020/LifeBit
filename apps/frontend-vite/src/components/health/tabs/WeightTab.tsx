import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Weight, Heart } from 'lucide-react';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { ChartDataPoint, COLORS } from '../types/analytics';

interface WeightTabProps {
  chartData: ChartDataPoint[];
  healthRecords: { data?: Array<{ weight?: number }> } | Array<{ weight?: number }> | null;
}

export const WeightTab: React.FC<WeightTabProps> = ({
  chartData,
  healthRecords
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 체중 변화 추이 */}
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
    </div>
  );
}; 