# LifeBit Health Analytics – 개발 진행 및 수정 사항 종합 정리

> **문서 버전:** 2025-06-29

이 문서는 최근 프론트엔드(React/Vite) ‑ 백엔드(Spring Boot) 건강 분석 기능 개발 과정에서 발생한 이슈, 원인 파악, 조치 및 코드 업데이트 내역을 **세부 주석**과 함께 기록한 문서입니다.

---

## 1. 칼로리 섭취 추이(영양소) 차트 데이터 미표시

| 구분 | 내용 |
| --- | --- |
| **증상** | Nutrition 탭의 **"칼로리 섭취 추이"** 차트가 비어 있음. |
| **원인** | 프론트엔드가 `calories_per_100g`, `amount` 필드를 사용했으나,<br/>백엔드 `/api/health-statistics`는 `calories`, `quantity` 필드를 반환. |
| **조치** | 1. `PythonAnalyticsCharts.tsx` 에서 필드명을 교정.<br/>2. 임시 계산 로직 제거, 실제 **일일 영양 통계**( `useHealthStatistics(userId, 'day')` ) 호출로 대체.<br/>3. 누적 값 계산식을 `Math.round(total)` 로 변경하여 소수점 정리. |
| **결과** | 차트에 정상 데이터 렌더링. |

### 1-1. 주요 코드 변경 (발췌)
```tsx
// ... existing code ...
// ✅ 실제 영양소 통계를 위한 day period 호출 추가
const { data: nutritionStats } = useHealthStatistics(userId.toString(), 'day');

// ➊ 잘못된 기존 참조
// calories += item.calories_per_100g * item.amount;
// ➋ 교정된 참조
calories += item.calories * item.quantity;
// ... existing code ...
```

---

## 2. `GET /env.js` 404 오류

| 구분 | 내용 |
| --- | --- |
| **증상** | 로컬 개발 환경에서 콘솔에 404(`GET /env.js`) 발생. |
| **원인** | `index.html` 내 `<script src="/env.js">` 태그는 **Docker 빌드 시** nginx 가 동적으로 파일을 생성하지만, 로컬 `vite dev` 서버에는 존재하지 않음. |
| **조치** | 1. `index.html` 스크립트를 **프로덕션 환경에서만** 로드하도록 조건 분기:<br/>
```html
<!-- index.html (snippet) -->
<script>
  if (import.meta.env.PROD) {
    const script = document.createElement('script');
    script.src = '/env.js';
    document.head.appendChild(script);
  }
</script>
```
2. 리포지토리에 하드-코딩된 `env.js` 추가 금지. |
| **결과** | 개발 환경에서 404 경고 제거, 프로덕션(도커)에서는 기존 로직 유지. |

---

## 3. 목표 달성률(운동/영양/전체) 0% 문제

### 3-1. 원인 분석
1. **프론트엔드** `PythonAnalyticsCharts` 가 최신 목표·통계 데이터를 올바르게 매핑하지 못함.<br/>
2. **백엔드** 측 `UserGoalController` 가 *목표 미설정 사용자*에 대해 `null`을 반환 → 프론트 계산 실패.

### 3-2. 백엔드 개선 – `UserGoalController`
* **기본 목표 반환:** `userGoalService.getUserGoalOrDefault(userId)` 호출로 **디폴트 목표**를 제공.
* **중복 INSERT 방지:** `createUserGoal` 에서 `isSameGoal()` 체크 후 동일 목표는 재삽입하지 않음.
* **로깅·예외 처리 강화:** `log.info/warn/error` 로 행위별 상세 로그 남김.

```java
// (발췌) apps/core-api-spring/.../UserGoalController.java
// ✅ 목표가 없으면 기본값으로 설정된 목표를 반환
UserGoal userGoal = userGoalService.getLatestUserGoal(userId);
if (userGoal == null) {
    userGoal = userGoalService.getUserGoalOrDefault(userId);
}
```

### 3-3. 프론트엔드 개선 – `PythonAnalyticsCharts`
* `goalPeriod` state(`'day' | 'week' | 'month'`) 추가 → 사용자 UI 와 연동.
* 목표/실적 비교 시 **기간별 합계** 유틸 함수(`getExerciseTarget`, `getNutritionTarget`) 구현.
* 상세 디버그 로그 삽입 → 콘솔에서 `healthRecords`, `exerciseSessions` 등 배열 여부·길이 확인.

```tsx
// 목표 달성률 계산 예시 (발췌)
const exerciseTarget = getExerciseTarget(goalPeriod);
const exerciseAchieved = totalExerciseMinutes;
const exerciseRate = exerciseTarget ? (exerciseAchieved / exerciseTarget) * 100 : 0;
```

### 3-4. 결과
* 목표 데이터가 존재하지 않아도 **기본값(0 또는 시스템 정의 값)** 으로 계산 가능.
* 목표 변경 이력 보존 + 중복 생성 방지 = 데이터 정합성 확보.

---

## 4. 추가 개발/리팩터링 사항

| 영역 | 주요 내용 |
| --- | --- |
| **데이터 로딩 최적화** | React-Query `isLoading` 결합 → 스피너 1회 표시. |
| **콘솔 디버깅** | `console.group` 으로 인증·데이터 상태 일괄 출력. |
| **타입 강화** | `MealLogWithFoodItem` 확장 인터페이스로 `food_item` 내부 영양 필드 optional 처리. |
| **성능** | `useMemo` 로 기간별 차트 데이터 계산 캐싱. |
| **UI/UX** | `goalPeriod` 버튼 그룹, 리프레시 아이콘(`RefreshCw`) 추가. |

---

## 5. 앞으로의 TODO
1. 백엔드 **HealthStatisticsService** 에 월/연 단위 총합 API 추가.
2. 프론트엔드 차트 모듈 별도 훅(`useHealthChartData`) 분리 → 재사용성 향상.
3. 시맨틱 버전 태깅 & ‑changelog 자동 생성(GitHub Actions) 연동.

---

### 문의 / 확인 사항
* 문서 관련 문의나 내용 추가 요청은 Discord **#lifebit-dev** 채널에 남겨주세요.

---

*(C) 2025 LifeBit Dev-Team – All rights reserved.* 