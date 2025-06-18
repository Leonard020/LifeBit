// src/components/AuthContext.tsx

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  nickname: string;
  isLoading: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setNickname: (nickname: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token'); // ✅ 일치시켜야 함
    const nick = localStorage.getItem('nickname');
    if (token && nick) {
      setIsLoggedIn(true);
      setNickname(nick);
    }
    setIsLoading(false); // 초기화 완료
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, nickname, isLoading, setIsLoggedIn, setNickname }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
