import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '비밀번호가 일치하지 않습니다.',
      });
      return;
    }
    try {
      await axios.post('/api/py/auth/reset-password', { token, password });
      toast({
        title: '비밀번호 변경 완료',
        description: '새 비밀번호로 로그인해주세요.',
      });
      navigate('/login');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        variant: 'destructive',
        title: '오류',
        description: error.response?.data?.detail || '비밀번호 변경에 실패했습니다.',
      });
    }
  };

  if (!token) {
    return <div>유효하지 않은 접근입니다.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <h2 className="text-2xl font-bold text-center">비밀번호 재설정</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="password"
            placeholder="새 비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="비밀번호 확인"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">비밀번호 변경</Button>
        </form>
      </div>
    </div>
  );
} 