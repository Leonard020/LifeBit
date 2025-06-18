-- 모든 테이블과 타입을 강제로 삭제하는 스크립트
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 트랜잭션 시작
BEGIN;

-- 1. 모든 테이블 삭제 (CASCADE로 의존성 있는 모든 것 삭제)
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

-- 2. 모든 ENUM 타입 삭제
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS badge_type CASCADE;
DROP TYPE IF EXISTS body_part_type CASCADE;
DROP TYPE IF EXISTS meal_time_type CASCADE;
DROP TYPE IF EXISTS input_source_type CASCADE;
DROP TYPE IF EXISTS validation_status_type CASCADE;
DROP TYPE IF EXISTS recognition_type CASCADE;
DROP TYPE IF EXISTS record_type CASCADE;

-- 3. 함수들 삭제
DROP FUNCTION IF EXISTS calculate_bmi(DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS log_validation_change() CASCADE;
DROP FUNCTION IF EXISTS update_processed_at() CASCADE;

-- 4. 파티션 테이블들 삭제
DROP TABLE IF EXISTS log_y2024m01 CASCADE;
DROP TABLE IF EXISTS log_y2024m02 CASCADE;

-- 트랜잭션 커밋
COMMIT;

-- 확인 메시지
SELECT 'All tables and types have been dropped successfully!' as message;