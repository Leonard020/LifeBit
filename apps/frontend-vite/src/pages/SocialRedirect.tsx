import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

export default function SocialRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const code = searchParams.get('code');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8001/auth/kakao/callback?code=${code}`
        );

        const { access_token, nickname } = res.data;
        localStorage.setItem('access_token', access_token);

        toast({
          title: '카카오 로그인 성공!',
          description: `${nickname}님 환영합니다 😊`,
        });

        navigate('/');
      } catch (err) {
        toast({
          title: '로그인 실패',
          description: '카카오 인증 중 문제가 발생했습니다.',
          variant: 'destructive',
        });
        navigate('/login');
      }
    };

    if (code) fetchToken();
  }, [code]);

  return <div className="p-4">카카오 로그인 처리 중입니다...</div>;
}
