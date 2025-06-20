import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/AuthContext';
import { setToken, setUserInfo } from '@/utils/auth';

export default function SocialRedirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setIsLoggedIn, setNickname, setUser } = useAuth();
  const hasProcessed = useRef(false);

  const code = searchParams.get('code');
  const provider = searchParams.get('provider');
  const error = searchParams.get('error');

  useEffect(() => {
    // 이미 처리된 경우 중복 실행 방지
    if (hasProcessed.current) {
      return;
    }

    // OAuth 오류 처리
    if (error) {
      console.error('OAuth 오류:', error);
      toast({
        title: '인증 실패',
        description: `OAuth 오류: ${error}`,
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const fetchToken = async () => {
      try {
        hasProcessed.current = true;

        if (!code || !provider) {
          throw new Error("코드 또는 provider 정보가 누락되었습니다.");
        }

        console.log('🔍 [SocialRedirect] 소셜 로그인 시작:', { provider, codeLength: code.length });

        let url = '';
        if (provider === 'kakao') {
          url = `http://localhost:8001/api/auth/kakao/callback?code=${code}`;
        } else if (provider === 'google') {
          url = `http://localhost:8001/api/auth/google/callback?code=${code}`;
        } else {
          throw new Error('지원하지 않는 소셜 로그인 방식입니다.');
        }

        console.log('🔗 [SocialRedirect] API 호출:', url);

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

        console.log('📡 [SocialRedirect] 응답 상태:', res.status);
        console.log('📡 [SocialRedirect] 응답 데이터:', res.data);

        if (res.status >= 400) {
          const errorMessage = res.data?.detail || '인증 처리 중 오류가 발생했습니다.';
          console.error('❌ [SocialRedirect] 인증 실패:', errorMessage);
          
          // Google OAuth 특정 오류 처리
          if (provider === 'google' && errorMessage.includes('invalid_grant')) {
            throw new Error('인증 코드가 만료되었거나 이미 사용되었습니다. 다시 로그인해주세요.');
          }
          
          throw new Error(errorMessage);
        }

        if (!res.data || !res.data.access_token) {
          console.error('❌ [SocialRedirect] 토큰 없음:', res.data);
          throw new Error('인증 토큰을 받지 못했습니다.');
        }

        const { access_token, nickname, role, user_id } = res.data;
        console.log('✅ [SocialRedirect] 로그인 성공:', { nickname, role, user_id });

        // 토큰과 사용자 정보 저장
        setToken(access_token);
        
        // 사용자 정보 객체 생성
        const userInfo = {
          userId: user_id?.toString() || '',
          email: res.data.email || '',
          nickname: nickname || '',
          role: role || 'USER'
        };
        
        // 로컬 스토리지와 AuthContext 업데이트
        setUserInfo(userInfo);
        setIsLoggedIn(true);
        setNickname(nickname);
        setUser(userInfo);

        console.log('✅ [SocialRedirect] 사용자 정보 설정 완료:', userInfo);

        toast({
          title: `${provider} 로그인 성공!`,
          description: `${nickname}님 환영합니다 😊`,
        });

        navigate('/');
      } catch (err: unknown) {
        console.error('❌ [SocialRedirect] 소셜 로그인 오류:', err);
        
        let errorMessage = '알 수 없는 오류가 발생했습니다.';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null && 'response' in err) {
          const axiosError = err as { response?: { data?: { detail?: string } } };
          errorMessage = axiosError.response?.data?.detail || '알 수 없는 오류가 발생했습니다.';
        }
        
        toast({
          title: '로그인 실패',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/login');
      }
    };

    fetchToken();
  }, [code, provider, error, navigate, toast, setIsLoggedIn, setNickname, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">소셜 로그인 처리 중...</p>
        <p className="text-sm text-gray-600 mt-2">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}
