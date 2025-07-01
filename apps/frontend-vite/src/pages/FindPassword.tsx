import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export default function FindPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
      toast({
        title: '이메일 전송 완료',
        description: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      });
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        variant: 'destructive',
        title: '오류',
        description: error.response?.data?.detail || '이메일 전송에 실패했습니다.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <h2 className="text-2xl font-bold text-center">비밀번호 찾기</h2>
        {sent ? (
          <p className="text-center">이메일을 확인해주세요.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              placeholder="가입한 이메일 주소"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">이메일 전송</Button>
          </form>
        )}
      </div>
    </div>
  );
} 