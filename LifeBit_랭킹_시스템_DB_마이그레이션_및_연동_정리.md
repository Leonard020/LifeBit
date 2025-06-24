# LifeBit 랭킹 시스템 DB 마이그레이션 및 연동 정리

## 1. 목적
- LifeBit 프로젝트의 랭킹 시스템이 SQL, 백엔드, 프론트엔드에서 일관성 있게 동작하도록 DB 구조 및 데이터 동기화, 컬럼 추가, 등급 매핑, 연동 체크리스트를 정리합니다.

## 2-1. 랭킹 등급 산정 기준 및 등급표

### ● 랭킹 점수 산정 공식
- **운동**: (운동 시간(분) × 2) + (칼로리 소모 × 0.5)
- **식단**: (목표 달성률 × 1)
- **출석**: (연속 출석일 × 10)
- **업적**: (업적 개수 × 50)
- 각 항목 점수 합산 → `total_score`로 저장

### ● 등급 구간/명칭/색상/설명/보상
| 등급(Tier)      | 점수 구간           | 색상 코드   | 한글명         | 설명                | 보상 예시         |
|----------------|---------------------|-------------|---------------|---------------------|-------------------|
| UNRANK         | 0 ~ 99              | #bdbdbd     | 언랭크        | 랭킹 미달성         | 참여상            |
| BRONZE         | 100 ~ 499           | #cd7f32     | 브론즈        | 기본 활동 등급      | 브론즈 뱃지       |
| SILVER         | 500 ~ 999           | #c0c0c0     | 실버          | 꾸준한 활동 등급    | 실버 뱃지         |
| GOLD           | 1000 ~ 1999         | #ffd700     | 골드          | 상위 30% 등급       | 골드 뱃지         |
| PLATINUM       | 2000 ~ 2999         | #e5e4e2     | 플래티넘      | 상위 15% 등급       | 플래티넘 뱃지     |
| DIAMOND        | 3000 ~ 3999         | #00bfff     | 다이아        | 상위 7% 등급        | 다이아 뱃지       |
| MASTER         | 4000 ~ 4999         | #a020f0     | 마스터        | 상위 3% 등급        | 마스터 뱃지       |
| GRANDMASTER    | 5000 ~ 5999         | #ff4500     | 그랜드마스터  | 상위 1% 등급        | 그랜드마스터 뱃지 |
| CHALLENGER     | 6000 이상           | #ff1493     | 챌린저        | 최상위 0.1% 등급    | 챌린저 뱃지+특별보상|

- 등급 구간/점수/색상/설명/보상은 정책에 따라 자유롭게 조정 가능
- 백엔드 Enum, 프론트 매핑 상수, DB tier 컬럼 값이 일치해야 전체 연동이 정상 동작

---

## 2. user_ranking 테이블 컬럼/인덱스 추가

```sql
ALTER TABLE user_ranking
  ADD COLUMN IF NOT EXISTS tier VARCHAR(32) DEFAULT 'UNRANK',
  ADD COLUMN IF NOT EXISTS rank_position INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS season INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_user_ranking_total_score ON user_ranking(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_ranking_user_id ON user_ranking(user_id);
```

---

## 3. ranking_history 테이블 컬럼/인덱스 추가

```sql
ALTER TABLE ranking_history
  ADD COLUMN IF NOT EXISTS tier VARCHAR(32),
  ADD COLUMN IF NOT EXISTS user_id BIGINT;
```

---

## 4. 등급 구간별 tier 값 일괄 업데이트

```sql
UPDATE user_ranking SET tier = 'UNRANK'      WHERE total_score < 100;
UPDATE user_ranking SET tier = 'BRONZE'      WHERE total_score >= 100   AND total_score < 500;
UPDATE user_ranking SET tier = 'SILVER'      WHERE total_score >= 500   AND total_score < 1000;
UPDATE user_ranking SET tier = 'GOLD'        WHERE total_score >= 1000  AND total_score < 2000;
UPDATE user_ranking SET tier = 'PLATINUM'    WHERE total_score >= 2000  AND total_score < 3000;
UPDATE user_ranking SET tier = 'DIAMOND'     WHERE total_score >= 3000  AND total_score < 4000;
UPDATE user_ranking SET tier = 'MASTER'      WHERE total_score >= 4000  AND total_score < 5000;
UPDATE user_ranking SET tier = 'GRANDMASTER' WHERE total_score >= 5000  AND total_score < 6000;
UPDATE user_ranking SET tier = 'CHALLENGER'  WHERE total_score >= 6000;
```

---

## 5. ranking_history 테이블 user_id, tier 값 동기화

```sql
-- user_id 동기화 (user_ranking_id → user_id)
UPDATE ranking_history rh
SET user_id = ur.user_id
FROM user_ranking ur
WHERE rh.user_ranking_id = ur.id;

-- tier 동기화 (user_id 기준)
UPDATE ranking_history rh
SET tier = ur.tier
FROM user_ranking ur
WHERE rh.user_id = ur.user_id;
```

---

## 6. 더미 데이터 삽입 예시 (테스트용)

```sql
INSERT INTO user_ranking (user_id, total_score, tier, rank_position, streak_days, is_active)
VALUES (1, 1200, 'GOLD', 1, 10, TRUE),
       (2, 800, 'SILVER', 2, 5, TRUE);
```

---

## 7. 프론트-백엔드-DB 연동 체크리스트

- [x] user_ranking 테이블에 tier 컬럼 및 랭킹 관련 컬럼/인덱스 추가
- [x] ranking_history 테이블에 tier, user_id 컬럼 추가 및 동기화
- [x] 등급 구간별 tier 값 일괄 업데이트
- [x] 프론트엔드에서 tier/colorCode 등급 정보 정상 표시
- [x] 백엔드에서 tier/colorCode 필드 포함 응답
- [x] 랭킹 산정/갱신 로직 정상 동작 확인
- [x] 더미 데이터로 테스트 및 실제 데이터 반영

---

## 8. 참고 사항 및 추가 팁

- 등급 구간/점수 기준은 정책에 맞게 자유롭게 조정 가능
- ranking_history에 user_ranking_id가 없으면 테이블 구조에 맞게 쿼리 수정 필요
- 인덱스 추가로 랭킹 조회 성능 향상
- 컬럼/인덱스가 이미 있으면 IF NOT EXISTS로 안전하게 처리
- DB 구조/데이터가 다를 경우, 테이블 구조를 먼저 확인 후 쿼리 수정

---

## 9. 적용 순서 요약

1. 위 쿼리 전체를 복사해서 DB에 실행 (컬럼/인덱스/데이터 동기화)
2. Spring 서버 재시작
3. 프론트 새로고침 후 등급/랭킹 정상 표시 확인

---

**이 문서만 따라하면 LifeBit 랭킹 시스템의 DB, 백엔드, 프론트 연동이 완벽하게 준비됩니다!**

추가 문의/확인 사항이 있으면 언제든 기록/문의하세요. 