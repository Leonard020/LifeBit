-- 1. user_ranking 테이블 컬럼 추가 (이미 있으면 생략)
ALTER TABLE user_ranking
  ADD COLUMN IF NOT EXISTS tier VARCHAR(32) DEFAULT 'UNRANK',
  ADD COLUMN IF NOT EXISTS rank_position INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS season INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMP DEFAULT NOW();

-- 2. ranking_history 테이블에 등급/유저 컬럼 추가 (이미 있으면 생략)
ALTER TABLE ranking_history
  ADD COLUMN IF NOT EXISTS tier VARCHAR(32),
  ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- 3. 인덱스 추가 (랭킹 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_ranking_total_score ON user_ranking(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_ranking_user_id ON user_ranking(user_id);

-- 4. 등급 구간별 tier 값 일괄 업데이트 (점수 기준, 필요에 따라 조정)
UPDATE user_ranking SET tier = 'UNRANK'      WHERE total_score < 100;
UPDATE user_ranking SET tier = 'BRONZE'      WHERE total_score >= 100   AND total_score < 500;
UPDATE user_ranking SET tier = 'SILVER'      WHERE total_score >= 500   AND total_score < 1000;
UPDATE user_ranking SET tier = 'GOLD'        WHERE total_score >= 1000  AND total_score < 2000;
UPDATE user_ranking SET tier = 'PLATINUM'    WHERE total_score >= 2000  AND total_score < 3000;
UPDATE user_ranking SET tier = 'DIAMOND'     WHERE total_score >= 3000  AND total_score < 4000;
UPDATE user_ranking SET tier = 'MASTER'      WHERE total_score >= 4000  AND total_score < 5000;
UPDATE user_ranking SET tier = 'GRANDMASTER' WHERE total_score >= 5000  AND total_score < 6000;
UPDATE user_ranking SET tier = 'CHALLENGER'  WHERE total_score >= 6000;

-- 5. ranking_history.user_id 값 동기화 (user_ranking_id → user_id)
UPDATE ranking_history rh
SET user_id = ur.user_id
FROM user_ranking ur
WHERE rh.user_ranking_id = ur.id;

-- 6. ranking_history.tier 값 동기화 (user_id 기준)
UPDATE ranking_history rh
SET tier = ur.tier
FROM user_ranking ur
WHERE rh.user_id = ur.user_id;

-- 7. (선택) 더미 데이터 삽입 예시
-- INSERT INTO user_ranking (user_id, total_score, tier, rank_position, streak_days, is_active)
-- VALUES (1, 1200, 'GOLD', 1, 10, TRUE), (2, 800, 'SILVER', 2, 5, TRUE);

-- 8. (선택) 기타 필요한 컬럼/인덱스 추가 (예: 시즌별 인덱스, created_at/last_updated_at 인덱스 등)