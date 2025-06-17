-- 트랜잭션 초기화
ROLLBACK;

-- 기존 데이터 정리
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE exercise_catalog CASCADE;
TRUNCATE TABLE food_items CASCADE;
TRUNCATE TABLE achievements CASCADE;
TRUNCATE TABLE recommendation CASCADE;
TRUNCATE TABLE voice_recognition_logs CASCADE;
TRUNCATE TABLE validation_history CASCADE;

-- 더미 데이터 삽입
BEGIN;

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

COMMIT; 