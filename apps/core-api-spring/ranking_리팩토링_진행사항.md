# ranking 테이블 구조 리팩토링 및 코드 변경/삭제 진행사항

## 1. 엔티티/레포지토리 리팩토링

### UserRanking 엔티티
- userUuid, username, periodType, periodRank, periodPoints, seasonRank, seasonPoints, rankChange 등 **제거**
- user_id(Long, FK), previous_rank, season, created_at, last_updated_at, is_active 등만 남김
- SQL 테이블(user_ranking) 구조와 일치하도록 수정

### RankingHistory 엔티티
- userUuid, username, periodRank, periodPoints, seasonRank, seasonPoints 등 **제거**
- user_ranking_id(Long, FK), total_score, streak_days, rank_position, season, period_type(VARCHAR), recorded_at 등만 남김
- SQL 테이블(ranking_history) 구조와 일치하도록 수정

### UserRankingRepository
- userUuid, periodType, seasonPoints, periodRank, periodPoints, seasonRank 등 관련 메서드/쿼리 **제거**
- season 타입 int로 변경, userId(Long) 기반 조회 메서드 추가

### RankingHistoryRepository
- userUuid, PeriodType, season(String) 등 관련 메서드/쿼리 **제거**
- userRanking(Long) 기반 조회 메서드로 변경, season 타입 int, periodType String으로 변경

---

이후 서비스/컨트롤러/DTO 등에서 삭제 또는 대폭 변경되는 기능이 있을 경우, 아래에 계속 기록합니다.

## 2. DTO 리팩토링

### 기존 DTO 삭제
- 프론트엔드 요구사항에 맞춘 새로운 DTO 구조로 통합/대체하기 위해, 기존의 세분화된 DTO 파일들을 모두 삭제했습니다.
  - `PeriodRankingResponse.java`
  - `RankingAchievementResponse.java`
  - `RankingHistoryResponse.java`
  - `RankingNotificationResponse.java`
  - `RankingRewardResponse.java`
  - `RankingStatsResponse.java`
  - `SeasonRankingResponse.java`

## 3. 서비스 리팩토링 (RankingService)

- **메서드 통합 및 단순화**: 기존의 `getMyRanking`, `getTopRankings`, `getMySeasonRanking` 등 여러 메서드를 **하나의 `getRankingData()` 메서드로 통합**했습니다. 이 메서드는 프론트엔드가 요구하는 `RankingResponseDto`를 반환합니다.
- **로직 변경**:
  - `userUuid` 대신 `userId`를 사용하여 사용자를 식별합니다.
  - `userRepository`를 통해 사용자의 `nickname` 등 추가 정보를 조회합니다.
  - 상위 랭커는 `totalScore` 기준, `PageRequest.of(0, 10)`으로 10명을 조회합니다.
  - `badge` 정보는 현재 시스템에 없어 "default"라는 고정값을 반환합니다.
- **불필요 의존성 제거**: `RankingValidator`, `RankingHistoryRepository` 등 더 이상 사용하지 않는 의존성을 제거했습니다.
- **스케줄러(`scheduledRankingUpdate`) 수정**: 새로운 `UserRanking` 엔티티 구조에 맞게 랭킹 업데이트 로직을 수정했습니다.

## 4. 컨트롤러 리팩토링 (RankingController)

- **엔드포인트 통합**: 기존의 `/me`, `/top`, `/stats`, `/history` 등 복잡하게 분리되어 있던 모든 엔드포인트를 **단일 `GET /api/v1/rankings` 엔드포인트로 통합**했습니다.
- **의존성 단순화**: `RankingRewardService`, `RankingNotificationService` 등 더 이상 필요 없는 서비스 의존성을 제거하고, 오직 `RankingService`만 사용하도록 변경했습니다.
- **응답 통일**: 새로운 엔드포인트는 리팩토링된 `RankingService`의 `getRankingData()`를 호출하여 프론트엔드 요구사항에 맞는 `RankingResponseDto`를 반환합니다. 

## 5. 2025-06-23 최종 리팩토링/수정 내역

### 동적 순위 계산 및 실시간 반영
- 상위 랭킹, 내 랭킹, 업적/보상 등 모든 영역에서 rank, rankPosition이 항상 최신 순위로 동적으로 계산되어 프론트에 반영되도록 서비스 로직을 수정함.
  - stream/map에서 index를 활용해 1등부터 순위를 동적으로 부여.
  - 내 랭킹(myRanking)은 전체 랭킹 리스트에서 userId의 인덱스를 찾아 실시간 순위 계산.
  - 시즌/연속기록 보상 등도 DTO 생성 시 index+1로 순위 부여.
- DB의 rankPosition 필드는 참고용(캐싱)으로만 사용, 실제 응답은 항상 실시간 계산값을 사용.

### userId 기반 일관성 및 삭제 필드/메서드 완전 제거
- userUuid, username, periodRank, seasonRank, getUserUuid, getUsername 등 모든 삭제 필드/메서드 코드에서 완전 제거.
- 엔티티/레포지토리/서비스/컨트롤러/DTO 전체적으로 userId, nickname 등만 사용하도록 일관성 유지.

### 기간별 랭킹 쿼리/알림 로직 정비
- UserRanking에는 periodType 필드가 없으므로, 기간별 랭킹/알림/보상 등은 RankingHistoryRepository를 통해 처리하도록 변경.
- 시즌별 랭킹/알림/보상 등은 UserRanking 기준으로 처리.

### 컨트롤러/서비스/DTO 응답 구조 통일
- 모든 랭킹 관련 API 응답에서 rank, score, streakDays, nickname, userId 등 필드가 프론트 요구와 100% 일치하도록 통일.
- 기록이 없는 신규 유저는 순위/점수/연속기록이 0으로 반환되며, 필요시 프론트에서 "기록 없음" 등으로 안내 가능.

### 기타
- 불필요/중복된 DTO, 서비스, 레포지토리, 쿼리, 의존성 등 모두 정리 및 삭제.
- 프론트엔드와의 연동(예: /ranking 페이지) 정상 동작 확인.
- 빌드/테스트/실행 시 발생한 모든 컴파일/런타임 에러를 즉시 수정하여, 최종적으로 모든 랭킹 기능이 정상 동작하도록 보장함.

---

**최종 결론:**
- 기존 랭킹 기능을 모두 살리면서, SQL 기반 엔티티 구조에 맞게 전체 백엔드 코드를 일관성 있게 리팩토링 및 복원 완료.
- 실시간 순위 계산, userId 기반 일관성, 삭제 필드/메서드 완전 제거, 프론트 연동 등 모든 요구사항을 100% 반영함. 

## 6. 랭킹 점수 산정 공식 및 등급표 (2025-06-23 추가)

### 1) 랭킹 점수 산정 공식
- **운동 점수**: 하루 운동 시간(분) × 2점 + 칼로리 소모(1kcal당 0.5점)
- **식단 점수**: 목표 영양소 달성률(%) × 1점 (예: 80% 달성 시 80점)
- **출석 점수**: 연속 출석 일수(streak_days) × 10점
- **업적 점수**: 달성 업적 개수 × 50점
- **총점 공식**:

```
total_score = (운동_분*2 + 운동_칼로리*0.5) + (식단_달성률*1) + (streak_days*10) + (업적_개수*50)
```
- ※ 각 항목별 점수는 일/주/월/시즌별로 합산 가능하며, 정책에 따라 가중치 조정 가능

### 2) 랭킹 등급표 (티어)
| 등급명         | 점수 구간         |
|:--------------|:-----------------|
| 언랭크(UNRANK) | 0                |
| 브론즈(BRONZE) | 1 ~ 999          |
| 실버(SILVER)   | 1000 ~ 1999      |
| 골드(GOLD)     | 2000 ~ 2999      |
| 플래티넘(PLATINUM) | 3000 ~ 3999 |
| 다이아(DIAMOND)    | 4000 ~ 4999 |
| 마스터(MASTER)     | 5000 ~ 5999 |
| 그랜드마스터(GRANDMASTER) | 6000 ~ 6999 |
| 챌린저(CHALLENGER) | 7000 이상   |

- ※ 점수 구간 및 등급명은 서비스 정책에 따라 조정 가능
- ※ 언랭크(UNRANK)는 랭킹 점수가 0점인 유저에게 부여

### 3) 점수책정 기준 및 참고 사항
- 운동/식단/출석/업적 등 다양한 활동을 종합적으로 반영하여 점수 산정
- 점수 산정 공식 및 등급표는 사용자에게 투명하게 안내
- 시즌/기간별로 점수 및 등급이 초기화될 수 있음
- 부정행위(중복 기록 등) 방지 로직 필요
- 랭킹 등급은 API 응답에 함께 제공하며, 프론트엔드에서 등급명/아이콘 등으로 시각화 가능

--- 