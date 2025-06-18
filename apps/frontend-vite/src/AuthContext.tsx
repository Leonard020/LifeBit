// src/components/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, getUserInfo, UserInfo } from '@/utils/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  nickname: string;
  user: UserInfo | null;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setNickname: (nickname: string) => void;
  setUser: (user: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = getToken();
    const userInfo = getUserInfo();
    
    if (token && userInfo) {
      setIsLoggedIn(true);
      setNickname(userInfo.nickname || '');
      setUser(userInfo);
    } else {
      setIsLoggedIn(false);
      setNickname('');
      setUser(null);
    }
  }, []);

  // 로컬 스토리지 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      const token = getToken();
      const userInfo = getUserInfo();
      
      if (token && userInfo) {
        setIsLoggedIn(true);
        setNickname(userInfo.nickname || '');
        setUser(userInfo);
      } else {
        setIsLoggedIn(false);
        setNickname('');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, nickname, user, setIsLoggedIn, setNickname, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
