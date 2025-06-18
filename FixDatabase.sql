-- 데이터베이스 문제 해결 스크립트
-- 1단계: 모든 기존 객체 삭제

-- 트랜잭션 시작
BEGIN;

-- 모든 테이블 강제 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE;';
    END LOOP;
    
    -- Drop all types
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE;';
    END LOOP;
    
    -- Drop all functions
    FOR r IN (SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE;';
    END LOOP;
END $$;

-- 트랜잭션 커밋
COMMIT;

-- 2단계: 새로운 스키마 생성
-- pgcrypto 확장 추가
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM 타입들 생성
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
CREATE TYPE badge_type AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE body_part_type AS ENUM ('chest', 'back', 'legs', 'shoulders', 'abs', 'arms', 'cardio');
CREATE TYPE meal_time_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE input_source_type AS ENUM ('VOICE', 'TYPING');
CREATE TYPE validation_status_type AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE recognition_type AS ENUM ('EXERCISE', 'MEAL');
CREATE TYPE record_type AS ENUM ('EXERCISE', 'MEAL');

-- users 테이블 생성 (last_visited 컬럼 포함)
CREATE TABLE users (
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
    updated_at TIMESTAMP DEFAULT NOW(),
    last_visited TIMESTAMP
);

-- 인덱스 추가
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_provider ON users(provider);

-- 확인 메시지
SELECT 'Database has been reset and users table created with last_visited column!' as message; 