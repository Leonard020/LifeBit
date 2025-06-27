import React, { useState, useEffect, useMemo } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';

interface StrengthGoal {
  id: string;
  bodyPart: string;
  weeklyCount: string;
}

// Track selected body parts in localStorage to persist across refresh/navigation
const SELECTED_BODY_PARTS_KEY = 'selectedBodyParts';

function getSelectedBodyPartsFromStorage() {
  try {
    const stored = localStorage.getItem(SELECTED_BODY_PARTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
function setSelectedBodyPartsToStorage(parts) {
  localStorage.setItem(SELECTED_BODY_PARTS_KEY, JSON.stringify(parts));
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

  const [strengthGoals, setStrengthGoals] = useState<StrengthGoal[]>([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);

  const [goals, setGoals] = useState({
    dailyCalories: '2000',
    dailyCarbs: '200',
    dailyProtein: '120',
    dailyFat: '60',
    weeklyChest: '0',
    weeklyBack: '0',
    weeklyLegs: '0',
    weeklyShoulders: '0',
    weeklyArms: '0',
    weeklyAbs: '0',
    weeklyCardio: '0',
  });

  // Calculate total weekly workout target based on displayStrengthGoals
  const totalWeeklyWorkoutTarget = useMemo(() => {
    return strengthGoals.reduce((sum, goal) => sum + parseInt(goal.weeklyCount), 0) + parseInt(goals.weeklyCardio);
  }, [strengthGoals, goals.weeklyCardio]);

  // Get current user ID
  const currentUserId = getUserIdFromToken();

  // React Query hooks for user goals
  const { data: userGoalsData, isLoading: goalsLoading } = useUserGoals(currentUserId?.toString() || '');
  const updateUserGoalMutation = useUpdateUserGoal();
  const createUserGoalMutation = useCreateUserGoal();
  const queryClient = useQueryClient();

  const bodyPartOptions = [
    { value: 'chest', label: '가슴' },
    { value: 'back', label: '등' },
    { value: 'legs', label: '하체' },
    { value: 'abs', label: '복근' },
    { value: 'arms', label: '팔' },
    { value: 'shoulders', label: '어깨' }
  ];

  // Compute available body parts for adding
  const availableBodyParts = useMemo(() => {
    const selected = selectedBodyParts;
    return bodyPartOptions.filter(opt => !selected.includes(opt.value));
  }, [selectedBodyParts, bodyPartOptions]);

  // --- 1. Table rendering: only show exercises in selectedBodyParts ---
  const displayStrengthGoals = useMemo(() => {
    return strengthGoals.filter(goal => selectedBodyParts.includes(goal.bodyPart));
  }, [strengthGoals, selectedBodyParts]);

  // --- 2. Delete logic: remove from selectedBodyParts and strengthGoals, set value to 0 in goals ---
  const removeStrengthGoal = (id: string) => {
    const goalToRemove = strengthGoals.find(goal => goal.id === id);
    if (!goalToRemove) return;

    // Remove from selectedBodyParts
    const updatedParts = selectedBodyParts.filter(part => part !== goalToRemove.bodyPart);
    setSelectedBodyParts(updatedParts);
    setSelectedBodyPartsToStorage(updatedParts);

    // Remove from strengthGoals (for UI)
    setStrengthGoals(strengthGoals.filter(goal => goal.id !== id));

    // Set value to 0 in goals state for DB
    setGoals(prevGoals => {
      const newGoals = { ...prevGoals };
      switch (goalToRemove.bodyPart) {
        case 'chest': newGoals.weeklyChest = '0'; break;
        case 'back': newGoals.weeklyBack = '0'; break;
        case 'legs': newGoals.weeklyLegs = '0'; break;
        case 'shoulders': newGoals.weeklyShoulders = '0'; break;
        case 'arms': newGoals.weeklyArms = '0'; break;
        case 'abs': newGoals.weeklyAbs = '0'; break;
        default: break;
      }
      return newGoals;
    });
  };

  // --- Simplified add logic: add on select ---
  const handleAddExerciseSelect = (selectedPart: string) => {
    addStrengthGoal(selectedPart);
  };

  // --- 3. Add logic: only allow adding exercises not in selectedBodyParts ---
  const addStrengthGoal = (selectedPart?: string) => {
    const newPart = selectedPart || (availableBodyParts.length > 0 ? availableBodyParts[0].value : undefined);
    if (!newPart) return;
    const newGoal: StrengthGoal = {
      id: Date.now().toString(),
      bodyPart: newPart,
      weeklyCount: '1'
    };
    setStrengthGoals([...strengthGoals, newGoal]);
    const updatedParts = Array.from(new Set([...selectedBodyParts, newPart]));
    setSelectedBodyParts(updatedParts);
    setSelectedBodyPartsToStorage(updatedParts);
  };

  // Restore updateStrengthGoal function
  const updateStrengthGoal = (id: string, field: keyof StrengthGoal, value: string) => {
    setStrengthGoals(strengthGoals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    ));
  };

  // --- 4. On load: robust initialization for new users and all-zero backend ---
  useEffect(() => {
    if (userGoalsData && !goalsLoading) {
      let goalsData;
      if (Array.isArray(userGoalsData)) {
        if (userGoalsData.length === 0) {
          setStrengthGoals([]);
          setSelectedBodyParts([]);
          setSelectedBodyPartsToStorage([]);
          setGoals({
            dailyCalories: '2000',
            dailyCarbs: '200',
            dailyProtein: '120',
            dailyFat: '60',
            weeklyChest: '0',
            weeklyBack: '0',
            weeklyLegs: '0',
            weeklyShoulders: '0',
            weeklyArms: '0',
            weeklyAbs: '0',
            weeklyCardio: '0',
          });
          return;
        }
        goalsData = userGoalsData.reduce((prev, curr) => (curr.user_goal_id > prev.user_goal_id ? curr : prev), userGoalsData[0]);
      } else {
        goalsData = userGoalsData.data || userGoalsData;
      }
      // Check if all weekly values are 0 or null (treat as new user)
      const allZero = [
        goalsData.weekly_chest,
        goalsData.weekly_back,
        goalsData.weekly_legs,
        goalsData.weekly_shoulders,
        goalsData.weekly_arms,
        goalsData.weekly_abs
      ].every(val => !val || parseInt(val) === 0);
      if (allZero) {
        setStrengthGoals([]);
        setSelectedBodyParts([]);
        setSelectedBodyPartsToStorage([]);
        setGoals({
          dailyCalories: goalsData.daily_calories_target?.toString() || '2000',
          dailyCarbs: goalsData.daily_carbs_target?.toString() || '200',
          dailyProtein: goalsData.daily_protein_target?.toString() || '120',
          dailyFat: goalsData.daily_fat_target?.toString() || '60',
          weeklyChest: '0',
          weeklyBack: '0',
          weeklyLegs: '0',
          weeklyShoulders: '0',
          weeklyArms: '0',
          weeklyAbs: '0',
          weeklyCardio: goalsData.weekly_cardio?.toString() || '0',
        });
        return;
      }
      setGoals({
        dailyCalories: goalsData.daily_calories_target?.toString() || '2000',
        dailyCarbs: goalsData.daily_carbs_target?.toString() || '200',
        dailyProtein: goalsData.daily_protein_target?.toString() || '120',
        dailyFat: goalsData.daily_fat_target?.toString() || '60',
        weeklyChest: goalsData.weekly_chest?.toString() || '0',
        weeklyBack: goalsData.weekly_back?.toString() || '0',
        weeklyLegs: goalsData.weekly_legs?.toString() || '0',
        weeklyShoulders: goalsData.weekly_shoulders?.toString() || '0',
        weeklyArms: goalsData.weekly_arms?.toString() || '0',
        weeklyAbs: goalsData.weekly_abs?.toString() || '0',
        weeklyCardio: goalsData.weekly_cardio?.toString() || '0',
      });
      // Only add exercises with value > 0
      const loadedStrengthGoals = [
        { id: 'chest', bodyPart: 'chest', weeklyCount: goalsData.weekly_chest?.toString() || '0' },
        { id: 'back', bodyPart: 'back', weeklyCount: goalsData.weekly_back?.toString() || '0' },
        { id: 'legs', bodyPart: 'legs', weeklyCount: goalsData.weekly_legs?.toString() || '0' },
        { id: 'shoulders', bodyPart: 'shoulders', weeklyCount: goalsData.weekly_shoulders?.toString() || '0' },
        { id: 'arms', bodyPart: 'arms', weeklyCount: goalsData.weekly_arms?.toString() || '0' },
        { id: 'abs', bodyPart: 'abs', weeklyCount: goalsData.weekly_abs?.toString() || '0' },
      ];
      const exercisesWithValues = loadedStrengthGoals.filter(goal => parseInt(goal.weeklyCount) > 0);
      setStrengthGoals(exercisesWithValues);
      const updatedSelectedParts = exercisesWithValues.map(goal => goal.bodyPart);
      setSelectedBodyParts(updatedSelectedParts);
      setSelectedBodyPartsToStorage(updatedSelectedParts);
    }
  }, [userGoalsData, goalsLoading]);

  // Keep selectedBodyParts in sync with localStorage
  useEffect(() => {
    setSelectedBodyPartsToStorage(selectedBodyParts);
  }, [selectedBodyParts]);

  // Sync goals state with strengthGoals changes (excluding cardio)
  useEffect(() => {
    setGoals(prevGoals => {
      const newGoals = { ...prevGoals };
      strengthGoals.forEach(goal => {
        switch (goal.bodyPart) {
          case 'chest': newGoals.weeklyChest = goal.weeklyCount; break;
          case 'back': newGoals.weeklyBack = goal.weeklyCount; break;
          case 'legs': newGoals.weeklyLegs = goal.weeklyCount; break;
          case 'shoulders': newGoals.weeklyShoulders = goal.weeklyCount; break;
          case 'arms': newGoals.weeklyArms = goal.weeklyCount; break;
          case 'abs': newGoals.weeklyAbs = goal.weeklyCount; break;
          default: break;
        }
      });
      // weeklyCardio는 기존 값 유지
      return newGoals;
    });
  }, [strengthGoals]);

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

      // Always send all 6 body parts, using value from strengthGoals if present, or 0 if not
      const allParts = ['chest', 'back', 'legs', 'shoulders', 'arms', 'abs'];
      const strengthGoalMap = allParts.reduce((acc, part) => {
        const found = strengthGoals.find(goal => goal.bodyPart === part);
        switch (part) {
          case 'chest': acc.weekly_chest = found ? parseInt(found.weeklyCount) : 0; break;
          case 'back': acc.weekly_back = found ? parseInt(found.weeklyCount) : 0; break;
          case 'legs': acc.weekly_legs = found ? parseInt(found.weeklyCount) : 0; break;
          case 'shoulders': acc.weekly_shoulders = found ? parseInt(found.weeklyCount) : 0; break;
          case 'arms': acc.weekly_arms = found ? parseInt(found.weeklyCount) : 0; break;
          case 'abs': acc.weekly_abs = found ? parseInt(found.weeklyCount) : 0; break;
          default: break;
        }
        return acc;
      }, { weekly_chest: 0, weekly_back: 0, weekly_legs: 0, weekly_shoulders: 0, weekly_arms: 0, weekly_abs: 0 });

      const goalsData = {
        daily_calories_target: parseInt(goals.dailyCalories),
        daily_carbs_target: parseInt(goals.dailyCarbs),
        daily_protein_target: parseInt(goals.dailyProtein),
        daily_fat_target: parseInt(goals.dailyFat),
        ...strengthGoalMap,
        weekly_cardio: parseInt(goals.weeklyCardio), // Cardio as separate field
      };

      await createUserGoalMutation.mutateAsync(goalsData);
      // Force refetch after mutation for immediate UI update
      await queryClient.refetchQueries({ queryKey: ['userGoals', currentUserId] });
      toast({
        title: '목표 설정 완료',
        description: '건강 목표가 성공적으로 저장되었습니다.',
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
                    <Select
                      value=""
                      onValueChange={handleAddExerciseSelect}
                      disabled={availableBodyParts.length === 0}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="부위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBodyParts.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    {bodyPartOptions.filter(opt => selectedBodyParts.includes(opt.value)).map((option, idx) => {
                      const goal = strengthGoals.find(g => g.bodyPart === option.value);
                      // Filter options for this row: allow current value + unselected
                      const selected = bodyPartOptions
                        .filter(o => o.value !== option.value && selectedBodyParts.includes(o.value))
                        .map(o => o.value);
                      const options = bodyPartOptions.filter(opt2 => !selected.includes(opt2.value) || opt2.value === option.value);
                      return (
                        <div key={goal?.id || option.value} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1 flex items-center pl-2 font-medium">{option.label}</div>
                          <div className="flex-1">
                            <Select 
                              value={goal?.weeklyCount || '1'} 
                              onValueChange={(value) => updateStrengthGoal(goal?.id || '', 'weeklyCount', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="주간 횟수" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">주 0회</SelectItem>
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
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeStrengthGoal(goal?.id || '')}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cardio Training */}
                <div className="space-y-2">
                  <Label htmlFor="cardioTraining">유산소 운동 (회/주)</Label>
                  <Select value={goals.weeklyCardio} onValueChange={(value) => setGoals({...goals, weeklyCardio: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="유산소 운동 횟수" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">주 0회</SelectItem>
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

                {/* Total Weekly Workout Target Display */}
                <div className="space-y-2">
                  <Label>총 주간 운동 목표</Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-lg font-semibold text-blue-700">
                      {totalWeeklyWorkoutTarget}회 / 주
                    </div>
                    <div className="text-sm text-blue-600">
                      (근력운동: {totalWeeklyWorkoutTarget - parseInt(goals.weeklyCardio)}회, 유산소: {goals.weeklyCardio}회)
                    </div>
                  </div>
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
                      onWheel={e => e.currentTarget.blur()}
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
                      onWheel={e => e.currentTarget.blur()}
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
                      onWheel={e => e.currentTarget.blur()}
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
                      onWheel={e => e.currentTarget.blur()}
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
