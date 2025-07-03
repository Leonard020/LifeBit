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
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import axios from 'axios';
import axiosInstance from '@/utils/axios';
import { getUserInfo, getToken, getUserIdFromToken, isTokenValid, removeToken, debugToken } from '@/utils/auth';
import { getExerciseCatalog, type ExerciseCatalog, getDailyDietRecords, type DietRecord, getDailyExerciseRecords, getWeeklyExerciseRecords, type ExerciseRecordDTO, createDietRecord, searchFoodItems, deleteDietRecord, updateDietRecord, createExerciseSession, updateExerciseSession, deleteExerciseSession } from '@/api/authApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useUserGoals } from '@/api/auth';
import type { TooltipProps } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateExerciseSession } from '@/api/authApi';

// 영양소 데이터 타입 정의
interface NutritionData {
  name: string;
  value: number;
  goal: number;
  color: string;
  calories: number;
  targetCalories: number;
}

// Note.tsx에서만 사용하는 UI용 타입 정의
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

interface NoteExerciseDTO {
  workoutDate: string;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  exerciseNames: string[];
}

const Note = () => {
  // 1. 다크모드 감지 state를 최상단에 위치
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // 식단 관련 상태
  const [dailyDietLogs, setDailyDietLogs] = useState<DietRecord[]>([]);
  const [isLoadingDietData, setIsLoadingDietData] = useState(true);
  const [dietError, setDietError] = useState<string | null>(null);

  // 식단 추가 관련 상태
  const [mealTime, setMealTime] = useState('breakfast');
  const [weeklySummary, setWeeklySummary] = useState<NoteExerciseDTO[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Mock data for records on specific dates (유지)
  const [todayExercise, setTodayExercise] = useState<ExerciseRecordDTO[]>([]);
  
  // 주간 운동 데이터 (레이더 차트용)
  const [weeklyExerciseData, setWeeklyExerciseData] = useState<ExerciseRecordDTO[]>([]);

  // ✅ 토큰을 맨 처음에 한 번만 가져와서 저장
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 운동 카탈로그 상태 - 동적 매핑용
  const [exerciseCatalog, setExerciseCatalog] = useState<ExerciseCatalog[]>([]);
  const [exerciseNameToBodyPartMap, setExerciseNameToBodyPartMap] = useState<Record<string, string>>({});

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
      const dietPromise = axiosInstance.get(`/api/diet/calendar-records/${year}/${month}`, {
        params: { userId }
      });

      const exercisePromise = axiosInstance.get(`/api/exercise-sessions/${userId}`, {
        params: { period: 'month' } // 현재 월의 운동 기록을 가져온다고 가정
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
    midnight: '야식',
  };
  const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'midnight'];

  const groupedDietLogs = dailyDietLogs.reduce((acc, log) => {
    const meal = log.mealTime || 'snack';
    if (!acc[meal]) {
      acc[meal] = [];
    }
    acc[meal].push(log);
    return acc;
  }, {} as Record<string, DietRecord[]>);

  // ✅ 인증 토큰을 맨 처음에 가져오기
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setAuthToken(token);
  }, [navigate]);

  // ✅ 운동 카탈로그 불러와서 매핑 Map 생성
  useEffect(() => {
    const fetchExerciseCatalog = async () => {
      try {
        const catalog = await getExerciseCatalog();
        setExerciseCatalog(catalog);
        
        // 운동 이름 → 부위 매핑 Map 생성
        const nameToBodyPartMap: Record<string, string> = {};
        catalog.forEach(exercise => {
          const bodyPart = exercise.target_body_part || 'cardio';
          const part = getBodyPartLabel(bodyPart);
          if (part && part !== '기타') {
            nameToBodyPartMap[exercise.name.toLowerCase()] = part;
          }
        });
        setExerciseNameToBodyPartMap(nameToBodyPartMap);
        console.log('🗺️ [Note] 운동 이름-부위 매핑 Map 생성:', nameToBodyPartMap);
      } catch (error) {
        console.error('❌ [Note] 운동 카탈로그 불러오기 실패:', error);
      }
    };
    
    if (authToken) {
      fetchExerciseCatalog();
    }
  }, [authToken]);

  // 2. 달력 월이 바뀔 때마다 기록 날짜 fetch
  useEffect(() => {
    const userId = getUserIdFromToken() || 1;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;
    const token = getToken();
    if (!token) return;

    // 식단 기록 날짜
    axiosInstance.get(`/api/diet/calendar-records/${year}/${month}`, {
      params: { userId }
    }).then(res => {
      setDietRecordedDates(Object.keys(res.data));
    });

    // 운동 기록 날짜
    axiosInstance.get(`/api/exercise-sessions/${userId}`, {
      params: { period: 'month' }
    }).then(res => {
      setExerciseRecordedDates(res.data.map(item => item.exercise_date));
    });
  }, [calendarMonth]);

  // 날짜별 기록 타입 정의 (원격 저장소 기능과 함께 유지)
  interface DateRecord {
    exercise: boolean;
    diet: boolean;
  }

  const userId = getUserIdFromToken();
  const { data: userGoalsData, isLoading: goalsLoading } = useUserGoals(userId ? userId.toString() : '');
  const queryClient = useQueryClient();

  // Force refetch of user goals when Note page mounts or userId changes
  React.useEffect(() => {
    if (userId) {
      queryClient.refetchQueries({ queryKey: ['userGoals', userId.toString()] });
    }
  }, [userId, queryClient]);

  // 운동부위 한글화
  const getBodyPartLabel = (key: string) => {
    const map: Record<string, string> = {
      chest: '가슴',
      back: '등',
      legs: '하체',
      shoulders: '어깨',
      arms: '팔',
      abs: '복근',
      cardio: '유산소',
      // 추가 매핑
      '가슴': '가슴',
      '등': '등',
      '하체': '하체',
      '어깨': '어깨',
      '팔': '팔',
      '복근': '복근',
      '유산소': '유산소',
    };
    return map[key] || '기타';
  };

  // 3. Map backend fields to radar chart axes
  const bodyPartMap = [
    { key: 'weekly_chest', label: '가슴' },
    { key: 'weekly_back', label: '등' },
    { key: 'weekly_legs', label: '하체' },
    { key: 'weekly_shoulders', label: '어깨' },
    { key: 'weekly_abs', label: '복근' },
    { key: 'weekly_arms', label: '팔' },
    { key: 'weekly_cardio', label: '유산소' },
  ];

  // Always show all 7 body parts in the graph, with 0 for unselected
  const exerciseGoals = React.useMemo(() => {
    if (!userGoalsData) return {};

    // 데이터 구조 정규화 - 배열이면 최신 데이터 선택, 객체면 그대로 사용
    const goals = Array.isArray(userGoalsData)
      ? userGoalsData.reduce((prev, curr) => (curr.user_goal_id > prev.user_goal_id ? curr : prev), userGoalsData[0])
      : userGoalsData; // ✅ .data 없이 바로 userGoalsData만 사용!

    console.log('🎯 [Note] 사용자 목표 데이터:', goals);

    // Always include all body parts, use 0 if not set
    return bodyPartMap.reduce((acc, { key, label }) => {
      acc[label] = goals[key] ?? 0;
      return acc;
    }, {} as Record<string, number>);
  }, [userGoalsData]);

  const MAX_EDGE_VALUE = 7;
  // 1. weekStart(일요일) 계산 확실히
  const day = selectedDate.getDay(); // 0(일) ~ 6(토)
  const weekStartDate = new Date(selectedDate);
  weekStartDate.setDate(selectedDate.getDate() - day); // 일요일로 맞춤
  weekStartDate.setHours(0,0,0,0);

  function getDateRangeArray(start, end) {
    const arr = [];
    const dt = new Date(start);
    while (dt <= end) {
      arr.push(dt.toISOString().split('T')[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }
  // 주간 범위: 일요일(weekStartDate) ~ 토요일(weekEndDate)
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const weekStartStr = weekStartDate.toISOString().split("T")[0];
  const weekEndStr = weekEndDate.toISOString().split("T")[0];

  const dateArr = getDateRangeArray(weekStartDate, weekEndDate);

  // weeklyExerciseData를 날짜별로 그룹화 (bodyPart가 cardio/유산소면 유산소로)
  const weeklyExerciseByDate = weeklyExerciseData.reduce((acc, rec) => {
    const date = rec.exerciseDate ? rec.exerciseDate.slice(0, 10) : null;
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(rec);
    return acc;
  }, {} as Record<string, ExerciseRecordDTO[]>);

  // 누락된 날짜의 운동 기록을 NoteExerciseDTO 형태로 변환 (유산소 보정 포함)
  const extraRecords = dateArr
    .filter(date => !weeklySummary.some(item => item.workoutDate.slice(0, 10) === date) && weeklyExerciseByDate[date])
    .map(date => {
      const records = weeklyExerciseByDate[date];
      return {
        workoutDate: date,
        totalSets: records.reduce((sum, r) => sum + (r.sets || 0), 0),
        totalReps: records.reduce((sum, r) => sum + (r.reps || 0), 0),
        totalWeight: records.reduce((sum, r) => sum + (r.weight || 0), 0),
        exerciseNames: records.map(r => {
          if (r.bodyPart === 'cardio' || r.bodyPart === '유산소') return '유산소';
          return r.exerciseName;
        }),
      };
    });

  // weeklySummary + 누락 보정 extraRecords 합치기 (exerciseNames 1개 이상만)
  const mergedSummary = [
    ...weeklySummary,
    ...extraRecords
  ].filter(item => Array.isArray(item.exerciseNames) && item.exerciseNames.length > 0);

  // Radar Chart 집계는 mergedSummary 기준으로 진행
  const filteredSummary = mergedSummary.filter(item => {
    const dateStr = item.workoutDate.slice(0, 10);
    return dateStr >= weekStartStr && dateStr <= weekEndStr;
  });

  // ✅ 주간 운동 부위별 횟수(세션 단위) 계산 – 같은 날 여러 번 해도 모두 카운트
  const weeklyBodyPartCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    // 1. weeklyExerciseData 사용 (이미 주간 범위 데이터)
    weeklyExerciseData.forEach((record) => {
      if (record.bodyPart) {
        const part = getBodyPartLabel(record.bodyPart);
        if (part && part !== '기타') {
          counts[part] = (counts[part] || 0) + 1;
        }
      }
    });
    
    // 2. weeklySummary에서도 bodyPart 정보가 있다면 사용 (현재는 exerciseNames만 있음)
    filteredSummary.forEach((item) => {
      if (!Array.isArray(item.exerciseNames) || item.exerciseNames.length === 0) return;
      item.exerciseNames.forEach((name: string) => {
        // 유산소 운동만 특별 처리 (운동명으로 판단)
        const lower = name.toLowerCase();
        const isCardio = ['수영', '사이클링', '조깅', '러닝', 'cardio', '유산소', '걷기', '런닝'].some(cardio => lower.includes(cardio));
        if (isCardio) {
          counts['유산소'] = (counts['유산소'] || 0) + 1;
        }
      });
    });
    
    return counts;
  }, [weeklyExerciseData, filteredSummary, weekStartStr, weekEndStr]);

  // ✅ 주간 Strength-Days / Cardio-Days 계산 (하루에 1회만 인정)
  const { weeklyStrengthDays, weeklyCardioDays } = React.useMemo(() => {
    // 날짜별로 strength, cardio 여부 저장
    const dayMap: Record<string, { strength: boolean; cardio: boolean }> = {};

    // weeklyExerciseData 사용 (이미 주간 범위 데이터)
    weeklyExerciseData.forEach((record) => {
      if (record.exerciseDate) {
        const date = record.exerciseDate.slice(0, 10);
        if (!dayMap[date]) {
          dayMap[date] = { strength: false, cardio: false };
        }
        
        if (record.bodyPart === 'cardio' || record.bodyPart === '유산소') {
          dayMap[date].cardio = true;
        } else {
          dayMap[date].strength = true;
        }
      }
    });

    // weeklySummary에서도 체크
    filteredSummary.forEach((item) => {
      if (!Array.isArray(item.exerciseNames) || item.exerciseNames.length === 0) return;
      const date = item.workoutDate;
      if (!dayMap[date]) {
        dayMap[date] = { strength: false, cardio: false };
      }

      item.exerciseNames.forEach((name: string) => {
        const lower = name.toLowerCase();
        const isCardio = ['수영', '사이클링', '조깅', '러닝', 'cardio', '유산소', '걷기', '런닝'].some(c => lower.includes(c));
        if (isCardio) {
          dayMap[date].cardio = true;
        } else {
          dayMap[date].strength = true;
        }
      });
    });

    // 주간 Strength/Cardio 일수 합산
    let strengthDays = 0;
    let cardioDays = 0;
    Object.values(dayMap).forEach(({ strength, cardio }) => {
      if (strength) strengthDays += 1;
      if (cardio) cardioDays += 1;
    });

    return { weeklyStrengthDays: strengthDays, weeklyCardioDays: cardioDays };
  }, [weeklyExerciseData, filteredSummary, weekStartStr, weekEndStr]);

  // ✅ 부위별 일일 1회 기준 주간 집계 (Radar 차트용) - 중복 제거
  const weeklyBodyPartDays = React.useMemo(() => {
    // 날짜별 부위 Set 저장
    const datePartSet: Record<string, Set<string>> = {};
    
    // 1. weeklyExerciseData 사용 (이미 주간 범위 데이터) - 우선순위 높음
    weeklyExerciseData.forEach((record) => {
      if (record.exerciseDate && record.bodyPart) {
        const date = record.exerciseDate.slice(0, 10);
        if (!datePartSet[date]) datePartSet[date] = new Set();
        const part = getBodyPartLabel(record.bodyPart);
        if (part && part !== '기타') {
          datePartSet[date].add(part);
        }
      }
    });
    
    // 2. weeklySummary에서 체크 - weeklyExerciseData에 없는 날짜만 처리
    filteredSummary.forEach((item) => {
      if (!Array.isArray(item.exerciseNames) || item.exerciseNames.length === 0) return;
      const date = item.workoutDate;
      
      // 이미 weeklyExerciseData에서 처리된 날짜는 건너뛰기
      if (datePartSet[date]) {
        console.log(`🔄 [weeklyBodyPartDays] ${date}는 이미 weeklyExerciseData에서 처리됨, 건너뛰기`);
        return;
      }
      
      if (!datePartSet[date]) datePartSet[date] = new Set();
      
      item.exerciseNames.forEach((name: string) => {
        const lower = name.toLowerCase();
        
        // 운동 카탈로그 매핑에서 부위 찾기
        const mappedBodyPart = exerciseNameToBodyPartMap[lower];
        if (mappedBodyPart) {
          datePartSet[date].add(mappedBodyPart);
        } else {
          // 매핑에 없는 경우 기본 유산소 키워드로 체크
          const isCardio = ['수영', '사이클링', '조깅', '러닝', 'cardio', '유산소', '걷기', '런닝', '트레드밀', '러닝머신'].some(c => lower.includes(c));
          if (isCardio) {
            datePartSet[date].add('유산소');
          }
        }
      });
    });

    // 부위별로 날짜별 1회씩 카운트
    const counts: Record<string, number> = {};
    Object.values(datePartSet).forEach(set => {
      set.forEach(part => {
        counts[part] = (counts[part] || 0) + 1;
      });
    });
    
    console.log('📊 [weeklyBodyPartDays] 최종 집계 결과:', counts);
    return counts;
  }, [weeklyExerciseData, filteredSummary, weekStartStr, weekEndStr, exerciseNameToBodyPartMap]);

  // 3. exerciseData: 주간 누적만 사용
  const exerciseData = bodyPartMap.map(({ label }) => ({
    subject: label,
    value: weeklyBodyPartDays[label] || 0, // 하루 1회 기준 값
    goal: exerciseGoals[label] || 0,
  }));

  // 운동데이터터 - 저장된 토큰 사용
  useEffect(() => {
    const fetchWeeklySummary = async () => {
      if (!authToken) return;
      setIsLoadingSummary(true);
      try {
        const userInfo = getUserInfo();
        const userId = userInfo?.userId || 1;
        // selectedDate 기준으로 해당 주의 일요일(weekStart) 계산
        const day = selectedDate.getDay(); // 0(일) ~ 6(토)
        const diffToSunday = -day; // 일요일까지의 차이
        const sunday = new Date(selectedDate);
        sunday.setDate(selectedDate.getDate() + diffToSunday);
        const weekStart = sunday.toISOString().split("T")[0];
        
        console.log('📅 [Note] 선택된 날짜:', selectedDate.toISOString().split("T")[0]);
        console.log('📅 [Note] 해당 주의 일요일:', weekStart);
        
        // API 호출 - axiosInstance 사용으로 변경
        const res = await axiosInstance.get(`/api/note/exercise/summary`, {
          params: { weekStart }
        });
        setWeeklySummary(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        if (isAxiosError(err) && err.response?.status === 403) {
          alert("운동 요약 데이터를 불러올 권한이 없습니다. 다시 로그인 해주세요.");
          removeToken();
          navigate('/login');
        }
        console.error("주간 운동 집계 불러오기 실패:", err);
        setWeeklySummary([]);
      } finally {
        setIsLoadingSummary(false);
      }
    };
    fetchWeeklySummary();
  }, [authToken, selectedDate]);

  // weeklySummary 콘솔 출력용 useEffect 추가
  React.useEffect(() => {
    console.log('🟣 weeklySummary:', weeklySummary);
    weeklySummary.forEach(day => {
      console.log('🔍 workoutDate:', day.workoutDate, 'exerciseNames:', day.exerciseNames);
    });
  }, [weeklySummary]);

  // weeklyExerciseData 디버깅용 useEffect 추가
  React.useEffect(() => {
    console.log('🔵 weeklyExerciseData:', weeklyExerciseData);
    weeklyExerciseData.forEach(record => {
      console.log('🔍 exerciseDate:', record.exerciseDate, 'bodyPart:', record.bodyPart, 'exerciseName:', record.exerciseName);
    });
  }, [weeklyExerciseData]);

  useEffect(() => {
    if (location.state?.refreshDiet) {
      fetchCalendarRecords();
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // 식단 기록 삭제
  const handleDeleteDietRecord = async (id: number) => {
    try {
      await deleteDietRecord(id);
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
  const goals = React.useMemo(() => {
    if (!userGoalsData) return undefined;
    return Array.isArray(userGoalsData)
      ? userGoalsData.reduce((prev, curr) => (curr.user_goal_id > prev.user_goal_id ? curr : prev), userGoalsData[0])
      : userGoalsData;
  }, [userGoalsData]);

  // 식단 목표치 계산을 userGoalsData에서 직접 가져오도록 변경
  const nutritionGoals: DietNutritionDTO[] = [
    {
      name: '칼로리',
      target: goals?.daily_calories_target ?? 0,
      current: dailyDietLogs.reduce((sum, log) => sum + log.calories, 0),
      unit: 'kcal',
      percentage: goals?.daily_calories_target ? (dailyDietLogs.reduce((sum, log) => sum + log.calories, 0) / goals.daily_calories_target) * 100 : 0
    },
    {
      name: '탄수화물',
      target: goals?.daily_carbs_target ?? 0,
      current: dailyDietLogs.reduce((sum, log) => sum + log.carbs, 0),
      unit: 'g',
      percentage: goals?.daily_carbs_target ? (dailyDietLogs.reduce((sum, log) => sum + log.carbs, 0) / goals.daily_carbs_target) * 100 : 0
    },
    {
      name: '단백질',
      target: goals?.daily_protein_target ?? 0,
      current: dailyDietLogs.reduce((sum, log) => sum + log.protein, 0),
      unit: 'g',
      percentage: goals?.daily_protein_target ? (dailyDietLogs.reduce((sum, log) => sum + log.protein, 0) / goals.daily_protein_target) * 100 : 0
    },
    {
      name: '지방',
      target: goals?.daily_fat_target ?? 0,
      current: dailyDietLogs.reduce((sum, log) => sum + log.fat, 0),
      unit: 'g',
      percentage: goals?.daily_fat_target ? (dailyDietLogs.reduce((sum, log) => sum + log.fat, 0) / goals.daily_fat_target) * 100 : 0
    }
  ];

  // hasNutritionGoals도 nutritionGoals에서 직접 계산
  const hasNutritionGoals = React.useMemo(() => {
    return (
      nutritionGoals.length === 4 &&
      nutritionGoals.every(goal => goal.target && goal.target > 0)
    );
  }, [nutritionGoals]);

  // getGoal 함수도 nutritionGoals에서 직접 찾도록 변경
  const getGoal = (name: string) => {
    const found = nutritionGoals.find(dto => dto.name === name);
    return found ? found.target : 0;
  };

  // uiNutritionData도 nutritionGoals를 활용해 생성
  const uiNutritionData: NutritionData[] = nutritionGoals.map(nutrient => ({
    name: nutrient.name,
    value: nutrient.target > 0 ? (nutrient.current / nutrient.target) * 100 : 0,
    goal: 100,
    color:
      nutrient.name === '탄수화물' ? '#3B4A9C' :
      nutrient.name === '단백질' ? '#E67E22' :
      nutrient.name === '지방' ? '#95A5A6' :
      '#8B5CF6',
    calories: nutrient.current,
    targetCalories: nutrient.target,
  }));

  // ✅ 오늘 식단 기록 불러오기 (함수 선언 형태 - 호이스팅)
  async function fetchDiet() {
    setIsLoadingDietData(true);
    setDietError(null);

    const userId = getUserIdFromToken();
    if (!userId) {
      setDailyDietLogs([]);
      setIsLoadingDietData(false);
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    try {
      const data = await getDailyDietRecords(formattedDate, userId);
      const filtered = data.filter((d: DietRecord) => d.logDate && d.logDate.startsWith(formattedDate));
      setDailyDietLogs(filtered.sort((a, b) => b.id - a.id));
    } catch (err) {
      console.error('식단 기록 불러오기 실패:', err);
      setDailyDietLogs([]);
      setDietError('식단 기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingDietData(false);
    }
  }

  // ✅ 오늘 운동 기록 불러오기
  const fetchExercise = async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      setTodayExercise([]);
      return;
    }
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    try {
      const data = await getDailyExerciseRecords(formattedDate, userId);
      // 날짜 필터 적용 (exerciseDate 기준)
      const filtered = data.filter((e: ExerciseRecordDTO) => e.exerciseDate && e.exerciseDate.startsWith(formattedDate));
      // 데이터 정제: undefined나 null이 아닌 값만 포함
      const cleanedData = filtered.map(record => ({
        ...record,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
        duration_minutes: record.duration_minutes || undefined,
        calories_burned: record.calories_burned || undefined
      }));
      setTodayExercise(cleanedData.sort((a, b) => b.exerciseSessionId - a.exerciseSessionId));
    } catch (err) {
      console.error("운동 기록 불러오기 실패:", err);
      setTodayExercise([]);
    }
  };

  // ✅ 주간 운동 기록 불러오기 (레이더 차트용)
  const fetchWeeklyExercise = useCallback(async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      setWeeklyExerciseData([]);
      return;
    }
    
    try {
      console.log('📅 [fetchWeeklyExercise] 주간 운동 데이터 조회 시작:', weekStartStr, '~', weekEndStr);
      const data = await getWeeklyExerciseRecords(weekStartStr, weekEndStr, userId);
      
      // 데이터 정제
      const cleanedData = data.map(record => ({
        ...record,
        sets: record.sets,
        reps: record.reps,
        weight: record.weight,
        duration_minutes: record.duration_minutes || undefined,
        calories_burned: record.calories_burned || undefined
      }));
      
      setWeeklyExerciseData(cleanedData);
      console.log('✅ [fetchWeeklyExercise] 주간 운동 데이터 조회 성공:', cleanedData.length, '개');
    } catch (err) {
      console.error("❌ [fetchWeeklyExercise] 주간 운동 기록 불러오기 실패:", err);
      setWeeklyExerciseData([]);
    }
  }, [weekStartStr, weekEndStr]);

  useEffect(() => {
    if (authToken) {
      fetchDiet(); // 식단 먼저
      fetchExercise();
      fetchWeeklyExercise(); // 주간 운동 데이터도 가져오기
    }
  }, [selectedDate, authToken, fetchWeeklyExercise]);

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
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
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
      width: '7px',
      height: '7px',
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 식단 수정 관련 상태
  const [isEditDietDialogOpen, setIsEditDietDialogOpen] = useState(false);
  const [editingDietLog, setEditingDietLog] = useState<DietRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    foodItemId: null as number | null,
    foodName: '',
    quantity: 0,
    calories: 0, // 100g당
    carbs: 0,    // 100g당
    protein: 0,  // 100g당
    fat: 0,      // 100g당
    mealTime: 'breakfast', // 추가: 식사 시간
  });
  const [isUpdatingDiet, setIsUpdatingDiet] = useState(false);

  // 수정 팝업 내 검색 관련 상태
  const [editSearchKeyword, setEditSearchKeyword] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<FoodItem[]>([]);
  const [isEditSearching, setIsEditSearching] = useState(false);


  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const isNutrientField = ['foodName', 'calories', 'carbs', 'protein', 'fat'].includes(name);

    setEditFormData(prev => ({
      ...prev,
      // 이름이나 영양성분 수정 시, foodItemId를 null로 만들어 '커스텀 음식'으로 전환
      foodItemId: isNutrientField ? null : prev.foodItemId,
      [name]: name === 'foodName' ? value : (name === 'mealTime' ? value : (Number(value) >= 0 ? Number(value) : 0))
    }));
  };

  // 수정 팝업 내 음식 검색
  const searchFoodForEdit = async () => {
    if (!editSearchKeyword.trim()) return;
    setIsEditSearching(true);
    try {
      const results = await searchFoodItems(editSearchKeyword);
      setEditSearchResults(results);
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
  const startEditDiet = (dietLog: DietRecord) => {
    setEditingDietLog(dietLog);

    // API에서 받은 값(총 섭취량)을 100g 기준으로 변환
    const per100gFactor = dietLog.quantity > 0 ? 100 / dietLog.quantity : 0;

    setEditFormData({
      foodItemId: dietLog.foodItemId,
      foodName: dietLog.foodName,
      quantity: dietLog.quantity,
      calories: parseFloat((dietLog.calories * per100gFactor).toFixed(1)),
      carbs: parseFloat((dietLog.carbs * per100gFactor).toFixed(1)),
      protein: parseFloat((dietLog.protein * per100gFactor).toFixed(1)),
      fat: parseFloat((dietLog.fat * per100gFactor).toFixed(1)),
      mealTime: dietLog.mealTime || 'breakfast', // 추가: 식사 시간
    });

    setEditSearchKeyword(dietLog.foodName);
    setEditSearchResults([]);
    setIsEditSearching(false);

    setIsEditDietDialogOpen(true);
  };

  // 식단 수정 저장
  interface DietEditRequest {
    userId: number | undefined;
    quantity: number;
    mealTime: string;
    unit: string;
    logDate: string;
    inputSource: string;
    foodItemId?: number;
    foodName?: string;
    calories?: number;
    carbs?: number;
    protein?: number;
    fat?: number;
  }

  const saveDietEdit = async () => {
    if (!editingDietLog) return;
    setIsUpdatingDiet(true);
    try {
      const request: DietEditRequest = {
        userId: getUserIdFromToken(), // PUT에는 반드시 포함
        quantity: editFormData.quantity,
        mealTime: editFormData.mealTime,
        unit: 'g',
        logDate: selectedDate.toISOString().split('T')[0],
        inputSource: 'TYPING',
      };
      if (editFormData.foodItemId) {
        request.foodItemId = editFormData.foodItemId;
      } else {
        request.foodName = editFormData.foodName;
        request.calories = editFormData.calories;
        request.carbs = editFormData.carbs;
        request.protein = editFormData.protein;
        request.fat = editFormData.fat;
      }
      const updatedRecord = await updateDietRecord(editingDietLog.id, request);
      setDailyDietLogs(prevLogs =>
        prevLogs.map(log => (log.id === updatedRecord.id ? updatedRecord : log))
      );
      await fetchCalendarRecords();
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


  // 일일 운동 기록 수정
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseRecordDTO | null>(null);
  const [exerciseEditForm, setExerciseEditForm] = useState({
    sets: 1,
    reps: 10,
    weight: 0,
    duration_minutes: 0,
  });


  const startEditExercise = (record: ExerciseRecordDTO) => {
    setEditingExercise(record);
    setExerciseEditForm({
      sets: record.sets || 1,
      reps: record.reps || 10,
      weight: record.weight || 0,
      duration_minutes: record.duration_minutes || 0,
    });
    setIsEditExerciseDialogOpen(true);
  };



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
    try {
      await deleteExerciseSession(sessionId);
      await fetchExercise();
    } catch (err) {
      console.error("운동 기록 삭제 실패:", err);
    }
  };


  // 운동 기록 수정 saveExerciseEdit
  const { mutate: updateSession } = useUpdateExerciseSession();
  const [isSaving, setIsSaving] = useState(false);

  const saveExerciseEdit = () => {
    if (!editingExercise || isSaving) return;
    setIsSaving(true);

    const dataToSend = {
      sets: exerciseEditForm.sets ?? 0,
      reps: exerciseEditForm.reps ?? 0,
      weight: exerciseEditForm.weight ?? 0,
      duration_minutes: exerciseEditForm.duration_minutes ?? 0,
    };

    console.log("📤 수정 요청 데이터:", dataToSend);

    updateSession(
      {
        sessionId: editingExercise.exerciseSessionId,
        data: dataToSend,
      },
      {
        onSuccess: () => {
          setIsSaving(false);
          setIsEditExerciseDialogOpen(false);
          setEditingExercise(null);
          fetchExercise();
        },
        onError: (err) => {
          setIsSaving(false);
          console.error("❌ 운동 기록 수정 실패:", err);
          alert("운동 기록 수정 중 오류가 발생했습니다.");
        },
      }
    );
  };


  // Custom tooltip for radar chart
  const RadarGoalTooltip: React.FC<TooltipProps<number, string> & { isDarkMode: boolean }> = ({ active, payload, isDarkMode }) => {
    if (active && payload && payload.length > 0) {
      const part = payload[0].payload.subject;
      const goal = payload[0].payload.goal;
      const value = payload[0].payload.value;
      return (
        <div style={{
          background: isDarkMode ? '#23272e' : 'white',
          color: isDarkMode ? '#fff' : '#222',
          border: '1px solid #ddd',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 14,
          boxShadow: '0 2px 8px #0001'
        }}>
          <strong>{part}</strong><br />
          목표: {goal}회<br />
          달성: {value}회
        </div>
      );
    }
    return null;
  };

  const timePeriodMap = {
    morning: '오전',
    afternoon: '오후',
    evening: '저녁',
    night: '야간',
  };

  // Helper type guard for axios error
  function isAxiosError(error: unknown): error is { response: { status: number } } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: unknown }).response === 'object' &&
      (error as { response: { status?: unknown } }).response?.status !== undefined
    );
  }

  // Note.tsx 상단 state 부분에 추가
  const [inputSource, setInputSource] = useState('TYPING'); // 입력 방식(직접입력/음성입력)

  // ✅ 간단하고 명확한 fetchDietData
  const fetchDietData = useCallback(async () => {
    if (!authToken) return;
    
    setIsLoadingDietData(true);
    setDietError(null);
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        setDietError("사용자 인증이 필요합니다.");
        return;
      }

      console.log(`✅ [fetchDietData] 식단 데이터 조회: ${formattedDate}, 사용자: ${userId}`);
      const dietRecords = await getDailyDietRecords(formattedDate, userId);
      
      console.log('✅ [fetchDietData] 식단 데이터 조회 성공:', dietRecords);
      setDailyDietLogs(dietRecords);
      
    } catch (error) {
      console.error("❌ [fetchDietData] 식단 데이터 조회 실패:", error);
      setDietError("식단 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingDietData(false);
    }
  }, [authToken, selectedDate]);

  // ✅ useEffect로 호출
  useEffect(() => {
    fetchDietData();
  }, [fetchDietData]);

  return (
    <Layout>
      <div className="min-h-screen bg-background container mx-auto px-4 py-8 pb-24">
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
              <CardHeader className="flex flex-row items-center justify-between">
                <>
                  <div>
                    <CardTitle>운동 부위별 목표</CardTitle>
                    <p className="text-sm text-muted-foreground">붉은 선은 목표치를 나타냅니다</p>
                  </div>
                  {/* 총 주간 운동 목표 - no box, just text on background */}
                </>
              </CardHeader>
              <CardContent>
                {(isLoadingSummary || goalsLoading) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    운동 집계 데이터를 불러오는 중...
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={exerciseData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" className="text-sm" />
                        <PolarRadiusAxis angle={90} domain={[0, MAX_EDGE_VALUE]} tickCount={MAX_EDGE_VALUE + 1} tick={false} />
                        <Tooltip content={<RadarGoalTooltip isDarkMode={isDarkMode} />} />
                        <Radar name="현재 운동량" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name="목표치" dataKey="goal" stroke="#EF4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                        <defs>
                          <linearGradient id="todayGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>오늘의 운동 기록</CardTitle>
              </CardHeader>
              <CardContent>
                {todayExercise.length > 0 ? (
                  <div className="space-y-3">
                    {todayExercise.map((record) => {
                      console.log('운동 기록 record:', record);
                      const isCardio = record.bodyPart === 'cardio';
                      // 시간, 칼로리, 날짜 등 정보
                      const infoParts = [];
                      if (record.duration_minutes !== undefined) infoParts.push(`${record.duration_minutes}분`);
                      if (record.calories_burned !== undefined) infoParts.push(`${record.calories_burned}kcal`);
                      if (record.exerciseDate) infoParts.push(`${record.exerciseDate}`);
                      // 근력운동이면 세트, 무게, 횟수 추가
                      if (!isCardio) {
                        if (record.sets !== undefined) infoParts.push(`${record.sets}세트`);
                        if (record.reps !== undefined) infoParts.push(`${record.reps}회`);
                        if (record.weight !== undefined) infoParts.push(`${record.weight}kg`);
                      }
                      return (
                        <div
                          key={record.exerciseSessionId}
                          className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#232946] border border-gray-200 dark:border-[#3a3a5a]"
                        >
                          <div>
                            <p className="font-medium text-gray-800 dark:text-[#e0e6f8]">{record.exerciseName}
                              {record.bodyPart && (
                                <span className="ml-2 text-xs text-gray-400">({record.bodyPart})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-[#b3b8d8] flex items-center flex-wrap gap-x-2">
                              {infoParts.length > 0 ? infoParts.join(' • ') : '기록 없음'}
                              {record.time_period && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium text-xs dark:bg-[#2d1e4a] dark:text-[#b3b8d8]">
                                  {timePeriodMap[record.time_period] || record.time_period}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* 👉 삭제 + 수정 버튼 같이 */}
                          <div className="flex gap-2 items-center">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => {
                              setEditingExercise(record);
                              setExerciseEditForm({
                                sets: record.sets,
                                reps: record.reps,
                                weight: record.weight,
                                duration_minutes: record.duration_minutes,
                              });
                              setIsEditExerciseDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteExerciseRecord(record.exerciseSessionId)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">아직 운동 기록이 없습니다.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ 등록된 운동 수정 다이얼로그 */}
          <Dialog open={isEditExerciseDialogOpen} onOpenChange={setIsEditExerciseDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>운동 기록 수정</DialogTitle>
              </DialogHeader>

              {editingExercise && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    운동 부위: {getBodyPartLabel(editingExercise.bodyPart)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    운동 종류: {editingExercise.exerciseName}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>세트 수</Label>
                      <Input
                        type="number"
                        value={exerciseEditForm.sets}
                        onChange={e => setExerciseEditForm(prev => ({ ...prev, sets: +e.target.value }))}
                        min={0}
                      />
                    </div>
                    <div>
                      <Label>반복 횟수</Label>
                      <Input
                        type="number"
                        value={exerciseEditForm.reps}
                        onChange={e => setExerciseEditForm(prev => ({ ...prev, reps: +e.target.value }))}
                        min={0}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>무게 (kg)</Label>
                    <Input
                      type="number"
                      value={exerciseEditForm.weight}
                      onChange={e => setExerciseEditForm(prev => ({ ...prev, weight: +e.target.value }))}
                      min={0}
                    />
                  </div>

                  <div>
                    <Label>운동 시간 (분)</Label>
                    <Input
                      type="number"
                      value={exerciseEditForm.duration_minutes}
                      onChange={e => setExerciseEditForm(prev => ({ ...prev, duration_minutes: +e.target.value }))}
                      min={0}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditExerciseDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button onClick={saveExerciseEdit} disabled={isSaving}>
                      {isSaving ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </div>
              )}
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
                            <span className="text-lg-dynamic font-bold">
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
                                    onClick={() => handleDeleteDietRecord(record.id)}
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
                  <div>
                    <Label htmlFor="editMealTime">식사 시간</Label>
                    <select
                      id="editMealTime"
                      name="mealTime"
                      value={editFormData.mealTime}
                      onChange={handleEditFormChange}
                      className="block w-full border rounded px-2 py-1 mt-1"
                    >
                      <option value="breakfast">아침</option>
                      <option value="lunch">점심</option>
                      <option value="dinner">저녁</option>
                      <option value="snack">간식</option>
                      <option value="midnight">야식</option>
                    </select>
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