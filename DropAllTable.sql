--테이블제거
-- 테이블 제거 (외래키 의존성 순서 고려)
-- 트리거는 테이블 삭제시 자동으로 함께 삭제됨

DROP TABLE IF EXISTS validation_history CASCADE;
DROP TABLE IF EXISTS voice_recognition_logs CASCADE;
DROP TABLE IF EXISTS log CASCADE;
DROP TABLE IF EXISTS log_y2025m07 CASCADE;
DROP TABLE IF EXISTS log_y2025m06 CASCADE;
DROP TABLE IF EXISTS log_y2025m05 CASCADE;
DROP TABLE IF EXISTS log_y2025m04 CASCADE;
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
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS policy CASCADE;
DROP TABLE IF EXISTS users CASCADE;


--설정
-- pgcrypto 확장 추가
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM 타입들 생성
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');
CREATE TYPE excercise_part_type AS ENUM ('aerobic', 'strength');
CREATE TYPE time_period_type AS ENUM ('dawn', 'morning', 'afternoon', 'night');
CREATE TYPE meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE input_source_type AS ENUM ('VOICE', 'TYPING');
CREATE TYPE validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE recognition_type AS ENUM ('EXERCISE', 'MEAL');
CREATE TYPE record_type AS ENUM ('EXERCISE', 'MEAL');

-- 함수 생성
CREATE OR REPLACE FUNCTION calculate_bmi(weight DECIMAL, height DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(weight / ((height/100) * (height/100)), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


