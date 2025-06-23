import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Ruler, Weight, Calendar, Target, Dumbbell, Heart, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile, useUserGoals } from '@/api/auth';
import { isLoggedIn, getUserIdFromToken } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { BasicInfoBox } from '@/components/BasicInfoBox';
import { API_CONFIG } from '@/config/env';
import { useUpdateUserGoal, useCreateUserGoal } from '@/api/authApi';

interface StrengthGoal {
  id: string;
  bodyPart: string;
  weeklyCount: string;
}

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    nickname: string;
    email: string;
    height: string;
    weight: string;
    age: string;
    gender: string;
    profileImageUrl?: string;
  }>({
    nickname: '',
    email: '',
    height: '',
    weight: '',
    age: '',
    gender: 'male',
  });

  const [strengthGoals, setStrengthGoals] = useState<StrengthGoal[]>([
    { id: '1', bodyPart: 'chest', weeklyCount: '2' }
  ]);

  const [goals, setGoals] = useState({
    cardioTraining: '2',
    dailyCalories: '2000',
    dailyCarbs: '200',
    dailyProtein: '120',
    dailyFat: '60',
  });

  // Get current user ID
  const currentUserId = getUserIdFromToken();

  // React Query hooks for user goals
  const { data: userGoalsData, isLoading: goalsLoading } = useUserGoals(currentUserId?.toString() || '');
  const updateUserGoalMutation = useUpdateUserGoal();
  const createUserGoalMutation = useCreateUserGoal();

  const bodyPartOptions = [
    { value: 'chest', label: '가슴' },
    { value: 'back', label: '등' },
    { value: 'legs', label: '하체' },
    { value: 'abs', label: '복근' },
    { value: 'arms', label: '팔' },
    { value: 'shoulders', label: '어깨' }
  ];

  // Load user goals when data is available
  useEffect(() => {
    if (userGoalsData && !goalsLoading) {
      const goalsData = userGoalsData.data || userGoalsData;
      setGoals({
        cardioTraining: goalsData.weekly_workout_target?.toString() || '2',
        dailyCalories: goalsData.daily_calories_target?.toString() || '2000',
        dailyCarbs: goalsData.daily_carbs_target?.toString() || '200',
        dailyProtein: goalsData.daily_protein_target?.toString() || '120',
        dailyFat: goalsData.daily_fat_target?.toString() || '60',
      });
    }
  }, [userGoalsData, goalsLoading]);

  const addStrengthGoal = () => {
    const newGoal: StrengthGoal = {
      id: Date.now().toString(),
      bodyPart: 'chest',
      weeklyCount: '1'
    };
    setStrengthGoals([...strengthGoals, newGoal]);
  };

  const removeStrengthGoal = (id: string) => {
    setStrengthGoals(strengthGoals.filter(goal => goal.id !== id));
  };

  const updateStrengthGoal = (id: string, field: keyof StrengthGoal, value: string) => {
    setStrengthGoals(strengthGoals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    ));
  };

  // 컴포넌트 마운트 시 사용자 프로필 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      // 로그인 상태 확인
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
          profileImageUrl: userProfile.profileImageUrl || '',
        });
      } catch (error) {
        console.error('Failed to load user profile:', error);
        toast({
          variant: 'destructive',
          title: '프로필 로드 실패',
          description: '사용자 정보를 불러올 수 없습니다.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate, toast]);

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      
      // 숫자 필드들을 적절한 타입으로 변환
      const updateData = {
        nickname: profileData.nickname,
        height: profileData.height ? parseFloat(profileData.height) : null,
        weight: profileData.weight ? parseFloat(profileData.weight) : null,
        age: profileData.age ? parseInt(profileData.age) : null,
        gender: profileData.gender,
      };

      await updateUserProfile(updateData);
      
      toast({
        title: "프로필 저장 완료",
        description: "개인정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        variant: 'destructive',
        title: '프로필 저장 실패',
        description: '개인정보 업데이트에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoalsSave = async () => {
    if (!currentUserId) {
      toast({
        variant: 'destructive',
        title: '사용자 인증 오류',
        description: '사용자 정보를 찾을 수 없습니다.',
      });
      return;
    }

    try {
      setLoading(true);

      const goalsData = {
        weekly_workout_target: parseInt(goals.cardioTraining),
        daily_calories_target: parseInt(goals.dailyCalories),
        daily_carbs_target: parseInt(goals.dailyCarbs),
        daily_protein_target: parseInt(goals.dailyProtein),
        daily_fat_target: parseInt(goals.dailyFat),
      };

      // Always create a new user goal (POST)
      await createUserGoalMutation.mutateAsync(goalsData);

      toast({
        title: "목표 설정 완료",
        description: "건강 목표가 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error('Failed to save goals:', error);
      toast({
        variant: 'destructive',
        title: '목표 저장 실패',
        description: '건강 목표 저장에 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중일 때 보여줄 컴포넌트
  if (loading || goalsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">마이페이지</h1>
              <p className="text-muted-foreground">사용자 정보를 불러오는 중...</p>
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              {profileData.profileImageUrl ? (
                <img 
                  src={`${API_CONFIG.BASE_URL}${profileData.profileImageUrl}`} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">마이페이지</h1>
            <p className="text-muted-foreground">개인정보와 건강 목표를 관리하세요</p>
          </div>

          {/* Basic Information */}
          <BasicInfoBox
            profileData={profileData}
            setProfileData={setProfileData}
            loading={loading}
            onSave={handleProfileSave}
          />

          {/* Health Goals */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                건강 목표 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exercise Goals */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5" />
                  운동 목표
                </h3>
                
                {/* Strength Training Goals */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">근력 운동 목표</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addStrengthGoal}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      추가
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {strengthGoals.map((goal) => (
                      <div key={goal.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <Select 
                            value={goal.bodyPart} 
                            onValueChange={(value) => updateStrengthGoal(goal.id, 'bodyPart', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="부위 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {bodyPartOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Select 
                            value={goal.weeklyCount} 
                            onValueChange={(value) => updateStrengthGoal(goal.id, 'weeklyCount', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="주간 횟수" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">주 1회</SelectItem>
                              <SelectItem value="2">주 2회</SelectItem>
                              <SelectItem value="3">주 3회</SelectItem>
                              <SelectItem value="4">주 4회</SelectItem>
                              <SelectItem value="5">주 5회</SelectItem>
                              <SelectItem value="6">주 6회</SelectItem>
                              <SelectItem value="7">매일</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {strengthGoals.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStrengthGoal(goal.id)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cardio Training */}
                <div className="space-y-2">
                  <Label htmlFor="cardioTraining">유산소 운동 (회/주)</Label>
                  <Select value={goals.cardioTraining} onValueChange={(value) => setGoals({...goals, cardioTraining: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="유산소 운동 횟수" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">주 1회</SelectItem>
                      <SelectItem value="2">주 2회</SelectItem>
                      <SelectItem value="3">주 3회</SelectItem>
                      <SelectItem value="4">주 4회</SelectItem>
                      <SelectItem value="5">주 5회</SelectItem>
                      <SelectItem value="6">주 6회</SelectItem>
                      <SelectItem value="7">매일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Diet Goals */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  식단 목표
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories">칼로리 (kcal/일)</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={goals.dailyCalories}
                      onChange={(e) => setGoals({...goals, dailyCalories: e.target.value})}
                      placeholder="2000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">탄수화물 (g/일)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={goals.dailyCarbs}
                      onChange={(e) => setGoals({...goals, dailyCarbs: e.target.value})}
                      placeholder="200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">단백질 (g/일)</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={goals.dailyProtein}
                      onChange={(e) => setGoals({...goals, dailyProtein: e.target.value})}
                      placeholder="120"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">지방 (g/일)</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={goals.dailyFat}
                      onChange={(e) => setGoals({...goals, dailyFat: e.target.value})}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleGoalsSave} 
                className="w-full gradient-bg hover:opacity-90 transition-opacity"
                disabled={createUserGoalMutation.isPending}
              >
                {createUserGoalMutation.isPending ? '저장 중...' : '건강 목표 저장'}
              </Button>
            </CardContent>
          </Card>

          {/* BMI Calculator */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>BMI 계산기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold gradient-text">
                  {((parseFloat(profileData.weight) / Math.pow(parseFloat(profileData.height) / 100, 2)) || 0).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {parseFloat(profileData.height) && parseFloat(profileData.weight) ? (
                    (() => {
                      const bmi = parseFloat(profileData.weight) / Math.pow(parseFloat(profileData.height) / 100, 2);
                      if (bmi < 18.5) return "저체중";
                      if (bmi < 25) return "정상체중";
                      if (bmi < 30) return "과체중";
                      return "비만";
                    })()
                  ) : "키와 체중을 입력하세요"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
