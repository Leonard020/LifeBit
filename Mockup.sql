-- 트랜잭션 초기화
ROLLBACK;

-- 트랜잭션 시작
BEGIN;

-- pgcrypto 확장 추가
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 먼저 모든 테이블 삭제 (ENUM 타입을 사용하는 테이블들)
DROP TABLE IF EXISTS validation_history CASCADE;
DROP TABLE IF EXISTS voice_recognition_logs CASCADE;
DROP TABLE IF EXISTS log CASCADE;
DROP TABLE IF EXISTS policy CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS recommendation CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS ranking_history CASCADE;
DROP TABLE IF EXISTS user_ranking CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS exercise_sessions CASCADE;
DROP TABLE IF EXISTS exercise_catalog CASCADE;
DROP TABLE IF EXISTS daily_workout_logs CASCADE;
DROP TABLE IF EXISTS workout CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 그 다음 ENUM 타입들 삭제
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS badge_type;
DROP TYPE IF EXISTS body_part_type;
DROP TYPE IF EXISTS meal_time_type;
DROP TYPE IF EXISTS input_source_type;
DROP TYPE IF EXISTS validation_status_type;
DROP TYPE IF EXISTS recognition_type;
DROP TYPE IF EXISTS record_type;

-- 3. ENUM 타입들 재생성
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');
CREATE TYPE meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE input_source_type AS ENUM ('VOICE', 'TYPING');
CREATE TYPE validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE recognition_type AS ENUM ('EXERCISE', 'MEAL');
CREATE TYPE record_type AS ENUM ('EXERCISE', 'MEAL');

-- 4. users
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    provider VARCHAR(50),  -- 소셜 로그인 제공자 (google, kakao 등)
    nickname VARCHAR(100) UNIQUE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_provider ON users(provider);  -- provider 인덱스 추가

-- 5. user_goals
CREATE TABLE user_goals (
    user_goal_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    weekly_workout_target INTEGER DEFAULT 3,
    daily_carbs_target INTEGER DEFAULT 200,
    daily_protein_target INTEGER DEFAULT 120,
    daily_fat_target INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. health_records (BMI 자동 계산을 위한 함수 수정)
CREATE OR REPLACE FUNCTION calculate_bmi(weight DECIMAL, height DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(weight / ((height/100) * (height/100)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

-- 인덱스 추가
CREATE INDEX idx_health_records_user_date ON health_records(user_id, record_date);

-- 7. exercise_catalog (body_part를 ENUM으로 변경)
CREATE TABLE exercise_catalog (
    exercise_catalog_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    name VARCHAR(100) NOT NULL,
    body_part body_part_type NOT NULL,
    description TEXT,
    intensity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. exercise_sessions (음성 인식 및 검증 관련 필드 추가)
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
    exercise_date DATE NOT NULL,
    input_source input_source_type,
    confidence_score DECIMAL(4,2),
    original_audio_path VARCHAR(255),
    validation_status validation_status_type DEFAULT 'PENDING',
    validation_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_exercise_sessions_user_date ON exercise_sessions(user_id, exercise_date);
CREATE INDEX idx_exercise_sessions_catalog ON exercise_sessions(exercise_catalog_id);
CREATE INDEX idx_exercise_sessions_validation ON exercise_sessions(validation_status);

-- 9. food_items
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

-- 10. meal_logs (음성 인식 및 검증 관련 필드 추가)
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

-- 인덱스 추가
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date);
CREATE INDEX idx_meal_logs_food ON meal_logs(food_item_id);
CREATE INDEX idx_meal_logs_validation ON meal_logs(validation_status);

-- 11. user_ranking (랭킹 시스템 개선)
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
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
-- 인덱스 추가
CREATE INDEX idx_user_ranking_user_id ON user_ranking(user_id);
CREATE INDEX idx_user_ranking_total_score ON user_ranking(total_score);
CREATE INDEX idx_user_ranking_rank_position ON user_ranking(rank_position);

-- 12. ranking_history (랭킹 이력 테이블)
CREATE TABLE ranking_history (
    id BIGSERIAL PRIMARY KEY,
    user_ranking_id BIGINT NOT NULL REFERENCES user_ranking(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    streak_days INTEGER NOT NULL,
    rank_position INTEGER NOT NULL,
    season INTEGER NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- 인덱스 추가
CREATE INDEX idx_ranking_history_user_ranking_id ON ranking_history(user_ranking_id);
CREATE INDEX idx_ranking_history_recorded_at ON ranking_history(recorded_at);
CREATE INDEX idx_ranking_history_period_type ON ranking_history(period_type);

-- 13. achievements (badge_type을 ENUM으로 변경)
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

-- 14. user_achievements
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

-- 15. recommendation (인덱스 추가)
CREATE TABLE recommendation (
    recommendation_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    item_id BIGINT,
    recommendation_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_recommendation_user ON recommendation(user_id);

-- 16. feedback (인덱스 추가)
CREATE TABLE feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    recommendation_id BIGINT REFERENCES recommendation(recommendation_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_type VARCHAR(100),
    feedback_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_feedback_recommendation ON feedback(recommendation_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);

-- 17. policy
CREATE TABLE policy (
    policy_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    policy_name VARCHAR(255) NOT NULL,
    policy_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 18. log (파티셔닝 추가)
CREATE TABLE log (
    log_id BIGSERIAL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(), 
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (log_id, created_at)  -- 파티셔닝 컬럼을 포합한 복합 기본키
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE log_y2024m01 PARTITION OF log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE log_y2024m02 PARTITION OF log
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- 필요한 만큼 파티션 추가

-- 인덱스 수정 (파티셔닝 컬럼 포함)
CREATE INDEX idx_log_created_at ON log(created_at, event_type);

-- 19. voice_recognition_logs (PostgreSQL 최적화)
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

-- 인덱스 추가
CREATE INDEX idx_voice_recognition_logs_user ON voice_recognition_logs(user_id);
CREATE INDEX idx_voice_recognition_logs_status ON voice_recognition_logs(status);
CREATE INDEX idx_voice_recognition_logs_created ON voice_recognition_logs(created_at);

-- 20. validation_history (PostgreSQL 최적화)
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

-- 인덱스 추가
CREATE INDEX idx_validation_history_record ON validation_history(record_type, record_id);
CREATE INDEX idx_validation_history_user ON validation_history(user_id);
CREATE INDEX idx_validation_history_created ON validation_history(created_at);

-- 21. daily_workout_logs 테이블 추가
CREATE TABLE daily_workout_logs (
    workout_log_id BIGSERIAL PRIMARY KEY,         -- 고유 운동 기록 ID
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- 고유 식별자
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE, -- 사용자
    exercise_catalog_id BIGINT REFERENCES exercise_catalog(exercise_catalog_id) ON DELETE SET NULL, -- 운동 종류
    duration_minutes INTEGER NOT NULL,            -- 총 소요 시간
    sets INTEGER,                                 -- 세트 수
    reps INTEGER,                                 -- 반복 수
    weight DECIMAL(5,2),                          -- 무게
    workout_date DATE NOT NULL,                   -- 운동한 날짜
    created_at TIMESTAMP DEFAULT NOW()            -- 작성 시각
);

-- 인덱스 추가
CREATE INDEX idx_daily_workout_logs_user_date ON daily_workout_logs(user_id, workout_date);
CREATE INDEX idx_daily_workout_logs_catalog ON daily_workout_logs(exercise_catalog_id);

-- 22. workout 테이블 추가
CREATE TABLE workout (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    exercise_name VARCHAR(255) NOT NULL,
    type VARCHAR(255),
    duration INTEGER,
    reps INTEGER,
    sets INTEGER,
    weight DOUBLE PRECISION,
    calories_burned INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- workout 테이블 인덱스 추가
CREATE INDEX idx_workout_user_date ON workout(user_id, date);
CREATE INDEX idx_workout_date ON workout(date);

-- 23. 트리거 함수들
-- 검증 상태 변경 트리거 함수
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

-- 음성 인식 처리 상태 트리거 함수
CREATE OR REPLACE FUNCTION update_processed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'PROCESSED' THEN
        NEW.processed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 24. 트리거 생성
-- 운동 세션 검증 트리거
CREATE TRIGGER exercise_validation_trigger
AFTER UPDATE ON exercise_sessions
FOR EACH ROW
EXECUTE FUNCTION log_validation_change();

-- 식단 로그 검증 트리거
CREATE TRIGGER meal_validation_trigger
AFTER UPDATE ON meal_logs
FOR EACH ROW
EXECUTE FUNCTION log_validation_change();

-- 음성 인식 상태 트리거
CREATE TRIGGER voice_recognition_status_trigger
BEFORE UPDATE ON voice_recognition_logs
FOR EACH ROW
EXECUTE FUNCTION update_processed_at();

-- 기존 데이터 정리
DELETE FROM users CASCADE;
DELETE FROM exercise_catalog CASCADE;
DELETE FROM food_items CASCADE;
DELETE FROM achievements CASCADE;
DELETE FROM recommendation CASCADE;
DELETE FROM voice_recognition_logs CASCADE;
DELETE FROM validation_history CASCADE;
DELETE FROM workout CASCADE;
DELETE FROM daily_workout_logs CASCADE;
DELETE FROM user_goals CASCADE;
DELETE FROM health_records CASCADE;
DELETE FROM exercise_sessions CASCADE;
DELETE FROM meal_logs CASCADE;
DELETE FROM user_ranking CASCADE;
DELETE FROM ranking_history CASCADE;
DELETE FROM user_achievements CASCADE;
DELETE FROM feedback CASCADE;
DELETE FROM policy CASCADE;
DELETE FROM log CASCADE;

-- 더미 데이터 삽입 

-- 1. 사용자 데이터 (bcrypt로 password123 해시 생성)
INSERT INTO users (email, password_hash, nickname, height, weight, age, gender, role) VALUES
('admin@lifebit.com', crypt('password123', gen_salt('bf')), '관리자', 175.5, 70.0, 30, 'male', 'ADMIN'),
('user1@example.com', crypt('password123', gen_salt('bf')), '홍길동', 180.0, 75.0, 25, 'male', 'USER'),
('user2@example.com', crypt('password123', gen_salt('bf')), '김철수', 170.0, 65.0, 28, 'male', 'USER'),
('user3@example.com', crypt('password123', gen_salt('bf')), '이영희', 165.0, 55.0, 26, 'female', 'USER'),
('user4@example.com', crypt('password123', gen_salt('bf')), '박지민', 178.0, 72.0, 27, 'male', 'USER');

-- 2. 운동 카탈로그 데이터 (ID 자동 생성)
INSERT INTO exercise_catalog (name, body_part, description, intensity) VALUES
('벤치프레스', 'chest', '가슴 운동의 대표적인 운동', 'high'),
('스쿼트', 'legs', '하체 운동의 기본', 'high'),
('데드리프트', 'back', '등과 하체를 동시에 운동', 'high'),
('플랭크', 'abs', '코어 강화 운동', 'medium'),
('풀업', 'back', '등 근육 강화 운동', 'high')
RETURNING exercise_catalog_id;

-- 3. 음식 아이템 데이터 (ID 자동 생성)
INSERT INTO food_items (food_code, name, serving_size, calories, carbs, protein, fat) VALUES
('F001', '닭가슴살', 100, 165, 0, 31, 3.6),
('F002', '현미밥', 200, 220, 45, 4, 1),
('F003', '바나나', 120, 105, 27, 1.3, 0.3),
('F004', '계란', 50, 70, 0.6, 6, 5),
('F005', '연어', 100, 208, 0, 22, 13)
RETURNING food_item_id;

-- 4. 업적 데이터 (ID 자동 생성)
INSERT INTO achievements (title, description, badge_type, target_days) VALUES
('초보 운동러', '첫 운동 완료', 'bronze', 1),
('열심히 하는 사람', '7일 연속 운동', 'silver', 7),
('운동 마니아', '30일 연속 운동', 'gold', 30),
('운동의 달인', '100일 연속 운동', 'platinum', 100)
RETURNING achievement_id;

-- 5. 사용자 목표 데이터
INSERT INTO user_goals (user_id, weekly_workout_target, daily_carbs_target, daily_protein_target, daily_fat_target) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 5, 250, 150, 70),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 3, 200, 120, 60),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 4, 220, 130, 65),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 3, 180, 100, 50),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 4, 230, 140, 68);

-- 6. 건강 기록 데이터
INSERT INTO health_records (user_id, weight, height, record_date) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 70.0, 175.5, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 75.0, 180.0, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 65.0, 170.0, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 55.0, 165.0, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 72.0, 178.0, CURRENT_DATE);

-- 7. 운동 세션 데이터 (음성 인식 및 검증 관련 필드 추가)
WITH exercise_catalog_ids AS (
    SELECT exercise_catalog_id, name 
    FROM exercise_catalog
)
INSERT INTO exercise_sessions (
    user_id, 
    exercise_catalog_id, 
    duration_minutes, 
    calories_burned, 
    exercise_date,
    input_source,
    confidence_score,
    validation_status
) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'), 
 45, 300, CURRENT_DATE, 'TYPING', NULL, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'), 
 30, 250, CURRENT_DATE, 'VOICE', 0.85, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'), 
 40, 280, CURRENT_DATE, 'VOICE', 0.92, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'), 
 20, 150, CURRENT_DATE, 'TYPING', NULL, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'), 
 35, 270, CURRENT_DATE, 'VOICE', 0.78, 'PENDING');

-- 8. 식사 기록 데이터 (음성 인식 및 검증 관련 필드 추가)
WITH food_item_ids AS (
    SELECT food_item_id, name 
    FROM food_items
)
INSERT INTO meal_logs (
    user_id, 
    food_item_id, 
    quantity, 
    log_date, 
    meal_time,
    input_source,
    confidence_score,
    validation_status
) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '닭가슴살'), 
 200, CURRENT_DATE, 'breakfast', 'TYPING', NULL, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '현미밥'), 
 300, CURRENT_DATE, 'lunch', 'VOICE', 0.88, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '바나나'), 
 120, CURRENT_DATE, 'dinner', 'VOICE', 0.95, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '계란'), 
 100, CURRENT_DATE, 'breakfast', 'TYPING', NULL, 'VALIDATED'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '연어'), 
 150, CURRENT_DATE, 'lunch', 'VOICE', 0.82, 'PENDING');

-- 9. 사용자 랭킹 데이터
INSERT INTO user_ranking (user_id, total_score, streak_days, rank_position, previous_rank, season, is_active)
VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1000, 7, 1, 2, 1, TRUE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 850, 5, 2, 1, 1, TRUE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 720, 4, 3, 3, 1, TRUE),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 680, 3, 4, 4, 1, TRUE),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 650, 2, 5, 5, 1, TRUE);

-- 10. 랭킹 히스토리 데이터 예시
INSERT INTO ranking_history (user_ranking_id, total_score, streak_days, rank_position, season, period_type)
VALUES
((SELECT id FROM user_ranking WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@lifebit.com')), 1000, 7, 1, 1, 'weekly'),
((SELECT id FROM user_ranking WHERE user_id = (SELECT user_id FROM users WHERE email = 'user1@example.com')), 850, 5, 2, 1, 'weekly'),
((SELECT id FROM user_ranking WHERE user_id = (SELECT user_id FROM users WHERE email = 'user2@example.com')), 720, 4, 3, 1, 'weekly'),
((SELECT id FROM user_ranking WHERE user_id = (SELECT user_id FROM users WHERE email = 'user3@example.com')), 680, 3, 4, 1, 'weekly'),
((SELECT id FROM user_ranking WHERE user_id = (SELECT user_id FROM users WHERE email = 'user4@example.com')), 650, 2, 5, 1, 'weekly');

-- 11. 사용자 업적 데이터
WITH achievement_ids AS (
    SELECT achievement_id, title 
    FROM achievements
)
INSERT INTO user_achievements (user_id, achievement_id, is_achieved, progress, achieved_date) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 
 (SELECT achievement_id FROM achievement_ids WHERE title = '초보 운동러'), 
 true, 1, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 (SELECT achievement_id FROM achievement_ids WHERE title = '열심히 하는 사람'), 
 true, 7, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 
 (SELECT achievement_id FROM achievement_ids WHERE title = '운동 마니아'), 
 false, 15, NULL),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 
 (SELECT achievement_id FROM achievement_ids WHERE title = '운동의 달인'), 
 false, 5, NULL),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 
 (SELECT achievement_id FROM achievement_ids WHERE title = '초보 운동러'), 
 true, 1, CURRENT_DATE);

-- 12. 추천 데이터 (ID 자동 생성)
WITH exercise_catalog_ids AS (
    SELECT exercise_catalog_id, name 
    FROM exercise_catalog
),
food_item_ids AS (
    SELECT food_item_id, name 
    FROM food_items
)
INSERT INTO recommendation (user_id, item_id, recommendation_data) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'), 
 '{"type": "exercise", "reason": "사용자의 운동 패턴 분석"}'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '현미밥'), 
 '{"type": "diet", "reason": "영양소 균형 분석"}'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'), 
 '{"type": "exercise", "reason": "체력 수준 기반"}'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 
 (SELECT food_item_id FROM food_item_ids WHERE name = '닭가슴살'), 
 '{"type": "diet", "reason": "식단 패턴 분석"}'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'), 
 '{"type": "exercise", "reason": "목표 기반 추천"}')
RETURNING recommendation_id;

-- 13. 피드백 데이터
WITH recommendation_ids AS (
    SELECT recommendation_id, user_id
    FROM recommendation
)
INSERT INTO feedback (recommendation_id, user_id, feedback_type, feedback_data) VALUES
((SELECT recommendation_id FROM recommendation_ids WHERE user_id = (SELECT user_id FROM users WHERE email = 'admin@lifebit.com')), 
 (SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 
 'positive', '{"rating": 5, "comment": "매우 만족"}'),
((SELECT recommendation_id FROM recommendation_ids WHERE user_id = (SELECT user_id FROM users WHERE email = 'user1@example.com')), 
 (SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 'positive', '{"rating": 4, "comment": "좋았음"}'),
((SELECT recommendation_id FROM recommendation_ids WHERE user_id = (SELECT user_id FROM users WHERE email = 'user2@example.com')), 
 (SELECT user_id FROM users WHERE email = 'user2@example.com'), 
 'neutral', '{"rating": 3, "comment": "보통"}'),
((SELECT recommendation_id FROM recommendation_ids WHERE user_id = (SELECT user_id FROM users WHERE email = 'user3@example.com')), 
 (SELECT user_id FROM users WHERE email = 'user3@example.com'), 
 'positive', '{"rating": 4, "comment": "도움이 됨"}'),
((SELECT recommendation_id FROM recommendation_ids WHERE user_id = (SELECT user_id FROM users WHERE email = 'user4@example.com')), 
 (SELECT user_id FROM users WHERE email = 'user4@example.com'), 
 'positive', '{"rating": 5, "comment": "매우 좋음"}');

-- 14. 정책 데이터
INSERT INTO policy (policy_name, policy_data) VALUES
('이용약관', '{"version": "1.0", "content": "서비스 이용 약관"}'),
('개인정보처리방침', '{"version": "1.0", "content": "개인정보 수집 및 이용"}'),
('운동 가이드라인', '{"version": "1.0", "content": "안전한 운동 방법"}');

-- 15. 로그 데이터
INSERT INTO log (event_type, event_data, created_at) VALUES
('USER_LOGIN', '{"user_id": 1, "ip": "127.0.0.1"}', '2024-01-01 00:00:00'),
('EXERCISE_COMPLETE', '{"user_id": 2, "exercise_id": 1}', '2024-01-01 00:00:00'),
('MEAL_LOG', '{"user_id": 3, "food_id": 1}', '2024-01-01 00:00:00'),
('ACHIEVEMENT_UNLOCK', '{"user_id": 4, "achievement_id": 1}', '2024-01-01 00:00:00'),
('RECOMMENDATION_VIEW', '{"user_id": 5, "recommendation_id": 1}', '2024-01-01 00:00:00');

-- 16. 음성 인식 로그 데이터
INSERT INTO voice_recognition_logs (
    user_id,
    audio_file_path,
    transcription_text,
    confidence_score,
    recognition_type,
    status,
    created_at
) VALUES
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 
 '/audio/user1_exercise_001.mp3',
 '30분 동안 스쿼트 3세트 12회씩 했어요',
 0.85,
 'EXERCISE',
 'VALIDATED',
 CURRENT_TIMESTAMP),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 '/audio/user2_meal_001.mp3',
 '점심에 현미밥 300g 먹었어요',
 0.92,
 'MEAL',
 'VALIDATED',
 CURRENT_TIMESTAMP),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 '/audio/user4_exercise_002.mp3',
 '35분 동안 플랭크 운동했어요',
 0.78,
 'EXERCISE',
 'PENDING',
 CURRENT_TIMESTAMP);

-- 17. 검증 히스토리 데이터
INSERT INTO validation_history (
    user_id,
    record_type,
    record_id,
    validation_status,
    validated_by,
    created_at
) VALUES
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 'EXERCISE',
 (SELECT exercise_session_id FROM exercise_sessions WHERE user_id = (SELECT user_id FROM users WHERE email = 'user1@example.com')),
 'VALIDATED',
 'SYSTEM',
 CURRENT_TIMESTAMP),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 'MEAL',
 (SELECT meal_log_id FROM meal_logs WHERE user_id = (SELECT user_id FROM users WHERE email = 'user2@example.com')),
 'VALIDATED',
 'SYSTEM',
 CURRENT_TIMESTAMP),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 'EXERCISE',
 (SELECT exercise_session_id FROM exercise_sessions WHERE user_id = (SELECT user_id FROM users WHERE email = 'user4@example.com')),
 'PENDING',
 'SYSTEM',
 CURRENT_TIMESTAMP);

-- 18. workout 데이터 추가
INSERT INTO workout (
    user_id,
    date,
    exercise_name,
    type,
    duration,
    reps,
    sets,
    weight,
    calories_burned
) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 CURRENT_DATE,
 '벤치프레스',
 'chest',
 45,
 12,
 3,
 80.0,
 300),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 CURRENT_DATE,
 '스쿼트',
 'legs',
 30,
 15,
 4,
 100.0,
 250),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 CURRENT_DATE,
 '데드리프트',
 'back',
 40,
 10,
 3,
 120.0,
 280),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 CURRENT_DATE,
 '플랭크',
 'abs',
 20,
 1,
 3,
 0.0,
 150),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 CURRENT_DATE,
 '풀업',
 'back',
 35,
 8,
 4,
 0.0,
 270);

-- 19. daily_workout_logs 데이터 추가
WITH exercise_catalog_ids AS (
    SELECT exercise_catalog_id, name 
    FROM exercise_catalog
)
INSERT INTO daily_workout_logs (
    user_id,
    exercise_catalog_id,
    duration_minutes,
    sets,
    reps,
    weight,
    workout_date
) VALUES
-- 관리자 일주일 운동 기록
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 45, 3, 12, 80.0, CURRENT_DATE - INTERVAL '6 days'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'),
 50, 4, 8, 120.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 40, 4, 10, 0.0, CURRENT_DATE - INTERVAL '4 days'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 45, 3, 12, 82.5, CURRENT_DATE - INTERVAL '3 days'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 40, 4, 10, 100.0, CURRENT_DATE - INTERVAL '2 days'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 30, 3, 1, 0.0, CURRENT_DATE - INTERVAL '1 day'),
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 45, 3, 12, 85.0, CURRENT_DATE),

-- 홍길동 일주일 운동 기록
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 30, 4, 15, 100.0, CURRENT_DATE - INTERVAL '6 days'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 25, 3, 1, 0.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 35, 4, 12, 105.0, CURRENT_DATE - INTERVAL '4 days'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 40, 3, 10, 60.0, CURRENT_DATE - INTERVAL '3 days'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 30, 4, 15, 107.5, CURRENT_DATE - INTERVAL '2 days'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 30, 3, 8, 0.0, CURRENT_DATE - INTERVAL '1 day'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 35, 4, 12, 110.0, CURRENT_DATE),

-- 김철수 일주일 운동 기록
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'),
 40, 3, 10, 120.0, CURRENT_DATE - INTERVAL '6 days'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 45, 3, 8, 70.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'),
 45, 4, 8, 125.0, CURRENT_DATE - INTERVAL '4 days'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 35, 3, 12, 90.0, CURRENT_DATE - INTERVAL '3 days'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'),
 40, 3, 10, 130.0, CURRENT_DATE - INTERVAL '2 days'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 25, 3, 1, 0.0, CURRENT_DATE - INTERVAL '1 day'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '데드리프트'),
 45, 4, 8, 135.0, CURRENT_DATE),

-- 이영희 일주일 운동 기록
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 20, 3, 1, 0.0, CURRENT_DATE - INTERVAL '6 days'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 25, 3, 10, 40.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 25, 3, 1, 0.0, CURRENT_DATE - INTERVAL '4 days'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 30, 3, 8, 30.0, CURRENT_DATE - INTERVAL '3 days'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 30, 3, 1, 0.0, CURRENT_DATE - INTERVAL '2 days'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 30, 3, 12, 45.0, CURRENT_DATE - INTERVAL '1 day'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 25, 3, 1, 0.0, CURRENT_DATE),

-- 박지민 일주일 운동 기록
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 35, 4, 8, 0.0, CURRENT_DATE - INTERVAL '6 days'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '플랭크'),
 25, 3, 1, 0.0, CURRENT_DATE - INTERVAL '5 days'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 40, 4, 10, 0.0, CURRENT_DATE - INTERVAL '4 days'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '스쿼트'),
 30, 3, 12, 60.0, CURRENT_DATE - INTERVAL '3 days'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 35, 4, 8, 0.0, CURRENT_DATE - INTERVAL '2 days'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '벤치프레스'),
 35, 3, 8, 40.0, CURRENT_DATE - INTERVAL '1 day'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'),
 (SELECT exercise_catalog_id FROM exercise_catalog_ids WHERE name = '풀업'),
 40, 4, 10, 0.0, CURRENT_DATE);

COMMIT; 