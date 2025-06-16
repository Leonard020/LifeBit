-- 트랜잭션 초기화
ROLLBACK;

-- 트랜잭션 시작
BEGIN;

-- pgcrypto 확장 추가
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUM 타입들
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS badge_type CASCADE;
DROP TYPE IF EXISTS body_part_type CASCADE;

CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');

-- 2. users
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
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

-- 3. social_accounts
DROP TABLE IF EXISTS social_accounts CASCADE;
CREATE TABLE social_accounts (
    social_account_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    UNIQUE (provider, provider_user_id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. user_goals
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

-- 5. health_records (BMI 자동 계산을 위한 함수 수정)
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

-- 6. exercise_catalog (body_part를 ENUM으로 변경)
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

-- 7. exercise_sessions (인덱스 추가)
DROP TABLE IF EXISTS exercise_sessions CASCADE;
CREATE TABLE exercise_sessions (
    exercise_session_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    exercise_catalog_id BIGINT REFERENCES exercise_catalog(exercise_catalog_id) ON DELETE SET NULL,
    duration_minutes INTEGER,
    calories_burned INTEGER,
    notes TEXT,
    exercise_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_exercise_sessions_user_date ON exercise_sessions(user_id, exercise_date);
CREATE INDEX idx_exercise_sessions_catalog ON exercise_sessions(exercise_catalog_id);

-- 8. food_items
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

-- 9. meal_logs (인덱스 추가)
DROP TABLE IF EXISTS meal_logs CASCADE;
CREATE TABLE meal_logs (
    meal_log_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    food_item_id BIGINT REFERENCES food_items(food_item_id) ON DELETE CASCADE,
    quantity DECIMAL(6,2),
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date);
CREATE INDEX idx_meal_logs_food ON meal_logs(food_item_id);

-- 10. user_rankings (rank_position에 UNIQUE 제약 추가)
DROP TABLE IF EXISTS user_rankings CASCADE;
CREATE TABLE user_rankings (
    user_ranking_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    rank_position INTEGER UNIQUE,
    updated_at TIMESTAMP DEFAULT NOW()
);

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

-- 트랜잭션 커밋
COMMIT;