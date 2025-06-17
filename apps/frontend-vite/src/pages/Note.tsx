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
import { getUserInfo, isLoggedIn } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  // Mock data for records on specific dates (유지)
  const [todayExercise, setTodayExercise] = useState([]);

  const recordsByDate = {
    '2025-06-12': { exercise: true, diet: true },
    '2025-06-11': { exercise: true, diet: false },
    '2025-06-10': { exercise: false, diet: true },
    '2025-06-09': { exercise: true, diet: true },
    '2025-06-08': { exercise: false, diet: true },
  };

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

  const exerciseData = [
    { subject: '가슴', value: 80, goal: exerciseGoals['가슴'] * 20 },
    { subject: '등', value: 65, goal: exerciseGoals['등'] * 20 },
    { subject: '하체', value: 90, goal: exerciseGoals['하체'] * 20 },
    { subject: '어깨', value: 70, goal: exerciseGoals['어깨'] * 20 },
    { subject: '복근', value: 60, goal: exerciseGoals['복근'] * 20 },
    { subject: '팔', value: 75, goal: exerciseGoals['팔'] * 20 },
    { subject: '유산소', value: 85, goal: exerciseGoals['유산소'] * 20 },
  ];

  // 식단 데이터 페칭
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    
    const fetchDietData = async () => {
      setIsLoadingDietData(true);
      setDietError(null);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      try {
        const userInfo = getUserInfo();
        const userId = userInfo?.userId || 1;
        
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
  }, [selectedDate, navigate]);

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
      const userInfo = getUserInfo();
      const userId = userInfo?.userId || 1;
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
        unit: "g"
      };
      
      await axios.post('/api/diet/record', request);
      
      // 데이터 새로고침
      const dietLogsResponse = await axios.get(`/api/diet/daily-records/${formattedDate}`, {
        params: { userId }
      });
      setDailyDietLogs(dietLogsResponse.data);
      
      // 다이얼로그 닫기
      setIsAddDietDialogOpen(false);
      setSelectedFood(null);
      setQuantity(100);
      setSearchKeyword('');
      setSearchResults([]);
      
    } catch (error) {
      console.error("식단 기록 추가 중 오류:", error);
    }
  };

  // 식단 기록 삭제
  const deleteDietRecord = async (id: number) => {
    try {
      await axios.delete(`/api/diet/record/${id}`);
      
      // 데이터 새로고침
      const userInfo = getUserInfo();
      const userId = userInfo?.userId || 1;
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const dietLogsResponse = await axios.get(`/api/diet/daily-records/${formattedDate}`, {
        params: { userId }
      });
      setDailyDietLogs(dietLogsResponse.data);
      
    } catch (error) {
      console.error("식단 기록 삭제 중 오류:", error);
    }
  };

  // 백엔드 데이터 -> UI 형식으로 변환 (nutritionData)
  const uiNutritionData = dailyNutritionGoals.map(dto => {
    let color = '';
    switch (dto.name) {
      case '탄수화물': color = '#3B4A9C'; break;
      case '단백질': color = '#E67E22'; break;
      case '지방': color = '#95A5A6'; break;
      case '칼로리': color = '#8B5CF6'; break;
      default: color = '#CCCCCC';
    }
    return {
      name: dto.name,
      value: dto.percentage,
      goal: 100,
      color: color,
      calories: dto.current,
      targetCalories: dto.target,
    };
  });

  // 백엔드 데이터 -> UI 형식으로 변환 (todayRecords.diet)
  const uiTodayDietRecords = dailyDietLogs.map(log => ({
    meal: '기록',
    food: log.foodName,
    amount: `${log.quantity}${log.unit}`,
    calories: log.calories,
    time: '',
  }));

  const todayRecords = { // 기존 구조 유지
    exercise: todayExercise,
    diet: uiTodayDietRecords
  };
  useEffect(() => {
    const fetchExercise = async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];
      try {
        const res = await fetch(`http://localhost:8080/api/workouts?date=${dateStr}`);
        if (!res.ok) throw new Error("운동 기록 불러오기 실패");

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
      setIsCalendarOpen(false);
    }
  };

  const hasRecordOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return recordsByDate[dateStr];
  };

  const customDayContent = (date: Date) => {
    const records = hasRecordOnDate(date);
    const hasBothRecords = records && records.exercise && records.diet;

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className={hasBothRecords ? "gradient-text font-medium" : ""}>{date.getDate()}</span>
        {records && (
          <div className="absolute -bottom-1 flex space-x-0.5">
            {records.exercise && !hasBothRecords && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            )}
            {records.diet && !hasBothRecords && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            )}
            {hasBothRecords && (
              <div className="w-2 h-1.5 rounded-full gradient-bg"></div>
            )}
          </div>
        )}
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

  const nutritionData = [
    { name: '탄수화물', value: 80, goal: 100, color: '#3B4A9C', calories: 180, targetCalories: 200 },
    { name: '단백질', value: 75, goal: 100, color: '#E67E22', calories: 95, targetCalories: 120 },
    { name: '지방', value: 60, goal: 100, color: '#95A5A6', calories: 45, targetCalories: 60 },
    { name: '칼로리', value: 92.5, goal: 100, color: '#8B5CF6', calories: 1850, targetCalories: 2000 },
  ];
  

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
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      components={{
                        Day: ({ date, ...props }) => (
                          <div className="relative">
                            <button {...props} className={cn("h-9 w-9 p-0 font-normal relative")}>{customDayContent(date)}</button>
                          </div>
                        )
                      }}
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
                                    className={`p-2 border rounded cursor-pointer hover:bg-accent ${
                                      selectedFood?.foodItemId === food.foodItemId ? 'bg-accent' : ''
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
                          <Button size="icon" variant="ghost" className="h-8 w-8">
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
      </div>
    </Layout>
  );
};

export default Note;