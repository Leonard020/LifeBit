import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile, deleteUser } from '@/api/auth';
import { isLoggedIn } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { BasicInfoBox } from '@/components/BasicInfoBox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

const UserInfo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    nickname: '',
    email: '',
    height: '',
    weight: '',
    age: '',
    gender: 'male',
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUnregisterDialog, setShowUnregisterDialog] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!isLoggedIn()) {
        navigate('/login');
        return;
      }
      try {
        const userProfile = await getUserProfile();
        setProfileData({
          nickname: userProfile.nickname || '',
          email: userProfile.email || '',
          height: userProfile.height ? userProfile.height.toString() : '',
          weight: userProfile.weight ? userProfile.weight.toString() : '',
          age: userProfile.age ? userProfile.age.toString() : '',
          gender: userProfile.gender || 'male',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '회원정보 로드 실패',
          description: '사용자 정보를 불러올 수 없습니다.',
        });
      } finally {
        setLoading(false);
      }
    };
    loadUserProfile();
  }, [navigate, toast]);

  const handleProfileSave = async () => {
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        toast({
          variant: 'destructive',
          title: '비밀번호 불일치',
          description: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        });
        return;
      }
    }
    try {
      setLoading(true);
      const updateData: Record<string, unknown> = {
        nickname: profileData.nickname,
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
        age: profileData.age ? parseInt(profileData.age) : null,
        gender: profileData.gender,
      };
      if (password) updateData.password = password;
      await updateUserProfile(updateData);
      toast({
        title: '회원정보 저장 완료',
        description: '회원정보가 성공적으로 업데이트되었습니다.',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '회원정보 저장 실패',
        description: '회원정보 업데이트에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async () => {
    try {
      setLoading(true);
      await deleteUser();
      toast({
        title: '회원탈퇴 완료',
        description: '회원탈퇴가 성공적으로 처리되었습니다.',
      });
      setShowUnregisterDialog(false);
      navigate('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '회원탈퇴 실패',
        description: '회원탈퇴 중 오류가 발생했습니다.',
      });
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white font-bold">회원</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">회원정보</h1>
            <p className="text-muted-foreground">회원정보를 확인하고 수정할 수 있습니다.</p>
          </div>
          <BasicInfoBox
            profileData={profileData}
            setProfileData={setProfileData}
            loading={loading}
            onSave={handleProfileSave}
            onUnregister={() => setShowUnregisterDialog(true)}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        </div>
        <Dialog open={showUnregisterDialog} onOpenChange={setShowUnregisterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>회원 탈퇴 확인</DialogTitle>
              <DialogDescription>정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnregisterDialog(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleUnregister} disabled={loading}>
                {loading ? '탈퇴 처리 중...' : '회원탈퇴'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UserInfo; 