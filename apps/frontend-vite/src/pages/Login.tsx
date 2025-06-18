import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { login, LoginData } from '@/api/auth';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/AuthContext';
import { setToken, setUserInfo } from '@/utils/auth';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setIsLoggedIn, setNickname } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSubmit = async (values: LoginFormData) => {
    try {
      const loginData: LoginData = {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      };

      const res = await login(loginData);
      const { access_token, nickname, user_id, role, email } = res;

      setToken(access_token);
      setUserInfo({
        userId: user_id,
        email: email,
        nickname: nickname,
        role: role
      });
      
      // AuthContext에서 nickname을 별도로 확인하므로 localStorage에 직접 저장
      localStorage.setItem('nickname', nickname);
      localStorage.setItem('role', role);
      
      setIsLoggedIn(true);
      setNickname(nickname);

      toast({
        title: '로그인 성공',
        description: `${nickname}님 환영합니다!`,
      });

      navigate('/');
    } catch (error: unknown) {
      console.error('Login failed:', error);
      let errorMessage = '로그인에 실패했습니다.';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        if (error.message === 'Invalid response data') {
          errorMessage = '서버 응답 형식이 올바르지 않습니다.';
        } else if (error.message === 'Network Error') {
          errorMessage = '서버에 연결할 수 없습니다.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: errorMessage,
      });
    }
  };

  const handleSocialLogin = (provider: string) => {
    const normalizedProvider = provider.toLowerCase();
  
    if (normalizedProvider === 'google') {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        console.error('❗ 구글 클라이언트 ID가 설정되지 않았습니다.');
        return;
      }
      const redirectUri = 'http://localhost:5173/auth/social-redirect?provider=google';
  
      const googleAuthUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        '?response_type=code' +
        `&client_id=${googleClientId}` +
        `&redirect_uri=${redirectUri}` +
        '&scope=openid%20email%20profile' +
        '&access_type=offline' +
        '&prompt=consent';
  
      window.location.href = googleAuthUrl;
    }
  
    if (normalizedProvider === 'kakao') {
      const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
      if (!kakaoClientId) {
        console.error('❗ 카카오 클라이언트 ID가 설정되지 않았습니다.');
        return;
      }
      const redirectUri = 'http://localhost:5173/auth/social-redirect?provider=kakao';
  
      const kakaoAuthUrl =
        'https://kauth.kakao.com/oauth/authorize' +
        '?response_type=code' +
        `&client_id=${kakaoClientId}` +
        `&redirect_uri=${redirectUri}`;
  
      window.location.href = kakaoAuthUrl;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="gradient-bg w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            LifeBit에 오신 것을 환영합니다
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            건강한 삶을 위한 첫걸음
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <label
                      htmlFor="rememberMe"
                      className="text-sm font-medium leading-none"
                    >
                      로그인 상태 유지
                    </label>
                  </FormItem>
                )}
              />
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                비밀번호 찾기
              </Link>
            </div>

            <Button type="submit" className="w-full gradient-bg hover:opacity-90">
              로그인
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-white text-black border border-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
            onClick={() => handleSocialLogin('Google')}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="h-5 w-5"
            />
            Google로 계속하기
          </Button>

          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-black border border-[#FEE500] hover:opacity-90"
            onClick={() => handleSocialLogin('Kakao')}
          >
            <img
              src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png"
              alt="Kakao logo"
              className="h-5 w-5"
            />
            카카오로 계속하기
          </Button>
        </div>

        <p className="text-center text-sm">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
