-- 트랜잭션 초기화
ROLLBACK;

-- 트랜잭션 시작
BEGIN;

-- pgcrypto 확장 추가
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUM 타입들
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS badge_type;
DROP TYPE IF EXISTS body_part_type;
DROP TYPE IF EXISTS meal_time_type;
DROP TYPE IF EXISTS input_source_type;
DROP TYPE IF EXISTS validation_status_type;
DROP TYPE IF EXISTS recognition_type;
DROP TYPE IF EXISTS record_type;

CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');
CREATE TYPE meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE input_source_type AS ENUM ('VOICE', 'TYPING');
CREATE TYPE validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE recognition_type AS ENUM ('EXERCISE', 'MEAL');
CREATE TYPE record_type AS ENUM ('EXERCISE', 'MEAL');

-- 2. users
DROP TABLE IF EXISTS users CASCADE;
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

-- 3. user_goals
DROP TABLE IF EXISTS user_goals CASCADE;
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

-- 4. health_records (BMI 자동 계산을 위한 함수 수정)
DROP TABLE IF EXISTS health_records CASCADE;
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

-- 5. exercise_catalog (body_part를 ENUM으로 변경)
DROP TABLE IF EXISTS exercise_catalog CASCADE;
CREATE TABLE exercise_catalog (
    exercise_catalog_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    name VARCHAR(100) NOT NULL,
    body_part body_part_type NOT NULL,
    description TEXT,
    intensity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. exercise_sessions (음성 인식 및 검증 관련 필드 추가)
DROP TABLE IF EXISTS exercise_sessions CASCADE;
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

-- 7. food_items
DROP TABLE IF EXISTS food_items CASCADE;
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

-- 8. meal_logs (음성 인식 및 검증 관련 필드 추가)
DROP TABLE IF EXISTS meal_logs CASCADE;
CREATE TABLE meal_logs (
    meal_log_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    food_item_id BIGINT REFERENCES food_items(food_item_id) ON DELETE CASCADE,
    meal_time meal_time_type NOT NULL,
    quantity DECIMAL(6,2),
    log_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- 9. user_ranking (랭킹 시스템 개선)
DROP TABLE IF EXISTS user_ranking CASCADE;
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

-- 10. ranking_history (랭킹 이력 테이블)
DROP TABLE IF EXISTS ranking_history CASCADE;
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

-- 11. achievements (badge_type을 ENUM으로 변경)
DROP TABLE IF EXISTS achievements CASCADE;
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

-- 12. user_achievements
DROP TABLE IF EXISTS user_achievements CASCADE;
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

-- 13. recommendation (인덱스 추가)
DROP TABLE IF EXISTS recommendation CASCADE;
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

-- 14. feedback (인덱스 추가)
DROP TABLE IF EXISTS feedback CASCADE;
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

-- 15. policy
DROP TABLE IF EXISTS policy CASCADE;
CREATE TABLE policy (
    policy_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    policy_name VARCHAR(255) NOT NULL,
    policy_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 16. log (파티셔닝 추가)
DROP TABLE IF EXISTS log CASCADE;
CREATE TABLE log (
    log_id BIGSERIAL,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(), 
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (log_id, created_at)  -- 파티셔닝 컬럼을 포함한 복합 기본키
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성
CREATE TABLE log_y2024m01 PARTITION OF log
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE log_y2024m02 PARTITION OF log
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- 필요한 만큼 파티션 추가

-- 인덱스 수정 (파티셔닝 컬럼 포함)
CREATE INDEX idx_log_created_at ON log(created_at, event_type);

-- 17. voice_recognition_logs (PostgreSQL 최적화)
DROP TABLE IF EXISTS voice_recognition_logs CASCADE;
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

-- 18. validation_history (PostgreSQL 최적화)
DROP TABLE IF EXISTS validation_history CASCADE;
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

-- 19. daily_workout_logs 테이블 추가
DROP TABLE IF EXISTS daily_workout_logs CASCADE;

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

-- 20. 트리거 함수들
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

-- 21. 트리거 생성
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

-- 22. workout 테이블 추가
DROP TABLE IF EXISTS workout CASCADE;
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

-- 트랜잭션 커밋
COMMIT;