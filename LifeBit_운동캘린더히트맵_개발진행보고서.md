# LifeBit 운동 캘린더 히트맵 개발 진행 보고서

## 📋 프로젝트 개요
**프로젝트명**: LifeBit 건강 추적 애플리케이션 - 운동 캘린더 히트맵 구현  
**개발 기간**: 2025년 6월 23일  
**개발 환경**: 
- **프론트엔드**: React with Vite (Vercel 배포)
- **백엔드**: Spring Boot (AWS EC2)
- **데이터베이스**: PostgreSQL (포트 5432, DB명: lifebit_db)
- **AI 서비스**: FastAPI
- **데이터 파이프라인**: Airflow

---

## 🚨 초기 문제 상황

### 문제 인식
사용자가 LifeBit 건강 추적 애플리케이션의 "주별 종합 트렌드 차트"에 실제 DB 데이터가 반영되지 않는 문제를 보고했습니다.

**증상:**
- 화면에는 건강 데이터(체중 48.71kg, BMI 18.6, 주별 운동 0분)가 표시됨
- 차트에는 실제 데이터가 반영되지 않음
- 더미 데이터나 기본값만 표시되는 상황

### 근본 원인 분석
1. **데이터베이스 연결 오류**: PostgreSQL 환경인데 MySQL 명령어 사용
2. **백엔드 차트 로직 부재**: 차트 전용 데이터 생성 로직 미구현
3. **프론트엔드 연동 부족**: 백엔드 데이터 우선 사용 로직 부재

---

## 🔧 주요 문제 해결 과정

### 1단계: 데이터베이스 연결 오류 수정

**문제점:**
```bash
# 잘못된 접근 (MySQL 명령어)
mysql -u username -p database_name
```

**해결책:**
```bash
# 올바른 접근 (PostgreSQL)
psql -h localhost -p 5432 -U username -d lifebit_db
```

**조치 내용:**
- PostgreSQL 환경 정보 확인 및 수정
- MySQL 관련 명령어 완전 제거
- PostgreSQL 전용 쿼리로 변경

### 2단계: 백엔드 차트 데이터 로직 추가

**파일**: `apps/core-api-spring/src/main/java/com/lifebit/coreapi/service/HealthStatisticsService.java`

**추가된 주요 메서드:**

```java
/**
 * 차트용 시계열 데이터 생성
 * @param userId 사용자 ID
 * @param period 조회 기간
 * @return 차트 데이터 맵
 */
private Map<String, Object> getChartTimeSeriesData(Long userId, String period) {
    Map<String, Object> chartData = new HashMap<>();
    
    try {
        // 건강 기록 차트 데이터 생성
        List<Map<String, Object>> healthChartData = createHealthChartData(userId, period);
        
        // 운동 차트 데이터 생성
        List<Map<String, Object>> exerciseChartData = createExerciseChartData(userId, period);
        
        chartData.put("healthChartData", healthChartData);
        chartData.put("exerciseChartData", exerciseChartData);
        
        log.info("✅ 차트 시계열 데이터 생성 완료 - 사용자: {}, 기간: {}", userId, period);
        
    } catch (Exception e) {
        log.error("❌ 차트 시계열 데이터 생성 실패: {}", e.getMessage(), e);
        chartData.put("healthChartData", List.of());
        chartData.put("exerciseChartData", List.of());
    }
    
    return chartData;
}

/**
 * 건강 기록 차트 데이터 생성 (체중, BMI 추이)
 */
private List<Map<String, Object>> createHealthChartData(Long userId, String period) {
    List<HealthRecord> healthRecords = getHealthRecordsByPeriod(userId, period);
    
    return healthRecords.stream()
        .map(record -> {
            Map<String, Object> chartPoint = new HashMap<>();
            chartPoint.put("date", record.getRecordDate().toString());
            chartPoint.put("weight", record.getWeight() != null ? record.getWeight().doubleValue() : 0.0);
            chartPoint.put("bmi", record.getBmi() != null ? record.getBmi().doubleValue() : 0.0);
            return chartPoint;
        })
        .sorted((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")))
        .toList();
}

/**
 * 운동 차트 데이터 생성 (시간, 칼로리 추이)
 */
private List<Map<String, Object>> createExerciseChartData(Long userId, String period) {
    List<ExerciseSession> sessions = exerciseService.getRecentExerciseSessions(userId, period);
    
    // 날짜별로 운동 세션 그룹핑
    Map<String, List<ExerciseSession>> sessionsByDate = sessions.stream()
        .filter(session -> session.getExerciseDate() != null)
        .collect(Collectors.groupingBy(
            session -> session.getExerciseDate().toString()
        ));
    
    return sessionsByDate.entrySet().stream()
        .map(entry -> {
            String date = entry.getKey();
            List<ExerciseSession> daySessions = entry.getValue();
            
            int totalMinutes = daySessions.stream()
                .mapToInt(session -> session.getDurationMinutes() != null ? session.getDurationMinutes() : 0)
                .sum();
            
            int totalCalories = daySessions.stream()
                .mapToInt(session -> session.getCaloriesBurned() != null ? session.getCaloriesBurned() : 0)
                .sum();
            
            Map<String, Object> chartPoint = new HashMap<>();
            chartPoint.put("date", date);
            chartPoint.put("minutes", totalMinutes);
            chartPoint.put("calories", totalCalories);
            chartPoint.put("sessions", daySessions.size());
            
            return chartPoint;
        })
        .sorted((a, b) -> ((String) a.get("date")).compareTo((String) b.get("date")))
        .toList();
}
```

### 3단계: 프론트엔드 차트 연동 개선

**파일**: `apps/frontend-vite/src/components/health/StatisticsCharts.tsx`

**수정된 핵심 로직:**

```typescript
/**
 * 건강 통계 데이터를 가져오는 React Query Hook
 * 백엔드 차트 데이터를 우선적으로 사용하고, 폴백으로 기존 로직 사용
 */
const useHealthStatistics = (userId: string, period: 'day' | 'week' | 'month' | 'year') => {
  return useQuery({
    queryKey: ['healthStatistics', userId, period],
    queryFn: () => getHealthStatistics(userId, period),
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    enabled: !!userId
  });
};

// 컴포넌트 내부에서 백엔드 차트 데이터 우선 사용
const StatisticsCharts: React.FC<StatisticsChartsProps> = ({ userId, period }) => {
  const { data: healthStats, isLoading, error } = useHealthStatistics(userId, period);
  
  // 백엔드 차트 데이터 우선 사용, 없으면 기존 로직 폴백
  const chartData = useMemo(() => {
    if (healthStats?.chartData?.healthChartData && healthStats.chartData.healthChartData.length > 0) {
      // 백엔드에서 제공하는 실제 차트 데이터 사용
      return healthStats.chartData.healthChartData.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        weight: item.weight,
        bmi: item.bmi,
        calories: item.calories || 0
      }));
    }
    
    // 폴백: 기존 더미 데이터 로직
    return generateFallbackData();
  }, [healthStats]);
  
  // ... 렌더링 로직
};
```

---

## 🚀 추가 기능 구현

### 운동 부위별 빈도 차트 구현

**목적**: 사용자의 운동 부위별 선호도와 빈도를 시각화

#### 백엔드 API 구현

**파일**: `apps/core-api-spring/src/main/java/com/lifebit/coreapi/service/HealthStatisticsService.java`

```java
/**
 * 🏋️ 운동 부위별 빈도 데이터 생성
 * 사용자의 운동 부위별 운동 횟수와 비율을 계산
 */
private Map<String, Object> getBodyPartFrequencyData(Long userId, String period) {
    Map<String, Object> bodyPartData = new HashMap<>();
    
    try {
        log.info("🏋️ 운동 부위별 빈도 데이터 생성 시작 - 사용자: {}, 기간: {}", userId, period);
        
        // exercise_sessions 테이블에서 실제 운동 데이터 조회
        List<ExerciseSession> sessions = exerciseService.getRecentExerciseSessions(userId, period);
        
        if (sessions.isEmpty()) {
            log.info("운동 세션 데이터가 없음 - 사용자: {}", userId);
            bodyPartData.put("bodyPartFrequency", List.of());
            bodyPartData.put("totalExerciseSessions", 0);
            return bodyPartData;
        }
        
        // 운동 부위별 빈도 계산
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
        
        // 총 운동 세션 수
        int totalSessions = sessions.size();
        
        // 운동 부위별 데이터 구성
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
            .sorted((a, b) -> Integer.compare((Integer) b.get("count"), (Integer) a.get("count")))
            .toList();
        
        bodyPartData.put("bodyPartFrequency", bodyPartFrequency);
        bodyPartData.put("totalExerciseSessions", totalSessions);
        
        log.info("✅ 운동 부위별 빈도 데이터 생성 완료 - 사용자: {}, 총 세션: {}, 부위 수: {}", 
                userId, totalSessions, bodyPartFrequency.size());
        
    } catch (Exception e) {
        log.error("❌ 운동 부위별 빈도 데이터 생성 실패: {}", e.getMessage(), e);
        bodyPartData.put("bodyPartFrequency", List.of());
        bodyPartData.put("totalExerciseSessions", 0);
    }
    
    return bodyPartData;
}

/**
 * 운동 부위 한글명 반환
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
        default: return bodyPart;
    }
}

/**
 * 운동 부위별 차트 색상 반환
 */
private String getBodyPartColor(String bodyPart) {
    switch (bodyPart.toLowerCase()) {
        case "chest": return "#FF6B6B";    // 빨간색
        case "back": return "#4ECDC4";     // 청록색
        case "legs": return "#45B7D1";     // 파란색
        case "shoulders": return "#FFA07A"; // 주황색
        case "arms": return "#98D8C8";     // 민트색
        case "abs": return "#F7DC6F";      // 노란색
        case "cardio": return "#BB8FCE";   // 보라색
        case "full_body": return "#85C1E9"; // 하늘색
        default: return "#BDC3C7";         // 회색
    }
}
```

#### 프론트엔드 차트 컴포넌트 구현

**파일**: `apps/frontend-vite/src/components/health/BodyPartFrequencyChart.tsx`

**주요 특징:**
- 바 차트와 파이 차트 두 가지 시각화 옵션
- 운동 부위별 횟수, 시간, 비율 표시
- 커스텀 툴팁과 반응형 디자인
- 통계 요약 (가장 많이 한 운동, 운동 부위 수, 평균 시간)

```typescript
interface BodyPartFrequencyChartProps {
  bodyPartFrequency: Array<{
    bodyPart: string;
    bodyPartKorean: string;
    count: number;
    duration: number;
    percentage: number;
    color: string;
  }>;
  totalExerciseSessions: number;
  period: 'day' | 'week' | 'month' | 'year';
  chartType?: 'bar' | 'pie';
}

export const BodyPartFrequencyChart: React.FC<BodyPartFrequencyChartProps> = ({
  bodyPartFrequency,
  totalExerciseSessions,
  period,
  chartType = 'bar'
}) => {
  // 데이터가 없는 경우 안전한 폴백 처리
  const safeData = useMemo(() => {
    return bodyPartFrequency && bodyPartFrequency.length > 0 ? bodyPartFrequency : [];
  }, [bodyPartFrequency]);

  // 통계 계산
  const stats = useMemo(() => {
    if (safeData.length === 0) {
      return { mostFrequent: '없음', uniqueParts: 0, averageDuration: 0 };
    }

    const mostFrequent = safeData[0]?.bodyPartKorean || '없음';
    const uniqueParts = safeData.length;
    const totalDuration = safeData.reduce((sum, item) => sum + item.duration, 0);
    const averageDuration = Math.round(totalDuration / safeData.length);

    return { mostFrequent, uniqueParts, averageDuration };
  }, [safeData]);

  // 차트 렌더링 로직...
};
```

### 운동 캘린더 히트맵 구현

**목적**: GitHub 잔디 스타일의 운동 기록 시각화

#### 초기 구현 (12주 버전)

**설계 이유:**
1. **GitHub 잔디 스타일**: GitHub의 contribution 히트맵을 참고
2. **운동 습관 형성 기간**: 운동 습관이 자리잡는데 보통 8-12주가 걸림
3. **분기별 성과**: 3개월 단위로 운동 성과를 보기에 적절
4. **데이터 밀도**: 너무 짧으면 패턴 파악 어렵고, 너무 길면 화면 복잡

#### 1차 수정: 1개월로 변경

**변경 이유**: 사용자 요청 - 1개월이 더 직관적이고 보기 편함

```typescript
// 기존: 12주 (84일)
const calendarData = useMemo(() => {
  // ... 
  for (let i = 83; i >= 0; i--) {
    // 84일 전부터 오늘까지
  }
}, []);

// 수정: 1개월 (30일)
const calendarData = useMemo(() => {
  // ...
  for (let i = 29; i >= 0; i--) {
    // 30일 전부터 오늘까지
  }
}, []);
```

#### 2차 수정: 5주로 최종 변경

**변경 이유**: 
- **주별 패턴**: 정확히 5주 = 5개 행으로 깔끔하게 표시
- **운동 루틴**: 운동 계획을 주 단위로 세우는 것이 일반적
- **습관 추적**: 5주면 새로운 운동 습관이 자리잡는지 확인 가능
- **시각적 완성도**: 5×7 그리드가 히트맵으로 가장 보기 좋음

```typescript
// 최종: 5주 (35일)
const calendarData = useMemo(() => {
  // 현재 주의 일요일을 찾기
  const currentSunday = new Date(today);
  const currentDayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  currentSunday.setDate(today.getDate() - currentDayOfWeek); // 이번 주 일요일로 이동
  
  // 4주 전 일요일부터 시작 (현재 주가 5주차가 되도록)
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - 28); // 4주 전 일요일
  
  // 완전한 5주 = 35일 (5 * 7)
  for (let i = 0; i < 35; i++) {
    // ...
  }
}, []);
```

#### 요일 정렬 문제 해결

**문제**: 6월 23일(월요일)이 토요일 컬럼에 표시되는 오류

**원인**: 단순히 35일을 7개씩 나누어서 주별로 배치했기 때문

**해결책**: 실제 요일에 맞는 캘린더 형태로 변경

```typescript
// 문제가 있던 기존 로직
const weeklyData = useMemo(() => {
  const weeks = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7)); // 단순히 7개씩 분할
  }
  return weeks;
}, [calendarData]);

// 해결된 로직 - 완전한 주 단위로 시작
const calendarData = useMemo(() => {
  // 현재 주의 일요일부터 정확히 5주 생성
  // 이렇게 하면 각 주가 일요일~토요일로 정확히 정렬됨
}, []);

const weeklyData = useMemo(() => {
  if (calendarData.length === 0) return [];
  
  const weeks = [];
  // 정확히 35일(5주)이므로 7일씩 나누기만 하면 됨
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }
  
  return weeks;
}, [calendarData]);
```

#### 주별 통계 정보 추가

**개선 사항**: 빈 셀 대신 각 주별 운동 통계를 표시

```typescript
// 주별 통계 계산
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
```

**UI 구현**:
```tsx
{/* 주차 정보 박스 */}
<div className="w-24 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group relative">
  <div className="text-xs font-bold text-blue-700 text-center mb-1">
    {weekIndex + 1}주차
  </div>
  <div className="text-xs text-blue-600 text-center space-y-0.5">
    <div>🏃 {weeklyStats[weekIndex]?.totalWorkouts || 0}회</div>
    <div>⏱️ {weeklyStats[weekIndex]?.totalMinutes || 0}분</div>
    <div className="text-blue-500">📈 {weeklyStats[weekIndex]?.activeDays || 0}/{weeklyStats[weekIndex]?.daysInWeek || 0}일</div>
  </div>
  
  {/* 호버 시 상세 주별 정보 */}
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
```

#### 시각적 개선사항

**1. 그라데이션 색상과 이모지**:
```typescript
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
```

**2. 크기 확장**:
- 히트맵 셀: `5×5` → `8×8`
- 간격: `gap-1` → `gap-2`
- 패딩: `p-4` → `p-6`

**3. 성취감 있는 통계 카드**:
```tsx
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
      🎯 목표 달성률 {Math.round((stats.totalWorkouts / 35) * 100)}%
    </div>
    <div className="absolute top-2 right-2 text-2xl opacity-20">💪</div>
  </div>
  {/* 다른 통계 카드들... */}
</div>
```

---

## 🔄 최종 업데이트 사항

### 현재 주 위치 조정

**문제**: 현재 주가 중간쯤에 불규칙적으로 위치
**해결**: 현재 주가 항상 5주차(마지막 줄)에 위치하도록 조정

```typescript
// 최종 로직: 현재 주가 마지막에 오도록
const calendarData = useMemo(() => {
  const data: DayData[] = [];
  
  // 현재 주의 일요일을 찾기
  const currentSunday = new Date(today);
  const currentDayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  currentSunday.setDate(today.getDate() - currentDayOfWeek); // 이번 주 일요일로 이동
  
  // 4주 전 일요일부터 시작 (현재 주가 5주차가 되도록)
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - 28); // 4주 전 일요일
  
  // 완전한 5주 = 35일 (5 * 7)
  for (let i = 0; i < 35; i++) {
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
```

**결과**:
- **1주차**: 4주 전
- **2주차**: 3주 전  
- **3주차**: 2주 전
- **4주차**: 1주 전
- **5주차**: 🎯 **현재 주** ← 오늘이 포함된 주

---

## 📊 최종 구현 결과

### 기능 완성도
1. **✅ 실제 DB 데이터 연동**: PostgreSQL에서 실제 운동 데이터 가져오기
2. **✅ 운동 부위별 빈도 차트**: 바 차트 + 파이 차트 두 가지 뷰
3. **✅ 운동 캘린더 히트맵**: GitHub 잔디 스타일의 5주 완전 캘린더
4. **✅ 주별 통계 박스**: 각 주의 운동 횟수, 시간, 활동일 표시
5. **✅ 시각적 개선**: 그라데이션, 이모지, 호버 효과, 성취감 있는 디자인

### 기술적 성과
1. **데이터 정합성**: 백엔드-프론트엔드 완전 연동
2. **사용자 경험**: 직관적이고 시각적으로 매력적인 UI
3. **성능 최적화**: React Query를 통한 효율적인 데이터 캐싱
4. **확장성**: 추가 차트 타입과 기간 설정 지원

### 코드 품질
1. **타입 안전성**: TypeScript를 통한 엄격한 타입 체크
2. **에러 처리**: 데이터 없을 때 안전한 폴백 처리
3. **로깅**: 상세한 로그를 통한 디버깅 지원
4. **메모이제이션**: 성능 최적화를 위한 적절한 캐싱

---

## 🎯 향후 개선 방향

### 단기 개선사항
1. **모바일 반응형**: 모바일 디바이스에서의 최적화
2. **애니메이션**: 더 부드러운 전환 효과
3. **접근성**: 스크린 리더 지원 및 키보드 네비게이션

### 장기 확장 계획
1. **운동 목표 설정**: 주별/월별 운동 목표 설정 기능
2. **소셜 기능**: 친구들과 운동 기록 비교
3. **AI 추천**: 운동 패턴 분석을 통한 개인화된 운동 추천
4. **운동 스트릭**: 연속 운동일 달성 시 보상 시스템

---

## 📝 결론

LifeBit 운동 캘린더 히트맵 개발을 통해 사용자의 운동 데이터를 직관적이고 매력적으로 시각화하는 시스템을 성공적으로 구축했습니다. 특히 실제 DB 데이터 연동 문제를 해결하고, 사용자 피드백을 적극 반영하여 점진적으로 개선해나가는 과정을 통해 완성도 높은 기능을 구현할 수 있었습니다.

**핵심 성과:**
- 🎯 **실제 데이터 활용**: 더미 데이터에서 실제 PostgreSQL 데이터로 전환
- 📊 **다양한 시각화**: 부위별 빈도 차트 + 캘린더 히트맵의 조합
- 🎨 **사용자 경험**: 직관적이고 성취감을 주는 인터페이스
- 🔧 **기술적 완성도**: 안정적이고 확장 가능한 아키텍처

이번 개발을 통해 사용자가 자신의 운동 패턴을 한눈에 파악하고, 운동 습관을 개선할 수 있는 강력한 도구를 제공하게 되었습니다.
</rewritten_file> 