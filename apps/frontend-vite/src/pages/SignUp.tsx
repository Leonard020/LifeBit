import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '@/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData({...formData, password});
    checkPasswordStrength(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { email, nickname, password } = formData;
      const response = await signUp({
        email,
        nickname,
        password
      });
      console.log('Sign up successful:', response);
      navigate('/login');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Sign up failed:', error);
      }
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: unknown } };
        if (err.response?.data) {
          // 필드별 유효성 검사 에러
          if (typeof err.response.data === 'object' && err.response.data !== null && !('message' in err.response.data)) {
            const errorMessages = Object.values(err.response.data as Record<string, unknown>).join('\n');
            setError(errorMessages);
          } else if (typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
            setError((err.response.data as { message?: string }).message || '회원가입에 실패했습니다.');
          } else {
            setError('회원가입에 실패했습니다.');
          }
        } else {
          setError('서버와의 통신에 실패했습니다.');
        }
      } else {
        setError('서버와의 통신에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return { text: '매우 약함', color: 'text-red-500' };
    if (passwordStrength < 50) return { text: '약함', color: 'text-orange-500' };
    if (passwordStrength < 75) return { text: '보통', color: 'text-yellow-500' };
    return { text: '강함', color: 'text-green-500' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="gradient-bg w-12 h-12 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
            <span className="gradient-text text-3xl font-bold">LifeBit</span>
          </Link>
          <p className="text-muted-foreground mt-2">새로운 건강 여정을 시작하세요</p>
        </div>

        <Card className="w-full shadow-lg hover-lift">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
            <p className="text-sm text-muted-foreground">
              몇 분만 투자하여 평생 건강을 관리하세요
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요 (2-12자)"
                    className="pl-10"
                    value={formData.nickname}
                    onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                    maxLength={12}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.nickname.length}/12자
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>비밀번호 강도</span>
                      <span className={getPasswordStrengthText().color}>
                        {getPasswordStrengthText().text}
                      </span>
                    </div>
                    <Progress value={passwordStrength} className="h-2" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <Check className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agree"
                  className="rounded"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                  required
                />
                <Label htmlFor="agree" className="text-sm">
                  <span className="text-primary cursor-pointer hover:underline">이용약관</span> 및{' '}
                  <span className="text-primary cursor-pointer hover:underline">개인정보처리방침</span>에 동의합니다
                </Label>
              </div>

              {error && (
                <div className="text-red-500 text-sm mb-4">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full gradient-bg hover:opacity-90 transition-opacity"
                disabled={!formData.agreeTerms || isLoading}
              >
                {isLoading ? '회원가입 중...' : '회원가입'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                이미 계정이 있으신가요?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  로그인
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
