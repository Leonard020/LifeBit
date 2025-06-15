
-- 1. ENUM 타입 (역할)
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');

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

-- 5. health_records
DROP TABLE IF EXISTS health_records CASCADE;
CREATE TABLE health_records (
    health_record_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    bmi DECIMAL(4,2),
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. exercise_catalog
DROP TABLE IF EXISTS exercise_catalog CASCADE;
CREATE TABLE exercise_catalog (
    exercise_catalog_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    name VARCHAR(100) NOT NULL,
    body_part VARCHAR(50) CHECK (body_part IN ('가슴', '등', '하체', '어깨', '복근', '팔', '유산소')),
    description TEXT,
    intensity VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. exercise_sessions
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

-- 9. meal_logs
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

-- 10. user_rankings
DROP TABLE IF EXISTS user_rankings CASCADE;
CREATE TABLE user_rankings (
    user_ranking_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    total_score INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 11. achievements
DROP TABLE IF EXISTS achievements CASCADE;
CREATE TABLE achievements (
    achievement_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    title VARCHAR(200) NOT NULL,
    description TEXT,
    badge_type VARCHAR(20) CHECK (badge_type IN ('bronze', 'silver', 'gold', 'platinum')),
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

-- 13. recommendation
DROP TABLE IF EXISTS recommendation CASCADE;
CREATE TABLE recommendation (
    recommendation_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    item_id BIGINT,
    recommendation_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 14. feedback
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

-- 16. log
DROP TABLE IF EXISTS log CASCADE;
CREATE TABLE log (
    log_id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), 
    event_type VARCHAR(100),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);


WITH base_vals AS (
    SELECT 
        generate_series(1,50) AS idx
),
generated_users AS (
    SELECT
        idx AS user_id,
        concat('user', idx, '@example.com') AS email,
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewis.2bEcUx2zJP6' AS password_hash,
        concat('User', idx) AS nickname,
        (160 + (idx % 21))::numeric(5, 2) AS height,
        (55 + (idx % 26))::numeric(5, 2) AS weight,
        (20 + (idx % 21)) AS age,
        CASE WHEN idx % 2 = 0 THEN 'male' ELSE 'female' END AS gender,
        CASE WHEN idx % 47 = 0 THEN 'ADMIN'::user_role ELSE 'USER'::user_role END AS role,
        (NOW() - (idx * interval '5 days'))::timestamp AS created_at
    FROM base_vals
)
 INSERT INTO users (user_id, email, password_hash, nickname, height, weight, age, gender, role, created_at, updated_at)
 SELECT 
    user_id, email, password_hash, nickname, height, weight, age, gender, role, created_at, created_at
 FROM generated_users;