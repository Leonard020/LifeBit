import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Dumbbell, Apple, Edit, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Note = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [todayScore, setTodayScore] = useState(12);
  const [hasClaimedExerciseScore, setHasClaimedExerciseScore] = useState(false);
  const [hasClaimedDietScore, setHasClaimedDietScore] = useState(false);
  
  // Mock data for records on specific dates
  const recordsByDate = {
    '2025-06-12': { exercise: true, diet: true },
    '2025-06-11': { exercise: true, diet: false },
    '2025-06-10': { exercise: false, diet: true },
    '2025-06-09': { exercise: true, diet: true },
    '2025-06-08': { exercise: false, diet: true },
  };

  // Exercise goals from profile (mock data)
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
    { subject: '가슴', value: 80, goal: exerciseGoals['가슴'] * 20 }, // 목표치를 20배로 스케일링
    { subject: '등', value: 65, goal: exerciseGoals['등'] * 20 },
    { subject: '하체', value: 90, goal: exerciseGoals['하체'] * 20 },
    { subject: '어깨', value: 70, goal: exerciseGoals['어깨'] * 20 },
    { subject: '복근', value: 60, goal: exerciseGoals['복근'] * 20 },
    { subject: '팔', value: 75, goal: exerciseGoals['팔'] * 20 },
    { subject: '유산소', value: 85, goal: exerciseGoals['유산소'] * 20 },
  ];

  // 업데이트된 영양소 데이터 - 칼로리 정보와 함께
  const nutritionData = [
    { name: '탄수화물', value: 80, goal: 100, color: '#3B4A9C', calories: 180, targetCalories: 200 },
    { name: '단백질', value: 75, goal: 100, color: '#E67E22', calories: 95, targetCalories: 120 },
    { name: '지방', value: 60, goal: 100, color: '#95A5A6', calories: 45, targetCalories: 60 },
    { name: '칼로리', value: 92.5, goal: 100, color: '#8B5CF6', calories: 1850, targetCalories: 2000 },
  ];

  // 칼로리 차트 데이터
  const calorieData = [
    { name: '섭취', value: 1850, color: '#8B5CF6' },
    { name: '목표', value: 2000, color: '#E5E7EB' },
  ];

  const todayRecords = {
    exercise: [
      { name: '벤치프레스', weight: '70kg', sets: 5, reps: 8, time: '10:30' },
      { name: '스쿼트', weight: '80kg', sets: 4, reps: 10, time: '11:00' },
    ],
    diet: [
      { meal: '아침', food: '바나나', amount: '1개', calories: 105, time: '08:00' },
      { meal: '아침', food: '그릭요거트', amount: '200g', calories: 130, time: '08:00' },
      { meal: '점심', food: '닭가슴살 샐러드', amount: '1인분', calories: 350, time: '12:30' },
    ]
  };

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
                            <button
                              {...props}
                              className={cn(
                                "h-9 w-9 p-0 font-normal relative"
                              )}
                            >
                              {customDayContent(date)}
                            </button>
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

        {/* Main Content Tabs */}
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

          {/* Exercise Tab */}
          <TabsContent value="exercise" className="space-y-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>운동 부위별 분포</CardTitle>
                <p className="text-sm text-muted-foreground">
                  붉은 선은 목표치를 나타냅니다
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={exerciseData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" className="text-sm" />
                      <Radar
                        name="현재 운동량"
                        dataKey="value"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name="목표치"
                        dataKey="goal"
                        stroke="#EF4444"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>오늘의 운동 기록</CardTitle>
                {isToday(selectedDate) && todayRecords.exercise.length > 0 && (
                  <Button
                    onClick={handleClaimExerciseScore}
                    disabled={hasClaimedExerciseScore}
                    className="gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {hasClaimedExerciseScore ? '점수 획득 완료' : '+1점 획득'}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {todayRecords.exercise.length > 0 ? (
                  <div className="space-y-3">
                    {todayRecords.exercise.map((record, index) => (
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
                        <p className="text-sm text-green-700 text-center">
                          🎉 오늘 기록이 등록되었습니다! 점수를 획득하세요!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    아직 운동 기록이 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diet Tab */}
          <TabsContent value="diet" className="space-y-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>얼마나 먹었을까?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  오늘의 영양소 및 칼로리 섭취량
                </p>
              </CardHeader>
              <CardContent>
                {/* Updated Nutrition Progress with 4 items including calories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {nutritionData.map((nutrient) => (
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
                            {nutrient.name === '칼로리' ? nutrient.calories : `${nutrient.calories}g`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {nutrient.value}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>목표: {nutrient.name === '칼로리' ? `${nutrient.targetCalories}kcal` : `${nutrient.targetCalories}g`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diet Records with Score Button */}
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>오늘의 식단 기록</CardTitle>
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
              </CardHeader>
              <CardContent>
                {todayRecords.diet.length > 0 ? (
                  <div className="space-y-3">
                    {todayRecords.diet.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{record.food}</h4>
                            <Badge variant="secondary" className="text-xs">{record.meal}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {record.amount} • {record.calories}kcal • {record.time}
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
