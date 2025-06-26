import React, { useState, useEffect } from 'react';
import { Bell, Trophy, Target, Medal, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '@/api/auth';
import { useAuth } from '@/AuthContext';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const [filterType, setFilterType] = useState<string | null>(null);
  const navigate = useNavigate();

  type LinkType = string | { pathname: string; state?: Record<string, unknown> };
  const typeMeta: Record<string, { icon: JSX.Element; color: string; link: (refId?: number) => LinkType | null; label: string }> = {
    ACHIEVEMENT: {
      icon: <Trophy className="w-4 h-4" />, color: 'text-yellow-500', label: '업적',
      link: (refId) => refId ? { pathname: '/ranking', state: { achievementId: refId } } : '/ranking',
    },
    GOAL_SET: {
      icon: <Target className="w-4 h-4" />, color: 'text-blue-500', label: '목표',
      link: () => '/note',
    },
    RANKING: {
      icon: <Medal className="w-4 h-4" />, color: 'text-purple-500', label: '랭킹',
      link: () => '/ranking',
    },
    SYSTEM: {
      icon: <Info className="w-4 h-4" />, color: 'text-gray-500', label: '시스템',
      link: () => null,
    },
  };

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      
      // 토큰 상태 디버깅
      const token = localStorage.getItem('access_token');
      console.log('🔍 [NotificationBell] 토큰 상태:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'null'
      });
      
      // 🚨 임시로 알림 기능 비활성화 (403 에러 방지)
      if (!token) {
        console.warn('🚨 [NotificationBell] 토큰이 없어서 알림 기능을 비활성화합니다.');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      const response = await getNotifications(0, 20);
      const notificationList = response.content || [];
      setNotifications(notificationList);
      
      // 읽지 않은 알림 개수 계산
      const unread = notificationList.filter(n => !n.isRead).length;
      setUnreadCount(unread);
      
      console.log('✅ [NotificationBell] 알림 조회 성공:', {
        totalCount: notificationList.length,
        unreadCount: unread
      });
    } catch (error) {
      console.error('❌ [NotificationBell] 알림을 불러오는데 실패했습니다:', error);
      
      // 에러 상세 정보 출력
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; statusText?: string; data?: unknown; headers?: unknown } };
        console.error('🔍 [NotificationBell] 에러 상세:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers
        });
      }
      
      // 🚨 에러 발생 시 빈 알림으로 설정
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // message 프로퍼티가 string인지 확인하는 타입 가드 함수
  function hasStringMessage(data: unknown): data is { message: string } {
    return (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
    );
  }

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: unknown) {
      // 이미 읽음 처리된 경우는 에러 토스트를 띄우지 않고 목록에서 제거
      if (
        error &&
        typeof error === 'object' &&
        (error as AxiosError).isAxiosError &&
        hasStringMessage((error as AxiosError).response?.data) &&
        ((error as AxiosError).response?.data as { message: string }).message.includes('이미 읽은 알림')
      ) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      toast.error('알림 읽음 처리에 실패했습니다.');
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      // 모든 알림을 목록에서 제거
      setNotifications([]);
      setUnreadCount(0);
      toast.success('모든 알림을 읽음 처리했습니다.');
    } catch (error) {
      toast.error('전체 읽음 처리에 실패했습니다.');
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('알림을 삭제했습니다.');
    } catch (error) {
      toast.error('알림 삭제에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  // 컴포넌트 마운트 시 알림 가져오기
  useEffect(() => {
    fetchNotifications();
  }, [isLoggedIn]);

  // 주기적으로 알림 업데이트 (5분마다)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const filteredNotifications = filterType
    ? notifications.filter((n) => n.type === filterType)
    : notifications;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n));
    }
    const meta = typeMeta[notification.type];
    if (meta && meta.link) {
      const link = meta.link(notification.refId);
      if (typeof link === 'string') {
        navigate(link);
      } else if (link && typeof link === 'object' && 'pathname' in link) {
        navigate(link.pathname, { state: link.state });
      }
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover-lift"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-full p-0" align="end">
        <div className="flex items-center justify-between p-5 border-b">
          <h4 className="font-semibold text-lg">알림</h4>
          <div className="flex items-center gap-2 flex-wrap min-w-0 overflow-x-auto max-w-full">
            <Button
              variant={filterType === null ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterType(null)}
              className="text-xs"
            >전체</Button>
            {Object.entries(typeMeta).map(([type, meta]) => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterType(type)}
                className={`text-xs ${meta.color}`}
              >{meta.icon} {meta.label}</Button>
            ))}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >모두 읽음</Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[480px]">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center p-10 text-muted-foreground">
              <p className="text-base">새로운 알림이 없습니다</p>
            </div>
          ) : (
            <div className="p-3">
              {filteredNotifications.map((notification) => {
                const meta = typeMeta[notification.type] || { icon: <Info className="w-4 h-4" />, color: 'text-gray-400', label: notification.type, link: () => null };
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl mb-3 cursor-pointer transition-colors flex items-start gap-3 shadow-sm ${
                      notification.isRead 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className={`mt-1 ${meta.color}`}>{meta.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className={`font-semibold text-base ${
                          notification.isRead ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {notification.title}
                          <span className="ml-2 text-xs text-gray-400">[{meta.label}]</span>
                        </h5>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        notification.isRead ? 'text-gray-600' : 'text-blue-700'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.refId && (
                        <p className="text-xs text-gray-400 mt-1">관련 ID: {notification.refId}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell; 