-- ===================================================================
-- EXTENSIONS
-- ===================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===================================================================
-- ENUM TYPE DEFINITIONS
-- ===================================================================

-- 사용자 역할 타입
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- 배지 타입
CREATE TYPE badge_type AS ENUM ('FIRST_LOGIN', 'STREAK_7', 'STREAK_30', 'STREAK_100', 'WEIGHT_GOAL', 'WORKOUT_GOAL', 'NUTRITION_GOAL', 'SOCIAL_SHARE', 'PERFECT_WEEK', 'MONTHLY_CHAMPION');

-- 신체 부위 타입
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'arms', 'abs', 'cardio', 'full_body');

-- 운동 부위 타입
CREATE TYPE exercise_part_type AS ENUM ('strength', 'aerobic', 'flexibility', 'balance');

-- 시간대 타입
CREATE TYPE time_period_type AS ENUM ('dawn', 'morning', 'afternoon', 'evening', 'night');

-- 식사 시간 타입
CREATE TYPE meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- 입력 소스 타입
CREATE TYPE input_source_type AS ENUM ('VOICE', 'TYPING');

-- 검증 상태 타입
CREATE TYPE validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'NEEDS_REVIEW');

-- 음성 인식 타입
CREATE TYPE recognition_type AS ENUM ('EXERCISE', 'MEAL', 'HEALTH_RECORD');

-- 기록 타입
CREATE TYPE record_type AS ENUM ('EXERCISE', 'MEAL', 'HEALTH_RECORD');

-- 기간 타입
CREATE TYPE period_type AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- ===================================================================
-- CUSTOM FUNCTIONS
-- ===================================================================

-- BMI 계산 함수
CREATE OR REPLACE FUNCTION calculate_bmi(weight DECIMAL, height DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height IS NULL OR height = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND((weight / ((height / 100) * (height / 100)))::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================================================================
-- TABLE CREATIONS
-- ===================================================================

-- users 테이블
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    provider VARCHAR(50),
    nickname VARCHAR(100) UNIQUE NOT NULL,
    profile_image_url VARCHAR(255),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW(),
    last_visited TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_provider ON users(provider);

-- user_goals
CREATE TABLE user_goals (
    user_goal_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    weekly_workout_target INTEGER DEFAULT 3,
	weekly_chest INTEGER DEFAULT 0,
	weekly_back INTEGER DEFAULT 0,
	weekly_legs INTEGER DEFAULT 0,
	weekly_shoulders INTEGER DEFAULT 0,
	weekly_arms INTEGER DEFAULT 0,
	weekly_abs INTEGER DEFAULT 0,
	weekly_cardio INTEGER DEFAULT 0,
    daily_carbs_target INTEGER DEFAULT 200,
    daily_protein_target INTEGER DEFAULT 120,
    daily_fat_target INTEGER DEFAULT 60,
    daily_calory_target INTEGER DEFAULT 1500,
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- health_records
CREATE TABLE health_records (
    health_record_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (calculate_bmi(weight, height)) STORED,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_health_records_user_date ON health_records(user_id, record_date);

-- exercise_catalog
CREATE TABLE exercise_catalog (
    exercise_catalog_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    name VARCHAR(100) NOT NULL,
    exercise_type VARCHAR(50),
    body_part body_part_type NOT NULL,
    description TEXT,
    intensity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- exercise_sessions
CREATE TABLE exercise_sessions (
    exercise_session_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    exercise_catalog_id BIGINT REFERENCES exercise_catalog(exercise_catalog_id) ON DELETE SET NULL,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    weight DECIMAL(5,2),
    reps INTEGER,
    sets INTEGER,
    notes TEXT,
    exercise_date DATE NULL,
    time_period time_period_type, 
    input_source input_source_type,
    confidence_score DECIMAL(4,2),
    validation_status validation_status_type DEFAULT 'PENDING',
    validation_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_sessions_user_date ON exercise_sessions(user_id, exercise_date);
CREATE INDEX idx_exercise_sessions_catalog ON exercise_sessions(exercise_catalog_id);
CREATE INDEX idx_exercise_sessions_validation ON exercise_sessions(validation_status);

-- food_items
CREATE TABLE food_items (
    food_item_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    food_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    serving_size DECIMAL(6,2),
    calories DECIMAL(6,2),
    carbs DECIMAL(6,2),
    protein DECIMAL(6,2),
    fat DECIMAL(6,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- meal_logs
CREATE TABLE meal_logs (
    meal_log_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    food_item_id BIGINT REFERENCES food_items(food_item_id) ON DELETE CASCADE,
    meal_time meal_time_type NOT NULL,
    quantity DECIMAL(6,2),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    input_source input_source_type,
    confidence_score DECIMAL(4,2),
    original_audio_path VARCHAR(255),
    validation_status validation_status_type DEFAULT 'PENDING',
    validation_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date);
CREATE INDEX idx_meal_logs_food ON meal_logs(food_item_id);
CREATE INDEX idx_meal_logs_validation ON meal_logs(validation_status);

-- user_ranking (단수형)
CREATE TABLE user_ranking (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    rank_position INTEGER NOT NULL DEFAULT 0,
    previous_rank INTEGER NOT NULL DEFAULT 0,
    season INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    tier VARCHAR(32) DEFAULT 'UNRANK'
);

CREATE INDEX idx_user_ranking_user_id ON user_ranking(user_id);
CREATE INDEX idx_user_ranking_total_score ON user_ranking(total_score);
CREATE INDEX idx_user_ranking_rank_position ON user_ranking(rank_position);

-- ranking_history
CREATE TABLE ranking_history (
    id BIGSERIAL PRIMARY KEY,
    user_ranking_id BIGINT NOT NULL REFERENCES user_ranking(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    streak_days INTEGER NOT NULL,
    rank_position INTEGER NOT NULL,
    season INTEGER NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id BIGINT,
    tier VARCHAR(32)
);

CREATE INDEX idx_ranking_history_user_ranking_id ON ranking_history(user_ranking_id);
CREATE INDEX idx_ranking_history_recorded_at ON ranking_history(recorded_at);
CREATE INDEX idx_ranking_history_period_type ON ranking_history(period_type);

-- achievements
CREATE TABLE achievements (
    achievement_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    title VARCHAR(200) NOT NULL,
    description TEXT,
    badge_type badge_type NOT NULL,
    target_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- user_achievements
CREATE TABLE user_achievements (
    user_achievement_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    achievement_id BIGINT REFERENCES achievements(achievement_id) ON DELETE CASCADE,
    is_achieved BOOLEAN DEFAULT FALSE,
    progress INTEGER DEFAULT 0,
    achieved_date DATE,
    created_at TIMESTAMP DEFAULT NOW(), 
    UNIQUE(user_id, achievement_id)
);

-- recommendation
CREATE TABLE recommendation (
    recommendation_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    item_id BIGINT,
    recommendation_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recommendation_user ON recommendation(user_id);

-- feedback
CREATE TABLE feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    recommendation_id BIGINT REFERENCES recommendation(recommendation_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_type VARCHAR(100),
    feedback_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_recommendation ON feedback(recommendation_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);

-- policy
CREATE TABLE policy (
    policy_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    policy_name VARCHAR(255) NOT NULL,
    policy_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- voice_recognition_logs
CREATE TABLE voice_recognition_logs (
    log_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    audio_file_path VARCHAR(255) CHECK (audio_file_path ~ '^[a-zA-Z0-9_\-/\.]+$'),
    transcription_text TEXT,
    confidence_score DECIMAL(4,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recognition_type recognition_type NOT NULL,
    status validation_status_type DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_voice_recognition_logs_user ON voice_recognition_logs(user_id);
CREATE INDEX idx_voice_recognition_logs_status ON voice_recognition_logs(status);
CREATE INDEX idx_voice_recognition_logs_created ON voice_recognition_logs(created_at);

-- validation_history
CREATE TABLE validation_history (
    history_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    record_type record_type NOT NULL,
    record_id BIGINT NOT NULL,
    validation_status validation_status_type NOT NULL,
    validation_notes TEXT,
    validated_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_validation_history_record ON validation_history(record_type, record_id);
CREATE INDEX idx_validation_history_user ON validation_history(user_id);
CREATE INDEX idx_validation_history_created ON validation_history(created_at);

-- log 테이블 (파티셔닝)
CREATE TABLE log (
    log_id BIGSERIAL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(), 
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (log_id, created_at)
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
-- 2025년 4월 (4월 1일 ~ 4월 30일)
CREATE TABLE log_y2025m04 PARTITION OF log
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

-- 2025년 5월 (5월 1일 ~ 5월 31일)  
CREATE TABLE log_y2025m05 PARTITION OF log
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

-- 2025년 6월 (6월 1일 ~ 6월 30일) - 현재 필요한 파티션
CREATE TABLE log_y2025m06 PARTITION OF log
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

-- 2025년 7월 (7월 1일 ~ 7월 31일)
CREATE TABLE log_y2025m07 PARTITION OF log
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

CREATE INDEX idx_log_created_at ON log(created_at, event_type);

-- 트리거 함수들
CREATE OR REPLACE FUNCTION log_validation_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.validation_status IS DISTINCT FROM NEW.validation_status THEN
        INSERT INTO validation_history (
            user_id,
            record_type,
            record_id,
            validation_status,
            validated_by
        ) VALUES (
            NEW.user_id,
            CASE 
                WHEN TG_TABLE_NAME = 'exercise_sessions' THEN 'EXERCISE'::record_type
                ELSE 'MEAL'::record_type
            END,
            CASE 
                WHEN TG_TABLE_NAME = 'exercise_sessions' THEN NEW.exercise_session_id
                ELSE NEW.meal_log_id
            END,
            NEW.validation_status,
            'SYSTEM'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'VALIDATED' THEN
        NEW.processed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER exercise_validation_trigger
AFTER UPDATE ON exercise_sessions
FOR EACH ROW
EXECUTE FUNCTION log_validation_change();

CREATE TRIGGER meal_validation_trigger
AFTER UPDATE ON meal_logs
FOR EACH ROW
EXECUTE FUNCTION log_validation_change();

CREATE TRIGGER voice_recognition_status_trigger
BEFORE UPDATE ON voice_recognition_logs
FOR EACH ROW
EXECUTE FUNCTION update_processed_at();

-- 인덱스 추가 (랭킹 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_ranking_total_score ON user_ranking(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_ranking_user_id ON user_ranking(user_id);

-- 등급 구간별 tier 값 일괄 업데이트 (점수 기준, 필요에 따라 조정)
UPDATE user_ranking SET tier = 'UNRANK'      WHERE total_score < 100;
UPDATE user_ranking SET tier = 'BRONZE'      WHERE total_score >= 100   AND total_score < 500;
UPDATE user_ranking SET tier = 'SILVER'      WHERE total_score >= 500   AND total_score < 1000;
UPDATE user_ranking SET tier = 'GOLD'        WHERE total_score >= 1000  AND total_score < 2000;
UPDATE user_ranking SET tier = 'PLATINUM'    WHERE total_score >= 2000  AND total_score < 3000;
UPDATE user_ranking SET tier = 'DIAMOND'     WHERE total_score >= 3000  AND total_score < 4000;
UPDATE user_ranking SET tier = 'MASTER'      WHERE total_score >= 4000  AND total_score < 5000;
UPDATE user_ranking SET tier = 'GRANDMASTER' WHERE total_score >= 5000  AND total_score < 6000;
UPDATE user_ranking SET tier = 'CHALLENGER'  WHERE total_score >= 6000;

-- ranking_history.user_id 값 동기화 (user_ranking_id → user_id)
UPDATE ranking_history rh
SET user_id = ur.user_id
FROM user_ranking ur
WHERE rh.user_ranking_id = ur.id;

-- ranking_history.tier 값 동기화 (user_id 기준)
UPDATE ranking_history rh
SET tier = ur.tier
FROM user_ranking ur
WHERE rh.user_id = ur.user_id;

-- (선택) 더미 데이터 삽입 예시
-- INSERT INTO user_ranking (user_id, total_score, tier, rank_position, streak_days, is_active)
-- VALUES (1, 1200, 'GOLD', 1, 10, TRUE), (2, 800, 'SILVER', 2, 5, TRUE);

-- (선택) 기타 필요한 컬럼/인덱스 추가 (예: 시즌별 인덱스, created_at/last_updated_at 인덱스 등)

SELECT * FROM exercise_sessions ORDER BY created_at DESC LIMIT 5;
  SELECT * FROM meal_logs WHERE user_id = 2 AND log_date = '2025-06-21';

    SELECT * FROM meal_logs WHERE user_id=2 ORDER BY log_date DESC;



-- 1. notification_read 테이블 생성
CREATE TABLE IF NOT EXISTS notification_read (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_id BIGINT NOT NULL REFERENCES notification(id) ON DELETE CASCADE,
    read_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_read_user_notification ON notification_read(user_id, notification_id);

-- 2. 시스템 공용 알림 데이터 (user_id = NULL)
INSERT INTO notification (user_id, type, ref_id, title, message) VALUES
(NULL, 'SYSTEM', NULL, '앱 사용 팁', '앱의 다양한 기능을 활용해보세요. 더욱 효율적인 건강 관리가 가능합니다.'),
(NULL, 'SYSTEM', NULL, '단축키 안내', '앱 사용을 더욱 편리하게 해주는 단축키를 확인해보세요. 빠른 접근이 가능합니다.'),
(NULL, 'SYSTEM', NULL, '음성 인식 기능', '음성으로 운동 기록을 남길 수 있는 기능이 추가되었습니다. 편리하게 이용해보세요.'),
(NULL, 'SYSTEM', NULL, 'AI 운동 추천', 'AI 운동 추천 기능을 활용해보세요. 개인 맞춤형 운동을 추천받을 수 있습니다.'),
(NULL, 'SYSTEM', NULL, '데이터 동기화', '여러 기기에서 사용하실 때는 데이터 동기화를 확인해주세요. 모든 기기에서 동일한 정보를 확인할 수 있습니다.');

-- 3. 신규 사용자 환영 알림 (user_id 1~10)
INSERT INTO notification (user_id, type, ref_id, title, message) VALUES
(1, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(2, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(3, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(4, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(5, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(6, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(7, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(8, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(9, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'),
(10, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.');

-- 4. 시스템 알림만 조회
SELECT * FROM notification WHERE user_id IS NULL;

-- 5. 특정 사용자가 읽은 시스템 알림
SELECT * FROM notification_read WHERE user_id = 1 AND notification_id IN (SELECT id FROM notification WHERE user_id IS NULL);

-- 6. 개인 알림만 조회
SELECT * FROM notification WHERE user_id IS NOT NULL;

-- 7. 실제 유저 읽은 여부 확인
SELECT * FROM notification_read WHERE user_id = 2;
SELECT * FROM notification_read WHERE user_id = 2 AND notification_id = 10;

-- 8. (예시) 읽지 않은 알림 개수 조회
-- SELECT COUNT(*) FROM notification WHERE is_read = false AND user_id = 1;

-- 9. (예시) 알림 타입별 개수 조회
-- SELECT type, COUNT(*) FROM notification GROUP BY type;


-- 실제 유저 읽은 여부 확인
-- 유저 MinSoo_Kim 기준, 이메일 user001@example.com
-- 예시)
--SELECT * FROM notification_read WHERE user_id = 2
  -- SELECT * FROM notification_read WHERE user_id = 2 AND notification_id = 10;
