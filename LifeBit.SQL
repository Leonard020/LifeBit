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
    updated_at TIMESTAMP DEFAULT NOW()
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
    exercise_type exercise_part_type,
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
    is_active BOOLEAN NOT NULL DEFAULT TRUE
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
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
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

