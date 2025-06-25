
-- 기존 데이터 정리 (의존성 순서 고려)


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
('user049@example.com', crypt('password123', gen_salt('bf')), 'JaeWook_Hwang', NULL, 176.0, 71.0, 28, 'male', 'USER');

-- ===================================================================
-- 2. 운동 카탈로그 50개 (다양한 운동 종류)
-- ===================================================================
INSERT INTO exercise_catalog (name, exercise_type, body_part, description, intensity) VALUES
-- 가슴 운동 (8개)
('벤치프레스', 'strength', 'chest', '가슴 운동의 대표적인 기본 운동', 'high'),
('인클라인 벤치프레스', 'strength', 'chest', '상부 가슴을 집중적으로 단련하는 운동', 'high'),
('디클라인 벤치프레스', 'strength', 'chest', '하부 가슴을 집중적으로 단련하는 운동', 'high'),
('덤벨 플라이', 'strength', 'chest', '가슴 근육 확장을 위한 운동', 'medium'),
('딥스', 'strength', 'chest', '자체 체중을 이용한 가슴 운동', 'medium'),
('푸시업', 'strength', 'chest', '기본적인 자체 체중 가슴 운동', 'low'),
('케이블 크로스오버', 'strength', 'chest', '케이블을 이용한 가슴 운동', 'medium'),
('펙 덱 플라이', 'strength', 'chest', '머신을 이용한 가슴 운동', 'medium'),

-- 등 운동 (8개)
('데드리프트', 'strength', 'back', '전신 근력 향상을 위한 복합 운동', 'high'),
('풀업', 'strength', 'back', '자체 체중을 이용한 등 운동', 'high'),
('랫 풀다운', 'strength', 'back', '머신을 이용한 등 운동', 'medium'),
('시티드 로우', 'strength', 'back', '앉은 자세에서 하는 등 운동', 'medium'),
('바벨 로우', 'strength', 'back', '바벨을 이용한 등 운동', 'high'),
('티바 로우', 'strength', 'back', '티바를 이용한 등 운동', 'medium'),
('원암 덤벨 로우', 'strength', 'back', '한 팔씩 하는 덤벨 등 운동', 'medium'),
('케이블 로우', 'strength', 'back', '케이블을 이용한 등 운동', 'medium'),

-- 하체 운동 (10개)
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

-- 어깨 운동 (8개)
('숄더 프레스', 'strength', 'shoulders', '전체 어깨 근육을 위한 운동', 'medium'),
('사이드 레터럴 레이즈', 'strength', 'shoulders', '어깨 측면 근육 운동', 'low'),
('프론트 레이즈', 'strength', 'shoulders', '어깨 앞쪽 근육 운동', 'low'),
('리어 델트 플라이', 'strength', 'shoulders', '어깨 뒷쪽 근육 운동', 'low'),
('업라이트 로우', 'strength', 'shoulders', '수직으로 당기는 어깨 운동', 'medium'),
('아놀드 프레스', 'strength', 'shoulders', '아놀드 스타일 어깨 운동', 'medium'),
('케이블 사이드 레터럴', 'strength', 'shoulders', '케이블을 이용한 어깨 측면 운동', 'low'),
('밀리터리 프레스', 'strength', 'shoulders', '서서 하는 어깨 프레스', 'high'),

-- 팔 운동 (6개)
('바이셉 컬', 'strength', 'arms', '이두근 집중 운동', 'low'),
('해머 컬', 'strength', 'arms', '해머 그립으로 하는 이두근 운동', 'low'),
('트라이셉 익스텐션', 'strength', 'arms', '삼두근 집중 운동', 'low'),
('트라이셉 딥스', 'strength', 'arms', '자체 체중을 이용한 삼두근 운동', 'medium'),
('클로즈 그립 벤치프레스', 'strength', 'arms', '좁은 손 간격으로 하는 삼두근 운동', 'medium'),
('케이블 트라이셉 푸시다운', 'strength', 'arms', '케이블을 이용한 삼두근 운동', 'low'),

-- 복근 운동 (5개)
('플랭크', 'strength', 'abs', '코어 강화를 위한 기본 운동', 'medium'),
('크런치', 'strength', 'abs', '복직근 집중 운동', 'low'),
('레그 레이즈', 'strength', 'abs', '하복부 집중 운동', 'medium'),
('러시안 트위스트', 'strength', 'abs', '복사근 집중 운동', 'medium'),
('마운틴 클라이머', 'strength', 'abs', '전신 코어 운동', 'high'),

-- 유산소 운동 (5개)
('러닝', 'aerobic', 'cardio', '달리기 유산소 운동', 'high'),
('사이클링', 'aerobic', 'cardio', '자전거 유산소 운동', 'medium'),
('로잉', 'aerobic', 'cardio', '로잉 머신 유산소 운동', 'high'),
('일립티컬', 'aerobic', 'cardio', '일립티컬 머신 유산소 운동', 'medium'),
('스테어 클라이머', 'aerobic', 'cardio', '계단 오르기 유산소 운동', 'high');

-- ===================================================================
-- 3. 음식 아이템 50개 (한국 음식 중심, 영양소 정보 포함)
-- ===================================================================
INSERT INTO food_items (food_code, name, serving_size, calories, carbs, protein, fat) VALUES
-- 주식류 (10개)
('F001', '현미밥', 100.0, 350.0, 73.0, 7.0, 2.5),
('F002', '백미밥', 100.0, 365.0, 80.0, 6.5, 1.0),
('F003', '잡곡밥', 100.0, 340.0, 70.0, 8.0, 3.0),
('F004', '귀리밥', 100.0, 380.0, 66.0, 12.0, 6.0),
('F005', '보리밥', 100.0, 325.0, 69.0, 8.5, 2.0),
('F006', '김밥', 150.0, 280.0, 45.0, 8.0, 7.0),
('F007', '볶음밥', 200.0, 420.0, 55.0, 12.0, 15.0),
('F008', '비빔밥', 300.0, 480.0, 65.0, 18.0, 12.0),
('F009', '덮밥', 250.0, 450.0, 60.0, 20.0, 10.0),
('F010', '주먹밥', 120.0, 320.0, 58.0, 7.0, 5.0),

-- 단백질류 (12개)
('F011', '닭가슴살', 100.0, 165.0, 0.0, 31.0, 3.6),
('F012', '닭다리살', 100.0, 205.0, 0.0, 26.0, 11.0),
('F013', '소고기 등심', 100.0, 250.0, 0.0, 26.0, 15.0),
('F014', '돼지고기 등심', 100.0, 280.0, 0.0, 22.0, 20.0),
('F015', '연어', 100.0, 208.0, 0.0, 25.0, 12.0),
('F016', '고등어', 100.0, 190.0, 0.0, 25.0, 12.0),
('F017', '계란', 50.0, 78.0, 0.6, 6.3, 5.3),
('F018', '두부', 100.0, 84.0, 2.0, 8.0, 5.0),
('F019', '콩', 100.0, 350.0, 30.0, 35.0, 18.0),
('F020', '아몬드', 30.0, 174.0, 6.1, 6.4, 15.0),
('F021', '호두', 30.0, 196.0, 4.1, 4.6, 19.6),
('F022', '참치캔', 100.0, 132.0, 0.0, 29.0, 1.0),

-- 채소류 (15개)
('F023', '시금치', 100.0, 23.0, 3.6, 2.9, 0.4),
('F024', '브로콜리', 100.0, 34.0, 7.0, 2.8, 0.4),
('F025', '양배추', 100.0, 25.0, 6.0, 1.3, 0.1),
('F026', '당근', 100.0, 41.0, 10.0, 0.9, 0.2),
('F027', '오이', 100.0, 16.0, 4.0, 0.7, 0.1),
('F028', '토마토', 100.0, 18.0, 3.9, 0.9, 0.2),
('F029', '상추', 100.0, 15.0, 2.9, 1.4, 0.1),
('F030', '무', 100.0, 18.0, 4.1, 0.6, 0.1),
('F031', '고구마', 100.0, 86.0, 20.0, 1.6, 0.1),
('F032', '감자', 100.0, 77.0, 17.0, 2.0, 0.1),
('F033', '양파', 100.0, 40.0, 9.3, 1.1, 0.1),
('F034', '마늘', 10.0, 42.0, 9.9, 1.8, 0.1),
('F035', '생강', 10.0, 8.0, 1.8, 0.2, 0.1),
('F036', '피망', 100.0, 26.0, 6.0, 1.0, 0.3),
('F037', '버섯', 100.0, 22.0, 3.3, 3.1, 0.3),

-- 과일류 (8개)
('F038', '사과', 150.0, 78.0, 20.6, 0.4, 0.3),
('F039', '바나나', 120.0, 105.0, 27.0, 1.3, 0.4),
('F040', '오렌지', 150.0, 62.0, 15.4, 1.2, 0.2),
('F041', '포도', 100.0, 69.0, 18.1, 0.7, 0.2),
('F042', '딸기', 100.0, 32.0, 7.7, 0.7, 0.3),
('F043', '블루베리', 100.0, 57.0, 14.5, 0.7, 0.3),
('F044', '키위', 100.0, 61.0, 14.7, 1.1, 0.5),
('F045', '수박', 100.0, 30.0, 7.6, 0.6, 0.2),

-- 음료 및 기타 (5개)
('F046', '우유', 200.0, 134.0, 9.6, 6.6, 7.6),
('F047', '요거트', 100.0, 59.0, 4.7, 10.0, 0.4),
('F048', '아보카도', 100.0, 160.0, 8.5, 2.0, 14.7),
('F049', '올리브오일', 10.0, 90.0, 0.0, 0.0, 10.0),
('F050', '견과류 믹스', 30.0, 180.0, 5.0, 6.0, 16.0);

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
    -- 사용자 ID: 2~50 사이
    2 + (row_number() OVER () - 1) % 49 AS user_id,
    -- 체중 변화 (60~90kg 범위에서 ±5kg 변화)
    65 + (random() * 20) + (random() - 0.5) * 10 AS weight,
    -- 키 (160~185cm 범위)
    160 + (random() * 25) AS height,
    -- 기록 날짜: 2025년 2월 1일부터 균일하게 분포
    '2025-02-01'::date + (row_number() OVER () - 1) * INTERVAL '1 day' / 5 AS record_date
FROM generate_series(1, 900) AS series;

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
    -- 사용자 ID: 2~50 사이 (49명)
    2 + (row_number() OVER () - 1) % 49 AS user_id,
    1 + (random() * 49)::integer, -- 운동 카탈로그 ID (1-50)
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
    -- 기록 날짜: 2025년 2월 1일부터 균일하게 분포
    ('2025-02-01'::date + (row_number() OVER () - 1) * INTERVAL '1 day' / 5)::date AS exercise_date,
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
FROM generate_series(1, 900) AS series;

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
    1 + (random() * 49)::integer AS food_item_id, -- 1~50 범위
    (ARRAY['breakfast', 'lunch', 'dinner', 'snack'])[1 + (random() * 3)::integer]::meal_time_type,
    (50 + random() * 200)::decimal(6,2) AS quantity,
    DATE '2025-02-01' + (random() * 180)::integer * INTERVAL '1 day' AS log_date,
    (ARRAY['VOICE', 'TYPING'])[1 + (random() * 1)::integer]::input_source_type,
    CASE 
        WHEN random() > 0.7 THEN (0.75 + random() * 0.25)::decimal(4,2) 
        ELSE NULL 
    END AS confidence_score,
    'VALIDATED'::validation_status_type,
    CURRENT_TIMESTAMP AS created_at
FROM users u
CROSS JOIN generate_series(1, 18) AS series -- 각 사용자당 18개씩 (50명 × 18 = 900개)
WHERE u.user_id IS NOT NULL
ORDER BY u.user_id, series
LIMIT 900; 

-- ===================================================================
-- 9. 사용자 랭킹 49개 (각 사용자당 1개)
-- ===================================================================
INSERT INTO user_ranking (user_id, total_score, streak_days, rank_position, previous_rank, season, is_active)
SELECT 
    user_id,
    (100 + random() * 900)::integer, -- 총점: 100-1000점
    (random() * 30)::integer, -- 연속일: 0-30일
    ROW_NUMBER() OVER (ORDER BY random()), -- 임시 순위
    ROW_NUMBER() OVER (ORDER BY random()), -- 이전 순위
    1, -- 현재 시즌
    true -- 활성 상태
FROM users WHERE role = 'USER';

-- 점수 기반 순위 재정렬
UPDATE user_ranking 
SET rank_position = subquery.new_rank
FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as new_rank
    FROM user_ranking
) AS subquery
WHERE user_ranking.user_id = subquery.user_id;


INSERT INTO ranking_history (
    user_ranking_id, total_score, streak_days, rank_position, season, period_type, recorded_at
) VALUES
(5, 1200, 10, 1, 2025, 'weekly', '2025-06-10 09:00:00'),
(12, 980, 7, 2, 2025, 'weekly', '2025-06-10 09:00:00'),
(25, 600, 5, 3, 2025, 'weekly', '2025-06-10 09:00:00'),
(1, 1500, 12, 1, 2025, 'monthly', '2025-06-01 00:00:00'),
(33, 1400, 10, 2, 2025, 'monthly', '2025-06-01 00:00:00'),
(17, 1100, 9, 3, 2025, 'monthly', '2025-06-01 00:00:00'),
(7, 500, 4, 10, 2024, 'weekly', '2024-12-20 10:00:00'),
(19, 800, 6, 6, 2024, 'weekly', '2024-12-20 10:00:00'),
(3, 300, 2, 20, 2024, 'monthly', '2024-11-01 00:00:00'),
(42, 1600, 15, 1, 2025, 'weekly', '2025-06-17 09:00:00');

--2025-06-19 18:32:11 [ERROR] TypeError: Cannot read properties of null (reading 'name')
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
    CASE 
        WHEN random() > 0.5 THEN -- 50% 확률로 운동 추천
            (SELECT exercise_catalog_id FROM exercise_catalog ORDER BY random() LIMIT 1)
        ELSE -- 50% 확률로 식단 추천  
            (SELECT food_item_id FROM food_items ORDER BY random() LIMIT 1)
    END,
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
    -- 최근 60일 내로 제한하되 현재 날짜 기준으로 설정
    CURRENT_DATE - (random() * 60)::integer * INTERVAL '1 day'
FROM users u
CROSS JOIN generate_series(1, 11) AS series -- 사용자당 11개씩
WHERE u.role = 'USER'
LIMIT 500;

-- ===================================================================
-- 12. 피드백 시스템 400개+ (추천에 대한 사용자 피드백)
-- ===================================================================
INSERT INTO feedback (recommendation_id, user_id, feedback_type, feedback_data, created_at)
SELECT 
    r.recommendation_id,
    r.user_id,
    (ARRAY['positive', 'neutral', 'negative'])[
        CASE 
            WHEN random() > 0.6 THEN 1 -- 60% 긍정적
            WHEN random() > 0.3 THEN 2 -- 30% 중립적  
            ELSE 3 -- 10% 부정적
        END
    ]::varchar(100),
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
    r.created_at + (random() * 7)::integer * INTERVAL '1 day' -- 추천 후 1주일 내 피드백
FROM recommendation r
WHERE random() > 0.2 -- 80% 확률로 피드백 제공
LIMIT 400;

-- ===================================================================
-- 13. 정책 데이터 10개 (서비스 운영 정책)
-- ===================================================================
INSERT INTO policy (policy_name, policy_data, created_at, updated_at) VALUES
('이용약관', '{"version": "1.0", "content": "LifeBit 서비스 이용 약관 및 조건", "last_updated": "2024-01-01"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('개인정보처리방침', '{"version": "1.0", "content": "개인정보 수집, 이용, 제공 및 관리 정책", "last_updated": "2024-01-01"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('운동 안전 가이드라인', '{"version": "1.0", "content": "안전한 운동 수행을 위한 지침", "safety_tips": ["준비운동 필수", "적절한 휴식", "수분 섭취"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('식단 관리 정책', '{"version": "1.0", "content": "건강한 식단 관리를 위한 가이드", "guidelines": ["균형잡힌 영양", "적정 칼로리", "규칙적인 식사"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('데이터 보안 정책', '{"version": "1.0", "content": "사용자 데이터 보안 및 암호화 정책", "encryption": "AES-256"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('커뮤니티 가이드라인', '{"version": "1.0", "content": "건전한 커뮤니티 운영을 위한 규칙", "rules": ["존중", "배려", "긍정적 소통"]}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('환불 및 취소 정책', '{"version": "1.0", "content": "서비스 환불 및 구독 취소 관련 정책", "refund_period": "7일"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('AI 추천 시스템 정책', '{"version": "1.0", "content": "AI 기반 개인화 추천 서비스 정책", "algorithm": "머신러닝 기반"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('음성 인식 서비스 정책', '{"version": "1.0", "content": "음성 데이터 처리 및 보관 정책", "retention": "30일"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('서비스 이용 제한 정책', '{"version": "1.0", "content": "부적절한 이용에 대한 제재 정책", "warning_system": "3단계"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===================================================================
-- 14. 시스템 로그 500개+ (사용자 활동 및 시스템 이벤트)
-- ===================================================================
-- 파티션 테이블이므로 현재 존재하는 파티션 범위 내에서만 데이터 생성 (2025-04-01 ~ 2025-07-31)
INSERT INTO log (event_type, event_data, created_at)
SELECT 
    (ARRAY['USER_LOGIN', 'USER_LOGOUT', 'EXERCISE_COMPLETE', 'MEAL_LOG', 'ACHIEVEMENT_UNLOCK', 
           'RECOMMENDATION_VIEW', 'FEEDBACK_SUBMIT', 'VOICE_RECOGNITION', 'DATA_SYNC', 'ERROR_OCCURRED'])[1 + (random() * 9)::integer],
    CASE (random() * 9)::integer + 1
        WHEN 1 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "ip": "192.168.1.' || (1 + random() * 254)::integer || '", "device": "mobile"}')::jsonb
        WHEN 2 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "session_duration": ' || (random() * 3600)::integer || '}')::jsonb
        WHEN 3 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "exercise_id": ' || (1 + random() * 49)::integer || ', "duration": ' || (30 + random() * 90)::integer || '}')::jsonb
        WHEN 4 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "food_id": ' || (1 + random() * 49)::integer || ', "calories": ' || (100 + random() * 500)::integer || '}')::jsonb
        WHEN 5 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "achievement_id": ' || (1 + random() * 49)::integer || '}')::jsonb
        WHEN 6 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "recommendation_id": ' || (1 + random() * 100)::integer || '}')::jsonb
        WHEN 7 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "feedback_type": "positive", "rating": ' || (1 + random() * 5)::integer || '}')::jsonb
        WHEN 8 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "recognition_type": "EXERCISE", "confidence": ' || (0.7 + random() * 0.3)::numeric(4,2) || '}')::jsonb
        WHEN 9 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "data_type": "health_record", "sync_status": "success"}')::jsonb
        ELSE ('{"error_code": "E' || (100 + random() * 899)::integer || '", "message": "시스템 오류 발생", "severity": "' || (ARRAY['low', 'medium', 'high'])[1 + (random() * 2)::integer] || '"}')::jsonb
    END,
    -- 파티션 범위 내 날짜로 제한: 2025-04-01 ~ 2025-06-30 (약 90일)
    '2025-04-01'::timestamp + (random() * 90)::integer * INTERVAL '1 day'
FROM generate_series(1, 500);

-- ===================================================================
-- 15. 검증 히스토리 300개+ (음성인식 및 데이터 검증 이력)
-- ===================================================================
INSERT INTO validation_history (user_id, record_type, record_id, validation_status, validation_notes, validated_by, created_at)
SELECT 
    (2 + (random() * 48)::integer), -- user_id (2-49, 관리자 제외, 총 48명)
    (ARRAY['EXERCISE', 'MEAL'])[1 + (random() * 1)::integer]::record_type,
    (1 + random() * 500)::integer, -- record_id
    (ARRAY['VALIDATED', 'PENDING', 'REJECTED'])[
        CASE 
            WHEN random() > 0.8 THEN 1 -- 80% 검증 완료
            WHEN random() > 0.1 THEN 2 -- 10% 대기중
            ELSE 3 -- 10% 거부
        END
    ]::validation_status_type,
    CASE 
        WHEN random() > 0.8 THEN -- 검증 완료
            (ARRAY['정확한 데이터로 확인됨', '음성 인식 결과 정확함', 
                   '사용자 확인 완료', '데이터 검증 통과', '정상 처리됨'])[1 + (random() * 4)::integer]
        WHEN random() > 0.1 THEN -- 대기중
            (ARRAY['추가 확인 필요', '모호한 음성 인식 결과', 
                   '사용자 재확인 요청', '데이터 정확성 검토중'])[1 + (random() * 3)::integer]
        ELSE -- 거부
            (ARRAY['부정확한 데이터', '음성 인식 오류', 
                   '데이터 불일치', '검증 기준 미달'])[1 + (random() * 3)::integer]
    END,
    CASE 
        WHEN random() > 0.3 THEN 'AI_SYSTEM' -- 70% AI 자동 검증
        ELSE 'ADMIN_USER' -- 30% 관리자 수동 검증
    END,
    -- 최근 60일 내로 제한하되 현재 시간 기준으로 설정
    CURRENT_DATE - (random() * 60)::integer * INTERVAL '1 day'
FROM generate_series(1, 300);


-- ===================================================================
-- 16. 음성 인식 로그 200개+ (음성 입력 처리 이력) - 수정된 버전
-- ===================================================================
INSERT INTO voice_recognition_logs (
    user_id,
    audio_file_path,
    transcription_text,
    confidence_score,
    recognition_type,
    status,
    error_message,
    created_at
)
SELECT 
    (2 + (random() * 48)::integer), -- user_id (2-49, 총 48명)
    '/audio/user_' || (2 + (random() * 48)::integer) || '_' || 
    (ARRAY['exercise', 'meal'])[1 + (random() * 1)::integer] || '_' || 
    (1000 + random() * 8999)::integer || '.mp3',
    CASE 
        WHEN random() > 0.5 THEN -- 운동 관련 음성
            (ARRAY[
                '30분 동안 벤치프레스 3세트 12회씩 했어요',
                '스쿼트 운동 45분 했습니다',
                '데드리프트 5세트 8회 완료했어요',
                '플랭크 2분씩 3세트 했습니다',
                '러닝 30분 했어요 컨디션 좋았어요',
                '풀업 10회씩 4세트 완료',
                '레그프레스 120kg로 12회씩 3세트',
                '유산소 운동 40분 했습니다'
            ])[1 + (random() * 7)::integer]
        ELSE -- 식단 관련 음성
            (ARRAY[
                '아침에 현미밥 200g 먹었어요',
                '점심에 닭가슴살 150g 섭취했습니다',
                '저녁에 연어 구이 120g 먹었어요',
                '간식으로 바나나 한 개 먹었습니다',
                '계란 후라이 2개 아침에 먹었어요',
                '두부 샐러드 200g 점심에 섭취',
                '견과류 30g 간식으로 먹었어요',
                '요거트 100g 아침에 드셨어요'
            ])[1 + (random() * 7)::integer]
    END,
    0.70 + (random() * 0.25), -- confidence_score 0.70-0.95
    (ARRAY['EXERCISE', 'MEAL'])[1 + (random() * 1)::integer]::recognition_type,
    (ARRAY['VALIDATED', 'PENDING', 'REJECTED'])[
        CASE 
            WHEN random() > 0.8 THEN 1 -- 80% 성공
            WHEN random() > 0.1 THEN 2 -- 10% 대기
            ELSE 3 -- 10% 거부
        END
    ]::validation_status_type,
    CASE 
        WHEN random() < 0.1 THEN -- 10% 오류 메시지
            (ARRAY['음성이 불분명합니다', '배경 소음이 많습니다', 
                   '지원하지 않는 언어입니다', '음성 파일이 손상되었습니다'])[1 + (random() * 3)::integer]
        ELSE NULL
    END,
    -- 🔧 누락된 created_at 값 추가
    CURRENT_DATE - (random() * 30)::integer * INTERVAL '1 day'
FROM generate_series(1, 200); 



-- 등급 구간별 tier 값 일괄 업데이트 (점수 기준, 필요에 따라 조정)
UPDATE user_ranking SET tier = 'UNRANK'      WHERE total_score < 100;
UPDATE user_ranking SET tier = 'BRONZE'      WHERE total_score >= 100   AND total_score < 500;
UPDATE user_ranking SET tier = 'SILVER'      WHERE total_score >= 500   AND total_score < 1000;
UPDATE user_ranking SET tier = 'GOLD'        WHERE total_score >= 1000  AND total_score < 2000;
UPDATE user_ranking SET tier = 'PLATINUM'    WHERE total_score >= 2000  AND total_score < 3000;
UPDATE user_ranking SET tier = 'DIAMOND'     WHERE total_score >= 3000  AND total_score < 4000;
UPDATE user_ranking SET tier = 'MASTER'      WHERE total_score >= 4000  AND total_score < 5000;
UPDATE user_ranking SET tier = 'GRANDMASTER' WHERE total_score >= 5000  AND total_score < 6000;
UPDATE user_ranking SET tier = 'CHALLENGER'  WHERE total_score >= 6000;

-- ranking_history.user_id 값 동기화 (user_ranking_id → user_id)
UPDATE ranking_history rh
SET user_id = ur.user_id
FROM user_ranking ur
WHERE rh.user_ranking_id = ur.id;

-- ranking_history.tier 값 동기화 (user_id 기준)
UPDATE ranking_history rh
SET tier = ur.tier
FROM user_ranking ur
WHERE rh.user_id = ur.user_id;