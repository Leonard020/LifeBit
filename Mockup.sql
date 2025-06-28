-- ===================================================================
-- 1. 사용자 데이터 50명 (관리자 1명 + 일반 사용자 49명)
-- ===================================================================
INSERT INTO users (email, password_hash, nickname, profile_image_url, height, weight, age, gender, role) VALUES
-- 관리자
('admin@lifebit.com', crypt('password123', gen_salt('bf')), 'Admin', NULL, 175.5, 70.0, 30, 'male', 'ADMIN'),

-- 일반 사용자 49명 (현실적인 한국인 체형 데이터)
('user001@example.com', crypt('password123', gen_salt('bf')), 'MinSoo_Kim', NULL, 180.0, 75.0, 25, 'male', 'USER'),
('user002@example.com', crypt('password123', gen_salt('bf')), 'YoungHee_Lee', NULL, 165.0, 55.0, 26, 'female', 'USER'),
('user003@example.com', crypt('password123', gen_salt('bf')), 'ChulSoo_Park', NULL, 170.0, 65.0, 28, 'male', 'USER'),
('user004@example.com', crypt('password123', gen_salt('bf')), 'JiMin_Jung', NULL, 162.0, 52.0, 24, 'female', 'USER'),
('user005@example.com', crypt('password123', gen_salt('bf')), 'DongWook_Choi', NULL, 178.0, 72.0, 27, 'male', 'USER'),
('user006@example.com', crypt('password123', gen_salt('bf')), 'SoYoung_Han', NULL, 168.0, 58.0, 23, 'female', 'USER'),
('user007@example.com', crypt('password123', gen_salt('bf')), 'DaeHyun_Yoon', NULL, 175.0, 68.0, 29, 'male', 'USER'),
('user008@example.com', crypt('password123', gen_salt('bf')), 'MiKyung_Oh', NULL, 160.0, 50.0, 25, 'female', 'USER'),
('user009@example.com', crypt('password123', gen_salt('bf')), 'JunHo_Jang', NULL, 182.0, 80.0, 31, 'male', 'USER'),
('user010@example.com', crypt('password123', gen_salt('bf')), 'HyeWon_Shin', NULL, 167.0, 57.0, 27, 'female', 'USER'),
('user011@example.com', crypt('password123', gen_salt('bf')), 'TaeHyun_Song', NULL, 173.0, 70.0, 26, 'male', 'USER'),
('user012@example.com', crypt('password123', gen_salt('bf')), 'EunJung_Ryu', NULL, 164.0, 54.0, 24, 'female', 'USER'),
('user013@example.com', crypt('password123', gen_salt('bf')), 'JungMin_Ko', NULL, 176.0, 73.0, 28, 'male', 'USER'),
('user014@example.com', crypt('password123', gen_salt('bf')), 'SuJin_Lim', NULL, 161.0, 51.0, 22, 'female', 'USER'),
('user015@example.com', crypt('password123', gen_salt('bf')), 'YoungSoo_Jun', NULL, 179.0, 76.0, 30, 'male', 'USER'),
('user016@example.com', crypt('password123', gen_salt('bf')), 'SeoYeon_Baek', NULL, 166.0, 56.0, 25, 'female', 'USER'),
('user017@example.com', crypt('password123', gen_salt('bf')), 'HyunWoo_Jo', NULL, 174.0, 69.0, 27, 'male', 'USER'),
('user018@example.com', crypt('password123', gen_salt('bf')), 'MiRae_Kang', NULL, 163.0, 53.0, 23, 'female', 'USER'),
('user019@example.com', crypt('password123', gen_salt('bf')), 'JiHoon_Yang', NULL, 181.0, 78.0, 29, 'male', 'USER'),
('user020@example.com', crypt('password123', gen_salt('bf')), 'YuNa_Seo', NULL, 169.0, 59.0, 26, 'female', 'USER'),
('user021@example.com', crypt('password123', gen_salt('bf')), 'SungHo_Moon', NULL, 177.0, 74.0, 28, 'male', 'USER'),
('user022@example.com', crypt('password123', gen_salt('bf')), 'DaEun_Yu', NULL, 165.0, 55.0, 24, 'female', 'USER'),
('user023@example.com', crypt('password123', gen_salt('bf')), 'JaeWon_Sim', NULL, 172.0, 67.0, 25, 'male', 'USER'),
('user024@example.com', crypt('password123', gen_salt('bf')), 'YeJin_Noh', NULL, 162.0, 52.0, 23, 'female', 'USER'),
('user025@example.com', crypt('password123', gen_salt('bf')), 'JunSeok_Heo', NULL, 178.0, 75.0, 27, 'male', 'USER'),
('user026@example.com', crypt('password123', gen_salt('bf')), 'ChaeWon_Nam', NULL, 167.0, 57.0, 25, 'female', 'USER'),
('user027@example.com', crypt('password123', gen_salt('bf')), 'DoYoung_Hwang', NULL, 175.0, 71.0, 26, 'male', 'USER'),
('user028@example.com', crypt('password123', gen_salt('bf')), 'SeoHyun_Kong', NULL, 164.0, 54.0, 24, 'female', 'USER'),
('user029@example.com', crypt('password123', gen_salt('bf')), 'MinChul_Kwak', NULL, 180.0, 77.0, 30, 'male', 'USER'),
('user030@example.com', crypt('password123', gen_salt('bf')), 'SuBin_Seok', NULL, 168.0, 58.0, 26, 'female', 'USER'),
('user031@example.com', crypt('password123', gen_salt('bf')), 'WooJin_Sunwoo', NULL, 176.0, 72.0, 28, 'male', 'USER'),
('user032@example.com', crypt('password123', gen_salt('bf')), 'BoRa_Ahn', NULL, 161.0, 51.0, 22, 'female', 'USER'),
('user033@example.com', crypt('password123', gen_salt('bf')), 'JaeMin_Ok', NULL, 179.0, 76.0, 29, 'male', 'USER'),
('user034@example.com', crypt('password123', gen_salt('bf')), 'SoHee_Yook', NULL, 166.0, 56.0, 25, 'female', 'USER'),
('user035@example.com', crypt('password123', gen_salt('bf')), 'HyunSeok_In', NULL, 174.0, 69.0, 27, 'male', 'USER'),
('user036@example.com', crypt('password123', gen_salt('bf')), 'ChaeYoung_Lim', NULL, 163.0, 53.0, 24, 'female', 'USER'),
('user037@example.com', crypt('password123', gen_salt('bf')), 'WooJin_Jang', NULL, 181.0, 79.0, 31, 'male', 'USER'),
('user038@example.com', crypt('password123', gen_salt('bf')), 'DaYoung_Jun', NULL, 169.0, 59.0, 26, 'female', 'USER'),
('user039@example.com', crypt('password123', gen_salt('bf')), 'SeungHyun_Jung', NULL, 177.0, 73.0, 28, 'male', 'USER'),
('user040@example.com', crypt('password123', gen_salt('bf')), 'ARa_Jo', NULL, 165.0, 55.0, 25, 'female', 'USER'),
('user041@example.com', crypt('password123', gen_salt('bf')), 'TaeYang_Jin', NULL, 172.0, 68.0, 26, 'male', 'USER'),
('user042@example.com', crypt('password123', gen_salt('bf')), 'YeEun_Cha', NULL, 162.0, 52.0, 23, 'female', 'USER'),
('user043@example.com', crypt('password123', gen_salt('bf')), 'HyungJun_Choi', NULL, 178.0, 74.0, 27, 'male', 'USER'),
('user044@example.com', crypt('password123', gen_salt('bf')), 'JiWoo_Tak', NULL, 167.0, 57.0, 24, 'female', 'USER'),
('user045@example.com', crypt('password123', gen_salt('bf')), 'MinSoo_Pyo', NULL, 175.0, 70.0, 25, 'male', 'USER'),
('user046@example.com', crypt('password123', gen_salt('bf')), 'JiYeon_Han', NULL, 164.0, 54.0, 26, 'female', 'USER'),
('user047@example.com', crypt('password123', gen_salt('bf')), 'JunHyuk_Hyun', NULL, 180.0, 76.0, 29, 'male', 'USER'),
('user048@example.com', crypt('password123', gen_salt('bf')), 'DaIn_Hong', NULL, 168.0, 58.0, 27, 'female', 'USER'),
('user049@example.com', crypt('password123', gen_salt('bf')), 'JaeWook_Hwang', NULL, 176.0, 71.0, 28, 'male', 'USER'),
('user050@example.com', crypt('password123', gen_salt('bf')), 'MinJun_Song', NULL, 176.0, 71.0, 28, 'male', 'USER');

-- ===================================================================
-- 2. 운동 카탈로그 50개 (다양한 운동 종류)
-- ===================================================================
INSERT INTO exercise_catalog (name, exercise_type, body_part, description, intensity) VALUES
('벤치프레스', 'strength', 'chest', '가슴 운동의 대표적인 기본 운동', 'high'),
('인클라인 벤치프레스', 'strength', 'chest', '상부 가슴을 집중적으로 단련하는 운동', 'high'),
('디클라인 벤치프레스', 'strength', 'chest', '하부 가슴을 집중적으로 단련하는 운동', 'high'),
('덤벨 플라이', 'strength', 'chest', '가슴 근육 확장을 위한 운동', 'medium'),
('딥스', 'strength', 'chest', '자체 체중을 이용한 가슴 운동', 'medium'),
('푸시업', 'strength', 'chest', '기본적인 자체 체중 가슴 운동', 'low'),
('케이블 크로스오버', 'strength', 'chest', '케이블을 이용한 가슴 운동', 'medium'),
('펙 덱 플라이', 'strength', 'chest', '머신을 이용한 가슴 운동', 'medium'),
('데드리프트', 'strength', 'back', '전신 근력 향상을 위한 복합 운동', 'high'),
('풀업', 'strength', 'back', '자체 체중을 이용한 등 운동', 'high'),
('랫 풀다운', 'strength', 'back', '머신을 이용한 등 운동', 'medium'),
('시티드 로우', 'strength', 'back', '앉은 자세에서 하는 등 운동', 'medium'),
('바벨 로우', 'strength', 'back', '바벨을 이용한 등 운동', 'high'),
('티바 로우', 'strength', 'back', '티바를 이용한 등 운동', 'medium'),
('원암 덤벨 로우', 'strength', 'back', '한 팔씩 하는 덤벨 등 운동', 'medium'),
('케이블 로우', 'strength', 'back', '케이블을 이용한 등 운동', 'medium'),
('스쿼트', 'strength', 'legs', '하체 운동의 기본이 되는 복합 운동', 'high'),
('프론트 스쿼트', 'strength', 'legs', '앞쪽에 무게를 두고 하는 스쿼트', 'high'),
('레그 프레스', 'strength', 'legs', '머신을 이용한 하체 운동', 'high'),
('런지', 'strength', 'legs', '한 다리씩 하는 하체 운동', 'medium'),
('불가리안 스플릿 스쿼트', 'strength', 'legs', '한 다리 집중 하체 운동', 'medium'),
('레그 컬', 'strength', 'legs', '햄스트링 집중 운동', 'medium'),
('레그 익스텐션', 'strength', 'legs', '대퇴사두근 집중 운동', 'medium'),
('카프 레이즈', 'strength', 'legs', '종아리 근육 운동', 'low'),
('힙 쓰러스트', 'strength', 'legs', '둔근 집중 운동', 'medium'),
('워킹 런지', 'strength', 'legs', '이동하면서 하는 런지 운동', 'medium'),
('숄더 프레스', 'strength', 'shoulders', '전체 어깨 근육을 위한 운동', 'medium'),
('사이드 레터럴 레이즈', 'strength', 'shoulders', '어깨 측면 근육 운동', 'low'),
('프론트 레이즈', 'strength', 'shoulders', '어깨 앞쪽 근육 운동', 'low'),
('리어 델트 플라이', 'strength', 'shoulders', '어깨 뒷쪽 근육 운동', 'low'),
('업라이트 로우', 'strength', 'shoulders', '수직으로 당기는 어깨 운동', 'medium'),
('아놀드 프레스', 'strength', 'shoulders', '아놀드 스타일 어깨 운동', 'medium'),
('케이블 사이드 레터럴', 'strength', 'shoulders', '케이블을 이용한 어깨 측면 운동', 'low'),
('밀리터리 프레스', 'strength', 'shoulders', '서서 하는 어깨 프레스', 'high'),
('바이셉 컬', 'strength', 'arms', '이두근 집중 운동', 'low'),
('해머 컬', 'strength', 'arms', '해머 그립으로 하는 이두근 운동', 'low'),
('트라이셉 익스텐션', 'strength', 'arms', '삼두근 집중 운동', 'low'),
('트라이셉 딥스', 'strength', 'arms', '자체 체중을 이용한 삼두근 운동', 'medium'),
('클로즈 그립 벤치프레스', 'strength', 'arms', '좁은 손 간격으로 하는 삼두근 운동', 'medium'),
('케이블 트라이셉 푸시다운', 'strength', 'arms', '케이블을 이용한 삼두근 운동', 'low'),
('플랭크', 'strength', 'abs', '코어 강화를 위한 기본 운동', 'medium'),
('크런치', 'strength', 'abs', '복직근 집중 운동', 'low'),
('레그 레이즈', 'strength', 'abs', '하복부 집중 운동', 'medium'),
('러시안 트위스트', 'strength', 'abs', '복사근 집중 운동', 'medium'),
('마운틴 클라이머', 'strength', 'abs', '전신 코어 운동', 'high'),
('러닝', 'aerobic', 'cardio', '달리기 유산소 운동', 'high'),
('사이클링', 'aerobic', 'cardio', '자전거 유산소 운동', 'medium'),
('로잉', 'aerobic', 'cardio', '로잉 머신 유산소 운동', 'high'),
('일립티컬', 'aerobic', 'cardio', '일립티컬 머신 유산소 운동', 'medium'),
('스테어 클라이머', 'aerobic', 'cardio', '계단 오르기 유산소 운동', 'high');

-- ===================================================================
-- 4. -- 사용자 목표 설정 (각 사용자당 10개씩, 500개)
-- 2025년 2월 1일부터 주별로 1개씩 생성
-- weekly_workout_target = 모든 운동 부위별 목표의 합계
-- ===================================================================
INSERT INTO user_goals (
    user_id,
    weekly_workout_target,
    weekly_chest,
    weekly_back,
    weekly_legs,
    weekly_shoulders,
    weekly_arms,
    weekly_abs,
    weekly_cardio,
    daily_carbs_target,
    daily_protein_target,
    daily_fat_target,
    daily_calory_target,
    created_at,
    updated_at
)
SELECT 
    calculated_data.user_id,
    
    -- 각 운동 부위별 목표의 합계로 weekly_workout_target 계산
    calculated_data.weekly_chest + 
    calculated_data.weekly_back + 
    calculated_data.weekly_legs + 
    calculated_data.weekly_shoulders + 
    calculated_data.weekly_arms + 
    calculated_data.weekly_abs + 
    calculated_data.weekly_cardio AS weekly_workout_target,
    
    -- 개별 운동 부위별 목표
    calculated_data.weekly_chest,
    calculated_data.weekly_back,
    calculated_data.weekly_legs,
    calculated_data.weekly_shoulders,
    calculated_data.weekly_arms,
    calculated_data.weekly_abs,
    calculated_data.weekly_cardio,

    -- 일일 영양소 목표 (이미 계산됨)
    calculated_data.daily_carbs_target,
    calculated_data.daily_protein_target,
    calculated_data.daily_fat_target,

    -- 일일 총 칼로리 목표 계산 (단백질*4 + 지방*9 + 탄수화물*4)
    (calculated_data.daily_protein_target * 4 + 
     calculated_data.daily_fat_target * 9 + 
     calculated_data.daily_carbs_target * 4)::integer AS daily_calory_target,

    CURRENT_TIMESTAMP AS created_at,
    CURRENT_TIMESTAMP AS updated_at

FROM (
    -- 실제 존재하는 사용자에 대해서만 생성하고 모든 목표값을 한번에 계산
    SELECT 
        u.user_id,
        u.gender,
        u.weight,
        u.age,
        week_num,
        -- 운동 부위별 목표
        (random() * 3)::integer AS weekly_chest,
        (random() * 3)::integer AS weekly_back,
        (random() * 3)::integer AS weekly_legs,
        (random() * 2)::integer AS weekly_shoulders,
        (random() * 2)::integer AS weekly_arms,
        (random() * 3)::integer AS weekly_abs,
        (random() * 5)::integer AS weekly_cardio,
        -- 일일 영양소 목표 (NULL 값 처리)
        CASE 
            WHEN COALESCE(u.gender, 'male') = 'male' THEN (COALESCE(u.weight, 70) * 4 + random() * 50)::integer
            ELSE (COALESCE(u.weight, 60) * 3.5 + random() * 40)::integer
        END AS daily_carbs_target,
        CASE 
            WHEN COALESCE(u.gender, 'male') = 'male' THEN (COALESCE(u.weight, 70) * 1.8 + random() * 30)::integer
            ELSE (COALESCE(u.weight, 60) * 1.5 + random() * 25)::integer
        END AS daily_protein_target,
        CASE 
            WHEN COALESCE(u.gender, 'male') = 'male' THEN (COALESCE(u.weight, 70) * 1.2 + random() * 20)::integer
            ELSE (COALESCE(u.weight, 60) * 1.0 + random() * 15)::integer
        END AS daily_fat_target
    FROM users u
    CROSS JOIN generate_series(0, 9) AS week_num
    WHERE u.user_id IS NOT NULL
    LIMIT 500  -- 최대 500개로 제한
) calculated_data
ORDER BY calculated_data.user_id, calculated_data.week_num;




-- ===================================================================
-- 5. 건강 기록 900개 (체중 변화 추적)
-- ===================================================================
-- 사용자 ID: 2~50 (49명)
-- 기간: 2025년 2월 1일부터
-- 기록 날짜: 균일하게 분포
-- ===================================================================
INSERT INTO health_records (user_id, weight, height, record_date)
SELECT 
    u.user_id,
    65 + (random() * 20) + (random() - 0.5) * 10 AS weight,
    160 + (random() * 25) AS height,
    '2025-01-01'::date + ((row_number() OVER (ORDER BY u.user_id) - 1) * 175 / 899)::integer * INTERVAL '1 day' AS record_date
FROM (
    SELECT user_id FROM users WHERE role = 'USER' ORDER BY user_id LIMIT 49
) u
CROSS JOIN generate_series(1, 900) AS series
LIMIT 900;

-- ===================================================================
-- 6. 업적 시스템 50개 (다양한 배지 타입과 목표)
-- ===================================================================
INSERT INTO achievements (title, description, badge_type, target_days, is_active) VALUES
-- 브론즈 업적 (15개) - 초급자용
('첫 걸음', '첫 번째 운동 기록', 'FIRST_LOGIN', 1, true),
('주간 전사', '연속 7일 운동', 'STREAK_7', 7, true),
('운동 초보자', '10번 운동 완료', 'WORKOUT_GOAL', 10, true),
('식단 시작', '첫 번째 식단 기록', 'NUTRITION_GOAL', 1, true),
('꾸준함의 시작', '연속 3일 운동', 'STREAK_7', 3, true),
('아침 운동러', '아침 운동 5회 완료', 'WORKOUT_GOAL', 5, true),
('저녁 운동러', '저녁 운동 5회 완료', 'WORKOUT_GOAL', 5, true),
('주말 전사', '주말 운동 3회 완료', 'WORKOUT_GOAL', 3, true),
('유산소 초보자', '유산소 운동 5회 완료', 'WORKOUT_GOAL', 5, true),
('근력 초보자', '근력 운동 5회 완료', 'WORKOUT_GOAL', 5, true),
('식단 기록자', '식단 기록 7일 완료', 'NUTRITION_GOAL', 7, true),
('목표 설정자', '운동 목표 설정 완료', 'WORKOUT_GOAL', 1, true),
('체중 관리자', '체중 기록 5회 완료', 'WEIGHT_GOAL', 5, true),
('운동 다양성', '3가지 다른 운동 완료', 'WORKOUT_GOAL', 3, true),
('건강한 하루', '하루 운동+식단 기록', 'PERFECT_WEEK', 1, true),

-- 실버 업적 (15개) - 중급자용
('2주 챌린지', '연속 14일 운동', 'STREAK_30', 14, true),
('월간 마스터', '연속 30일 운동', 'STREAK_30', 30, true),
('운동 애호가', '총 50회 운동 완료', 'WORKOUT_GOAL', 50, true),
('식단 전문가', '연속 14일 식단 기록', 'NUTRITION_GOAL', 14, true),
('체중 감량 성공', '체중 3kg 감량 달성', 'WEIGHT_GOAL', 30, true),
('근력 향상자', '근력 운동 30회 완료', 'WORKOUT_GOAL', 30, true),
('유산소 매니아', '유산소 운동 30회 완료', 'WORKOUT_GOAL', 30, true),
('아침형 인간', '아침 운동 20회 완료', 'WORKOUT_GOAL', 20, true),
('저녁 루틴 마스터', '저녁 운동 20회 완료', 'WORKOUT_GOAL', 20, true),
('주말 활동가', '주말 운동 10회 완료', 'WORKOUT_GOAL', 10, true),
('균형 식단', '균형 식단 14일 유지', 'NUTRITION_GOAL', 14, true),
('칼로리 버너', '총 10000kcal 소모', 'WORKOUT_GOAL', 30, true),
('체중 관리 전문가', '체중 기록 30회 완료', 'WEIGHT_GOAL', 30, true),
('운동 전문가', '5가지 다른 운동 완료', 'WORKOUT_GOAL', 5, true),
('건강한 생활', '30일 연속 건강관리', 'PERFECT_WEEK', 30, true),

-- 골드 업적 (15개) - 고급자용
('3개월 챌린지', '연속 90일 운동', 'STREAK_100', 90, true),
('100회 돌파', '총 100회 운동 완료', 'WORKOUT_GOAL', 100, true),
('체중 관리 마스터', '목표 체중 달성', 'WEIGHT_GOAL', 60, true),
('근력 킹', '근력 운동 60회 완료', 'WORKOUT_GOAL', 60, true),
('유산소 킹', '유산소 운동 60회 완료', 'WORKOUT_GOAL', 60, true),
('식단 완벽주의자', '연속 60일 식단 기록', 'NUTRITION_GOAL', 60, true),
('아침 운동 마스터', '아침 운동 50회 완료', 'WORKOUT_GOAL', 50, true),
('저녁 운동 전문가', '저녁 운동 50회 완료', 'WORKOUT_GOAL', 50, true),
('주말 운동 킹', '주말 운동 30회 완료', 'WORKOUT_GOAL', 30, true),
('칼로리 소모 킹', '총 30000kcal 소모', 'WORKOUT_GOAL', 90, true),
('운동 올라운더', '10가지 다른 운동 완료', 'WORKOUT_GOAL', 10, true),
('체중 변화 추적자', '체중 기록 90회 완료', 'WEIGHT_GOAL', 90, true),
('건강 생활 마스터', '90일 연속 건강관리', 'PERFECT_WEEK', 90, true),
('목표 달성자', '모든 목표 달성', 'WORKOUT_GOAL', 90, true),
('피트니스 구루', '총 50시간 운동 완료', 'WORKOUT_GOAL', 90, true),

-- 플래티넘 업적 (5개) - 최고급자용
('6개월 레전드', '연속 180일 운동', 'STREAK_100', 180, true),
('운동 매니아', '총 500회 운동 완료', 'WORKOUT_GOAL', 500, true),
('완벽한 변화', '목표 체중 6개월 유지', 'WEIGHT_GOAL', 180, true),
('칼로리 소모 레전드', '총 100000kcal 소모', 'WORKOUT_GOAL', 180, true),
('건강 생활 레전드', '180일 연속 완벽 관리', 'PERFECT_WEEK', 180, true);

-- ===================================================================
-- 7. 운동 세션 900개+ (현실적인 운동 패턴)
-- ===================================================================
-- 운동 세션 900개 생성
-- 사용자 ID: 2~50 (49명)
-- 기간: 2025년 2월 1일부터
-- 기록 날짜: 균일하게 분포
-- ===================================================================
INSERT INTO exercise_sessions (
    user_id, 
    exercise_catalog_id, 
    duration_minutes, 
    calories_burned,
    weight,
    reps,
    sets, 
    exercise_date,
    time_period,
    input_source,
    confidence_score,
    validation_status,
    notes
)
SELECT 
    u.user_id,
    ec.exercise_catalog_id,
    45 + (random() * 45)::integer, -- 운동 시간: 45-90분
    200 + (random() * 400)::integer, -- 칼로리: 200-600
    CASE 
        WHEN random() > 0.5 THEN (20 + random() * 100)::decimal(5,2) -- 중량 (근력운동시)
        ELSE NULL 
    END,
    CASE 
        WHEN random() > 0.5 THEN 8 + (random() * 12)::integer -- 반복횟수: 8-20회
        ELSE NULL 
    END,
    CASE 
        WHEN random() > 0.5 THEN 2 + (random() * 4)::integer -- 세트수: 2-6세트
        ELSE NULL 
    END,
    ('2025-02-01'::date + ((row_number() OVER (ORDER BY u.user_id) - 1) * 143 / 899)::integer * INTERVAL '1 day')::date AS exercise_date,
    (ARRAY['dawn', 'morning', 'afternoon', 'night'])[1 + (random() * 3)::integer]::time_period_type,
    (ARRAY['VOICE', 'TYPING'])[1 + (random() * 1)::integer]::input_source_type,
    CASE 
        WHEN random() > 0.5 THEN (0.75 + random() * 0.25)::decimal(4,2) 
        ELSE NULL 
    END,
    'VALIDATED'::validation_status_type,
    (ARRAY[
        '컨디션이 좋아서 운동이 잘됐어요',
        '목표 중량 달성했습니다!',
        '오늘은 좀 힘들었네요',
        '개인 기록 갱신!',
        '완벽한 자세로 운동 완료',
        '집중력이 좋았던 운동'
    ])[1 + (random() * 5)::integer]
FROM (
    SELECT user_id FROM users WHERE role = 'USER' ORDER BY user_id LIMIT 49
) u
JOIN LATERAL (
    SELECT exercise_catalog_id FROM exercise_catalog ORDER BY random() LIMIT 1
) ec ON TRUE
CROSS JOIN generate_series(1, 900) AS series
LIMIT 900;

-- ===================================================================
-- 8. 식단 로그 900개+ (현실적인 식사 패턴)
-- 사용자 ID: 2~50 (49명)
-- 기간: 2025년 2월 1일부터
-- ===================================================================

INSERT INTO meal_logs (
    user_id,
    food_item_id,
    meal_time,
    quantity,
    log_date,
    input_source,
    confidence_score,
    validation_status,
    created_at
)
SELECT 
    u.user_id,
    f.food_item_id,
    (ARRAY['breakfast', 'lunch', 'dinner', 'snack'])[1 + (random() * 3)::integer]::meal_time_type,
    (50 + random() * 200)::decimal(6,2) AS quantity,
    DATE '2025-01-01' + (random() * 176)::integer * INTERVAL '1 day' AS log_date,
    (ARRAY['VOICE', 'TYPING'])[1 + (random() * 1)::integer]::input_source_type,
    CASE 
        WHEN random() > 0.7 THEN (0.75 + random() * 0.25)::decimal(4,2) 
        ELSE NULL 
    END AS confidence_score,
    'VALIDATED'::validation_status_type,
    CURRENT_TIMESTAMP AS created_at
FROM users u
JOIN LATERAL (
    SELECT food_item_id FROM food_items ORDER BY random() LIMIT 1
) f ON TRUE
CROSS JOIN generate_series(1, 18) AS series
WHERE u.user_id IS NOT NULL
ORDER BY u.user_id, series
LIMIT 900;

-- ===================================================================
-- 9. 사용자 랭킹 49개 (각 사용자당 1개)
-- ===================================================================
INSERT INTO user_ranking (user_id, total_score, streak_days, rank_position, previous_rank, season, is_active)
SELECT 
    u.user_id,
    (100 + random() * 900)::integer, -- 총점: 100-1000점
    (random() * 30)::integer, -- 연속일: 0-30일
    ROW_NUMBER() OVER (ORDER BY random()), -- 임시 순위
    ROW_NUMBER() OVER (ORDER BY random()), -- 이전 순위
    1, -- 현재 시즌
    true -- 활성 상태
FROM users u WHERE role = 'USER';

-- 점수 기반 순위 재정렬
UPDATE user_ranking 
SET rank_position = subquery.new_rank
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as new_rank
    FROM user_ranking
) AS subquery
WHERE user_ranking.id = subquery.id;

-- ===================================================================
-- 10. 사용자 업적 달성 기록 500개+ (각 사용자가 여러 업적에 도전)
-- ===================================================================
INSERT INTO user_achievements (user_id, achievement_id, is_achieved, progress, achieved_date)
SELECT 
    u.user_id,
    a.achievement_id,
    CASE WHEN random() > 0.7 THEN true ELSE false END, -- 30% 확률로 달성
    CASE 
        WHEN random() > 0.7 THEN a.target_days -- 달성한 경우 목표 달성
        ELSE (random() * a.target_days)::integer -- 미달성시 부분 진행
    END,
    CASE 
        WHEN random() > 0.7 THEN CURRENT_DATE - (random() * 30)::integer 
        ELSE NULL 
    END
FROM users u
CROSS JOIN achievements a
WHERE u.role = 'USER' 
AND random() > 0.8 -- 20% 확률로만 업적에 참여 (너무 많아지지 않게)
LIMIT 500;

-- ===================================================================
-- 11. 추천 시스템 500개+ (운동/식단 추천)
-- ===================================================================
INSERT INTO recommendation (user_id, item_id, recommendation_data, created_at)
SELECT 
    u.user_id,
    COALESCE(
        (SELECT exercise_catalog_id FROM exercise_catalog ORDER BY random() LIMIT 1),
        (SELECT food_item_id FROM food_items ORDER BY random() LIMIT 1)
    ),
    CASE 
        WHEN random() > 0.5 THEN 
            ('{"type": "exercise", "reason": "' || 
             (ARRAY['사용자의 운동 패턴 분석', '체력 수준 기반 추천', '목표 달성을 위한 추천', 
                    '최근 운동 이력 기반', '개인 맞춤형 추천', '효과적인 운동 조합'])[1 + (random() * 5)::integer] 
             || '", "priority": ' || (1 + random() * 5)::integer || '}')::jsonb
        ELSE 
            ('{"type": "diet", "reason": "' || 
             (ARRAY['영양소 균형 분석', '칼로리 목표 기반', '식단 패턴 분석', 
                    '건강한 식습관 형성', '개인 영양 상태 고려', '균형잡힌 영양 섭취'])[1 + (random() * 5)::integer] 
             || '", "priority": ' || (1 + random() * 5)::integer || '}')::jsonb
    END,
    CURRENT_DATE - (random() * 60)::integer * INTERVAL '1 day'
FROM users u
WHERE u.role = 'USER'
LIMIT 500;

-- ===================================================================
-- 12. 피드백 시스템 400개+ (추천에 대한 사용자 피드백)
-- ===================================================================
INSERT INTO feedback (recommendation_id, user_id, feedback_type, feedback_data, created_at)
SELECT 
    r.recommendation_id,
    r.user_id,
    (ARRAY['positive', 'neutral', 'negative'])[1 + (random() * 2)::integer],
    CASE 
        WHEN random() > 0.6 THEN -- 긍정적 피드백
            ('{"rating": ' || (4 + random())::integer || ', "comment": "' || 
             (ARRAY['매우 도움이 되었어요', '좋은 추천이었습니다', '만족스러워요', 
                    '효과가 있었어요', '계속 사용하겠어요', '추천해주셔서 감사해요'])[1 + (random() * 5)::integer] 
             || '"}')::jsonb
        WHEN random() > 0.3 THEN -- 중립적 피드백
            ('{"rating": ' || (2 + random())::integer || ', "comment": "' || 
             (ARRAY['보통이에요', '괜찮았어요', '평범해요', 
                    '무난했습니다', '그럭저럭이에요', '나쁘지 않아요'])[1 + (random() * 5)::integer] 
             || '"}')::jsonb
        ELSE -- 부정적 피드백
            ('{"rating": ' || (1 + random())::integer || ', "comment": "' || 
             (ARRAY['별로였어요', '맞지 않았어요', 
                    '효과가 없었어요', '아쉬웠습니다', '기대에 못 미쳤어요', '개선이 필요해요'])[1 + (random() * 5)::integer] 
             || '"}')::jsonb
    END,
    r.created_at + (random() * 7)::integer * INTERVAL '1 day'
FROM recommendation r
WHERE random() > 0.2
LIMIT 400;

-- ===================================================================
-- 13. ranking_history (user_ranking_id 동적 참조)
-- ===================================================================
INSERT INTO ranking_history (
    user_ranking_id, total_score, streak_days, rank_position, season, period_type, recorded_at
) 
SELECT
    ur.id,
    (100 + random() * 900)::integer,
    (random() * 30)::integer,
    ROW_NUMBER() OVER (ORDER BY random()),
    1,
    (ARRAY['weekly', 'monthly'])[1 + (random() * 1)::integer],
    NOW() - (random() * 60)::integer * INTERVAL '1 day'
FROM user_ranking ur
ORDER BY ur.id
LIMIT 10;

-- ===================================================================
-- 14. 알림 데이터
-- ===================================================================

-- 시스템 공용 알림 데이터 (user_id = NULL)
INSERT INTO notification (user_id, type, ref_id, title, message) VALUES
(NULL, 'SYSTEM', NULL, '앱 사용 팁', '앱의 다양한 기능을 활용해보세요. 더욱 효율적인 건강 관리가 가능합니다.'),
(NULL, 'SYSTEM', NULL, '단축키 안내', '앱 사용을 더욱 편리하게 해주는 단축키를 확인해보세요. 빠른 접근이 가능합니다.'),
(NULL, 'SYSTEM', NULL, '음성 인식 기능', '음성으로 운동 기록을 남길 수 있는 기능이 추가되었습니다. 편리하게 이용해보세요.'),
(NULL, 'SYSTEM', NULL, 'AI 운동 추천', 'AI 운동 추천 기능을 활용해보세요. 개인 맞춤형 운동을 추천받을 수 있습니다.'),
(NULL, 'SYSTEM', NULL, '데이터 동기화', '여러 기기에서 사용하실 때는 데이터 동기화를 확인해주세요. 모든 기기에서 동일한 정보를 확인할 수 있습니다.');

-- 신규 사용자 환영 알림 (admin 제외, 일반 사용자 10명)
INSERT INTO notification (user_id, type, ref_id, title, message)
SELECT user_id, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'
FROM users
WHERE role = 'USER'
ORDER BY user_id
LIMIT 10;







