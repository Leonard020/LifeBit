# LifeBit 건강로그 차트 시스템 개발 및 이슈/해결 정리

---

## 1. 개발 목표 및 요구사항

- **차트 종류**: 체중 변화 추이, BMI 변화 추이, 운동 시간
- **기간별**: 일별(7일), 주별(6주), 월별(6개월)
- **Forward Fill**: 건강 기록이 없는 기간에는 직전 유효값을 유지, 운동 기록은 실제 합계만 표시

---

## 2. 주요 이슈 및 원인 파악

### 2.1. 차트 시작점이 0으로 표시되는 문제
- **현상**: 일별 차트의 첫 구간(예: 6월 1일)이 0에서 시작
- **원인**: 표시 기간(7일)만 데이터 조회 → 직전 데이터가 없으면 Forward Fill이 0에서 시작
- **백엔드**: 7일만 조회
- **프론트엔드**: Forward Fill의 초기값이 항상 null

### 2.2. 미래 데이터 누락
- **현상**: 미래 날짜의 운동 기록이 차트에 표시되지 않음
- **원인**: 백엔드에서 현재 날짜까지만 조회

### 2.3. 기간별 데이터 조회 범위 부족
- **현상**: 월별 차트에서 6개월 데이터가 모두 표시되지 않음
- **원인**: 조회 범위가 30일로 제한됨

---

## 3. 조치 및 해결

### 3.1. 백엔드 HealthStatisticsService.java
- **기간별 데이터 조회 범위 확장**
  - 일별: 7일 → 97일 (7 + 90, 3개월 전 데이터 포함)
  - 주별: 42일 → 132일 (42 + 90)
  - 월별: 180일 → 270일 (180 + 90)
  - 연별: 365일 → 455일 (365 + 90)
- **미래 데이터 포함**: endDate를 미래까지 확장

#### 주요 코드 (주석 포함)
```java
// 기간별 건강 기록 조회 헬퍼 메소드
private List<HealthRecord> getHealthRecordsByPeriod(Long userId, String period) {
    int days;
    switch (period.toLowerCase()) {
        case "day":
            days = 97;  // 일별 차트용 7일 + 3개월 전 데이터 (7 + 90 = 97일)
            break;
        case "week":
            days = 132; // 주별 차트용 6주 + 3개월 전 데이터 (42 + 90 = 132일)
            break;
        case "month":
            days = 270; // 월별 차트용 6개월 + 3개월 전 데이터 (180 + 90 = 270일)
            break;
        case "year":
            days = 455; // 연별 차트용 1년 + 3개월 전 데이터 (365 + 90 = 455일)
            break;
        default:
            days = 270; // 기본값 9개월
            break;
    }
    // 3개월 전 데이터까지 포함하여 조회
    log.info("📊 건강 기록 조회 요청 - 사용자: {}, 기간: {}, 일수: {} (3개월 전 데이터 포함)", userId, period, days);
    List<HealthRecord> records = healthRecordService.getRecentHealthRecords(userId, days);
    log.info("📊 건강 기록 조회 완료 - 사용자: {}, 조회된 기록 수: {}", userId, records.size());
    return records;
}
```

### 3.2. 백엔드 ExerciseService.java
- **운동 데이터도 동일하게 3개월 전 데이터까지 조회**

#### 주요 코드 (주석 포함)
```java
// 사용자의 최근 운동 세션 조회 (기간별)
public List<ExerciseSession> getRecentExerciseSessions(Long userId, String period) {
    LocalDate today = LocalDate.now();
    LocalDate startDate;
    LocalDate endDate;
    // 기간에 따른 시작 날짜 계산 (3개월 전 데이터 포함 + 미래 데이터도 포함)
    switch (period.toLowerCase()) {
        case "day":
            startDate = today.minusDays(97);  // 최근 7일 + 3개월 전 데이터
            endDate = today.plusDays(1);      // 내일까지
            break;
        case "week":
            startDate = today.minusDays(132); // 최근 6주 + 3개월 전 데이터
            endDate = today.plusWeeks(1);     // 다음 주까지
            break;
        case "month":
            startDate = today.minusDays(270); // 최근 6개월 + 3개월 전 데이터
            endDate = today.plusMonths(1);    // 다음 달까지
            break;
        case "year":
            startDate = today.minusDays(455); // 최근 1년 + 3개월 전 데이터
            endDate = today.plusYears(1);     // 다음 년까지
            break;
        default:
            startDate = today.minusDays(270); // 기본값: 9개월
            endDate = today.plusMonths(1);    // 다음 달까지
    }
    User user = userRepository.getReferenceById(userId);
    return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
            user, startDate, endDate);
}
```

### 3.3. 프론트엔드 StatisticsCharts.tsx
- **Forward Fill 로직 개선**: 표시 기간 이전의 과거 데이터에서 가장 최근 유효값을 찾아 초기값으로 사용
- **차트 시작점이 0이 아닌 직전 데이터로 표시됨**

#### 주요 코드 (주석 포함)
```typescript
// Forward Fill을 위한 초기값 설정: 가장 최근의 유효한 과거 데이터 찾기
let lastValidValue: number | null = null;
// 표시 기간 시작일 계산
let periodStartDate: Date;
if (period === 'day') {
  periodStartDate = new Date(today);
  periodStartDate.setDate(today.getDate() - 6); // 7일 전
} else if (period === 'week') {
  periodStartDate = new Date(today);
  periodStartDate.setDate(today.getDate() - (5 * 7)); // 6주 전
} else {
  periodStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); // 6개월 전
}
// 표시 기간 이전의 데이터에서 가장 최근 유효값 찾기
const pastData = sortedData.filter(item => {
  const itemDate = new Date(item[dateField] as string);
  return itemDate < periodStartDate;
});
if (pastData.length > 0) {
  for (let i = pastData.length - 1; i >= 0; i--) {
    const val = Number(pastData[i][valueField]);
    if (!isNaN(val) && val > 0) {
      lastValidValue = val;
      console.log(`🔍 [${period}] 과거 데이터에서 초기값 설정: ${lastValidValue} (날짜: ${pastData[i][dateField]})`);
      break;
    }
  }
}
```

---

## 4. 결과 및 효과

- **차트 시작점이 0이 아닌 직전 데이터로 자연스럽게 표시됨**
- **Forward Fill 로직이 UX를 개선**
- **6개월/6주/7일 등 기간별로 과거 데이터가 충분히 반영됨**
- **운동 데이터도 미래 기록까지 포함하여 정확하게 표시**

---

## 5. 참고/추가 개선점
- 데이터가 너무 오래된 경우(예: 1년 이상 전)는 별도 안내 가능
- 프론트엔드와 백엔드의 기간 계산 기준을 항상 맞추는 것이 중요 