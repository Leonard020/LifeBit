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

export const useRealTimeUpdates = ({ userId, enabled = true }: UseRealTimeUpdatesProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasShownInitialNotification = useRef(false);

  const connect = useCallback(() => {
    if (!enabled || !userId) {
      console.log('🔗 [useRealTimeUpdates] 연결 시도:', { enabled, userId });
      return;
    }

    try {
      // JWT 토큰 가져오기
      const token = getToken();
      if (!token) {
        console.warn('JWT 토큰이 없어 WebSocket 연결을 건너뜁니다.');
        return;
      }

      console.log('🔗 [useRealTimeUpdates] WebSocket 연결 시도:', { userId, tokenLength: token.length });

      // WebSocket 연결 설정 (JWT 토큰 포함)
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/ws/health/${userId}?token=${encodeURIComponent(token)}`
        : `ws://localhost:8080/ws/health/${userId}?token=${encodeURIComponent(token)}`;
      
      console.log('🔗 [useRealTimeUpdates] WebSocket URL:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('📡 실시간 업데이트 연결됨');
        reconnectAttempts.current = 0;
        
        // 최초 연결 시에만 알림 표시
        if (!hasShownInitialNotification.current) {
          hasShownInitialNotification.current = true;
          
          // 사용자에게 알림
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('LifeBit', {
              body: '실시간 업데이트가 활성화되었습니다.',
              icon: '/favicon.ico',
              tag: 'websocket-connection' // 중복 알림 방지
            });
          }
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: HealthUpdateMessage = JSON.parse(event.data);
          
          // 메시지가 현재 사용자를 위한 것인지 확인
          if (message.userId !== userId) return;

          console.log('📨 실시간 업데이트 수신:', message);

          // 메시지 타입에 따라 적절한 쿼리 무효화
          switch (message.type) {
            case 'health_record_update':
              // 건강 기록 관련 쿼리들 무효화
              queryClient.invalidateQueries({ queryKey: ['healthRecords', userId] });
              queryClient.invalidateQueries({ queryKey: ['healthStatistics', userId] });
              break;
              
            case 'exercise_session_update':
              // 운동 세션 관련 쿼리들 무효화
              queryClient.invalidateQueries({ queryKey: ['exerciseSessions', userId] });
              queryClient.invalidateQueries({ queryKey: ['healthStatistics', userId] });
              break;
              
            case 'recommendation_update':
              // 추천 관련 쿼리들 무효화
              queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
              break;
              
            default:
              console.warn('알 수 없는 메시지 타입:', message.type);
          }

          // 사용자에게 업데이트 알림 (알림 권한이 있는 경우)
          if ('Notification' in window && Notification.permission === 'granted') {
            const notificationMessages = {
              'health_record_update': '건강 기록이 업데이트되었습니다.',
              'exercise_session_update': '운동 기록이 업데이트되었습니다.',
              'recommendation_update': '새로운 건강 추천이 있습니다.'
            };
            
            new Notification('LifeBit 업데이트', {
              body: notificationMessages[message.type] || '데이터가 업데이트되었습니다.',
              icon: '/favicon.ico',
              tag: `health-update-${message.type}` // 중복 알림 방지
            });
          }

        } catch (error) {
          console.error('실시간 메시지 처리 오류:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket 오류:', error);
        // 오류가 발생해도 연결 시도는 계속됨
      };

      wsRef.current.onclose = (event) => {
        console.log('📡 실시간 업데이트 연결 종료:', event.code, event.reason);
        
        // 정상 종료가 아닌 경우에만 재연결 시도
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // 지수 백오프
          console.log(`🔄 ${delay}ms 후 재연결 시도... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (event.code === 1000 || event.code === 1001) {
          console.log('정상적인 연결 종료');
          reconnectAttempts.current = 0; // 정상 종료 시 재시도 카운터 리셋
        }
      };

    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  }, [userId, enabled, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
  }, []);

  // 수동 데이터 새로고침 함수
  const refreshData = useCallback(() => {
    console.log('🔄 수동 데이터 새로고침');
    queryClient.invalidateQueries({ queryKey: ['healthRecords', userId] });
    queryClient.invalidateQueries({ queryKey: ['exerciseSessions', userId] });
    queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
    queryClient.invalidateQueries({ queryKey: ['healthStatistics', userId] });
  }, [queryClient, userId]);

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

  useEffect(() => {
    // 알림 권한 요청 (한 번만)
    if (!hasShownInitialNotification.current) {
      requestNotificationPermission();
    }
    
    // WebSocket 연결
    connect();

    // 페이지 가시성 변경 시 연결 관리
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨지면 연결 일시 중단 (선택적)
        console.log('📱 페이지 비활성화 - 연결 유지');
      } else {
        // 페이지가 다시 보이면 데이터 새로고침
        console.log('📱 페이지 활성화 - 데이터 새로고침');
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 네트워크 상태 변경 감지
    const handleOnline = () => {
      console.log('🌐 네트워크 연결됨 - 재연결 시도');
      connect();
    };

    const handleOffline = () => {
      console.log('🌐 네트워크 연결 끊김');
      disconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect, disconnect, refreshData, requestNotificationPermission]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    refreshData,
    requestNotificationPermission
  };
}; 