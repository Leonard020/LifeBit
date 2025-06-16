-- 트랜잭션 초기화
ROLLBACK;

-- 기존 데이터 정리
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE exercise_catalog CASCADE;
TRUNCATE TABLE food_items CASCADE;
TRUNCATE TABLE achievements CASCADE;
TRUNCATE TABLE recommendation CASCADE;

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
('풀업', 'back', '등 근육 강화 운동', 'high');

-- 3. 음식 아이템 데이터 (ID 자동 생성)
INSERT INTO food_items (food_code, name, serving_size, calories, carbs, protein, fat) VALUES
('F001', '닭가슴살', 100, 165, 0, 31, 3.6),
('F002', '현미밥', 200, 220, 45, 4, 1),
('F003', '바나나', 120, 105, 27, 1.3, 0.3),
('F004', '계란', 50, 70, 0.6, 6, 5),
('F005', '연어', 100, 208, 0, 22, 13);

-- 4. 업적 데이터 (ID 자동 생성)
INSERT INTO achievements (title, description, badge_type, target_days) VALUES
('초보 운동러', '첫 운동 완료', 'bronze', 1),
('열심히 하는 사람', '7일 연속 운동', 'silver', 7),
('운동 마니아', '30일 연속 운동', 'gold', 30),
('운동의 달인', '100일 연속 운동', 'platinum', 100);

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

-- 7. 운동 세션 데이터
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, exercise_date) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1, 45, 300, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 2, 30, 250, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 3, 40, 280, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 4, 20, 150, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 5, 35, 270, CURRENT_DATE);

-- 8. 식사 기록 데이터
INSERT INTO meal_logs (user_id, food_item_id, quantity, log_date) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1, 200, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 2, 300, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 3, 120, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 4, 100, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 5, 150, CURRENT_DATE);

-- 9. 사용자 랭킹 데이터
INSERT INTO user_rankings (user_id, total_score, streak_days, rank_position) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1000, 7, 1),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 850, 5, 2),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 720, 4, 3),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 680, 3, 4),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 650, 2, 5);

-- 10. 사용자 업적 데이터
INSERT INTO user_achievements (user_id, achievement_id, is_achieved, progress, achieved_date) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1, true, 1, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 2, true, 7, CURRENT_DATE),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 3, false, 15, NULL),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 4, false, 5, NULL),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 1, true, 1, CURRENT_DATE);

-- 11. 추천 데이터 (ID 자동 생성)
INSERT INTO recommendation (user_id, item_id, recommendation_data) VALUES
((SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 1, '{"type": "exercise", "reason": "사용자의 운동 패턴 분석"}'),
((SELECT user_id FROM users WHERE email = 'user1@example.com'), 2, '{"type": "diet", "reason": "영양소 균형 분석"}'),
((SELECT user_id FROM users WHERE email = 'user2@example.com'), 3, '{"type": "exercise", "reason": "체력 수준 기반"}'),
((SELECT user_id FROM users WHERE email = 'user3@example.com'), 4, '{"type": "diet", "reason": "식단 패턴 분석"}'),
((SELECT user_id FROM users WHERE email = 'user4@example.com'), 5, '{"type": "exercise", "reason": "목표 기반 추천"}');

-- 12. 피드백 데이터
INSERT INTO feedback (recommendation_id, user_id, feedback_type, feedback_data) VALUES
(1, (SELECT user_id FROM users WHERE email = 'admin@lifebit.com'), 'positive', '{"rating": 5, "comment": "매우 만족"}'),
(2, (SELECT user_id FROM users WHERE email = 'user1@example.com'), 'positive', '{"rating": 4, "comment": "좋았음"}'),
(3, (SELECT user_id FROM users WHERE email = 'user2@example.com'), 'neutral', '{"rating": 3, "comment": "보통"}'),
(4, (SELECT user_id FROM users WHERE email = 'user3@example.com'), 'positive', '{"rating": 4, "comment": "도움이 됨"}'),
(5, (SELECT user_id FROM users WHERE email = 'user4@example.com'), 'positive', '{"rating": 5, "comment": "매우 좋음"}');

-- 13. 정책 데이터
INSERT INTO policy (policy_name, policy_data) VALUES
('이용약관', '{"version": "1.0", "content": "서비스 이용 약관"}'),
('개인정보처리방침', '{"version": "1.0", "content": "개인정보 수집 및 이용"}'),
('운동 가이드라인', '{"version": "1.0", "content": "안전한 운동 방법"}');

-- 14. 로그 데이터
INSERT INTO log (event_type, event_data, created_at) VALUES
('USER_LOGIN', '{"user_id": 1, "ip": "127.0.0.1"}', '2024-01-01 00:00:00'),
('EXERCISE_COMPLETE', '{"user_id": 2, "exercise_id": 1}', '2024-01-01 00:00:00'),
('MEAL_LOG', '{"user_id": 3, "food_id": 1}', '2024-01-01 00:00:00'),
('ACHIEVEMENT_UNLOCK', '{"user_id": 4, "achievement_id": 1}', '2024-01-01 00:00:00'),
('RECOMMENDATION_VIEW', '{"user_id": 5, "recommendation_id": 1}', '2024-01-01 00:00:00');

COMMIT; 