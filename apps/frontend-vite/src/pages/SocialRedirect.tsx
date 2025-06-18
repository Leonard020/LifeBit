import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/AuthContext';

export default function SocialRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setIsLoggedIn, setNickname } = useAuth();

  const code = searchParams.get('code');
  const provider = searchParams.get('provider');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        if (!code || !provider) {
          throw new Error("코드 또는 provider 정보가 누락되었습니다.");
        }

        let url = '';
        if (provider === 'kakao') {
          url = `http://localhost:8001/api/auth/kakao/callback?code=${code}`;
        } else if (provider === 'google') {
          url = `http://localhost:8001/api/auth/google/callback?code=${code}`;
        } else {
          throw new Error('지원하지 않는 소셜 로그인 방식입니다.');
        }

        const res = await axios.get(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          withCredentials: true,
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        });

        console.log('Social login response:', res);

        if (res.status >= 400) {
          const errorMessage = res.data?.detail || '인증 처리 중 오류가 발생했습니다.';
          console.error('Social login error:', errorMessage);
          throw new Error(errorMessage);
        }

        if (!res.data || !res.data.access_token) {
          console.error('No access token in response:', res.data);
          throw new Error('인증 토큰을 받지 못했습니다.');
        }

        const { access_token, nickname, role } = res.data;
        console.log('Login successful:', { nickname, role });

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('nickname', nickname);
        localStorage.setItem('role', role);
        setIsLoggedIn(true);
        setNickname(nickname);

        toast({
          title: `${provider} 로그인 성공!`,
          description: `${nickname}님 환영합니다 😊`,
        });

        navigate('/');
      } catch (err: any) {
        console.error('소셜 로그인 오류:', err);
        const errorMessage = err.response?.data?.detail || err.message || '알 수 없는 오류가 발생했습니다.';
        
        toast({
          title: '로그인 실패',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/login');
      }
    };

    fetchToken();
  }, [code, provider, navigate, toast, setIsLoggedIn, setNickname]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">
          {provider === 'google'
            ? 'Google 로그인 처리 중입니다...'
            : provider === 'kakao'
            ? 'Kakao 로그인 처리 중입니다...'
            : '소셜 로그인 처리 중입니다...'}
        </h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
