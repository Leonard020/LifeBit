# LifeBit 코드 수정 사항 상세 문서

## 🔧 주요 코드 수정 내역

### 1. 백엔드 - HealthStatisticsService.java 확장

#### 📍 파일 위치
`apps/core-api-spring/src/main/java/com/lifebit/coreapi/service/HealthStatisticsService.java`

#### 🆕 추가된 주요 메서드

```java
/**
 * 🏋️ 운동 부위별 빈도 데이터 생성
 * - exercise_sessions 테이블에서 실제 운동 데이터 조회
 * - 부위별 운동 횟수, 시간, 비율 계산
 * - 한글명 변환 및 부위별 전용 색상 지정
 */
private Map<String, Object> getBodyPartFrequencyData(Long userId, String period) {
    Map<String, Object> bodyPartData = new HashMap<>();
    
    try {
        log.info("🏋️ 운동 부위별 빈도 데이터 생성 시작 - 사용자: {}, 기간: {}", userId, period);
        
        // exercise_sessions 테이블에서 실제 운동 데이터 조회
        List<ExerciseSession> sessions = exerciseService.getRecentExerciseSessions(userId, period);
        
        // 데이터 없을 때 안전한 처리
        if (sessions.isEmpty()) {
            log.info("운동 세션 데이터가 없음 - 사용자: {}", userId);
            bodyPartData.put("bodyPartFrequency", List.of());
            bodyPartData.put("totalExerciseSessions", 0);
            return bodyPartData;
        }
        
        // 운동 부위별 빈도 및 시간 계산
        Map<String, Integer> bodyPartCounts = new HashMap<>();
        Map<String, Integer> bodyPartDuration = new HashMap<>();
        
        for (ExerciseSession session : sessions) {
            if (session.getExerciseCatalog() != null && session.getExerciseCatalog().getBodyPart() != null) {
                String bodyPart = session.getExerciseCatalog().getBodyPart().name();
                
                // 운동 횟수 카운트
                bodyPartCounts.put(bodyPart, bodyPartCounts.getOrDefault(bodyPart, 0) + 1);
                
                // 운동 시간 합계 (분)
                int duration = session.getDurationMinutes() != null ? session.getDurationMinutes() : 0;
                bodyPartDuration.put(bodyPart, bodyPartDuration.getOrDefault(bodyPart, 0) + duration);
            }
        }
        
        int totalSessions = sessions.size();
        
        // 운동 부위별 상세 데이터 구성
        List<Map<String, Object>> bodyPartFrequency = bodyPartCounts.entrySet().stream()
            .map(entry -> {
                String bodyPart = entry.getKey();
                int count = entry.getValue();
                int duration = bodyPartDuration.getOrDefault(bodyPart, 0);
                double percentage = (double) count / totalSessions * 100;
                
                Map<String, Object> bodyPartInfo = new HashMap<>();
                bodyPartInfo.put("bodyPart", bodyPart);
                bodyPartInfo.put("bodyPartKorean", getBodyPartKoreanName(bodyPart)); // 한글명 변환
                bodyPartInfo.put("count", count);
                bodyPartInfo.put("duration", duration);
                bodyPartInfo.put("percentage", Math.round(percentage * 10.0) / 10.0);
                bodyPartInfo.put("color", getBodyPartColor(bodyPart)); // 부위별 전용 색상
                
                return bodyPartInfo;
            })
            .sorted((a, b) -> Integer.compare((Integer) b.get("count"), (Integer) a.get("count"))) // 운동 횟수 내림차순
            .toList();
        
        bodyPartData.put("bodyPartFrequency", bodyPartFrequency);
        bodyPartData.put("totalExerciseSessions", totalSessions);
        
        log.info("✅ 운동 부위별 빈도 데이터 생성 완료 - 사용자: {}, 총 세션: {}, 부위 수: {}", 
                userId, totalSessions, bodyPartFrequency.size());
        
    } catch (Exception e) {
        log.error("❌ 운동 부위별 빈도 데이터 생성 실패: {}", e.getMessage(), e);
        // 에러 시 안전한 빈 데이터 반환
        bodyPartData.put("bodyPartFrequency", List.of());
        bodyPartData.put("totalExerciseSessions", 0);
    }
    
    return bodyPartData;
}

/**
 * 운동 부위 한글명 변환
 * - 영문 부위명을 사용자 친화적인 한글명으로 변환
 */
private String getBodyPartKoreanName(String bodyPart) {
    switch (bodyPart.toLowerCase()) {
        case "chest": return "가슴";
        case "back": return "등";
        case "legs": return "하체";
        case "shoulders": return "어깨";
        case "arms": return "팔";
        case "abs": return "복근";
        case "cardio": return "유산소";
        case "full_body": return "전신";
        default: return bodyPart; // 매칭되지 않으면 원본 반환
    }
}

/**
 * 운동 부위별 차트 색상 지정
 * - 각 운동 부위마다 고유한 색상 지정으로 시각적 구분
 */
private String getBodyPartColor(String bodyPart) {
    switch (bodyPart.toLowerCase()) {
        case "chest": return "#FF6B6B";    // 빨간색 - 가슴
        case "back": return "#4ECDC4";     // 청록색 - 등
        case "legs": return "#45B7D1";     // 파란색 - 하체
        case "shoulders": return "#FFA07A"; // 주황색 - 어깨
        case "arms": return "#98D8C8";     // 민트색 - 팔
        case "abs": return "#F7DC6F";      // 노란색 - 복근
        case "cardio": return "#BB8FCE";   // 보라색 - 유산소
        case "full_body": return "#85C1E9"; // 하늘색 - 전신
        default: return "#BDC3C7";         // 회색 - 기타
    }
}

/**
 * 📅 운동 캘린더 히트맵 데이터 생성
 * - 최근 35일(5주)간 운동 데이터 조회
 * - 날짜별 운동 세션, 시간, 칼로리 집계
 */
public Map<String, Object> getExerciseCalendarHeatmapData(Long userId) {
    Map<String, Object> result = new HashMap<>();
    
    try {
        log.info("📅 운동 캘린더 히트맵 데이터 생성 시작 - 사용자: {}", userId);
        
        // 최근 35일(5주) 운동 세션 조회
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(34); // 35일 전
        
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserIdAndExerciseDateBetween(
            userId, startDate, endDate);
        
        // 날짜별 운동 데이터 그룹핑 및 집계
        Map<String, Map<String, Object>> exerciseByDate = sessions.stream()
            .filter(session -> session.getExerciseDate() != null)
            .collect(Collectors.groupingBy(
                session -> session.getExerciseDate().toString(),
                Collectors.collectingAndThen(
                    Collectors.toList(),
                    sessionList -> {
                        Map<String, Object> dayData = new HashMap<>();
                        
                        // 운동 횟수
                        dayData.put("workouts", sessionList.size());
                        
                        // 총 운동 시간 (분)
                        int totalMinutes = sessionList.stream()
                            .mapToInt(s -> s.getDurationMinutes() != null ? s.getDurationMinutes() : 0)
                            .sum();
                        dayData.put("totalMinutes", totalMinutes);
                        
                        // 총 소모 칼로리
                        int totalCalories = sessionList.stream()
                            .mapToInt(s -> s.getCaloriesBurned() != null ? s.getCaloriesBurned() : 0)
                            .sum();
                        dayData.put("totalCalories", totalCalories);
                        
                        return dayData;
                    }
                )
            ));
        
        result.put("exerciseByDate", exerciseByDate);
        result.put("startDate", startDate.toString());
        result.put("endDate", endDate.toString());
        
        log.info("✅ 운동 캘린더 히트맵 데이터 생성 완료 - 사용자: {}, 기간: {} ~ {}, 활동일: {}", 
                userId, startDate, endDate, exerciseByDate.size());
        
    } catch (Exception e) {
        log.error("❌ 운동 캘린더 히트맵 데이터 생성 실패: {}", e.getMessage(), e);
        result.put("exerciseByDate", Map.of());
        result.put("startDate", LocalDate.now().minusDays(34).toString());
        result.put("endDate", LocalDate.now().toString());
    }
    
    return result;
}
```

#### 🔗 컨트롤러 엔드포인트 추가

```java
// HealthStatisticsController.java에 추가
@GetMapping("/exercise-calendar-heatmap")
public ResponseEntity<?> getExerciseCalendarHeatmap(@RequestParam Long userId) {
    try {
        Map<String, Object> heatmapData = healthStatisticsService.getExerciseCalendarHeatmapData(userId);
        return ResponseEntity.ok(heatmapData);
    } catch (Exception e) {
        log.error("운동 캘린더 히트맵 조회 실패: {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "운동 캘린더 히트맵 데이터를 불러올 수 없습니다."));
    }
}
```

---

### 2. 프론트엔드 - API 함수 추가

#### 📍 파일 위치
`apps/frontend-vite/src/api/authApi.ts`

#### 🆕 추가된 API 타입 및 함수

```typescript
// 📊 운동 캘린더 히트맵 데이터 타입 정의
export interface ExerciseCalendarHeatmapData {
  exerciseByDate: {
    [date: string]: {
      workouts: number;
      totalMinutes: number;
      totalCalories: number;
    };
  };
  startDate: string;
  endDate: string;
}

/**
 * 운동 캘린더 히트맵 데이터 API 호출
 * - 최근 5주(35일)간 운동 데이터 조회
 */
export const getExerciseCalendarHeatmapData = async (userId: string): Promise<ExerciseCalendarHeatmapData> => {
  try {
    const response = await api.get('/health-statistics/exercise-calendar-heatmap', {
      params: { userId }
    });
    return response.data;
  } catch (error) {
    console.error('운동 캘린더 히트맵 데이터 조회 실패:', error);
    // 에러 시 안전한 빈 데이터 반환
    return {
      exerciseByDate: {},
      startDate: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    };
  }
};

/**
 * 운동 캘린더 히트맵 React Query Hook
 * - 5분 캐싱으로 성능 최적화
 */
export const useExerciseCalendarHeatmap = (userId: string) => {
  return useQuery({
    queryKey: ['exerciseCalendarHeatmap', userId],
    queryFn: () => getExerciseCalendarHeatmapData(userId),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    enabled: !!userId,
    retry: 2, // 최대 2번 재시도
    onError: (error) => {
      console.error('운동 캘린더 히트맵 데이터 로드 실패:', error);
    }
  });
};
```

---

### 3. 프론트엔드 - 운동 캘린더 히트맵 컴포넌트

#### 📍 파일 위치
`apps/frontend-vite/src/components/health/ExerciseCalendarHeatmap.tsx`

#### 🎯 핵심 구현 로직

```typescript
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

/**
 * 📅 5주 완전 캘린더 데이터 생성
 * - 현재 주가 5주차(마지막)에 위치하도록 계산
 * - 완전한 주 단위로 일요일~토요일 정렬
 */
const calendarData = useMemo(() => {
  const data: DayData[] = [];
  const today = new Date();
  const currentMonth = today.getMonth();
  
  // 현재 주의 일요일을 찾기
  const currentSunday = new Date(today);
  const currentDayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  currentSunday.setDate(today.getDate() - currentDayOfWeek); // 이번 주 일요일로 이동
  
  // 4주 전 일요일부터 시작 (현재 주가 5주차가 되도록)
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - 28); // 4주 전 일요일
  
  // 완전한 5주 = 35일 (5 * 7) 생성
  for (let i = 0; i < 35; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateString = currentDate.toISOString().split('T')[0];
    const dayData = exerciseByDate[dateString] || { workouts: 0, totalMinutes: 0, totalCalories: 0 };
    
    // 운동 강도 계산 (총 운동 시간 기준)
    let intensity: DayData['intensity'] = 'none';
    if (dayData.totalMinutes > 0) {
      if (dayData.totalMinutes < 15) intensity = 'low';        // 15분 미만: 낮음 🌱
      else if (dayData.totalMinutes < 30) intensity = 'medium';  // 30분 미만: 보통 💪
      else if (dayData.totalMinutes < 60) intensity = 'high';    // 60분 미만: 높음 🔥
      else intensity = 'very-high';                              // 60분 이상: 매우 높음 ⚡
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
}, [exerciseByDate]);

/**
 * 🗓️ 주별 데이터 구성 (5주 × 7일)
 */
const weeklyData = useMemo(() => {
  if (calendarData.length === 0) return [];
  
  const weeks = [];
  // 정확히 35일(5주)이므로 7일씩 나누기만 하면 됨
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }
  
  return weeks;
}, [calendarData]);

/**
 * 📊 주별 통계 계산
 */
const weeklyStats = useMemo(() => {
  return weeklyData.map(week => {
    const totalWorkouts = week.reduce((sum, day) => sum + day.workouts, 0);
    const totalMinutes = week.reduce((sum, day) => sum + day.totalMinutes, 0);
    const totalCalories = week.reduce((sum, day) => sum + day.totalCalories, 0);
    const activeDays = week.filter(day => day.workouts > 0).length;
    
    return {
      totalWorkouts,
      totalMinutes,
      totalCalories,
      activeDays,
      daysInWeek: 7 // 항상 7일
    };
  });
}, [weeklyData]);

/**
 * 🎨 운동 강도별 색상 및 스타일 반환
 */
const getIntensityColor = (intensity: DayData['intensity'], isToday: boolean, isWeekend: boolean) => {
  if (isToday) {
    // 오늘 날짜는 파란색 + 노란색 테두리 + 크기 확대
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

/**
 * ✨ 강도별 이모지 반환
 */
const getIntensityEmoji = (intensity: DayData['intensity']) => {
  switch (intensity) {
    case 'none': return '';
    case 'low': return '🌱';     // 새싹 - 가벼운 운동
    case 'medium': return '💪';  // 근육 - 보통 운동
    case 'high': return '🔥';    // 불꽃 - 강한 운동
    case 'very-high': return '⚡'; // 벼락 - 매우 강한 운동
    default: return '';
  }
};
```

#### 🎨 UI 렌더링 핵심 부분

```tsx
{/* 📅 5주 히트맵 그리드 */}
<div className="grid grid-cols-8 gap-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
  {/* 요일 헤더 */}
  <div className="text-center"></div> {/* 주차 컬럼 공간 */}
  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
    <div key={day} className="text-xs font-semibold text-gray-600 text-center p-1">
      {day}
    </div>
  ))}
  
  {/* 주별 데이터 렌더링 */}
  {weeklyData.map((week, weekIndex) => (
    <React.Fragment key={weekIndex}>
      {/* 🏷️ 주차 정보 박스 */}
      <div className="w-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group relative">
        <div className="text-xs font-bold text-blue-700 text-center mb-1">
          {weekIndex + 1}주차
        </div>
        <div className="text-xs text-blue-600 text-center space-y-0.5">
          <div>🏃 {weeklyStats[weekIndex]?.totalWorkouts || 0}회</div>
          <div>⏱️ {weeklyStats[weekIndex]?.totalMinutes || 0}분</div>
          <div className="text-blue-500">📈 {weeklyStats[weekIndex]?.activeDays || 0}/{weeklyStats[weekIndex]?.daysInWeek || 0}일</div>
        </div>
        
        {/* 호버 시 상세 주별 정보 툴팁 */}
        <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 transform -translate-x-1/2 bg-blue-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-20 transition-opacity duration-200 whitespace-nowrap">
          <div className="font-semibold text-center mb-1">{weekIndex + 1}주차 상세</div>
          <div className="space-y-1">
            <div>운동 횟수: {weeklyStats[weekIndex]?.totalWorkouts || 0}회</div>
            <div>운동 시간: {weeklyStats[weekIndex]?.totalMinutes || 0}분</div>
            <div>칼로리: {weeklyStats[weekIndex]?.totalCalories || 0}kcal</div>
            <div>활동일: {weeklyStats[weekIndex]?.activeDays || 0}일</div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-blue-800"></div>
        </div>
      </div>
      
      {/* 📅 해당 주의 7일 렌더링 */}
      {week.map(day => (
        <div
          key={day.dateString}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer relative group
            ${getIntensityColor(day.intensity, day.isToday, day.isWeekend)}
          `}
        >
          {/* 📅 날짜 표시 */}
          <span className={`text-xs font-bold ${
            day.isToday ? 'text-white' : 
            day.intensity === 'none' ? 'text-gray-600' : 'text-white'
          }`}>
            {day.dayOfMonth}
          </span>
          
          {/* ✨ 강도 이모지 */}
          {day.intensity !== 'none' && (
            <span className="absolute -top-1 -right-1 text-xs">
              {getIntensityEmoji(day.intensity)}
            </span>
          )}
          
          {/* ⭐ 오늘 표시 */}
          {day.isToday && (
            <span className="absolute -top-2 -right-2 text-yellow-400 text-sm">⭐</span>
          )}
          
          {/* 🏷️ 호버 시 상세 정보 툴팁 */}
          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 pointer-events-none z-20 transition-opacity duration-200 whitespace-nowrap">
            <div className="font-semibold text-center mb-1">{day.date.toLocaleDateString('ko-KR')}</div>
            <div className="space-y-1">
              <div>운동: {day.workouts}회</div>
              <div>시간: {day.totalMinutes}분</div>
              <div>칼로리: {day.totalCalories}kcal</div>
              {day.isToday && <div className="text-yellow-400">🎯 오늘</div>}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        </div>
      ))}
    </React.Fragment>
  ))}
</div>
```

---

### 4. 프론트엔드 - 대시보드 통합

#### 📍 파일 위치
`apps/frontend-vite/src/components/health/EnhancedHealthDashboard.tsx`

#### 🔄 주요 수정 사항

```typescript
// 🆕 운동 캘린더 히트맵 관련 import 추가
import { ExerciseCalendarHeatmap } from './ExerciseCalendarHeatmap';
import { useExerciseCalendarHeatmap } from '../../api/authApi';

// 🔧 탭 구성 수정 (3개 → 4개)
const tabs = [
  { id: 'overview', label: '개요', icon: BarChart3 },
  { id: 'weight', label: '체중 추이', icon: TrendingUp },
  { id: 'goals', label: '목표 진행', icon: Target },
  { id: 'exercise', label: '주별 운동 요약', icon: Activity } // 🆕 새로 추가된 탭
];

// 🔄 컴포넌트 내부에서 히트맵 데이터 사용
const ExerciseAnalysisTab = () => {
  const { data: heatmapData, isLoading, error } = useExerciseCalendarHeatmap(userId?.toString() || '');
  
  if (isLoading) {
    return <div className="text-center py-8">운동 데이터를 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className="text-center py-8 text-red-500">데이터를 불러올 수 없습니다.</div>;
  }
  
  return (
    <div className="space-y-8">
      {/* 🏋️ 운동 부위별 빈도 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BodyPartFrequencyChart
          bodyPartFrequency={healthStats?.bodyPartFrequency || []}
          totalExerciseSessions={healthStats?.totalExerciseSessions || 0}
          period="week"
          chartType="bar"
        />
        
        {/* 📅 운동 캘린더 히트맵 */}
        <ExerciseCalendarHeatmap 
          exerciseByDate={heatmapData?.exerciseByDate || {}}
        />
      </div>
      
      {/* 💎 운동 요약 통계 카드들 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 통계 카드 구현... */}
      </div>
    </div>
  );
};

// 🔄 메인 렌더링에서 새 탭 처리
{activeTab === 'exercise' && <ExerciseAnalysisTab />}
```

---

## 📝 주요 개선 포인트

### 1. 타입 안전성
- TypeScript interface로 모든 데이터 구조 정의
- API 응답 타입 검증으로 런타임 에러 방지

### 2. 에러 처리
- 백엔드: try-catch 블록으로 안전한 에러 처리
- 프론트엔드: 폴백 데이터로 사용자 경험 보장

### 3. 성능 최적화
- React Query로 API 캐싱 (5분 staleTime)
- useMemo로 무거운 계산 메모이제이션
- 적절한 리렌더링 최적화

### 4. 사용자 경험
- 로딩 상태 및 에러 상태 표시
- 직관적인 색상과 이모지 사용
- 호버 효과와 애니메이션으로 인터랙션 개선

### 5. 확장성
- 기간 설정 확장 가능한 구조
- 새로운 차트 타입 추가 용이
- 컴포넌트 재사용성 고려

이렇게 체계적으로 구현된 코드는 유지보수성과 확장성을 모두 갖춘 완성도 높은 솔루션입니다! 🎉 