-- 모든 데이터베이스 객체를 강제로 삭제하는 스크립트
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 트랜잭션 초기화 (이전 트랜잭션 롤백)
ROLLBACK;

-- 트랜잭션 시작
BEGIN;

-- 1단계: 모든 외래키 제약조건 비활성화
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    ) LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT ' || r.conname || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 제약조건이 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
END $$;

-- 2단계: 모든 트리거 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tgname, tgrelid::regclass AS table_name
        FROM pg_trigger
        WHERE tgrelid IN (
            SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace
        )
    ) LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON ' || r.table_name || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 트리거가 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
END $$;

-- 3단계: 모든 테이블 삭제 (순서 중요)
DROP TABLE IF EXISTS validation_history CASCADE;
DROP TABLE IF EXISTS voice_recognition_logs CASCADE;
DROP TABLE IF EXISTS log_y2024m01 CASCADE;
DROP TABLE IF EXISTS log_y2024m02 CASCADE;
DROP TABLE IF EXISTS log CASCADE;
DROP TABLE IF EXISTS policy CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS recommendation CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS ranking_history CASCADE;
DROP TABLE IF EXISTS user_rankings CASCADE;
DROP TABLE IF EXISTS user_ranking CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;
DROP TABLE IF EXISTS exercise_sessions CASCADE;
DROP TABLE IF EXISTS exercise_catalog CASCADE;
DROP TABLE IF EXISTS health_records CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 4단계: 모든 시퀀스 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 시퀀스가 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
END $$;

-- 5단계: 모든 ENUM 타입 삭제
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS badge_type CASCADE;
DROP TYPE IF EXISTS body_part_type CASCADE;
DROP TYPE IF EXISTS exercise_part_type CASCADE;
DROP TYPE IF EXISTS time_period_type CASCADE;
DROP TYPE IF EXISTS meal_time_type CASCADE;
DROP TYPE IF EXISTS input_source_type CASCADE;
DROP TYPE IF EXISTS validation_status_type CASCADE;
DROP TYPE IF EXISTS recognition_type CASCADE;
DROP TYPE IF EXISTS record_type CASCADE;
DROP TYPE IF EXISTS period_type CASCADE;

-- 6단계: 사용자 정의 함수만 삭제 (시스템 함수 제외)
DROP FUNCTION IF EXISTS calculate_bmi(DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS log_validation_change() CASCADE;
DROP FUNCTION IF EXISTS update_processed_at() CASCADE;

-- 7단계: 모든 뷰 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 뷰가 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
END $$;

-- 8단계: 모든 인덱스 삭제 (테이블과 함께 삭제되지만 확실히 하기 위해)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 인덱스가 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
END $$;

-- 9단계: 모든 스키마 객체 강제 삭제 (최후의 수단)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 모든 테이블 강제 삭제
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 테이블이 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
    
    -- 모든 타입 강제 삭제
    FOR r IN (
        SELECT typname 
        FROM pg_type 
        WHERE typnamespace = 'public'::regnamespace AND typtype = 'e'
    ) LOOP
        BEGIN
            EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 타입이 이미 없거나 삭제할 수 없는 경우 무시
                NULL;
        END;
    END LOOP;
    
    -- 사용자 정의 함수만 강제 삭제 (시스템 함수 제외)
    FOR r IN (
        SELECT proname 
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
        AND proname NOT IN ('gen_random_uuid', 'gen_random_uuid', 'uuid_generate_v4')
    ) LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || ' CASCADE;';
        EXCEPTION
            WHEN OTHERS THEN
                -- 시스템 함수는 무시하고 계속 진행
                NULL;
        END;
    END LOOP;
END $$;

-- 트랜잭션 커밋
COMMIT;

-- 확인 메시지
SELECT 'All database objects have been dropped successfully!' as message;

-- 남은 객체 확인
SELECT 
    'Remaining tables: ' || COUNT(*) as remaining_tables
FROM pg_tables 
WHERE schemaname = 'public';

SELECT 
    'Remaining types: ' || COUNT(*) as remaining_types
FROM pg_type 
WHERE typnamespace = 'public'::regnamespace AND typtype = 'e';

SELECT 
    'Remaining sequences: ' || COUNT(*) as remaining_sequences
FROM information_schema.sequences 
WHERE sequence_schema = 'public';