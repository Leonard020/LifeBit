-- V1__Initial_Schema.sql
-- LifeBit 초기 데이터베이스 스키마 생성

-- 1. ENUM 타입들 생성
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE IF NOT EXISTS badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE IF NOT EXISTS body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');
CREATE TYPE IF NOT EXISTS meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE IF NOT EXISTS input_source_type AS ENUM ('VOICE', 'TYPING');
CREATE TYPE IF NOT EXISTS validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE IF NOT EXISTS recognition_type AS ENUM ('EXERCISE', 'MEAL');
CREATE TYPE IF NOT EXISTS record_type AS ENUM ('EXERCISE', 'MEAL');

-- 2. users 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    provider VARCHAR(50),
    nickname VARCHAR(100) UNIQUE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT NOW(), 
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- 3. user_goals 테이블
CREATE TABLE IF NOT EXISTS user_goals (
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

-- 4. health_records 테이블
CREATE OR REPLACE FUNCTION calculate_bmi(weight DECIMAL, height DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height IS NULL OR height = 0 THEN
        RETURN NULL;
    END IF;
    RETURN ROUND(weight / ((height/100) * (height/100)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TABLE IF NOT EXISTS health_records (
    health_record_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,2) GENERATED ALWAYS AS (calculate_bmi(weight, height)) STORED,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_records_user_date ON health_records(user_id, record_date);

-- 5. exercise_catalog 테이블
CREATE TABLE IF NOT EXISTS exercise_catalog (
    exercise_catalog_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    name VARCHAR(100) NOT NULL,
    body_part body_part_type NOT NULL,
    description TEXT,
    intensity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. exercise_sessions 테이블
CREATE TABLE IF NOT EXISTS exercise_sessions (
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

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user_date ON exercise_sessions(user_id, exercise_date);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_catalog ON exercise_sessions(exercise_catalog_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_validation ON exercise_sessions(validation_status);

-- 7. food_items 테이블
CREATE TABLE IF NOT EXISTS food_items (
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

-- 8. meal_logs 테이블 (Hibernate 호환성을 위해 VARCHAR 사용)
CREATE TABLE IF NOT EXISTS meal_logs (
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

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_meal_logs_food ON meal_logs(food_item_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_validation ON meal_logs(validation_status);

-- 9. achievements 테이블
CREATE TABLE IF NOT EXISTS achievements (
    achievement_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    badge_type badge_type NOT NULL,
    target_days INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. user_achievements 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
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

-- 스키마 생성 완료
-- 기본 데이터는 기존 PostgreSQL 데이터를 사용 