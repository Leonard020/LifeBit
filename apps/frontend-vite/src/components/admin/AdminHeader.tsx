import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    timestamp: new Date().toISOString(),
    onlineUsers: 0,
    authenticatedUsers: 0,
    activeRecorders: 0,
    recentActivity: { exercise: 0, diet: 0 }
  });
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  useEffect(() => {
    // WebSocket 연결 (추후 실제 구현)
    // 현재는 시뮬레이션 데이터로 테스트
    const simulateRealTimeData = () => {
      const mockData: RealTimeData = {
        timestamp: new Date().toISOString(),
        onlineUsers: Math.floor(Math.random() * 100) + 20,
        authenticatedUsers: Math.floor(Math.random() * 50) + 10,
        activeRecorders: Math.floor(Math.random() * 10) + 2,
        recentActivity: {
          exercise: Math.floor(Math.random() * 5),
          diet: Math.floor(Math.random() * 8)
        }
      };
      setRealTimeData(mockData);
      setIsWebSocketConnected(true);
    };

    // 초기 데이터 설정
    simulateRealTimeData();

    // 10초마다 업데이트 (실제로는 WebSocket으로 실시간)
    const interval = setInterval(simulateRealTimeData, 10000);

    return () => clearInterval(interval);
  }, []);

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
            isWebSocketConnected 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-red-500'
          }`} />
          
          <div className="text-sm">
            <div className="font-semibold text-green-700 dark:text-green-300">
              실시간 접속: {realTimeData.onlineUsers.toLocaleString()}명
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              활동 중: {realTimeData.authenticatedUsers}명 | 기록 중: {realTimeData.activeRecorders}명
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