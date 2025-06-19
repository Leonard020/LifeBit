// src/components/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, getUserInfo, UserInfo } from '@/utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  nickname: string;
  user: UserInfo | null;
  isLoading: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setNickname: (nickname: string) => void;
  setUser: (user: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const userInfo = getUserInfo();
    
    console.log('🔍 [AuthContext] 초기화:', { token: !!token, userInfo });
    
    if (token && userInfo) {
      setIsLoggedIn(true);
      setNickname(userInfo.nickname || '');
      setUser(userInfo);
      console.log('✅ [AuthContext] 사용자 정보 로드됨:', userInfo);
    } else {
      setIsLoggedIn(false);
      setNickname('');
      setUser(null);
      console.log('❌ [AuthContext] 사용자 정보 없음');
    }
    
    setIsLoading(false);
  }, []);

  // 로컬 스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const token = getToken();
      const userInfo = getUserInfo();
      
      console.log('🔄 [AuthContext] 스토리지 변경 감지:', { token: !!token, userInfo });
      
      if (token && userInfo) {
        setIsLoggedIn(true);
        setNickname(userInfo.nickname || '');
        setUser(userInfo);
        console.log('✅ [AuthContext] 스토리지에서 사용자 정보 업데이트:', userInfo);
      } else {
        setIsLoggedIn(false);
        setNickname('');
        setUser(null);
        console.log('❌ [AuthContext] 스토리지에서 사용자 정보 제거');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // setUser 함수 래핑하여 로그 추가
  const setUserWithLog = (user: UserInfo | null) => {
    console.log('🔧 [AuthContext] setUser 호출:', user);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, nickname, user, isLoading, setIsLoggedIn, setNickname, setUser: setUserWithLog }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
