-- 트리거 추가 업적/뱃지 계산 로직 함수(progress 집계 다름)
--누적형(ex. 총 운동 횟수, 총 식단 기록)
--연속형(ex. 연속 운동/식단 기록)
--특정 요일/시간대(ex. 아침 운동, 주말 운동)
--특정 값 도달(ex. 체중 목표, 칼로리 소모)


-- [누적 운동 기록 업적] (ex. 운동 초보자, 운동 애호가, 100회 돌파, 운동 매니아)
CREATE OR REPLACE FUNCTION calc_workout_progress(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [누적 식단 기록 업적] (ex. 식단 기록자, 균형 식단)
CREATE OR REPLACE FUNCTION calc_meal_progress(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(DISTINCT meal_logs.log_date) INTO cnt
    FROM meal_logs
    WHERE meal_logs.user_id = p_user_id
      AND meal_logs.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [연속 운동 기록 업적] (ex. 주간 전사, 2주 챌린지, 월간 마스터, 3개월 챌린지, 6개월 레전드, 꾸준함의 시작)
CREATE OR REPLACE FUNCTION calc_workout_streak(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    max_streak INTEGER := 0;
    cur_streak INTEGER := 0;
    prev_date DATE := NULL;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT exercise_sessions.exercise_date::date AS d
        FROM exercise_sessions
        WHERE exercise_sessions.user_id = p_user_id
          AND exercise_sessions.validation_status = 'VALIDATED'
        ORDER BY d
    LOOP
        IF prev_date IS NULL OR rec.d = prev_date + 1 THEN
            cur_streak := cur_streak + 1;
        ELSE
            cur_streak := 1;
        END IF;
        IF cur_streak > max_streak THEN
            max_streak := cur_streak;
        END IF;
        prev_date := rec.d;
    END LOOP;
    RETURN max_streak;
END;
$$ LANGUAGE plpgsql;

-- [연속 식단 기록 업적] (ex. 식단 전문가, 식단 완벽주의자)
CREATE OR REPLACE FUNCTION calc_meal_streak(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    max_streak INTEGER := 0;
    cur_streak INTEGER := 0;
    prev_date DATE := NULL;
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT meal_logs.log_date::date AS d
        FROM meal_logs
        WHERE meal_logs.user_id = p_user_id
          AND meal_logs.validation_status = 'VALIDATED'
        ORDER BY d
    LOOP
        IF prev_date IS NULL OR rec.d = prev_date + 1 THEN
            cur_streak := cur_streak + 1;
        ELSE
            cur_streak := 1;
        END IF;
        IF cur_streak > max_streak THEN
            max_streak := cur_streak;
        END IF;
        prev_date := rec.d;
    END LOOP;
    RETURN max_streak;
END;
$$ LANGUAGE plpgsql;

-- [아침 운동 업적] (ex. 아침 운동러, 아침형 인간, 아침 운동 마스터)
CREATE OR REPLACE FUNCTION calc_morning_workout(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.time_period = 'morning'
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [저녁 운동 업적] (ex. 저녁 운동러, 저녁 루틴 마스터, 저녁 운동 전문가)
CREATE OR REPLACE FUNCTION calc_night_workout(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.time_period = 'night'
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [주말 운동 업적] (ex. 주말 전사, 주말 활동가, 주말 운동 킹)
CREATE OR REPLACE FUNCTION calc_weekend_workout(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND EXTRACT(ISODOW FROM exercise_sessions.exercise_date) IN (6, 7)
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [유산소 운동 업적] (ex. 유산소 초보자, 유산소 매니아, 유산소 킹)
CREATE OR REPLACE FUNCTION calc_cardio_workout(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions es
    JOIN exercise_catalog ec ON es.exercise_catalog_id = ec.exercise_catalog_id
    WHERE es.user_id = p_user_id
      AND ec.exercise_type = 'aerobic'
      AND es.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [근력 운동 업적] (ex. 근력 초보자, 근력 향상자, 근력 킹)
CREATE OR REPLACE FUNCTION calc_strength_workout(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM exercise_sessions es
    JOIN exercise_catalog ec ON es.exercise_catalog_id = ec.exercise_catalog_id
    WHERE es.user_id = p_user_id
      AND ec.exercise_type = 'strength'
      AND es.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [체중 기록 업적] (ex. 체중 관리자, 체중 관리 전문가, 체중 변화 추적자)
CREATE OR REPLACE FUNCTION calc_weight_record_count(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM health_records
    WHERE health_records.user_id = p_user_id;
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [목표 체중 달성 업적] (ex. 체중 감량 성공, 체중 관리 마스터, 완벽한 변화)
-- (목표 체중 파라미터 필요, 임시로 60kg로 예시)
CREATE OR REPLACE FUNCTION calc_weight_goal_achieved(p_user_id BIGINT, target_weight DECIMAL)
RETURNS INTEGER AS $$
DECLARE
    achieved INTEGER := 0;
BEGIN
    SELECT 1 INTO achieved
    FROM health_records
    WHERE health_records.user_id = p_user_id
      AND weight <= target_weight
    LIMIT 1;
    RETURN COALESCE(achieved, 0);
END;
$$ LANGUAGE plpgsql;

-- [총 칼로리 소모 업적] (ex. 칼로리 버너, 칼로리 소모 킹, 칼로리 소모 레전드)
CREATE OR REPLACE FUNCTION calc_total_calories_burned(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(exercise_sessions.calories_burned), 0) INTO total
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- [총 운동 시간 업적] (ex. 피트니스 구루)
CREATE OR REPLACE FUNCTION calc_total_workout_minutes(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COALESCE(SUM(exercise_sessions.duration_minutes), 0) INTO total
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- [다양한 운동 업적] (ex. 운동 다양성, 운동 전문가, 운동 올라운더)
CREATE OR REPLACE FUNCTION calc_unique_exercise_count(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(DISTINCT exercise_sessions.exercise_catalog_id) INTO cnt
    FROM exercise_sessions
    WHERE exercise_sessions.user_id = p_user_id
      AND exercise_sessions.validation_status = 'VALIDATED';
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [하루 운동+식단 모두 기록 업적] (ex. 건강한 하루, 건강한 생활, 건강 생활 마스터, 건강 생활 레전드)
CREATE OR REPLACE FUNCTION calc_perfect_day(p_user_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM (
        SELECT e.d
        FROM (
            SELECT DISTINCT exercise_sessions.exercise_date::date AS d
            FROM exercise_sessions
            WHERE exercise_sessions.user_id = p_user_id
              AND exercise_sessions.validation_status = 'VALIDATED'
        ) e
        INNER JOIN (
            SELECT DISTINCT meal_logs.log_date AS d
            FROM meal_logs
            WHERE meal_logs.user_id = p_user_id
              AND meal_logs.validation_status = 'VALIDATED'
        ) m ON e.d = m.d
    ) days;
    RETURN cnt;
END;
$$ LANGUAGE plpgsql;

-- [운동 기록 시 업적 progress 자동 갱신 트리거]
CREATE OR REPLACE FUNCTION update_workout_achievement_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 누적 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_workout_progress(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.badge_type = 'WORKOUT_GOAL'
      AND a.title NOT LIKE '%아침%' AND a.title NOT LIKE '%저녁%' AND a.title NOT LIKE '%주말%' AND a.title NOT LIKE '%유산소%' AND a.title NOT LIKE '%근력%' AND a.title NOT LIKE '%다른 운동%' AND a.title NOT LIKE '%운동 목표%' AND a.title NOT LIKE '%칼로리%' AND a.title NOT LIKE '%운동 시간%';

    -- 연속 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_workout_streak(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND (a.badge_type = 'STREAK_7' OR a.badge_type = 'STREAK_30' OR a.badge_type = 'STREAK_100');

    -- 아침 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_morning_workout(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%아침 운동%';

    -- 저녁 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_night_workout(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%저녁 운동%';

    -- 주말 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_weekend_workout(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%주말 운동%';

    -- 유산소 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_cardio_workout(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%유산소%';

    -- 근력 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_strength_workout(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%근력%';

    -- 다양한 운동 업적
    UPDATE user_achievements ua
    SET progress = calc_unique_exercise_count(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%다른 운동%';

    -- 칼로리 소모 업적
    UPDATE user_achievements ua
    SET progress = calc_total_calories_burned(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%칼로리 소모%';

    -- 총 운동 시간 업적
    UPDATE user_achievements ua
    SET progress = calc_total_workout_minutes(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.title LIKE '%운동 시간%';

    -- 하루 운동+식단 기록 업적
    UPDATE user_achievements ua
    SET progress = calc_perfect_day(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND (a.title LIKE '%건강한 하루%' OR a.title LIKE '%건강한 생활%' OR a.title LIKE '%건강 생활 마스터%' OR a.title LIKE '%건강 생활 레전드%');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_achievement_progress_trigger
AFTER INSERT OR UPDATE ON exercise_sessions
FOR EACH ROW
EXECUTE FUNCTION update_workout_achievement_progress();

-- [식단 기록 시 업적 progress 자동 갱신 트리거]
CREATE OR REPLACE FUNCTION update_meal_achievement_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 누적 식단 업적
    UPDATE user_achievements ua
    SET progress = calc_meal_progress(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.badge_type = 'NUTRITION_GOAL'
      AND a.title NOT LIKE '%연속%' AND a.title NOT LIKE '%완벽주의자%';

    -- 연속 식단 업적
    UPDATE user_achievements ua
    SET progress = calc_meal_streak(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND (a.title LIKE '%연속%' OR a.title LIKE '%완벽주의자%');

    -- 하루 운동+식단 기록 업적
    UPDATE user_achievements ua
    SET progress = calc_perfect_day(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND (a.title LIKE '%건강한 하루%' OR a.title LIKE '%건강한 생활%' OR a.title LIKE '%건강 생활 마스터%' OR a.title LIKE '%건강 생활 레전드%');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_achievement_progress_trigger
AFTER INSERT OR UPDATE ON meal_logs
FOR EACH ROW
EXECUTE FUNCTION update_meal_achievement_progress();

-- [체중 기록 시 업적 progress 자동 갱신 트리거]
CREATE OR REPLACE FUNCTION update_weight_achievement_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- 체중 기록 업적
    UPDATE user_achievements ua
    SET progress = calc_weight_record_count(NEW.user_id)
    FROM achievements a
    WHERE ua.user_id = NEW.user_id
      AND ua.achievement_id = a.achievement_id
      AND a.badge_type = 'WEIGHT_GOAL'
      AND a.title NOT LIKE '%목표 체중%' AND a.title NOT LIKE '%완벽한 변화%' AND a.title NOT LIKE '%체중 변화 추적자%';

    -- 목표 체중 달성 업적 (임시: target_weight 파라미터 필요)
    -- UPDATE user_achievements ua
    -- SET progress = calc_weight_goal_achieved(NEW.user_id, 목표체중)
    -- FROM achievements a
    -- WHERE ua.user_id = NEW.user_id
    --   AND ua.achievement_id = a.achievement_id
    --   AND (a.title LIKE '%목표 체중%' OR a.title LIKE '%완벽한 변화%');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weight_achievement_progress_trigger
AFTER INSERT OR UPDATE ON health_records
FOR EACH ROW
EXECUTE FUNCTION update_weight_achievement_progress();

-- [업적 달성 자동 반영 트리거]
CREATE OR REPLACE FUNCTION check_achievement_completion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_achievements
    SET is_achieved = TRUE,
        achieved_date = CURRENT_DATE
    FROM achievements a
    WHERE user_achievements.user_id = NEW.user_id
      AND user_achievements.achievement_id = a.achievement_id
      AND user_achievements.progress >= a.target_days
      AND is_achieved = FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER achievement_completion_trigger
AFTER UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION check_achievement_completion();

-- [운동 기록 시 랭킹 점수 자동 증가 트리거]
CREATE OR REPLACE FUNCTION update_ranking_on_workout()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_ranking
    SET total_score = total_score + 10,
        streak_days = calc_workout_streak(NEW.user_id),
        last_updated_at = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_workout_trigger
AFTER INSERT ON exercise_sessions
FOR EACH ROW
EXECUTE FUNCTION update_ranking_on_workout();

-- [식단 기록 시 랭킹 점수 자동 증가 트리거]
CREATE OR REPLACE FUNCTION update_ranking_on_meal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_ranking
    SET total_score = total_score + 5,
        last_updated_at = NOW()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ranking_meal_trigger
AFTER INSERT ON meal_logs
FOR EACH ROW
EXECUTE FUNCTION update_ranking_on_meal();

-- [신규 가입자 랭킹 row 자동 생성 트리거]
-- user_id 중복 INSERT 방지 로직 포함
CREATE OR REPLACE FUNCTION create_user_ranking_row()
RETURNS TRIGGER AS $$
BEGIN
    -- 이미 user_ranking row가 있으면 아무것도 하지 않음
    IF EXISTS (SELECT 1 FROM user_ranking WHERE user_id = NEW.user_id) THEN
        RETURN NEW;
    END IF;
    INSERT INTO user_ranking (user_id) VALUES (NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 중복 생성 방지: 이미 있으면 삭제 후 생성
DROP TRIGGER IF EXISTS user_ranking_auto_create ON users;
CREATE TRIGGER user_ranking_auto_create
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_ranking_row();

-- user_id에 UNIQUE 제약조건 추가 (이미 있으면 생략)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name='user_ranking' AND constraint_type='UNIQUE' AND constraint_name='uq_user_ranking_user_id'
    ) THEN
        EXECUTE 'ALTER TABLE user_ranking ADD CONSTRAINT uq_user_ranking_user_id UNIQUE (user_id)';
    END IF;
END$$;



-- (중복 row 정리용 쿼리는 필요시 수동 실행, 실제 트리거.sql에는 포함하지 않음)
-- -- 중복 user_id 확인
-- SELECT user_id, COUNT(*) FROM user_ranking GROUP BY user_id HAVING COUNT(*) > 1;
-- -- (예시) user_id가 123인 경우, 1개만 남기고 삭제
-- DELETE FROM user_ranking
-- WHERE user_id = 123
-- AND id NOT IN (
--   SELECT MIN(id) FROM user_ranking WHERE user_id = 123
-- );

