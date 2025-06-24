import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Dumbbell, Apple, Edit, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { getUserInfo, getToken, getUserIdFromToken, isTokenValid, removeToken, debugToken } from '@/utils/auth';
import { getExerciseCatalog, type ExerciseCatalog, getDailyDietRecords, type DietRecord, getDailyExerciseRecords, type ExerciseRecordDTO } from '@/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';

import { toast } from '@/hooks/use-toast';

// 백엔드 API 응답 타입 정의
interface DietLogDTO {
  id: number;
  userId: number;
  foodItemId: number;
  foodName: string;
  quantity: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  logDate: string;
  unit: string;
  mealTime?: string; // ENUM: breakfast, lunch, dinner, snack
  inputSource?: string; // ENUM: VOICE, TYPING
  confidenceScore?: number;
  originalAudioPath?: string;
  validationStatus?: string; // ENUM: PENDING, VALIDATED, REJECTED
  validationNotes?: string;
  createdAt?: string;
}

interface DietNutritionDTO {
  name: string;
  target: number;
  current: number;
  unit: string;
  percentage: number;
}

interface FoodItem {
  foodItemId: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  servingSize: number;
}

const Note = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [todayScore, setTodayScore] = useState(12);
  const [hasClaimedExerciseScore, setHasClaimedExerciseScore] = useState(false);
  const [hasClaimedDietScore, setHasClaimedDietScore] = useState(false);

  // 식단 관련 상태
  const [dailyDietLogs, setDailyDietLogs] = useState<DietLogDTO[]>([]);
  const [dailyNutritionGoals, setDailyNutritionGoals] = useState<DietNutritionDTO[]>([]);
  const [isLoadingDietData, setIsLoadingDietData] = useState(true);
  const [dietError, setDietError] = useState<string | null>(null);

  // 식단 추가 관련 상태
  const [isAddDietDialogOpen, setIsAddDietDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [isSearching, setIsSearching] = useState(false);
  const [mealTime, setMealTime] = useState('breakfast');
  const [weeklySummary, setWeeklySummary] = useState<{ [part: string]: number }>({});
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  // 운동 추가 관련 상태
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(1);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [time, setTime] = useState('');
  const [exerciseOptions, setExerciseOptions] = useState<{ value: string; label: string }[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Mock data for records on specific dates (유지)
  const [todayExercise, setTodayExercise] = useState<ExerciseRecordDTO[]>([]);

  // ✅ 토큰을 맨 처음에 한 번만 가져와서 저장
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1. 기록 날짜 상태 추가
  const [dietRecordedDates, setDietRecordedDates] = useState<string[]>([]);
  const [exerciseRecordedDates, setExerciseRecordedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // ✅ 달력의 기록된 날짜(점)를 가져오는 로직을 async/await로 변경하여 안정성 확보
  const fetchCalendarRecords = useCallback(async () => {
    const userId = getUserIdFromToken() || 1;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;
    const token = getToken();
    if (!token || !userId) return;

    try {
      const dietPromise = axios.get(`/api/diet/calendar-records/${year}/${month}`, {
        params: { userId },
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const exercisePromise = axios.get(`/api/exercise-sessions/${userId}`, {
        params: { period: 'month' }, // 현재 월의 운동 기록을 가져온다고 가정
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const [dietResponse, exerciseResponse] = await Promise.all([dietPromise, exercisePromise]);

      setDietRecordedDates(Object.keys(dietResponse.data));
      // exercise_date가 없을 경우를 대비하여 방어 코드 추가
      setExerciseRecordedDates(exerciseResponse.data?.map((item: { exercise_date: string }) => item.exercise_date) || []);
    } catch (err) {
      console.error("달력 기록 조회 실패:", err);
      setDietRecordedDates([]);
      setExerciseRecordedDates([]);
    }
  }, [calendarMonth]);

  const mealTimeMap: Record<string, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  };
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];

  const groupedDietLogs = dailyDietLogs.reduce((acc, log) => {
    const meal = log.mealTime || 'snack';
    if (!acc[meal]) {
      acc[meal] = [];
    }
    acc[meal].push(log);
    return acc;
  }, {} as Record<string, DietLogDTO[]>);

  // ✅ 인증 토큰을 맨 처음에 가져오기
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);
  }, [navigate]);

  // 2. 달력 월이 바뀔 때마다 기록 날짜 fetch
  useEffect(() => {
    const userId = getUserIdFromToken() || 1;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;
    const token = getToken();
    if (!token) return;

    // 식단 기록 날짜
    axios.get(`/api/diet/calendar-records/${year}/${month}`, {
      params: { userId },
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      setDietRecordedDates(Object.keys(res.data));
    });

    // 운동 기록 날짜
    axios.get(`/api/exercise-sessions/${userId}`, {
      params: { period: 'month' },
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      setExerciseRecordedDates(res.data.map(item => item.exercise_date));
    });
  }, [calendarMonth]);

  // 날짜별 기록 타입 정의 (원격 저장소 기능과 함께 유지)
  interface DateRecord {
    exercise: boolean;
    diet: boolean;
  }

  // Exercise goals from profile (mock data) (유지)
  const exerciseGoals: { [key: string]: number } = {
    '가슴': 3,
    '등': 2,
    '하체': 4,
    '어깨': 2,
    '복근': 3,
    '팔': 2,
    '유산소': 5,
  };

  // 운동데이터터 - 저장된 토큰 사용
  useEffect(() => {
    const fetchWeeklySummary = async () => {
      if (!authToken) return; // 토큰이 없으면 실행하지 않음

      setIsLoadingSummary(true);
      try {
        const userInfo = getUserInfo();
        const userId = userInfo?.userId || 1;

        const today = new Date();
        const day = today.getDay(); // 0(일) ~ 6(토)
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);
        const weekStart = monday.toISOString().split("T")[0];


      } catch (err) {
        console.error("주간 운동 집계 불러오기 실패:", err);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    fetchWeeklySummary();
  }, [authToken]); // authToken이 변경될 때마다 실행

  const exerciseData = Object.entries(exerciseGoals).map(([part, goal]) => ({
    subject: part,
    value: (weeklySummary[part] || 0) * 20, // 1회 = 20%
    goal: goal * 20,
  }));

  // ✅ fetchDietData를 useCallback으로 분리
  const fetchDietData = useCallback(async () => {
    if (!authToken) return;
    setIsLoadingDietData(true);
    setDietError(null);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    try {
      const userId = getUserIdFromToken();
      
      if (!userId) {
        console.warn('🚨 [fetchDietData] 사용자 ID를 찾을 수 없습니다.');
        setDietError("사용자 인증이 필요합니다.");
        return;
      }

      console.log(`🍽️ [fetchDietData] 식단 데이터 조회 시작: ${formattedDate}, 사용자: ${userId}`);
      
      // ✅ authApi.ts의 함수 사용 (충돌 방지)
      const dietRecords = await getDailyDietRecords(formattedDate, userId);
      
      // DietRecord → DietLogDTO 변환
      const convertedRecords: DietLogDTO[] = dietRecords.map(record => ({
        id: record.id,
        userId: record.userId,
        foodItemId: record.foodItemId,
        foodName: record.foodName,
        quantity: record.quantity,
        calories: record.calories,
        carbs: record.carbs,
        protein: record.protein,
        fat: record.fat,
        logDate: record.logDate,
        unit: record.unit,
        mealTime: record.mealTime,
        inputSource: record.inputSource,
        confidenceScore: record.confidenceScore,
        originalAudioPath: record.originalAudioPath,
        validationStatus: record.validationStatus,
        validationNotes: record.validationNotes,
        createdAt: record.createdAt
      }));

      // 영양소 목표는 임시로 기본값 설정 (추후 authApi.ts에 함수 추가 필요)
      const defaultGoals: DietNutritionDTO[] = [
        { name: '칼로리', target: 2000, current: 0, unit: 'kcal', percentage: 0 },
        { name: '탄수화물', target: 250, current: 0, unit: 'g', percentage: 0 },
        { name: '단백질', target: 120, current: 0, unit: 'g', percentage: 0 },
        { name: '지방', target: 60, current: 0, unit: 'g', percentage: 0 }
      ];
      
      console.log('✅ [fetchDietData] 식단 데이터 조회 성공');
      setDailyDietLogs(convertedRecords);
      setDailyNutritionGoals(defaultGoals);
      
    } catch (error) {
      console.error("❌ [fetchDietData] 식단 데이터 조회 실패:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          setDietError("권한이 없습니다. 다시 로그인해주세요.");
        } else if (error.message.includes('401')) {
          setDietError("인증이 만료되었습니다. 다시 로그인해주세요.");
        } else {
          setDietError(`식단 데이터를 불러오는데 실패했습니다: ${error.message}`);
        }
      } else {
        setDietError("식단 데이터를 불러오는데 실패했습니다.");
      }
    } finally {
      setIsLoadingDietData(false);
    }
  }, [authToken, selectedDate]);

  useEffect(() => {
    fetchDietData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, authToken]);

  useEffect(() => {
    if (location.state?.refreshDiet) {
      fetchDietData();
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // 음식 검색
  const searchFood = async () => {
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/diet/food-items/search`, {
        params: { keyword: searchKeyword }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("음식 검색 중 오류:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 식단 추가
  const addDietRecord = async () => {
    if (!selectedFood || !quantity) {
      alert('음식과 양을 입력해주세요.');
      return;
    }
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        toast({
          title: "사용자 정보를 찾을 수 없습니다.",
          description: "다시 로그인 해주세요.",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      const request = {
        userId,
        foodItemId: selectedFood.foodItemId,
        quantity: parseFloat(quantity),
        logDate: selectedDate.toISOString().split('T')[0],
        mealTime: mealTime,
        unit: 'g',
      };

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/diet/record', request, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newRecord = response.data as DietLogDTO;

      // ✅ 데이터 새로고침 대신, 반환된 데이터로 상태를 직접 업데이트
      setDailyDietLogs(prevLogs => [newRecord, ...prevLogs]);
      await fetchCalendarRecords(); // 달력 점은 여전히 새로고침

      // ✅ 상태 초기화 및 팝업 닫기
      setIsAddDietDialogOpen(false);
      setSearchKeyword('');
      setSearchResults([]);
      setSelectedFood(null);
      setQuantity('100');
      setMealTime('breakfast');

      toast({
        title: "식단 기록 추가 완료",
        description: `${format(selectedDate, 'yyyy-MM-dd')}에 식단이 추가되었습니다.`,
      });
    } catch (error) {
      console.error('식단 기록 추가 중 오류:', error);
      toast({
        title: "식단 기록 추가 실패",
        description: "기록 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 식단 기록 삭제
  const deleteDietRecord = async (id: number) => {
    try {
      await axios.delete(`/api/diet/record/${id}`);

      // 데이터 새로고침 (목록과 달력 모두)
      await fetchDietData();
      await fetchCalendarRecords();

      toast({
        title: "삭제 완료",
        description: "식단 기록이 삭제되었습니다."
      });

    } catch (error) {
      console.error("식단 기록 삭제 중 오류:", error);
      toast({
        title: "삭제 실패",
        description: "기록 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // UI 기록 타입 정의
  interface UIRecord {
    meal: string;
    food: string;
    amount: string;
    calories: number;
    time: string;
  }

  // 백엔드 데이터 -> UI 형식으로 변환 (todayRecords.diet)
  const uiTodayDietRecords: UIRecord[] = dailyDietLogs.map(log => ({
    meal: '기록',
    food: log.foodName,
    amount: `${log.quantity}${log.unit}`,
    calories: log.calories,
    time: '',
  }));

  // 오늘의 기록 타입 정의
  interface TodayRecords {
    exercise: ExerciseRecordDTO[];
    diet: UIRecord[];
  }

  const todayRecords: TodayRecords = {
    exercise: todayExercise,
    diet: uiTodayDietRecords
  };

  // Get nutrition goals from DB (dailyNutritionGoals)
  const getGoal = (name: string) => {
    const found = dailyNutritionGoals.find(dto => dto.name === name);
    return found ? found.target : 1; // fallback to 1 to avoid division by zero
  };

  // 영양소 데이터 타입 정의
  interface NutritionData {
    name: string;
    value: number;
    goal: number;
    color: string;
    calories: number;
    targetCalories: number;
  }

  const uiNutritionData: NutritionData[] = [
    {
      name: '탄수화물',
      value: (dailyDietLogs.reduce((sum, log) => sum + log.carbs, 0) / getGoal('탄수화물')) * 100,
      goal: 100,
      color: '#3B4A9C',
      calories: dailyDietLogs.reduce((sum, log) => sum + log.carbs, 0),
      targetCalories: getGoal('탄수화물'),
    },
    {
      name: '단백질',
      value: (dailyDietLogs.reduce((sum, log) => sum + log.protein, 0) / getGoal('단백질')) * 100,
      goal: 100,
      color: '#E67E22',
      calories: dailyDietLogs.reduce((sum, log) => sum + log.protein, 0),
      targetCalories: getGoal('단백질'),
    },
    {
      name: '지방',
      value: (dailyDietLogs.reduce((sum, log) => sum + log.fat, 0) / getGoal('지방')) * 100,
      goal: 100,
      color: '#95A5A6',
      calories: dailyDietLogs.reduce((sum, log) => sum + log.fat, 0),
      targetCalories: getGoal('지방'),
    },
    {
      name: '칼로리',
      value: (dailyDietLogs.reduce((sum, log) => sum + log.calories, 0) / getGoal('칼로리')) * 100,
      goal: 100,
      color: '#8B5CF6',
      calories: dailyDietLogs.reduce((sum, log) => sum + log.calories, 0),
      targetCalories: getGoal('칼로리'),
    },
  ];

  // ✅ 오늘 운동 기록 불러오기
  const fetchExercise = async () => {
    if (!authToken) {
      console.warn('인증 토큰이 없습니다.');
      setTodayExercise([]);
      return;
    }

    // 토큰 유효성 검사 추가
    if (!isTokenValid()) {
      console.error('토큰이 유효하지 않습니다. 로그인 페이지로 이동합니다.');
      removeToken();
      navigate('/login');
      return;
    }

    const dateStr = selectedDate.toISOString().split("T")[0];
    console.log(`🔍 운동 기록 조회 시작 - 날짜: ${dateStr}`);

    try {
      // authApi.ts의 getDailyExerciseRecords 함수 사용
      const data = await getDailyExerciseRecords(dateStr);
      console.log('✅ 운동 기록 조회 성공:', data);
      setTodayExercise(data);
    } catch (err) {
      console.error("운동 기록 불러오기 실패:", err);
      
      if (err instanceof Error) {
        const message = err.message;
        
        if (message.includes('인증이 필요합니다')) {
          console.error('인증 실패 - 토큰이 만료되었거나 유효하지 않습니다.');
          debugToken();
          removeToken();
          navigate('/login');
          return;
        }
        
        if (message.includes('접근 권한이 없습니다')) {
          console.error('권한 없음 - 403 Forbidden');
          debugToken();
        }
      }
      
      setTodayExercise([]);
    }
  };

  useEffect(() => {
    fetchExercise();
  }, [selectedDate]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    const currentMonth = selectedDate.getMonth();

    newDate.setDate(newDate.getDate() + days);

    // 월이 변경되었는지 확인하여 calendarMonth 동기화
    if (newDate.getMonth() !== currentMonth) {
      setCalendarMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    }

    setSelectedDate(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1)); // ensure calendarMonth is in sync
      setIsCalendarOpen(false);
    }
  };

  // 3. 실제 기록 기반으로 점 표시
  const hasRecordOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      exercise: exerciseRecordedDates.includes(dateStr),
      diet: dietRecordedDates.includes(dateStr)
    };
  };

  // 4. 기존 recordsByDate mock 데이터 삭제
  // (recordsByDate 관련 코드 모두 제거)

  // 5. Calendar에 onMonthChange 핸들러 추가 및 customDayContent 수정
  const customDayContent = (date: Date) => {
    const records = hasRecordOnDate(date);
    const hasBothRecords = records && records.exercise && records.diet;

    // 점 스타일: 크게, 색상별
    const dotStyle = {
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      marginTop: '6px',
      display: 'inline-block',
    };

    let dot = null;
    if (hasBothRecords) {
      dot = (
        <span
          style={{
            ...dotStyle,
            background: '#a78bfa', // purple-500
            boxShadow: '0 0 0 2px #8B5CF644',
          }}
        />
      );
    } else if (records.exercise) {
      dot = (
        <span
          style={{
            ...dotStyle,
            background: '#22c55e', // green-500
            boxShadow: '0 0 0 2px #22c55e44',
          }}
        />
      );
    } else if (records.diet) {
      dot = (
        <span
          style={{
            ...dotStyle,
            background: '#3b82f6', // blue-500
            boxShadow: '0 0 0 2px #3b82f644',
          }}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[44px]">
        <span className={hasBothRecords ? "gradient-text font-medium" : ""}>
          {date.getDate()}
        </span>
        {dot}
      </div>
    );
  };

  const handleClaimExerciseScore = () => {
    setTodayScore(todayScore + 1);
    setHasClaimedExerciseScore(true);
  };

  const handleClaimDietScore = () => {
    setTodayScore(todayScore + 1);
    setHasClaimedDietScore(true);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 식단 수정 관련 상태
  const [isEditDietDialogOpen, setIsEditDietDialogOpen] = useState(false);
  const [editingDietLog, setEditingDietLog] = useState<DietLogDTO | null>(null);
  const [editFormData, setEditFormData] = useState({
    foodItemId: null as number | null,
    foodName: '',
    quantity: 0,
    calories: 0, // 100g당
    carbs: 0,    // 100g당
    protein: 0,  // 100g당
    fat: 0,      // 100g당
  });
  const [isUpdatingDiet, setIsUpdatingDiet] = useState(false);

  // 수정 팝업 내 검색 관련 상태
  const [editSearchKeyword, setEditSearchKeyword] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<FoodItem[]>([]);
  const [isEditSearching, setIsEditSearching] = useState(false);


  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const isNutrientField = ['foodName', 'calories', 'carbs', 'protein', 'fat'].includes(name);

    setEditFormData(prev => ({
      ...prev,
      // 이름이나 영양성분 수정 시, foodItemId를 null로 만들어 '커스텀 음식'으로 전환
      foodItemId: isNutrientField ? null : prev.foodItemId,
      [name]: name === 'foodName' ? value : (Number(value) >= 0 ? Number(value) : 0)
    }));
  };

  // 수정 팝업 내 음식 검색
  const searchFoodForEdit = async () => {
    if (!editSearchKeyword.trim()) return;
    setIsEditSearching(true);
    try {
      const response = await axios.get(`/api/diet/food-items/search`, {
        params: { keyword: editSearchKeyword }
      });
      setEditSearchResults(response.data);
    } catch (error) {
      console.error("음식 검색 중 오류:", error);
      setEditSearchResults([]);
    } finally {
      setIsEditSearching(false);
    }
  };

  // 수정 팝업에서 검색 결과 선택
  const handleSelectFoodForEdit = (food: FoodItem) => {
    setEditFormData(prev => ({
      ...prev, // quantity는 유지
      foodItemId: food.foodItemId,
      foodName: food.name,
      // 검색된 음식의 영양성분은 100g 기준
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
    }));
    setEditSearchResults([]);
    setEditSearchKeyword(food.name);
  };

  // 식단 수정 시작
  const startEditDiet = (dietLog: DietLogDTO) => {
    setEditingDietLog(dietLog);

    // API에서 받은 값(총 섭취량)을 100g 기준으로 변환
    const per100gFactor = dietLog.quantity > 0 ? 100 / dietLog.quantity : 0;

    setEditFormData({
      foodItemId: dietLog.foodItemId,
      foodName: dietLog.foodName,
      quantity: dietLog.quantity,
      calories: dietLog.calories * per100gFactor,
      carbs: dietLog.carbs * per100gFactor,
      protein: dietLog.protein * per100gFactor,
      fat: dietLog.fat * per100gFactor,
    });

    setEditSearchKeyword(dietLog.foodName);
    setEditSearchResults([]);
    setIsEditSearching(false);

    setIsEditDietDialogOpen(true);
  };

  // 식단 수정 저장
  const saveDietEdit = async () => {
    if (!editingDietLog) return;

    setIsUpdatingDiet(true);
    try {
      // 서버에는 foodItemId 유무와 100g 기준 영양성분을 보냄
      const submissionData = {
        foodItemId: editFormData.foodItemId,
        foodName: editFormData.foodName,
        quantity: editFormData.quantity,
        calories: editFormData.calories,
        carbs: editFormData.carbs,
        protein: editFormData.protein,
        fat: editFormData.fat,
      };

      const response = await axios.put(`/api/diet/record/${editingDietLog.id}`, submissionData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const updatedRecord = response.data as DietLogDTO;

      // ✅ 데이터 새로고침 대신, 반환된 데이터로 상태 직접 업데이트
      setDailyDietLogs(prevLogs =>
        prevLogs.map(log => (log.id === updatedRecord.id ? updatedRecord : log))
      );
      await fetchCalendarRecords(); // 달력 점 새로고침

      setIsEditDietDialogOpen(false);
      setEditingDietLog(null);

      toast({
        title: "식단이 수정되었습니다.",
        description: "식단 기록이 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("식단 수정 실패:", error);
      toast({
        title: "식단 수정 실패",
        description: "식단을 수정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDiet(false);
    }
  };

  // 💪 일일 운동 추가 - Spring API 사용
  const [bodyPart, setBodyPart] = useState('chest');         // 선택한 부위

  const addExerciseRecord = async () => {
    try {
      const token = getToken();
      const userInfo = getUserInfo();
      const userId = userInfo?.userId || 1;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const request = {
        userId: userId,
        exerciseName: exerciseName.trim(),
        sets: sets || 1,
        reps: reps || 10,
        weight: weight || 0.0,
        time: time || null,
        exerciseDate: formattedDate
      };
      console.log("💪 운동 추가 요청:", request);

      const res = await fetch('/api/note/exercise', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!res.ok) throw new Error("운동 기록 추가 실패");

      const data = await res.json();
      setTodayExercise(prev => [...prev, data]);

      setIsAddExerciseDialogOpen(false);
      setExerciseName('');
      setSets(1);
      setReps(10);
      setWeight(0);
      setTime('');
    } catch (err) {
      console.error(err);
      toast({
        title: "운동 추가 실패",
        description: "기록을 저장하는 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  // 일일 운동 기록 수정
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseRecordDTO | null>(null);
  const [exerciseEditForm, setExerciseEditForm] = useState({
    sets: 1,
    reps: 10,
    weight: 0,
  });


  const startEditExercise = (record: ExerciseRecordDTO) => {
    setEditingExercise(record);
    setExerciseEditForm({
      sets: record.sets || 1,
      reps: record.reps || 10,
      weight: record.weight || 0,
    });
    setIsEditExerciseDialogOpen(true);
  };


  useEffect(() => {
    const fetchExercises = async () => {
      try {
        console.log(`🏋️ [fetchExercises] 운동 카탈로그 조회 시작`);
        
        const data = await getExerciseCatalog();
        console.log('✅ [fetchExercises] 운동 카탈로그 조회 성공:', data);
        
        setExerciseOptions(data.map(item => ({
          value: item.name,
          label: item.name
        })));
      } catch (err) {
        console.error("❌ [fetchExercises] 운동 카탈로그 조회 실패:", err);
      }
    };

    fetchExercises();
  }, []);


  // 점(●) 표시용 modifiers와 classNames 추가
  function parseDateString(dateStr: string) {
    // "2024-06-21T15:30:00" -> "15:30"
    if (dateStr.includes('T')) {
      return dateStr.split('T')[1].substring(0, 5);
    }
    // "15:30:00" -> "15:30"
    if (dateStr.includes(':')) {
      const parts = dateStr.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    return dateStr;
  }

  const deleteExerciseRecord = async (sessionId: number) => {
    if (!authToken) {
      console.warn('인증 토큰이 없습니다.');
      return;
    }

    try {
      await axios.delete(`/api/note/exercise/${sessionId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // 삭제 후 목록 새로고침
      await fetchExercise();
    } catch (err) {
      console.error("운동 기록 삭제 실패:", err);
    }
  };

  const saveExerciseEdit = async () => {
    if (!editingExercise || !authToken) return;

    try {
      await axios.put(`/api/note/exercise/${editingExercise.exerciseSessionId}`, {
        sets: exerciseEditForm.sets,
        reps: exerciseEditForm.reps,
        weight: exerciseEditForm.weight,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setIsEditExerciseDialogOpen(false);
      setEditingExercise(null);
      await fetchExercise();
    } catch (err) {
      console.error("운동 기록 수정 실패:", err);
    }
  };


  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center flex-1 mx-4">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-center space-x-2 hover:bg-accent/50 w-full">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(selectedDate)}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      onMonthChange={setCalendarMonth}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      dayContent={customDayContent}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex items-center justify-center space-x-4 text-sm mt-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>운동</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>식단</span>
                  </div>
                  <Badge variant="outline" className="text-xs">+{todayScore}점</Badge>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="exercise" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercise" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span>운동</span>
            </TabsTrigger>
            <TabsTrigger value="diet" className="flex items-center space-x-2">
              <Apple className="h-4 w-4" />
              <span>식단</span>
            </TabsTrigger>
          </TabsList>

          {/* Exercise Tab - 기존 코드 유지 */}
          <TabsContent value="exercise" className="space-y-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>운동 부위별 목표</CardTitle>
                <p className="text-sm text-muted-foreground">붉은 선은 목표치를 나타냅니다</p>
              </CardHeader>
              <CardContent>
                {isLoadingSummary ? (
                  <div className="text-center py-8 text-muted-foreground">
                    운동 집계 데이터를 불러오는 중...
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={exerciseData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" className="text-sm" />
                        <Radar name="현재 운동량" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name="목표치" dataKey="goal" stroke="#EF4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>오늘의 운동 기록</CardTitle>
                {isToday(selectedDate) && todayExercise.length > 0 && (
                  <Button onClick={handleClaimExerciseScore} disabled={hasClaimedExerciseScore} className="gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {hasClaimedExerciseScore ? '점수 획득 완료' : '+1점 획득'}
                  </Button>
                )}
                <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-bg hover:opacity-90 transition-opacity" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      운동 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>운동 기록 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* ✅ 운동 부위 선택 */}
                      <div>
                        <Label>운동 부위 선택</Label>
                        <select
                          value={bodyPart}
                          onChange={(e) => setBodyPart(e.target.value as 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'abs' | 'cardio' | 'full_body')}
                          className="w-full border p-2 rounded"
                          title="운동 부위 선택"
                        >
                          <option value="chest">가슴</option>
                          <option value="back">등</option>
                          <option value="legs">하체</option>
                          <option value="shoulders">어깨</option>
                          <option value="arms">팔</option>
                          <option value="abs">복부</option>
                          <option value="cardio">유산소</option>
                          <option value="full_body">전신</option>
                        </select>
                      </div>

                      {/* ✅ 운동 이름 선택 */}
                      <div>
                        <Label>운동 선택</Label>
                        <select
                          value={exerciseName}
                          onChange={(e) => setExerciseName(e.target.value)}
                          className="w-full border p-2 rounded"
                          disabled={exerciseOptions.length === 0}
                          title="운동 선택"
                        >
                          <option value="">
                            {exerciseOptions.length === 0 ? '운동 부위를 먼저 선택하세요' : '운동을 선택하세요'}
                          </option>
                          {exerciseOptions.map((exercise) => (
                            <option key={exercise.value} value={exercise.value}>
                              {exercise.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>세트</Label>
                          <Input type="number" value={sets} onChange={(e) => setSets(Number(e.target.value))} min={1} />
                        </div>
                        <div>
                          <Label>횟수</Label>
                          <Input type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} min={1} />
                        </div>
                      </div>
                      <div>
                        <Label>무게 (kg)</Label>
                        <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} min={0} />
                      </div>
                      <div>
                        <Label>운동 시간</Label>
                        <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="예: 20분" />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsAddExerciseDialogOpen(false)}>취소</Button>
                        <Button onClick={addExerciseRecord}>추가</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {todayExercise.length > 0 ? (
                  <div className="space-y-3">
                    {todayExercise.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{record.exerciseName}</p>
                          <p className="text-sm text-gray-600">
                            {record.sets && record.reps && record.weight ? (
                              `${record.sets}세트 × ${record.reps}회 (${record.weight}kg)`
                            ) : (
                              `${record.durationMinutes || 0}분`
                            )}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteExerciseRecord(record.exerciseSessionId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {isToday(selectedDate) && !hasClaimedExerciseScore && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 text-center">🎉 오늘 기록이 등록되었습니다! 점수를 획득하세요!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">아직 운동 기록이 없습니다.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ 등록된 운동 수정정 */}
          <Dialog open={isEditExerciseDialogOpen} onOpenChange={setIsEditExerciseDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>운동 수정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>세트</Label>
                    <Input
                      type="number"
                      value={exerciseEditForm.sets}
                      onChange={e => setExerciseEditForm(prev => ({ ...prev, sets: +e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>횟수</Label>
                    <Input
                      type="number"
                      value={exerciseEditForm.reps}
                      onChange={e => setExerciseEditForm(prev => ({ ...prev, reps: +e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>무게 (kg)</Label>
                  <Input
                    type="number"
                    value={exerciseEditForm.weight}
                    onChange={e => setExerciseEditForm(prev => ({ ...prev, weight: +e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditExerciseDialogOpen(false)}>취소</Button>
                  <Button onClick={saveExerciseEdit}>저장</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>



          {/* Diet Tab - 수정된 부분 */}
          <TabsContent value="diet" className="space-y-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>얼마나 먹었을까?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  오늘의 영양소 및 칼로리 섭취량
                </p>
              </CardHeader>
              <CardContent>
                {isLoadingDietData ? (
                  <div className="text-center py-8 text-muted-foreground">
                    식단 데이터를 불러오는 중...
                  </div>
                ) : dietError ? (
                  <div className="text-center py-8 text-destructive">
                    {dietError}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uiNutritionData.map((nutrient) => (
                      <div key={nutrient.name} className="text-center">
                        <h3 className="font-medium text-sm mb-2">{nutrient.name}</h3>
                        <div className="relative w-20 h-20 mx-auto mb-3">
                          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 42 42">
                            <circle
                              cx="21"
                              cy="21"
                              r="18"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="4"
                            />
                            <circle
                              cx="21"
                              cy="21"
                              r="18"
                              fill="none"
                              stroke={nutrient.color}
                              strokeWidth="4"
                              strokeDasharray={`${(nutrient.value / nutrient.goal) * 113.1}, 113.1`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold">
                              {nutrient.name === '칼로리' ? `${Math.round(nutrient.calories)}kcal` : `${Math.round(nutrient.calories)}g`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(nutrient.value)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>목표: {nutrient.name === '칼로리' ? `${Math.round(nutrient.targetCalories)}kcal` : `${Math.round(nutrient.targetCalories)}g`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Diet Records with Score Button */}
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>오늘의 식단 기록</CardTitle>
                <div className="flex space-x-2">
                  <Dialog open={isAddDietDialogOpen} onOpenChange={setIsAddDietDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-bg hover:opacity-90 transition-opacity" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        식단 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>식단 기록 추가</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="search">음식 검색</Label>
                          <div className="flex space-x-2 mt-1">
                            <Input
                              id="search"
                              value={searchKeyword}
                              onChange={(e) => setSearchKeyword(e.target.value)}
                              placeholder="음식명을 입력하세요"
                              onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                            />
                            <Button onClick={searchFood} disabled={isSearching}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.3-4.3" />
                              </svg>
                            </Button>
                          </div>
                        </div>

                        {searchResults.length > 0 && (
                          <div>
                            <Label>검색 결과</Label>
                            <div className="max-h-40 overflow-y-auto space-y-2 mt-1">
                              {searchResults.map((food) => (
                                <div
                                  key={food.foodItemId}
                                  className={`p-2 border rounded cursor-pointer hover:bg-accent ${selectedFood?.foodItemId === food.foodItemId ? 'bg-accent' : ''
                                    }`}
                                  onClick={() => setSelectedFood(food)}
                                >
                                  <div className="font-medium">{food.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {Math.round(food.calories)}kcal / 100g
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedFood && (
                          <div>
                            <Label htmlFor="quantity">섭취량 (g)</Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              min="1"
                              className="mt-1"
                            />
                            <div className="text-sm text-muted-foreground mt-1">
                              예상 칼로리: {Math.round((selectedFood.calories * parseFloat(quantity)) / 100)}kcal
                            </div>
                            <div className="mt-3">
                              <Label htmlFor="mealTime">식사 시간</Label>
                              <select
                                id="mealTime"
                                title="식사 시간 선택"
                                value={mealTime}
                                onChange={e => setMealTime(e.target.value)}
                                className="mt-1 block w-full border rounded px-2 py-1"
                              >
                                <option value="breakfast">아침</option>
                                <option value="lunch">점심</option>
                                <option value="dinner">저녁</option>
                                <option value="snack">간식</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsAddDietDialogOpen(false)}>
                            취소
                          </Button>
                          <Button onClick={addDietRecord} disabled={!selectedFood}>
                            추가
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {isToday(selectedDate) && dailyDietLogs.length > 0 && (
                    <Button
                      onClick={handleClaimDietScore}
                      disabled={hasClaimedDietScore}
                      className="gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {hasClaimedDietScore ? '점수 획득 완료' : '+1점 획득'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDietData ? (
                  <div className="text-center py-8 text-muted-foreground">
                    식단 기록을 불러오는 중...
                  </div>
                ) : dietError ? (
                  <div className="text-center py-8 text-destructive">
                    {dietError}
                  </div>
                ) : dailyDietLogs.length > 0 ? (
                  <div className="space-y-6">
                    {mealOrder.map((meal) => {
                      const logs = groupedDietLogs[meal];
                      if (!logs || logs.length === 0) return null;

                      return (
                        <div key={meal}>
                          <h3 className="font-semibold text-lg mb-3 pb-2 border-b">{mealTimeMap[meal]}</h3>
                          <div className="space-y-3">
                            {logs.map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium">{record.foodName}</h4>
                                    <Badge variant="secondary" className="text-xs">{mealTimeMap[record.mealTime || 'snack']}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {record.quantity}{record.unit} • {Math.round(record.calories)}kcal
                                    {typeof record.carbs === 'number' && ` • 탄수화물: ${record.carbs.toFixed(1)}g`}
                                    {typeof record.protein === 'number' && ` • 단백질: ${record.protein.toFixed(1)}g`}
                                    {typeof record.fat === 'number' && ` • 지방: ${record.fat.toFixed(1)}g`}
                                  </p>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => startEditDiet(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteDietRecord(record.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {isToday(selectedDate) && !hasClaimedDietScore && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 text-center">
                          🎉 오늘 기록이 등록되었습니다! 점수를 획득하세요!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 식단 기록이 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 식단 수정 다이얼로그 */}
        <Dialog open={isEditDietDialogOpen} onOpenChange={setIsEditDietDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>식단 수정</DialogTitle>
            </DialogHeader>
            {editingDietLog && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editSearch">음식 검색</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="editSearch"
                      value={editSearchKeyword}
                      onChange={(e) => setEditSearchKeyword(e.target.value)}
                      placeholder="음식명 검색으로 변경"
                      onKeyPress={(e) => e.key === 'Enter' && searchFoodForEdit()}
                    />
                    <Button onClick={searchFoodForEdit} disabled={isEditSearching}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </Button>
                  </div>
                </div>

                {editSearchResults.length > 0 && (
                  <div>
                    <Label>검색 결과</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2 mt-1 border rounded-md p-2">
                      {editSearchResults.map((food) => (
                        <div
                          key={food.foodItemId}
                          className="p-2 border rounded cursor-pointer hover:bg-accent"
                          onClick={() => handleSelectFoodForEdit(food)}
                        >
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.round(food.calories)}kcal / 100g
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label htmlFor="foodName" className="text-muted-foreground">음식명 (직접 수정 시 커스텀 음식으로 저장)</Label>
                    <Input
                      id="foodName"
                      name="foodName"
                      value={editFormData.foodName}
                      onChange={handleEditFormChange}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">섭취량 (g)</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={editFormData.quantity}
                        onChange={handleEditFormChange}
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="calories" className="text-muted-foreground">100g당 칼로리</Label>
                      <Input
                        id="calories"
                        name="calories"
                        type="number"
                        value={editFormData.calories}
                        onChange={handleEditFormChange}
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="carbs" className="text-muted-foreground">100g당 탄수화물</Label>
                      <Input
                        id="carbs"
                        name="carbs"
                        type="number"
                        value={editFormData.carbs}
                        onChange={handleEditFormChange}
                        step="0.1"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="protein" className="text-muted-foreground">100g당 단백질</Label>
                      <Input
                        id="protein"
                        name="protein"
                        type="number"
                        value={editFormData.protein}
                        onChange={handleEditFormChange}
                        step="0.1"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fat" className="text-muted-foreground">100g당 지방</Label>
                      <Input
                        id="fat"
                        name="fat"
                        type="number"
                        value={editFormData.fat}
                        onChange={handleEditFormChange}
                        step="0.1"
                        min="0"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mt-2 p-2 bg-slate-50 rounded-md">
                    <h4 className="font-medium mb-1">총 섭취량</h4>
                    - 칼로리: {((editFormData.calories * editFormData.quantity) / 100).toFixed(0)} kcal<br />
                    - 탄수화물: {((editFormData.carbs * editFormData.quantity) / 100).toFixed(1)} g<br />
                    - 단백질: {((editFormData.protein * editFormData.quantity) / 100).toFixed(1)} g<br />
                    - 지방: {((editFormData.fat * editFormData.quantity) / 100).toFixed(1)} g
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDietDialogOpen(false)}
                    disabled={isUpdatingDiet}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={saveDietEdit}
                    disabled={isUpdatingDiet}
                  >
                    {isUpdatingDiet ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Note;