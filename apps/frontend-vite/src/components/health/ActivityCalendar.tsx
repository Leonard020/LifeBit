import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { 
  CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Dumbbell,
  Apple,
  Droplets,
  Weight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useExerciseSessions, useMealLogs, useHealthRecords } from '../../api/auth';

interface ActivityCalendarProps {
  userId: string;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

interface DayActivity {
  hasExercise: boolean;
  hasDiet: boolean;
  hasHealthRecord: boolean;
  exerciseCount: number;
  dietCount: number;
  totalCalories: number;
  weight?: number;
  waterIntake?: number;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  userId,
  selectedDate,
  onDateSelect,
  currentMonth,
  onMonthChange
}) => {
  // 현재 월에 해당하는 기간 계산 (더 넓은 범위로 조회)
  const currentYear = currentMonth.getFullYear();
  const currentMonthNum = currentMonth.getMonth();
  
  // 현재 월의 이전달부터 다음달까지 3개월 데이터 조회
  const startDate = new Date(currentYear, currentMonthNum - 1, 1);
  const endDate = new Date(currentYear, currentMonthNum + 2, 0);
  
  console.log('🗓️ [ActivityCalendar] 데이터 조회 범위:', {
    userId,
    currentMonth: format(currentMonth, 'yyyy-MM'),
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd')
  });

  // 더 넓은 기간의 데이터 조회 (3개월)
  const { 
    data: exerciseData, 
    isLoading: exerciseLoading 
  } = useExerciseSessions(userId, 'year'); // year로 설정하여 더 많은 데이터 조회
  
  const { 
    data: mealData, 
    isLoading: mealLoading 
  } = useMealLogs(userId, 'year');
  
  const { 
    data: healthRecords, 
    isLoading: healthLoading 
  } = useHealthRecords(userId, 'year');

  const isLoading = exerciseLoading || mealLoading || healthLoading;

  console.log('🗓️ [ActivityCalendar] 렌더링:', { 
    userId, 
    exerciseDataCount: exerciseData?.length || 0,
    mealDataCount: mealData?.length || 0,
    healthRecordsCount: healthRecords?.length || 0,
    isLoading
  });

  // 날짜별 활동 데이터 집계
  const activityByDate = useMemo(() => {
    if (!exerciseData || !mealData || !healthRecords) return {};
    
    const activities: { [date: string]: DayActivity } = {};

    // 운동 데이터 처리
    const exercises = exerciseData?.data || exerciseData || [];
    exercises.forEach((exercise: any) => {
      const date = exercise.exercise_date;
      if (!date) return;

      if (!activities[date]) {
        activities[date] = {
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0
        };
      }

      activities[date].hasExercise = true;
      activities[date].exerciseCount++;
      activities[date].totalCalories += exercise.calories_burned || 0;
    });

    // 식단 데이터 처리
    const meals = mealData?.data || mealData || [];
    meals.forEach((meal: any) => {
      const date = meal.log_date || meal.logDate;
      if (!date) return;

      if (!activities[date]) {
        activities[date] = {
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0
        };
      }

      activities[date].hasDiet = true;
      activities[date].dietCount++;
    });

    // 건강 기록 데이터 처리
    const records = healthRecords?.data || healthRecords || [];
    records.forEach((record: any) => {
      const date = record.record_date || record.recordDate;
      if (!date) return;

      if (!activities[date]) {
        activities[date] = {
          hasExercise: false,
          hasDiet: false,
          hasHealthRecord: false,
          exerciseCount: 0,
          dietCount: 0,
          totalCalories: 0
        };
      }

      activities[date].hasHealthRecord = true;
      if (record.weight) activities[date].weight = record.weight;
      if (record.water_intake || record.waterIntake) {
        activities[date].waterIntake = record.water_intake || record.waterIntake;
      }
    });

    console.log('📊 [ActivityCalendar] 활동 데이터 집계:', {
      totalDays: Object.keys(activities).length,
      sampleDays: Object.keys(activities).slice(0, 5),
      activities: Object.fromEntries(Object.entries(activities).slice(0, 3))
    });

    return activities;
  }, [exerciseData, mealData, healthRecords]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">캘린더 데이터를 불러오는 중...</span>
        </CardContent>
      </Card>
    );
  }

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  // 날짜별 활동 표시 컴포넌트
  const DayContent = ({ date }: { date: Date }) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const activity = activityByDate[dateString];
    
    if (!activity) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-wrap gap-0.5 max-w-full">
          {activity.hasExercise && (
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title={`운동 ${activity.exerciseCount}회`} />
          )}
          {activity.hasDiet && (
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title={`식단 ${activity.dietCount}회`} />
          )}
          {activity.hasHealthRecord && activity.weight && (
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title={`체중 ${activity.weight}kg`} />
          )}
          {activity.hasHealthRecord && activity.waterIntake && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title={`물 ${activity.waterIntake}ml`} />
          )}
        </div>
      </div>
    );
  };

  // 선택된 날짜의 활동 상세 정보
  const selectedDateActivity = selectedDate ? activityByDate[format(selectedDate, 'yyyy-MM-dd')] : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              month={currentMonth}
              onMonthChange={onMonthChange}
              className="rounded-md border"
              components={{
                DayContent: ({ date }: { date: Date }) => (
                  <div className="relative w-full h-full">
                    <div className="text-center">{date.getDate()}</div>
                    <DayContent date={date} />
                  </div>
                )
              }}
            />
          </div>
          
          {/* 범례 */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>운동</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>식단</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>체중</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 날짜의 활동 상세 정보 */}
      {selectedDate && selectedDateActivity && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })} 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedDateActivity.hasExercise && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <Dumbbell className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-600">{selectedDateActivity.exerciseCount}회</div>
                    <div className="text-xs text-gray-600">운동</div>
                  </div>
                </div>
              )}
              
              {selectedDateActivity.hasDiet && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Apple className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-600">{selectedDateActivity.dietCount}회</div>
                    <div className="text-xs text-gray-600">식단</div>
                  </div>
                </div>
              )}
              
              {selectedDateActivity.weight && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                  <Weight className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-600">{selectedDateActivity.weight}kg</div>
                    <div className="text-xs text-gray-600">체중</div>
                  </div>
                </div>
              )}
              
              {selectedDateActivity.waterIntake && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Droplets className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-600">{selectedDateActivity.waterIntake}ml</div>
                    <div className="text-xs text-gray-600">물 섭취</div>
                  </div>
                </div>
              )}
              
              {selectedDateActivity.totalCalories > 0 && (
                <div className="col-span-2 flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-purple-600">{selectedDateActivity.totalCalories} kcal</div>
                  <div className="text-xs text-gray-600">총 소모 칼로리</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 