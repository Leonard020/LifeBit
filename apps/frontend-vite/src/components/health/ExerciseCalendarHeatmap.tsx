import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Activity, Clock, Flame, Trophy, Zap, Target, Star } from 'lucide-react';
import { Tooltip } from '../ui/tooltip';

interface ExerciseCalendarHeatmapProps {
  exerciseSessions: Array<{
    exercise_date: string;
    duration_minutes: number;
    calories_burned: number;
    exercise_name?: string;
  }>;
  period: 'day' | 'week' | 'month' | 'year';
}

interface DayData {
  date: Date;
  dateString: string;
  workouts: number;
  totalMinutes: number;
  totalCalories: number;
  intensity: 'none' | 'low' | 'medium' | 'high' | 'very-high';
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  monthName: string;
  dayOfMonth: number;
}

export const ExerciseCalendarHeatmap: React.FC<ExerciseCalendarHeatmapProps> = ({
  exerciseSessions = [],
  period
}) => {
  // 현재 날짜와 기간 설정
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // 운동 데이터를 날짜별로 그룹핑
  const exerciseByDate = useMemo(() => {
    const grouped: Record<string, { workouts: number; totalMinutes: number; totalCalories: number }> = {};
    
    exerciseSessions.forEach(session => {
      const date = session.exercise_date;
      if (!grouped[date]) {
        grouped[date] = { workouts: 0, totalMinutes: 0, totalCalories: 0 };
      }
      grouped[date].workouts += 1;
      grouped[date].totalMinutes += session.duration_minutes || 0;
      grouped[date].totalCalories += session.calories_burned || 0;
    });

    return grouped;
  }, [exerciseSessions]);

  // 캘린더 데이터 생성 (최근 12주 = 84일)
  const calendarData = useMemo(() => {
    const data: DayData[] = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 83); // 12주 전부터

    for (let i = 0; i < 84; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dateString = currentDate.toISOString().split('T')[0];
      const dayData = exerciseByDate[dateString] || { workouts: 0, totalMinutes: 0, totalCalories: 0 };
      
      // 운동 강도 계산 (총 운동 시간 기준)
      let intensity: DayData['intensity'] = 'none';
      if (dayData.totalMinutes > 0) {
        if (dayData.totalMinutes < 15) intensity = 'low';
        else if (dayData.totalMinutes < 30) intensity = 'medium';
        else if (dayData.totalMinutes < 60) intensity = 'high';
        else intensity = 'very-high';
      }

      data.push({
        date: currentDate,
        dateString,
        workouts: dayData.workouts,
        totalMinutes: dayData.totalMinutes,
        totalCalories: dayData.totalCalories,
        intensity,
        isToday: dateString === today.toISOString().split('T')[0],
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        monthName: currentDate.toLocaleDateString('ko-KR', { month: 'short' }),
        dayOfMonth: currentDate.getDate()
      });
    }

    return data;
  }, [exerciseByDate, today, currentMonth]);

  // 색상 클래스 반환 - 더 생동감 있고 그라데이션 느낌
  const getIntensityColor = (intensity: DayData['intensity'], isToday: boolean, isWeekend: boolean) => {
    if (isToday) {
      return 'bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-yellow-400 shadow-lg transform scale-110';
    }
    
    const baseClasses = 'transition-all duration-200 hover:transform hover:scale-110 hover:shadow-md';
    
    switch (intensity) {
      case 'none': 
        return `${baseClasses} ${isWeekend ? 'bg-gray-50' : 'bg-gray-100'} hover:bg-gray-200 border border-gray-200`;
      case 'low': 
        return `${baseClasses} bg-gradient-to-br from-green-200 to-green-300 hover:from-green-300 hover:to-green-400 border border-green-300`;
      case 'medium': 
        return `${baseClasses} bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 border border-green-500`;
      case 'high': 
        return `${baseClasses} bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border border-green-700`;
      case 'very-high': 
        return `${baseClasses} bg-gradient-to-br from-green-800 to-green-900 hover:from-green-900 hover:to-emerald-900 border border-green-800 shadow-md`;
      default: return `${baseClasses} bg-gray-100`;
    }
  };

  // 강도별 이모지 반환
  const getIntensityEmoji = (intensity: DayData['intensity']) => {
    switch (intensity) {
      case 'none': return '';
      case 'low': return '🌱';
      case 'medium': return '💪';
      case 'high': return '🔥';
      case 'very-high': return '⚡';
      default: return '';
    }
  };

  // 주별로 데이터 그룹핑 (7개씩)
  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      weeks.push(calendarData.slice(i, i + 7));
    }
    return weeks;
  }, [calendarData]);

  // 통계 계산
  const stats = useMemo(() => {
    const totalWorkouts = calendarData.reduce((sum, day) => sum + day.workouts, 0);
    const totalMinutes = calendarData.reduce((sum, day) => sum + day.totalMinutes, 0);
    const totalCalories = calendarData.reduce((sum, day) => sum + day.totalCalories, 0);
    const activeDays = calendarData.filter(day => day.workouts > 0).length;

    return { totalWorkouts, totalMinutes, totalCalories, activeDays };
  }, [calendarData]);

  return (
    <Card className="w-full bg-gradient-to-br from-white to-green-50/30 border-2 border-green-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">🔥 운동 캘린더 히트맵</div>
              <div className="text-sm text-gray-600 font-normal">최근 12주간의 운동 기록</div>
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
              <Trophy className="h-3 w-3 mr-1" />
              레벨 {Math.floor(stats.activeDays / 10) + 1}
            </Badge>
            <Badge variant="outline" className="border-orange-300 text-orange-600">
              <Flame className="h-3 w-3 mr-1" />
              {stats.activeDays}일 활동
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 월별 구분 히트맵 그리드 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
          {/* 요일 라벨 */}
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-3 ml-8">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div key={index} className="w-5 h-5 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* 히트맵 그리드 */}
          <div className="space-y-1">
            {weeklyData.map((week, weekIndex) => {
              const isFirstWeekOfMonth = week.some(day => day.dayOfMonth === 1);
              const monthName = week.find(day => day.dayOfMonth === 1)?.monthName;
              
              return (
                <div key={weekIndex}>
                  {/* 월 구분선 */}
                  {isFirstWeekOfMonth && weekIndex > 0 && (
                    <div className="flex items-center gap-2 my-2 px-2">
                      <div className="h-px bg-gradient-to-r from-green-200 to-transparent flex-1"></div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {monthName}
                      </span>
                      <div className="h-px bg-gradient-to-l from-green-200 to-transparent flex-1"></div>
                    </div>
                  )}
                  
                  <div className="flex gap-1 items-center">
                    {/* 주차 표시 */}
                    <div className="w-6 text-xs text-gray-400 text-center">
                      {weekIndex % 4 + 1}
                    </div>
                    
                    {/* 일별 히트맵 */}
                    <div className="flex gap-1">
                      {week.map((day, dayIndex) => (
                        <div
                          key={`${weekIndex}-${dayIndex}`}
                          className={`w-5 h-5 rounded-md cursor-pointer relative group ${getIntensityColor(day.intensity, day.isToday, day.isWeekend)}`}
                          title={`${day.date.toLocaleDateString('ko-KR')} (${day.monthName} ${day.dayOfMonth}일)\n${day.workouts}회 운동 • ${day.totalMinutes}분 • ${day.totalCalories}kcal`}
                        >
                          {/* 강도별 이모지 */}
                          {day.intensity !== 'none' && (
                            <div className="absolute inset-0 flex items-center justify-center text-xs">
                              {getIntensityEmoji(day.intensity)}
                            </div>
                          )}
                          
                          {/* 오늘 표시 */}
                          {day.isToday && (
                            <div className="absolute -top-1 -right-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            </div>
                          )}
                          
                          {/* 월초 날짜 표시 */}
                          {(day.dayOfMonth === 1 || (weekIndex === 0 && dayIndex === 0)) && (
                            <div className="absolute -top-4 left-0 text-xs font-medium text-gray-500">
                              {day.dayOfMonth}
                            </div>
                          )}
                          
                          {/* 호버 시 상세 정보 */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 pointer-events-none z-10 transition-opacity duration-200 whitespace-nowrap">
                            <div className="font-medium">{day.date.toLocaleDateString('ko-KR')}</div>
                            <div>{day.workouts}회 • {day.totalMinutes}분 • {day.totalCalories}kcal</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 개선된 범례 */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-green-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">운동 강도:</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" title="운동 안함"></div>
                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-200 to-green-300 border border-green-300" title="가벼운 운동 (15분 미만)"></div>
                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-400 to-green-500 border border-green-500" title="보통 운동 (15-30분)"></div>
                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-600 to-green-700 border border-green-700" title="강한 운동 (30-60분)"></div>
                <div className="w-3 h-3 rounded bg-gradient-to-br from-green-800 to-green-900 border border-green-800" title="매우 강한 운동 (60분 이상)"></div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              💡 하루 운동 시간에 따라 색상이 달라져요
            </div>
          </div>
        </div>

        {/* 💎 개선된 통계 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <div className="p-1.5 bg-blue-500 rounded-full shadow-sm">
                <Activity className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">총 운동 횟수</span>
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-1">{stats.totalWorkouts}</div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              🎯 목표 달성률 {Math.round((stats.totalWorkouts / 84) * 100)}%
            </div>
            <div className="absolute top-2 right-2 text-2xl opacity-20">💪</div>
          </div>
          
          <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
              <div className="p-1.5 bg-green-500 rounded-full shadow-sm">
                <Clock className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">총 운동 시간</span>
            </div>
            <div className="text-3xl font-bold text-green-700 mb-1">{stats.totalMinutes}</div>
            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              ⏰ 평균 {Math.round(stats.totalMinutes / (stats.activeDays || 1))}분/일
            </div>
            <div className="absolute top-2 right-2 text-2xl opacity-20">⏱️</div>
          </div>
          
          <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
              <div className="p-1.5 bg-orange-500 rounded-full shadow-sm">
                <Flame className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">소모 칼로리</span>
            </div>
            <div className="text-3xl font-bold text-orange-700 mb-1">{stats.totalCalories.toLocaleString()}</div>
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              🔥 평균 {Math.round(stats.totalCalories / (stats.activeDays || 1))}kcal/일
            </div>
            <div className="absolute top-2 right-2 text-2xl opacity-20">🔥</div>
          </div>
          
          <div className="relative overflow-hidden text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
              <div className="p-1.5 bg-purple-500 rounded-full shadow-sm">
                <Target className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">활동 일수</span>
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-1">{stats.activeDays}</div>
            <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              📈 연속성 {Math.round((stats.activeDays / 84) * 100)}%
            </div>
            <div className="absolute top-2 right-2 text-2xl opacity-20">📅</div>
          </div>
        </div>

        {/* 🎉 성취감 있는 격려 메시지 */}
        <div className="relative p-6 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-gradient shadow-lg overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="text-2xl mb-2">
              {stats.activeDays > 60 ? '🏆' : stats.activeDays > 30 ? '💪' : stats.activeDays > 15 ? '🌟' : '🚀'}
            </div>
            <div className="text-lg font-bold text-gray-800 mb-1">
              {stats.activeDays > 60 ? '운동 마스터!' : 
               stats.activeDays > 30 ? '훌륭한 진전!' : 
               stats.activeDays > 15 ? '좋은 시작!' : 
               '운동 시작!'}
            </div>
            <div className="text-sm text-gray-600">
              {stats.activeDays > 60 ? '꾸준함이 정말 대단해요! 최고의 운동 습관을 유지하고 계시네요! 👑' :
               stats.activeDays > 30 ? '운동 습관이 완전히 자리잡았어요! 이 기세를 이어가세요! 🔥' :
               stats.activeDays > 15 ? '멋진 시작이에요! 조금만 더 꾸준히 하면 습관이 될 거예요! 💪' :
               '건강한 습관의 첫걸음을 시작해보세요! 작은 시작이 큰 변화를 만들어요! ✨'}
            </div>
          </div>
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/20 to-transparent rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-200/20 to-transparent rounded-full"></div>
        </div>
      </CardContent>
    </Card>
  );
}; 