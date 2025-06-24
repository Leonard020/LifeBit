import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { AUTH_CONFIG } from '@/config/env';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isAuthError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 인증 관련 오류 확인
    const isAuthError = error.message.includes('401') || 
                       error.message.includes('403') || 
                       error.message.includes('토큰') ||
                       error.message.includes('로그인');

    return {
      hasError: true,
      error,
      errorInfo: null,
      isAuthError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      isAuthError: error.message.includes('401') || 
                  error.message.includes('403') || 
                  error.message.includes('토큰') ||
                  error.message.includes('로그인')
    });

    // 인증 오류인 경우 토큰 정리
    if (this.state.isAuthError) {
      localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
      localStorage.removeItem(AUTH_CONFIG.USER_KEY);
      window.dispatchEvent(new Event('storage'));
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLogin = () => {
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                {this.state.isAuthError ? <LogIn /> : <AlertTriangle />}
              </div>
              <CardTitle className="text-xl text-red-600">
                {this.state.isAuthError ? '인증 오류' : '오류가 발생했습니다'}
              </CardTitle>
              <CardDescription>
                {this.state.isAuthError 
                  ? '로그인이 필요하거나 세션이 만료되었습니다.'
                  : '예상치 못한 오류가 발생했습니다.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                {this.state.isAuthError ? (
                  <Button onClick={this.handleLogin} className="flex-1">
                    <LogIn className="mr-2 h-4 w-4" />
                    로그인하기
                  </Button>
                ) : (
                  <Button onClick={this.handleReload} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    새로고침
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    개발자 정보 (클릭하여 펼치기)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 border rounded text-xs overflow-auto max-h-40">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 