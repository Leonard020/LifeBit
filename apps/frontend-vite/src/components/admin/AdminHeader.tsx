import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useOnlineUsersDetail } from '@/api/analyticsApi';

interface RealTimeData {
  timestamp: string;
  onlineUsers: number;
  authenticatedUsers: number;
  activeRecorders: number;
  recentActivity: {
    exercise: number;
    diet: number;
  };
}

interface AdminHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onRefresh,
  isRefreshing,
  lastUpdated
}) => {
  // 실제 실시간 접속자 상세 데이터 사용
  const { data: onlineUsersData, isLoading: isOnlineLoading } = useOnlineUsersDetail();
  
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    timestamp: new Date().toISOString(),
    onlineUsers: 0,
    authenticatedUsers: 0,
    activeRecorders: 0,
    recentActivity: { exercise: 0, diet: 0 }
  });

  // 실제 API 데이터로 업데이트 (이제 진짜 데이터!)
  useEffect(() => {
    if (onlineUsersData) {
      setRealTimeData(prev => ({
        ...prev,
        onlineUsers: onlineUsersData.onlineUsers,
        authenticatedUsers: onlineUsersData.authenticatedUsers, // 실제 데이터
        activeRecorders: onlineUsersData.activeRecorders, // 실제 데이터 (HealthLog 페이지 사용자)
        timestamp: new Date(onlineUsersData.timestamp).toISOString(),
        recentActivity: {
          exercise: onlineUsersData.pageStats?.['health-log'] || 0,
          diet: onlineUsersData.pageStats?.['health-log'] || 0
        }
      }));
    }
  }, [onlineUsersData]);

  return (
    <div className="flex justify-between items-start mb-6">
      {/* 왼쪽: 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          관리자 대시보드
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          LifeBit 서비스 운영 현황을 실시간으로 모니터링합니다
        </p>
      </div>

      {/* 오른쪽: 실시간 정보 + 새로고침 */}
      <div className="flex flex-col items-end gap-3">
        {/* 실시간 접속자 정보 */}
        <div className="flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className={`w-2 h-2 rounded-full ${
            !isOnlineLoading && onlineUsersData
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`} />
          
          <div className="text-sm">
            <div className="font-semibold text-green-700 dark:text-green-300">
              실시간 접속: {realTimeData.onlineUsers.toLocaleString()}명
            </div>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '갱신 중...' : '새로고침'}
          </Button>
          
          <span className="text-xs text-gray-500 dark:text-gray-400">
            마지막 업데이트: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader; 