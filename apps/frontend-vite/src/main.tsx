import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 🔧 개발 환경에서 디버깅 도구 제공
if (import.meta.env.DEV) {
  // @ts-expect-error - 개발 환경에서만 사용하는 디버깅 도구
  window.debugAuth = {
    getToken: () => localStorage.getItem('token'),
    getUserInfo: () => {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    },
    clearAuth: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      console.log('✅ 인증 정보 삭제됨');
    },
    testWebSocket: (userId: string) => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ 토큰이 없습니다');
        return;
      }
      
      const wsUrl = `ws://localhost:8080/ws/health/${userId}?token=${encodeURIComponent(token)}`;
      console.log('🔗 WebSocket 테스트 연결 시도:', wsUrl);
      
      const testWs = new WebSocket(wsUrl);
      
      testWs.onopen = () => {
        console.log('✅ WebSocket 테스트 연결 성공');
        testWs.close();
      };
      
      testWs.onerror = (error) => {
        console.error('❌ WebSocket 테스트 연결 실패:', error);
      };
      
      testWs.onclose = (event) => {
        console.log('📡 WebSocket 테스트 연결 종료:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
      };
    },
    checkAuthState: () => {
      const token = localStorage.getItem('token');
      const userInfo = localStorage.getItem('userInfo');
      
      console.log('🔍 현재 인증 상태:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        hasUserInfo: !!userInfo,
        userInfo: userInfo ? JSON.parse(userInfo) : null
      });
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          console.log('🔑 토큰 정보:', {
            userId: payload.userId,
            email: payload.sub,
            expiresAt: new Date(payload.exp * 1000).toLocaleString(),
            isExpired: payload.exp < currentTime,
            remainingTime: Math.max(0, Math.floor(payload.exp - currentTime))
          });
        } catch (error) {
          console.error('❌ 토큰 파싱 실패:', error);
        }
      }
    }
  };
  
  console.log('🛠️ 디버깅 도구 사용 가능:');
  console.log('- debugAuth.getToken() : 현재 토큰 확인');
  console.log('- debugAuth.getUserInfo() : 현재 사용자 정보 확인');
  console.log('- debugAuth.clearAuth() : 인증 정보 삭제');
  console.log('- debugAuth.testWebSocket(userId) : WebSocket 연결 테스트');
  console.log('- debugAuth.checkAuthState() : 전체 인증 상태 확인');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
