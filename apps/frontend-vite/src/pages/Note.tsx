import React, { useState, useEffect } from 'react';
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
import { Calendar as CalendarIcon, Dumbbell, Apple, Edit, Trash2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from '@/utils/axios';
import { getUserInfo, isLoggedIn, getToken, getUserIdFromToken, isTokenValid } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
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
  const [quantity, setQuantity] = useState(100);
  const [isSearching, setIsSearching] = useState(false);
  const [mealTime, setMealTime] = useState('breakfast');
  const [weeklySummary, setWeeklySummary] = useState<{ [part: string]: number }>({});
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const navigate = useNavigate();

  // Mock data for records on specific dates (유지)
  const [todayExercise, setTodayExercise] = useState([]);

  // ✅ 토큰을 맨 처음에 한 번만 가져와서 저장
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1. 기록 날짜 상태 추가
  const [dietRecordedDates, setDietRecordedDates] = useState<string[]>([]);
  const [exerciseRecordedDates, setExerciseRecordedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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

  // Exercise goals from profile (mock data) (유지)
  const exerciseGoals = {
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

        const res = await axios.get('/api/weekly-workouts/summary', {
          params: { userId, weekStart },
          headers: {
            'Authorization': `Bearer ${authToken}` // ✅ 저장된 토큰 사용
          }
        });

        setWeeklySummary(res.data);
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

  // 식단 데이터 페칭 - 저장된 토큰 사용
  useEffect(() => {
    const fetchDietData = async () => {
      if (!authToken) return; // 토큰이 없으면 실행하지 않음
      
      setIsLoadingDietData(true);
      setDietError(null);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      try {
        const userId = getUserIdFromToken() || 1;

        // 1. 실제 식단 기록 가져오기
        const dietLogsResponse = await axios.get(`/api/diet/daily-records/${formattedDate}`, {
          params: { userId }
        });

        // 2. 실제 영양소 목표 가져오기
        const nutritionGoalsResponse = await axios.get(`/api/diet/nutrition-goals/${formattedDate}`, {
          params: { userId }
        });

        setDailyDietLogs(dietLogsResponse.data);
        setDailyNutritionGoals(nutritionGoalsResponse.data);

      } catch (error) {
        console.error("식단 데이터를 가져오는 중 오류 발생:", error);
        setDietError("식단 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingDietData(false);
      }
    };

    fetchDietData();
  }, [selectedDate, authToken]); // authToken이 변경될 때마다 실행

  // 음식 검색
  const searchFood = async () => {
    if (!searchKeyword.trim()) return;

    setIsSearching(true);
    try {
      const response = await axios.get(`/api/meals/foods/search`, {
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

  // 식단 기록 추가
  const addDietRecord = async () => {
    if (!selectedFood) return;

    try {
      const userId = getUserIdFromToken() || 1;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const request = {
        userId: userId,
        foodItemId: selectedFood.foodItemId,
        foodName: selectedFood.name,
        quantity: quantity,
        calories: (selectedFood.calories * quantity) / 100,
        carbs: (selectedFood.carbs * quantity) / 100,
        protein: (selectedFood.protein * quantity) / 100,
        fat: (selectedFood.fat * quantity) / 100,
        logDate: formattedDate,
        unit: "g",
        meal_time: mealTime,
        input_source: null, // 기본값, 추후 VOICE/TYPING 등으로 확장 가능
        confidence_score: null,
        original_audio_path: null,
        validation_status: null,
        validation_notes: null,
        created_at: null
      };

      await axios.post('/api/diet/record', request);

      // 데이터 새로고침
      const dietLogsResponse = await axios.get(`/api/diet/daily-records/${formattedDate}`, {
        params: { userId }
      });
      setDailyDietLogs(dietLogsResponse.data);

      // 다이얼로그 닫기 및 상태 초기화
      setIsAddDietDialogOpen(false);
      setSelectedFood(null);
      setQuantity(100);
      setSearchKeyword('');
      setSearchResults([]);
      setMealTime('breakfast');

    } catch (error) {
      console.error("식단 기록 추가 중 오류:", error);
    }
  };

  // 식단 기록 삭제
  const deleteDietRecord = async (id: number) => {
    try {
      await axios.delete(`/api/diet/record/${id}`);

      // 데이터 새로고침
      const userId = getUserIdFromToken() || 1;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const dietLogsResponse = await axios.get(`/api/diet/daily-records/${formattedDate}`, {
        params: { userId }
      });
      setDailyDietLogs(dietLogsResponse.data);

    } catch (error) {
      console.error("식단 기록 삭제 중 오류:", error);
    }
  };

  // 백엔드 데이터 -> UI 형식으로 변환 (todayRecords.diet)
  const uiTodayDietRecords = dailyDietLogs.map(log => ({
    meal: '기록',
    food: log.foodName,
    amount: `${log.quantity}${log.unit}`,
    calories: log.calories,
    time: '',
  }));

  const todayRecords = {
    exercise: todayExercise,
    diet: uiTodayDietRecords
  };

  // Calculate total nutrition intake based on actual consumed quantity
  const BASE_AMOUNT = 100; // DB 기준량(예: 100g)

  const totalCarbs = dailyDietLogs.reduce(
    (sum, log) => sum + (log.carbs * log.quantity / BASE_AMOUNT), 0
  );
  const totalProtein = dailyDietLogs.reduce(
    (sum, log) => sum + (log.protein * log.quantity / BASE_AMOUNT), 0
  );
  const totalFat = dailyDietLogs.reduce(
    (sum, log) => sum + (log.fat * log.quantity / BASE_AMOUNT), 0
  );
  const totalCalories = dailyDietLogs.reduce(
    (sum, log) => sum + (log.calories * log.quantity / BASE_AMOUNT), 0
  );

  // Get nutrition goals from DB (dailyNutritionGoals)
  const getGoal = (name: string) => {
    const found = dailyNutritionGoals.find(dto => dto.name === name);
    return found ? found.target : 1; // fallback to 1 to avoid division by zero
  };

  const uiNutritionData = [
    {
      name: '탄수화물',
      value: (totalCarbs / getGoal('탄수화물')) * 100,
      goal: 100,
      color: '#3B4A9C',
      calories: totalCarbs,
      targetCalories: getGoal('탄수화물'),
    },
    {
      name: '단백질',
      value: (totalProtein / getGoal('단백질')) * 100,
      goal: 100,
      color: '#E67E22',
      calories: totalProtein,
      targetCalories: getGoal('단백질'),
    },
    {
      name: '지방',
      value: (totalFat / getGoal('지방')) * 100,
      goal: 100,
      color: '#95A5A6',
      calories: totalFat,
      targetCalories: getGoal('지방'),
    },
    {
      name: '칼로리',
      value: (totalCalories / getGoal('칼로리')) * 100,
      goal: 100,
      color: '#8B5CF6',
      calories: totalCalories,
      targetCalories: getGoal('칼로리'),
    },
  ];

  useEffect(() => {
    const fetchExercise = async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      try {
        // 인증 토큰 가져오기
        const token = getToken();
        if (!token || !isTokenValid()) {
          console.warn('인증 토큰이 없거나 만료되었습니다.');
          setTodayExercise([]);
          return;
        }

        const res = await fetch(`/api/note/exercise/daily?date=${dateStr}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          if (res.status === 403) {
            console.warn('인증이 필요합니다.');
          }
          throw new Error("운동 기록 불러오기 실패");
        }

        const data = await res.json();
        setTodayExercise(data);
      } catch (err) {
        console.error(err);
        setTodayExercise([]);
      }
    };

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
    newDate.setDate(newDate.getDate() + days);
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
            background: 'linear-gradient(90deg, #22c55e 50%, #3b82f6 50%)', // green + blue
            boxShadow: '0 0 0 2px #a78bfa', // 보라색 외곽
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
  const [editQuantity, setEditQuantity] = useState(100);
  const [isUpdatingDiet, setIsUpdatingDiet] = useState(false);

  // 식단 수정 시작
  const startEditDiet = (dietLog: DietLogDTO) => {
    setEditingDietLog(dietLog);
    setEditQuantity(dietLog.quantity);
    setIsEditDietDialogOpen(true);
  };

  // 식단 수정 저장
  const saveDietEdit = async () => {
    if (!editingDietLog) return;

    setIsUpdatingDiet(true);
    try {
      const updateData = {
        ...editingDietLog,
        quantity: editQuantity,
        meal_time: editingDietLog.mealTime || mealTime,
        input_source: editingDietLog.inputSource || null,
        confidence_score: editingDietLog.confidenceScore || null,
        original_audio_path: editingDietLog.originalAudioPath || null,
        validation_status: editingDietLog.validationStatus || null,
        validation_notes: editingDietLog.validationNotes || null,
        created_at: editingDietLog.createdAt || null
      };

      const response = await axios.put(`/api/diet/record/${editingDietLog.id}`, updateData);

      // 로컬 상태 업데이트
      setDailyDietLogs(prev => 
        prev.map(log => 
          log.id === editingDietLog.id 
            ? response.data
            : log
        )
      );

      setIsEditDietDialogOpen(false);
      setEditingDietLog(null);
      setEditQuantity(100);
      
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

  // 점(●) 표시용 modifiers와 classNames 추가
  function parseDateString(dateStr: string) {
    // 'yyyy-MM-dd' -> Date 객체
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const dietDates = dietRecordedDates.map(parseDateString);
  const exerciseDates = exerciseRecordedDates.map(parseDateString);
  const bothDates = dietDates.filter(date => exerciseDates.some(ed => ed.getTime() === date.getTime()));
  const dietOnlyDates = dietDates.filter(date => !exerciseDates.some(ed => ed.getTime() === date.getTime()));
  const exerciseOnlyDates = exerciseDates.filter(date => !dietDates.some(dd => dd.getTime() === date.getTime()));
  const modifiers = {
    both: bothDates,
    diet: dietOnlyDates,
    exercise: exerciseOnlyDates,
  };
  const modifiersClassNames = {
    both: 'calendar-dot-both',
    diet: 'calendar-dot-diet',
    exercise: 'calendar-dot-exercise',
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
                  <PopoverContent className="w-auto p-0" align="center" side="bottom">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      onMonthChange={setCalendarMonth}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
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
              </CardHeader>
              <CardContent>
                {todayExercise.length > 0 ? (
                  <div className="space-y-3">
                    {todayExercise.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{record.name}</h4>
                            <Badge variant="outline" className="text-xs">운동</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {record.weight} × {record.sets}세트 × {record.reps}회 • {record.time}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                  {isToday(selectedDate) && (
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
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                min="1"
                                className="mt-1"
                              />
                              <div className="text-sm text-muted-foreground mt-1">
                                예상 칼로리: {Math.round((selectedFood.calories * quantity) / 100)}kcal
                              </div>
                              <div className="mt-3">
                                <Label htmlFor="mealTime">식사 시간</Label>
                                <select
                                  id="mealTime"
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
                  )}
                  {isToday(selectedDate) && todayRecords.diet.length > 0 && (
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
                ) : todayRecords.diet.length > 0 ? (
                  <div className="space-y-3">
                    {todayRecords.diet.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{record.food}</h4>
                            <Badge variant="secondary" className="text-xs">{record.meal}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {record.amount} • {Math.round(record.calories)}kcal {record.time && `• ${record.time}`}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEditDiet(dailyDietLogs[index])}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteDietRecord(dailyDietLogs[index].id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>식단 수정</DialogTitle>
            </DialogHeader>
            {editingDietLog && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="foodName">음식명</Label>
                  <Input
                    id="foodName"
                    value={editingDietLog.foodName}
                    disabled
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">수량 (g)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(Number(e.target.value))}
                    min="1"
                    step="1"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">칼로리:</span>
                    <span className="ml-2 font-medium">
                      {((editingDietLog.calories / editingDietLog.quantity) * editQuantity).toFixed(0)}kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">탄수화물:</span>
                    <span className="ml-2 font-medium">
                      {((editingDietLog.carbs / editingDietLog.quantity) * editQuantity).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">단백질:</span>
                    <span className="ml-2 font-medium">
                      {((editingDietLog.protein / editingDietLog.quantity) * editQuantity).toFixed(1)}g
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">지방:</span>
                    <span className="ml-2 font-medium">
                      {((editingDietLog.fat / editingDietLog.quantity) * editQuantity).toFixed(1)}g
                    </span>
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