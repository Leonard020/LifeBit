import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getToken } from '@/utils/auth';

interface UseRealTimeUpdatesProps {
  userId: string;
  enabled?: boolean;
}

interface HealthUpdateMessage {
  type: 'health_record_update' | 'exercise_session_update' | 'recommendation_update';
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export const useRealTimeUpdates = ({ userId, enabled = false }: UseRealTimeUpdatesProps) => {
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 수동 데이터 새로고침 함수
  const refreshData = useCallback(() => {
    console.log('🔄 데이터 새로고침');
    queryClient.invalidateQueries({ queryKey: ['healthRecords', userId] });
    queryClient.invalidateQueries({ queryKey: ['exerciseSessions', userId] });
    queryClient.invalidateQueries({ queryKey: ['mealLogs', userId] });
    queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
    queryClient.invalidateQueries({ queryKey: ['healthStatistics', userId] });
  }, [queryClient, userId]);

  // 폴링 방식으로 데이터 새로고침 (WebSocket 대신)
  useEffect(() => {
    if (!enabled || !userId) {
      console.log('🔄 [useRealTimeUpdates] 폴링 비활성화:', { enabled, userId });
      return;
    }

    console.log('🔄 [useRealTimeUpdates] 폴링 방식 데이터 새로고침 시작 (30초 간격)');
    
    // 30초마다 데이터 새로고침
    pollingIntervalRef.current = setInterval(() => {
      refreshData();
    }, 30000); // 30초

    // 클린업
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [enabled, userId, refreshData]);

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }, []);

  return {
    isConnected: enabled, // 폴링 활성화 상태를 연결 상태로 표시
    refreshData,
    requestNotificationPermission
  };
}; 