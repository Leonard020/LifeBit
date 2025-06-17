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
  const provider = searchParams.get('provider'); // ✅ URL 쿼리에서 정확히 추출

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

        const res = await axios.get(url);
        const { access_token, nickname } = res.data;

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('nickname', nickname);
        setIsLoggedIn(true);
        setNickname(nickname);

        toast({
          title: `${provider} 로그인 성공!`,
          description: `${nickname}님 환영합니다 😊`,
        });

        navigate('/');
      } catch (err) {
        console.error('소셜 로그인 오류:', err);
        toast({
          title: '로그인 실패',
          description: `${provider || '소셜'} 인증 중 문제가 발생했습니다.`,
          variant: 'destructive',
        });
        navigate('/login');
      }
    };

    fetchToken();
  }, [code, provider]);

  return (
    <div className="p-4">
      {provider === 'google'
        ? 'Google 로그인 처리 중입니다...'
        : provider === 'kakao'
        ? 'Kakao 로그인 처리 중입니다...'
        : '소셜 로그인 처리 중입니다...'}
    </div>
  );
}
