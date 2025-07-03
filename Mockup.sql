CREATE EXTENSION IF NOT EXISTS pgcrypto;
BEGIN;
SET CONSTRAINTS ALL DEFERRED;

-- ===================================================================
-- 1. 사용자 데이터 50명 (관리자 1명 + 일반 사용자 49명)
-- ===================================================================
INSERT INTO users (email, password_hash, nickname, profile_image_url, height, weight, age, gender, role, created_at, updated_at, last_visited, uuid) VALUES
-- 관리자
('admin@lifebit.com', crypt('password123', gen_salt('bf')), 'Admin', NULL, 175.5, 70.0, 30, 'male', 'ADMIN', NOW(), NOW(), NOW(), gen_random_uuid()),

-- 일반 사용자 49명 (현실적인 한국인 체형 데이터)
('user001@example.com', crypt('password123', gen_salt('bf')), 'MinSoo_Kim', NULL, 180.0, 75.0, 25, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user002@example.com', crypt('password123', gen_salt('bf')), 'YoungHee_Lee', NULL, 165.0, 55.0, 26, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user003@example.com', crypt('password123', gen_salt('bf')), 'ChulSoo_Park', NULL, 170.0, 65.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user004@example.com', crypt('password123', gen_salt('bf')), 'JiMin_Jung', NULL, 162.0, 52.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user005@example.com', crypt('password123', gen_salt('bf')), 'DongWook_Choi', NULL, 178.0, 72.0, 27, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user006@example.com', crypt('password123', gen_salt('bf')), 'SoYoung_Han', NULL, 168.0, 58.0, 23, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user007@example.com', crypt('password123', gen_salt('bf')), 'DaeHyun_Yoon', NULL, 175.0, 68.0, 29, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user008@example.com', crypt('password123', gen_salt('bf')), 'MiKyung_Oh', NULL, 160.0, 50.0, 25, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user009@example.com', crypt('password123', gen_salt('bf')), 'JunHo_Jang', NULL, 182.0, 80.0, 31, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user010@example.com', crypt('password123', gen_salt('bf')), 'HyeWon_Shin', NULL, 167.0, 57.0, 27, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user011@example.com', crypt('password123', gen_salt('bf')), 'TaeHyun_Song', NULL, 173.0, 70.0, 26, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user012@example.com', crypt('password123', gen_salt('bf')), 'EunJung_Ryu', NULL, 164.0, 54.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user013@example.com', crypt('password123', gen_salt('bf')), 'JungMin_Ko', NULL, 176.0, 73.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user014@example.com', crypt('password123', gen_salt('bf')), 'SuJin_Lim', NULL, 161.0, 51.0, 22, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user015@example.com', crypt('password123', gen_salt('bf')), 'YoungSoo_Jun', NULL, 179.0, 76.0, 30, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user016@example.com', crypt('password123', gen_salt('bf')), 'SeoYeon_Baek', NULL, 166.0, 56.0, 25, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user017@example.com', crypt('password123', gen_salt('bf')), 'HyunWoo_Jo', NULL, 174.0, 69.0, 27, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user018@example.com', crypt('password123', gen_salt('bf')), 'MiRae_Kang', NULL, 163.0, 53.0, 23, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user019@example.com', crypt('password123', gen_salt('bf')), 'JiHoon_Yang', NULL, 181.0, 78.0, 29, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user020@example.com', crypt('password123', gen_salt('bf')), 'YuNa_Seo', NULL, 169.0, 59.0, 26, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user021@example.com', crypt('password123', gen_salt('bf')), 'SungHo_Moon', NULL, 177.0, 74.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user022@example.com', crypt('password123', gen_salt('bf')), 'DaEun_Yu', NULL, 165.0, 55.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user023@example.com', crypt('password123', gen_salt('bf')), 'JaeWon_Sim', NULL, 172.0, 67.0, 25, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user024@example.com', crypt('password123', gen_salt('bf')), 'YeJin_Noh', NULL, 162.0, 52.0, 23, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user025@example.com', crypt('password123', gen_salt('bf')), 'JunSeok_Heo', NULL, 178.0, 75.0, 27, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user026@example.com', crypt('password123', gen_salt('bf')), 'ChaeWon_Nam', NULL, 167.0, 57.0, 25, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user027@example.com', crypt('password123', gen_salt('bf')), 'DoYoung_Hwang', NULL, 175.0, 71.0, 26, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user028@example.com', crypt('password123', gen_salt('bf')), 'SeoHyun_Kong', NULL, 164.0, 54.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user029@example.com', crypt('password123', gen_salt('bf')), 'MinChul_Kwak', NULL, 180.0, 77.0, 30, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user030@example.com', crypt('password123', gen_salt('bf')), 'SuBin_Seok', NULL, 168.0, 58.0, 26, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user031@example.com', crypt('password123', gen_salt('bf')), 'WooJin_Sunwoo', NULL, 176.0, 72.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user032@example.com', crypt('password123', gen_salt('bf')), 'BoRa_Ahn', NULL, 161.0, 51.0, 22, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user033@example.com', crypt('password123', gen_salt('bf')), 'JaeMin_Ok', NULL, 179.0, 76.0, 29, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user034@example.com', crypt('password123', gen_salt('bf')), 'SoHee_Yook', NULL, 166.0, 56.0, 25, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user035@example.com', crypt('password123', gen_salt('bf')), 'HyunSeok_In', NULL, 174.0, 69.0, 27, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user036@example.com', crypt('password123', gen_salt('bf')), 'ChaeYoung_Lim', NULL, 163.0, 53.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user037@example.com', crypt('password123', gen_salt('bf')), 'WooJin_Jang', NULL, 181.0, 79.0, 31, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user038@example.com', crypt('password123', gen_salt('bf')), 'DaYoung_Jun', NULL, 169.0, 59.0, 26, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user039@example.com', crypt('password123', gen_salt('bf')), 'SeungHyun_Jung', NULL, 177.0, 73.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user040@example.com', crypt('password123', gen_salt('bf')), 'ARa_Jo', NULL, 165.0, 55.0, 25, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user041@example.com', crypt('password123', gen_salt('bf')), 'TaeYang_Jin', NULL, 172.0, 68.0, 26, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user042@example.com', crypt('password123', gen_salt('bf')), 'YeEun_Cha', NULL, 162.0, 52.0, 23, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user043@example.com', crypt('password123', gen_salt('bf')), 'HyungJun_Choi', NULL, 178.0, 74.0, 27, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user044@example.com', crypt('password123', gen_salt('bf')), 'JiWoo_Tak', NULL, 167.0, 57.0, 24, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user045@example.com', crypt('password123', gen_salt('bf')), 'MinSoo_Pyo', NULL, 175.0, 70.0, 25, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user046@example.com', crypt('password123', gen_salt('bf')), 'JiYeon_Han', NULL, 164.0, 54.0, 26, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user047@example.com', crypt('password123', gen_salt('bf')), 'JunHyuk_Hyun', NULL, 180.0, 76.0, 29, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user048@example.com', crypt('password123', gen_salt('bf')), 'DaIn_Hong', NULL, 168.0, 58.0, 27, 'female', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user049@example.com', crypt('password123', gen_salt('bf')), 'JaeWook_Hwang', NULL, 176.0, 71.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid()),
('user050@example.com', crypt('password123', gen_salt('bf')), 'MinJun_Song', NULL, 176.0, 71.0, 28, 'male', 'USER', NOW(), NOW(), NOW(), gen_random_uuid());

-- ===================================================================
-- 2. 운동 카탈로그 50개 (다양한 운동 종류)
-- ===================================================================
INSERT INTO exercise_catalog (name, exercise_type, body_part, description, intensity, created_at, uuid) VALUES
('벤치프레스', 'strength', 'chest', '가슴 운동의 대표적인 기본 운동', 'high', NOW(), gen_random_uuid()),
('인클라인 벤치프레스', 'strength', 'chest', '상부 가슴을 집중적으로 단련하는 운동', 'high', NOW(), gen_random_uuid()),
('디클라인 벤치프레스', 'strength', 'chest', '하부 가슴을 집중적으로 단련하는 운동', 'high', NOW(), gen_random_uuid()),
('덤벨 플라이', 'strength', 'chest', '가슴 근육 확장을 위한 운동', 'medium', NOW(), gen_random_uuid()),
('딥스', 'strength', 'chest', '자체 체중을 이용한 가슴 운동', 'medium', NOW(), gen_random_uuid()),
('푸시업', 'strength', 'chest', '기본적인 자체 체중 가슴 운동', 'low', NOW(), gen_random_uuid()),
('케이블 크로스오버', 'strength', 'chest', '케이블을 이용한 가슴 운동', 'medium', NOW(), gen_random_uuid()),
('펙 덱 플라이', 'strength', 'chest', '머신을 이용한 가슴 운동', 'medium', NOW(), gen_random_uuid()),
('데드리프트', 'strength', 'back', '전신 근력 향상을 위한 복합 운동', 'high', NOW(), gen_random_uuid()),
('풀업', 'strength', 'back', '자체 체중을 이용한 등 운동', 'high', NOW(), gen_random_uuid()),
('랫 풀다운', 'strength', 'back', '머신을 이용한 등 운동', 'medium', NOW(), gen_random_uuid()),
('시티드 로우', 'strength', 'back', '앉은 자세에서 하는 등 운동', 'medium', NOW(), gen_random_uuid()),
('바벨 로우', 'strength', 'back', '바벨을 이용한 등 운동', 'high', NOW(), gen_random_uuid()),
('티바 로우', 'strength', 'back', '티바를 이용한 등 운동', 'medium', NOW(), gen_random_uuid()),
('원암 덤벨 로우', 'strength', 'back', '한 팔씩 하는 덤벨 등 운동', 'medium', NOW(), gen_random_uuid()),
('케이블 로우', 'strength', 'back', '케이블을 이용한 등 운동', 'medium', NOW(), gen_random_uuid()),
('스쿼트', 'strength', 'legs', '하체 운동의 기본이 되는 복합 운동', 'high', NOW(), gen_random_uuid()),
('프론트 스쿼트', 'strength', 'legs', '앞쪽에 무게를 두고 하는 스쿼트', 'high', NOW(), gen_random_uuid()),
('레그 프레스', 'strength', 'legs', '머신을 이용한 하체 운동', 'high', NOW(), gen_random_uuid()),
('런지', 'strength', 'legs', '한 다리씩 하는 하체 운동', 'medium', NOW(), gen_random_uuid()),
('불가리안 스플릿 스쿼트', 'strength', 'legs', '한 다리 집중 하체 운동', 'medium', NOW(), gen_random_uuid()),
('레그 컬', 'strength', 'legs', '햄스트링 집중 운동', 'medium', NOW(), gen_random_uuid()),
('레그 익스텐션', 'strength', 'legs', '대퇴사두근 집중 운동', 'medium', NOW(), gen_random_uuid()),
('카프 레이즈', 'strength', 'legs', '종아리 근육 운동', 'low', NOW(), gen_random_uuid()),
('힙 쓰러스트', 'strength', 'legs', '둔근 집중 운동', 'medium', NOW(), gen_random_uuid()),
('워킹 런지', 'strength', 'legs', '이동하면서 하는 런지 운동', 'medium', NOW(), gen_random_uuid()),
('숄더 프레스', 'strength', 'shoulders', '전체 어깨 근육을 위한 운동', 'medium', NOW(), gen_random_uuid()),
('사이드 레터럴 레이즈', 'strength', 'shoulders', '어깨 측면 근육 운동', 'low', NOW(), gen_random_uuid()),
('프론트 레이즈', 'strength', 'shoulders', '어깨 앞쪽 근육 운동', 'low', NOW(), gen_random_uuid()),
('리어 델트 플라이', 'strength', 'shoulders', '어깨 뒷쪽 근육 운동', 'low', NOW(), gen_random_uuid()),
('업라이트 로우', 'strength', 'shoulders', '수직으로 당기는 어깨 운동', 'medium', NOW(), gen_random_uuid()),
('아놀드 프레스', 'strength', 'shoulders', '아놀드 스타일 어깨 운동', 'medium', NOW(), gen_random_uuid()),
('케이블 사이드 레터럴', 'strength', 'shoulders', '케이블을 이용한 어깨 측면 운동', 'low', NOW(), gen_random_uuid()),
('밀리터리 프레스', 'strength', 'shoulders', '서서 하는 어깨 프레스', 'high', NOW(), gen_random_uuid()),
('바이셉 컬', 'strength', 'arms', '이두근 집중 운동', 'low', NOW(), gen_random_uuid()),
('해머 컬', 'strength', 'arms', '해머 그립으로 하는 이두근 운동', 'low', NOW(), gen_random_uuid()),
('트라이셉 익스텐션', 'strength', 'arms', '삼두근 집중 운동', 'low', NOW(), gen_random_uuid()),
('트라이셉 딥스', 'strength', 'arms', '자체 체중을 이용한 삼두근 운동', 'medium', NOW(), gen_random_uuid()),
('클로즈 그립 벤치프레스', 'strength', 'arms', '좁은 손 간격으로 하는 삼두근 운동', 'medium', NOW(), gen_random_uuid()),
('케이블 트라이셉 푸시다운', 'strength', 'arms', '케이블을 이용한 삼두근 운동', 'low', NOW(), gen_random_uuid()),
('플랭크', 'strength', 'abs', '코어 강화를 위한 기본 운동', 'medium', NOW(), gen_random_uuid()),
('크런치', 'strength', 'abs', '복직근 집중 운동', 'low', NOW(), gen_random_uuid()),
('레그 레이즈', 'strength', 'abs', '하복부 집중 운동', 'medium', NOW(), gen_random_uuid()),
('러시안 트위스트', 'strength', 'abs', '복사근 집중 운동', 'medium', NOW(), gen_random_uuid()),
('마운틴 클라이머', 'strength', 'abs', '전신 코어 운동', 'high', NOW(), gen_random_uuid()),
('러닝', 'aerobic', 'cardio', '달리기 유산소 운동', 'high', NOW(), gen_random_uuid()),
('사이클링', 'aerobic', 'cardio', '자전거 유산소 운동', 'medium', NOW(), gen_random_uuid()),
('로잉', 'aerobic', 'cardio', '로잉 머신 유산소 운동', 'high', NOW(), gen_random_uuid()),
('일립티컬', 'aerobic', 'cardio', '일립티컬 머신 유산소 운동', 'medium', NOW(), gen_random_uuid()),
('스테어 클라이머', 'aerobic', 'cardio', '계단 오르기 유산소 운동', 'high', NOW(), gen_random_uuid());

-- ===================================================================
-- 3. 음식 아이템 50개 (한국 음식 중심, 영양소 정보 포함)
-- ===================================================================
INSERT INTO food_items (food_code, name, serving_size, calories, carbs, protein, fat, created_at, uuid) VALUES
-- 주식류 (10개)
('F001', '현미밥', 100.0, 350.0, 73.0, 7.0, 2.5, NOW(), gen_random_uuid()),
('F002', '백미밥', 100.0, 365.0, 80.0, 6.5, 1.0, NOW(), gen_random_uuid()),
('F003', '잡곡밥', 100.0, 340.0, 70.0, 8.0, 3.0, NOW(), gen_random_uuid()),
('F004', '귀리밥', 100.0, 380.0, 66.0, 12.0, 6.0, NOW(), gen_random_uuid()),
('F005', '보리밥', 100.0, 325.0, 69.0, 8.5, 2.0, NOW(), gen_random_uuid()),
('F006', '김밥', 150.0, 280.0, 45.0, 8.0, 7.0, NOW(), gen_random_uuid()),
('F007', '볶음밥', 200.0, 420.0, 55.0, 12.0, 15.0, NOW(), gen_random_uuid()),
('F008', '비빔밥', 300.0, 480.0, 65.0, 18.0, 12.0, NOW(), gen_random_uuid()),
('F009', '덮밥', 250.0, 450.0, 60.0, 20.0, 10.0, NOW(), gen_random_uuid()),
('F010', '주먹밥', 120.0, 320.0, 58.0, 7.0, 5.0, NOW(), gen_random_uuid()),

-- 단백질류 (12개)
('F011', '닭가슴살', 100.0, 165.0, 0.0, 31.0, 3.6, NOW(), gen_random_uuid()),
('F012', '닭다리살', 100.0, 205.0, 0.0, 26.0, 11.0, NOW(), gen_random_uuid()),
('F013', '소고기 등심', 100.0, 250.0, 0.0, 26.0, 15.0, NOW(), gen_random_uuid()),
('F014', '돼지고기 등심', 100.0, 280.0, 0.0, 22.0, 20.0, NOW(), gen_random_uuid()),
('F015', '연어', 100.0, 208.0, 0.0, 25.0, 12.0, NOW(), gen_random_uuid()),
('F016', '고등어', 100.0, 190.0, 0.0, 25.0, 12.0, NOW(), gen_random_uuid()),
('F017', '계란', 50.0, 78.0, 0.6, 6.3, 5.3, NOW(), gen_random_uuid()),
('F018', '두부', 100.0, 84.0, 2.0, 8.0, 5.0, NOW(), gen_random_uuid()),
('F019', '콩', 100.0, 350.0, 30.0, 35.0, 18.0, NOW(), gen_random_uuid()),
('F020', '아몬드', 30.0, 174.0, 6.1, 6.4, 15.0, NOW(), gen_random_uuid()),
('F021', '호두', 30.0, 196.0, 4.1, 4.6, 19.6, NOW(), gen_random_uuid()),
('F022', '참치캔', 100.0, 132.0, 0.0, 29.0, 1.0, NOW(), gen_random_uuid()),

-- 채소류 (15개)
('F023', '시금치', 100.0, 23.0, 3.6, 2.9, 0.4, NOW(), gen_random_uuid()),
('F024', '브로콜리', 100.0, 34.0, 7.0, 2.8, 0.4, NOW(), gen_random_uuid()),
('F025', '양배추', 100.0, 25.0, 6.0, 1.3, 0.1, NOW(), gen_random_uuid()),
('F026', '당근', 100.0, 41.0, 10.0, 0.9, 0.2, NOW(), gen_random_uuid()),
('F027', '오이', 100.0, 16.0, 4.0, 0.7, 0.1, NOW(), gen_random_uuid()),
('F028', '토마토', 100.0, 18.0, 3.9, 0.9, 0.2, NOW(), gen_random_uuid()),
('F029', '상추', 100.0, 15.0, 2.9, 1.4, 0.1, NOW(), gen_random_uuid()),
('F030', '무', 100.0, 18.0, 4.1, 0.6, 0.1, NOW(), gen_random_uuid()),
('F031', '고구마', 100.0, 86.0, 20.0, 1.6, 0.1, NOW(), gen_random_uuid()),
('F032', '감자', 100.0, 77.0, 17.0, 2.0, 0.1, NOW(), gen_random_uuid()),
('F033', '양파', 100.0, 40.0, 9.3, 1.1, 0.1, NOW(), gen_random_uuid()),
('F034', '마늘', 10.0, 42.0, 9.9, 1.8, 0.1, NOW(), gen_random_uuid()),
('F035', '생강', 10.0, 8.0, 1.8, 0.2, 0.1, NOW(), gen_random_uuid()),
('F036', '피망', 100.0, 26.0, 6.0, 1.0, 0.3, NOW(), gen_random_uuid()),
('F037', '버섯', 100.0, 22.0, 3.3, 3.1, 0.3, NOW(), gen_random_uuid()),

-- 과일류 (8개)
('F038', '사과', 150.0, 78.0, 20.6, 0.4, 0.3, NOW(), gen_random_uuid()),
('F039', '바나나', 120.0, 105.0, 27.0, 1.3, 0.4, NOW(), gen_random_uuid()),
('F040', '오렌지', 150.0, 62.0, 15.4, 1.2, 0.2, NOW(), gen_random_uuid()),
('F041', '포도', 100.0, 69.0, 18.1, 0.7, 0.2, NOW(), gen_random_uuid()),
('F042', '딸기', 100.0, 32.0, 7.7, 0.7, 0.3, NOW(), gen_random_uuid()),
('F043', '블루베리', 100.0, 57.0, 14.5, 0.7, 0.3, NOW(), gen_random_uuid()),
('F044', '키위', 100.0, 61.0, 14.7, 1.1, 0.5, NOW(), gen_random_uuid()),
('F045', '수박', 100.0, 30.0, 7.6, 0.6, 0.2, NOW(), gen_random_uuid()),

-- 음료 및 기타 (5개)
('F046', '우유', 200.0, 134.0, 9.6, 6.6, 7.6, NOW(), gen_random_uuid()),
('F047', '요거트', 100.0, 59.0, 4.7, 10.0, 0.4, NOW(), gen_random_uuid()),
('F048', '아보카도', 100.0, 160.0, 8.5, 2.0, 14.7, NOW(), gen_random_uuid()),
('F049', '올리브오일', 10.0, 90.0, 0.0, 0.0, 10.0, NOW(), gen_random_uuid()),
('F050', '견과류 믹스', 30.0, 180.0, 5.0, 6.0, 16.0, NOW(), gen_random_uuid());

-- ===================================================================
-- 4. 업적 데이터 (기본 업적)
-- ===================================================================
INSERT INTO achievements (title, description, badge_type, target_days, is_active, created_at, uuid) VALUES
-- 브론즈 업적 (15개) - 초급자용
('첫 걸음', '첫 번째 운동 기록', 'FIRST_LOGIN', 1, true, NOW(), gen_random_uuid()),
('주간 전사', '연속 7일 운동', 'STREAK_7', 7, true, NOW(), gen_random_uuid()),
('운동 초보자', '10번 운동 완료', 'WORKOUT_GOAL', 10, true, NOW(), gen_random_uuid()),
('식단 시작', '첫 번째 식단 기록', 'NUTRITION_GOAL', 1, true, NOW(), gen_random_uuid()),
('꾸준함의 시작', '연속 3일 운동', 'STREAK_7', 3, true, NOW(), gen_random_uuid()),
('아침 운동러', '아침 운동 5회 완료', 'WORKOUT_GOAL', 5, true, NOW(), gen_random_uuid()),
('저녁 운동러', '저녁 운동 5회 완료', 'WORKOUT_GOAL', 5, true, NOW(), gen_random_uuid()),
('주말 전사', '주말 운동 3회 완료', 'WORKOUT_GOAL', 3, true, NOW(), gen_random_uuid()),
('유산소 초보자', '유산소 운동 5회 완료', 'WORKOUT_GOAL', 5, true, NOW(), gen_random_uuid()),
('근력 초보자', '근력 운동 5회 완료', 'WORKOUT_GOAL', 5, true, NOW(), gen_random_uuid()),
('식단 기록자', '식단 기록 7일 완료', 'NUTRITION_GOAL', 7, true, NOW(), gen_random_uuid()),
('목표 설정자', '운동 목표 설정 완료', 'WORKOUT_GOAL', 1, true, NOW(), gen_random_uuid()),
('체중 관리자', '체중 기록 5회 완료', 'WEIGHT_GOAL', 5, true, NOW(), gen_random_uuid()),
('운동 다양성', '3가지 다른 운동 완료', 'WORKOUT_GOAL', 3, true, NOW(), gen_random_uuid()),
('건강한 하루', '하루 운동+식단 기록', 'PERFECT_WEEK', 1, true, NOW(), gen_random_uuid()),

-- 실버 업적 (15개) - 중급자용
('2주 챌린지', '연속 14일 운동', 'STREAK_30', 14, true, NOW(), gen_random_uuid()),
('월간 마스터', '연속 30일 운동', 'STREAK_30', 30, true, NOW(), gen_random_uuid()),
('운동 애호가', '총 50회 운동 완료', 'WORKOUT_GOAL', 50, true, NOW(), gen_random_uuid()),
('식단 전문가', '연속 14일 식단 기록', 'NUTRITION_GOAL', 14, true, NOW(), gen_random_uuid()),
('체중 감량 성공', '체중 3kg 감량 달성', 'WEIGHT_GOAL', 30, true, NOW(), gen_random_uuid()),
('근력 향상자', '근력 운동 30회 완료', 'WORKOUT_GOAL', 30, true, NOW(), gen_random_uuid()),
('유산소 매니아', '유산소 운동 30회 완료', 'WORKOUT_GOAL', 30, true, NOW(), gen_random_uuid()),
('아침형 인간', '아침 운동 20회 완료', 'WORKOUT_GOAL', 20, true, NOW(), gen_random_uuid()),
('저녁 루틴 마스터', '저녁 운동 20회 완료', 'WORKOUT_GOAL', 20, true, NOW(), gen_random_uuid()),
('주말 활동가', '주말 운동 10회 완료', 'WORKOUT_GOAL', 10, true, NOW(), gen_random_uuid()),
('균형 식단', '균형 식단 14일 유지', 'NUTRITION_GOAL', 14, true, NOW(), gen_random_uuid()),
('칼로리 버너', '총 10000kcal 소모', 'WORKOUT_GOAL', 30, true, NOW(), gen_random_uuid()),
('체중 관리 전문가', '체중 기록 30회 완료', 'WEIGHT_GOAL', 30, true, NOW(), gen_random_uuid()),
('운동 전문가', '5가지 다른 운동 완료', 'WORKOUT_GOAL', 5, true, NOW(), gen_random_uuid()),
('건강한 생활', '30일 연속 건강관리', 'PERFECT_WEEK', 30, true, NOW(), gen_random_uuid()),

-- 골드 업적 (15개) - 고급자용
('3개월 챌린지', '연속 90일 운동', 'STREAK_100', 90, true, NOW(), gen_random_uuid()),
('100회 돌파', '총 100회 운동 완료', 'WORKOUT_GOAL', 100, true, NOW(), gen_random_uuid()),
('체중 관리 마스터', '목표 체중 달성', 'WEIGHT_GOAL', 60, true, NOW(), gen_random_uuid()),
('근력 킹', '근력 운동 60회 완료', 'WORKOUT_GOAL', 60, true, NOW(), gen_random_uuid()),
('유산소 킹', '유산소 운동 60회 완료', 'WORKOUT_GOAL', 60, true, NOW(), gen_random_uuid()),
('식단 완벽주의자', '연속 60일 식단 기록', 'NUTRITION_GOAL', 60, true, NOW(), gen_random_uuid()),
('아침 운동 마스터', '아침 운동 50회 완료', 'WORKOUT_GOAL', 50, true, NOW(), gen_random_uuid()),
('저녁 운동 전문가', '저녁 운동 50회 완료', 'WORKOUT_GOAL', 50, true, NOW(), gen_random_uuid()),
('주말 운동 킹', '주말 운동 30회 완료', 'WORKOUT_GOAL', 30, true, NOW(), gen_random_uuid()),
('칼로리 소모 킹', '총 30000kcal 소모', 'WORKOUT_GOAL', 90, true, NOW(), gen_random_uuid()),
('운동 올라운더', '10가지 다른 운동 완료', 'WORKOUT_GOAL', 10, true, NOW(), gen_random_uuid()),
('체중 변화 추적자', '체중 기록 90회 완료', 'WEIGHT_GOAL', 90, true, NOW(), gen_random_uuid()),
('건강 생활 마스터', '90일 연속 건강관리', 'PERFECT_WEEK', 90, true, NOW(), gen_random_uuid()),
('목표 달성자', '모든 목표 달성', 'WORKOUT_GOAL', 90, true, NOW(), gen_random_uuid()),
('피트니스 구루', '총 50시간 운동 완료', 'WORKOUT_GOAL', 90, true, NOW(), gen_random_uuid()),

-- 플래티넘 업적 (5개) - 최고급자용
('6개월 레전드', '연속 180일 운동', 'STREAK_100', 180, true, NOW(), gen_random_uuid()),
('운동 매니아', '총 500회 운동 완료', 'WORKOUT_GOAL', 500, true, NOW(), gen_random_uuid()),
('완벽한 변화', '목표 체중 6개월 유지', 'WEIGHT_GOAL', 180, true, NOW(), gen_random_uuid()),
('칼로리 소모 레전드', '총 100000kcal 소모', 'WORKOUT_GOAL', 180, true, NOW(), gen_random_uuid()),
('건강 생활 레전드', '180일 연속 완벽 관리', 'PERFECT_WEEK', 180, true, NOW(), gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 5. 건강 기록 900개 (체중 변화 추적)
-- ===================================================================
-- 사용자 ID: 2~50 (49명)
-- 기간: 2025년 2월 1일부터
-- 기록 날짜: 균일하게 분포
-- ===================================================================
INSERT INTO health_records (user_id, weight, height, record_date)
WITH user_records AS (
    SELECT 
        u.user_id,
        series_num,
        65 + (random() * 20) + (random() - 0.5) * 10 AS weight,
        160 + (random() * 25) AS height,
        '2025-02-01'::date + (random() * 149)::integer * INTERVAL '1 day' AS record_date
    FROM (
        SELECT user_id FROM users WHERE role = 'USER' ORDER BY user_id LIMIT 49
    ) u
    CROSS JOIN generate_series(1, 18) AS series_num -- 49명 × 18개 = 882개
    
    UNION ALL
    
    -- 나머지 18개 레코드를 랜덤 사용자에게 추가
    SELECT 
        (SELECT user_id FROM users WHERE role = 'USER' ORDER BY random() LIMIT 1) AS user_id,
        series_num,
        65 + (random() * 20) + (random() - 0.5) * 10 AS weight,
        160 + (random() * 25) AS height,
        '2025-02-01'::date + (random() * 149)::integer * INTERVAL '1 day' AS record_date
    FROM generate_series(1, 18) AS series_num
)
SELECT user_id, weight, height, record_date 
FROM user_records 
ORDER BY random()
LIMIT 900;

-- ===================================================================
-- 6. 운동 세션 900개+ (현실적인 운동 패턴)
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
    -- 기록 날짜: 2025년 1월 1일부터 6월 29일까지 균등하게 분포 (179일간)
    ('2025-01-01'::date + ((row_number() OVER () - 1) * 178 / 1599)::integer * INTERVAL '1 day')::date AS exercise_date,
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
FROM generate_series(1, 1600) AS series;

-- ===================================================================
-- 7. 식단 로그 900개+ (현실적인 식사 패턴)
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
    (ARRAY['breakfast', 'lunch', 'dinner', 'snack'])[1 + (random() * 3)::integer],
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
-- 8. 사용자 랭킹 49개 (각 사용자당 1개)
-- ===================================================================
-- user_ranking은 트리거에 의해 자동 생성되므로 UPDATE로 점수만 설정
UPDATE user_ranking 
SET 
    total_score = (100 + random() * 900)::integer, -- 총점: 100-1000점
    streak_days = (random() * 30)::integer, -- 연속일: 0-30일
    season = 1, -- 현재 시즌
    is_active = true -- 활성 상태
WHERE user_id IN (SELECT user_id FROM users WHERE role = 'USER');

-- 점수 기반 순위 재정렬
UPDATE user_ranking 
SET rank_position = subquery.new_rank
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as new_rank
    FROM user_ranking
) AS subquery
WHERE user_ranking.id = subquery.id;

-- ===================================================================
-- 9. 사용자 업적 달성 기록 500개+ (각 사용자가 여러 업적에 도전)
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
-- 10. 추천 시스템 500개+ (운동/식단 추천)
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
-- 11. 피드백 시스템 400개+ (추천에 대한 사용자 피드백)
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
-- 12. ranking_history (user_ranking_id 동적 참조)
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
-- 13. 신규 사용자 환영 알림 (admin 제외, 일반 사용자 10명)
-- ===================================================================
INSERT INTO notification (user_id, type, ref_id, title, message)
SELECT user_id, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'
FROM users
WHERE role = 'USER'
ORDER BY user_id
LIMIT 10;

-- ===================================================================
-- 14. notification_read
-- ===================================================================
INSERT INTO notification_read (user_id, notification_id)
SELECT u.user_id, n.id
FROM users u
CROSS JOIN notification n
WHERE n.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM notification_read nr
    WHERE nr.user_id = u.user_id AND nr.notification_id = n.id
  );

-- ===================================================================
-- 15. 기본 데이터 (LifeBit.sql에서 이동)
-- ===================================================================
-- 기본 시스템 알림 데이터 삽입
INSERT INTO notification (user_id, type, ref_id, title, message, created_at, uuid) VALUES
-- 시스템 공용 알림 데이터 (user_id = NULL)
(NULL, 'SYSTEM', NULL, '앱 사용 팁', '앱의 다양한 기능을 활용해보세요. 더욱 효율적인 건강 관리가 가능합니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '단축키 안내', '앱 사용을 더욱 편리하게 해주는 단축키를 확인해보세요. 빠른 접근이 가능합니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '음성 인식 기능', '음성으로 운동 기록을 남길 수 있는 기능이 추가되었습니다. 편리하게 이용해보세요.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, 'AI 운동 추천', 'AI 운동 추천 기능을 활용해보세요. 개인 맞춤형 운동을 추천받을 수 있습니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '데이터 동기화', '여러 기기에서 사용하실 때는 데이터 동기화를 확인해주세요. 모든 기기에서 동일한 정보를 확인할 수 있습니다.', NOW(), gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 모든 사용자-업적 조합이 user_achievements에 없으면 생성 (중복 없이)
INSERT INTO user_achievements (user_id, achievement_id)
SELECT u.user_id, a.achievement_id
FROM users u
CROSS JOIN achievements a
WHERE NOT EXISTS (
  SELECT 1 FROM user_achievements ua WHERE ua.user_id = u.user_id AND ua.achievement_id = a.achievement_id
);

-- === 추가된 2025-07-02~03 더미데이터 ===

-- mockup data for 2025-07-02 and 2025-07-03

INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 47, 38, 190, 32.2, 5, 2, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 10, 55, 385, 87.9, 8, 3, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 31, 32, 192, 52.1, 15, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (1, 33, 'dinner', 0.91, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (1, 46, 'snack', 1.04, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (1, 168.3, 61.0, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (2, 10, 30, 270, 99.9, 8, 1, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (2, 33, 23, 161, 34.4, 15, 2, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (2, 32, 56, 392, 82.6, 11, 4, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (2, 15, 'midnight', 1.84, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (2, 19, 'lunch', 0.98, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (2, 35, 'lunch', 1.62, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (2, 161.0, 75.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (3, 13, 11, 66, 89.1, 5, 5, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (3, 14, 'midnight', 1.91, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (3, 44, 'midnight', 1.61, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (3, 48, 'snack', 1.38, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (3, 163.4, 76.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (4, 40, 57, 456, 78.3, 7, 2, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (4, 31, 27, 243, 95.7, 9, 2, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 6, 'midnight', 1.16, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 25, 'dinner', 0.77, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 12, 'breakfast', 0.65, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (4, 185.3, 84.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (5, 30, 22, 198, 47.8, 10, 1, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (5, 4, 17, 136, 93.0, 12, 5, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 2, 'lunch', 0.8, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 4, 'snack', 0.77, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 22, 'breakfast', 1.68, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 20, 'midnight', 1.92, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (5, 186.4, 62.0, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (6, 22, 18, 90, 95.1, 7, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (6, 1, 27, 162, 24.4, 5, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (6, 25, 28, 196, 48.5, 13, 2, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 23, 'midnight', 1.41, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 34, 'dinner', 1.26, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 5, 'lunch', 1.35, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (6, 185.4, 88.1, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (7, 25, 36, 288, 59.9, 8, 2, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (7, 23, 27, 243, 33.2, 5, 4, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 13, 'snack', 1.47, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 38, 'snack', 0.5, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 41, 'midnight', 1.98, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 14, 'breakfast', 1.19, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (7, 175.1, 72.1, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (8, 43, 47, 235, 73.3, 12, 2, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (8, 36, 38, 190, 87.0, 15, 2, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 23, 'midnight', 1.83, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 21, 'midnight', 0.67, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 5, 'lunch', 1.44, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (8, 161.2, 62.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (9, 41, 15, 150, 65.5, 5, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (9, 34, 41, 246, 49.2, 6, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (9, 49, 38, 380, 44.7, 15, 2, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 27, 'snack', 1.84, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 2, 'dinner', 0.96, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 9, 'snack', 0.51, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (9, 162.0, 50.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (10, 13, 49, 490, 26.7, 10, 5, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 35, 'midnight', 0.61, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 22, 'dinner', 1.22, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (10, 169.3, 87.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (11, 23, 55, 440, 87.7, 15, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (11, 40, 58, 348, 41.3, 14, 2, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (11, 25, 13, 117, 25.1, 12, 3, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 34, 'dinner', 1.02, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 12, 'midnight', 0.66, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 30, 'snack', 0.88, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (11, 184.9, 83.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 50, 35, 210, 90.1, 11, 4, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 44, 26, 182, 89.4, 7, 1, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 50, 48, 384, 70.5, 10, 1, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 13, 'lunch', 0.82, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 23, 'dinner', 0.78, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 48, 'snack', 0.74, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 50, 'lunch', 0.79, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (12, 189.5, 86.5, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 49, 53, 477, 72.7, 5, 5, '2025-07-02', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 31, 32, 256, 96.1, 15, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 27, 16, 96, 77.0, 15, 3, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 24, 'breakfast', 1.6, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 20, 'midnight', 1.04, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 47, 'midnight', 1.24, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (13, 162.6, 88.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (14, 23, 60, 420, 42.7, 8, 1, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (14, 13, 'snack', 0.99, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (14, 30, 'dinner', 1.85, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (14, 169.3, 76.5, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (15, 32, 35, 245, 70.3, 10, 1, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (15, 2, 55, 440, 34.4, 14, 5, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (15, 50, 36, 180, 86.4, 9, 1, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (15, 21, 'dinner', 1.39, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (15, 35, 'dinner', 0.98, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (15, 37, 'lunch', 1.52, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (15, 167.5, 83.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (16, 25, 49, 294, 75.3, 13, 2, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (16, 2, 35, 315, 78.1, 11, 1, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (16, 43, 31, 155, 29.5, 9, 5, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 23, 'dinner', 0.65, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 16, 'dinner', 1.35, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (16, 171.4, 53.7, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (17, 47, 12, 108, 21.1, 13, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (17, 47, 30, 210, 72.1, 7, 5, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (17, 32, 20, 120, 54.1, 13, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 48, 'lunch', 0.53, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 19, 'breakfast', 1.66, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (17, 159.8, 82.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (18, 43, 39, 195, 29.7, 6, 1, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (18, 10, 58, 464, 66.6, 12, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (18, 47, 'lunch', 0.86, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (18, 9, 'snack', 0.52, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (18, 173.4, 66.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (19, 46, 35, 210, 72.2, 6, 1, '2025-07-02', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (19, 36, 15, 105, 42.2, 11, 3, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (19, 27, 'lunch', 0.84, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (19, 3, 'breakfast', 0.96, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (19, 189.9, 72.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (20, 29, 28, 140, 94.6, 13, 1, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (20, 31, 14, 84, 74.8, 5, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (20, 17, 'midnight', 0.8, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (20, 30, 'lunch', 0.69, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (20, 178.1, 74.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (21, 22, 47, 376, 46.7, 6, 2, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (21, 7, 20, 200, 73.9, 8, 1, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 7, 'midnight', 1.38, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 38, 'lunch', 1.35, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 31, 'midnight', 1.31, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 35, 'lunch', 1.08, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (21, 172.2, 79.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (22, 11, 56, 336, 66.9, 11, 5, '2025-07-02', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (22, 25, 28, 224, 85.6, 12, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (22, 21, 59, 295, 75.2, 8, 5, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 47, 'dinner', 1.54, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 3, 'lunch', 1.63, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 47, 'breakfast', 1.6, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (22, 161.4, 79.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (23, 50, 25, 150, 25.4, 14, 1, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 48, 'snack', 1.47, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 6, 'dinner', 1.1, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 29, 'breakfast', 1.2, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 12, 'dinner', 1.33, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (23, 181.9, 73.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (24, 12, 55, 385, 57.1, 9, 3, '2025-07-02', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (24, 10, 18, 180, 21.9, 7, 2, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 1, 'midnight', 0.84, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 50, 'snack', 1.14, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 1, 'snack', 0.81, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (24, 172.4, 54.3, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (25, 6, 59, 472, 33.4, 13, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (25, 29, 'lunch', 0.66, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (25, 35, 'snack', 1.85, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (25, 150.7, 60.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (26, 50, 10, 50, 86.0, 5, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (26, 20, 55, 385, 40.8, 8, 2, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (26, 8, 16, 160, 70.7, 11, 1, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 44, 'midnight', 1.68, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 11, 'dinner', 1.06, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (26, 155.6, 78.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (27, 30, 38, 304, 84.6, 15, 2, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (27, 33, 45, 315, 49.4, 15, 3, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 21, 'lunch', 1.41, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 48, 'lunch', 0.54, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 11, 'lunch', 1.08, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 37, 'dinner', 0.69, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (27, 156.5, 64.5, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (28, 1, 11, 110, 50.9, 11, 3, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (28, 43, 'breakfast', 1.17, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (28, 31, 'snack', 1.79, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (28, 170.6, 85.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (29, 27, 29, 145, 96.0, 8, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (29, 2, 29, 232, 26.1, 11, 3, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (29, 35, 44, 220, 27.5, 5, 2, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (29, 12, 'breakfast', 0.95, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (29, 19, 'midnight', 0.51, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (29, 177.0, 67.3, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (30, 35, 53, 371, 57.9, 6, 1, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 23, 'lunch', 1.67, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 28, 'breakfast', 0.74, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 45, 'midnight', 1.0, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 30, 'lunch', 1.43, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (30, 156.3, 56.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (31, 42, 15, 105, 75.8, 7, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (31, 25, 30, 270, 66.8, 6, 3, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (31, 26, 36, 360, 32.4, 6, 3, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (31, 44, 'midnight', 0.79, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (31, 12, 'dinner', 1.96, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (31, 173.5, 85.1, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 27, 22, 198, 98.1, 7, 2, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 4, 47, 423, 33.1, 5, 5, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 17, 46, 460, 23.9, 12, 1, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 48, 'breakfast', 1.35, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 34, 'lunch', 0.67, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 49, 'dinner', 0.67, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (32, 154.4, 74.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (33, 29, 32, 320, 92.4, 5, 4, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (33, 34, 'midnight', 0.7, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (33, 48, 'breakfast', 1.6, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (33, 34, 'lunch', 0.79, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (33, 165.0, 88.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (34, 22, 54, 324, 70.9, 10, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (34, 45, 18, 126, 90.1, 12, 5, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (34, 10, 55, 330, 99.7, 15, 2, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (34, 45, 'lunch', 1.56, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (34, 6, 'lunch', 1.31, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (34, 36, 'breakfast', 1.65, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (34, 182.8, 80.5, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (35, 2, 47, 376, 94.4, 13, 2, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 37, 'lunch', 0.53, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 23, 'lunch', 1.4, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 13, 'breakfast', 1.61, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 14, 'breakfast', 0.65, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (35, 183.2, 77.2, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (36, 11, 56, 560, 30.5, 7, 5, '2025-07-02', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 28, 'midnight', 1.4, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 49, 'snack', 0.89, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 35, 'lunch', 1.98, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 25, 'dinner', 1.09, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (36, 158.1, 80.7, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (37, 20, 39, 234, 56.5, 9, 4, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 21, 'dinner', 1.89, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 48, 'breakfast', 0.87, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (37, 164.8, 79.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (38, 38, 55, 330, 53.0, 6, 5, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 33, 'breakfast', 1.73, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 48, 'breakfast', 1.02, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 48, 'breakfast', 0.64, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (38, 170.0, 82.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (39, 39, 18, 180, 85.4, 15, 3, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (39, 6, 13, 78, 55.3, 15, 4, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 10, 'dinner', 1.14, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 33, 'midnight', 1.03, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 19, 'breakfast', 1.82, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 41, 'snack', 0.85, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (39, 174.6, 74.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (40, 6, 39, 273, 70.8, 15, 3, '2025-07-02', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (40, 30, 47, 282, 47.9, 8, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (40, 8, 'dinner', 1.28, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (40, 33, 'dinner', 1.85, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (40, 168.4, 69.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (41, 3, 59, 472, 42.5, 13, 3, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (41, 16, 11, 88, 35.4, 13, 3, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (41, 19, 22, 154, 42.0, 8, 4, '2025-07-02', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 48, 'snack', 0.79, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 27, 'lunch', 0.77, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 18, 'snack', 0.7, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 13, 'snack', 1.28, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (41, 166.7, 71.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (42, 38, 52, 520, 98.6, 13, 2, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 41, 'midnight', 0.7, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 13, 'lunch', 0.72, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 11, 'breakfast', 0.93, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (42, 186.1, 75.9, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (43, 5, 41, 328, 52.4, 11, 1, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (43, 21, 28, 168, 71.7, 12, 3, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (43, 41, 'breakfast', 1.23, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (43, 29, 'midnight', 1.65, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (43, 178.7, 80.6, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (44, 40, 47, 423, 20.3, 5, 3, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (44, 30, 52, 260, 72.9, 10, 1, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (44, 23, 'breakfast', 1.18, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (44, 18, 'snack', 0.72, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (44, 152.1, 77.5, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 16, 59, 354, 20.5, 7, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 40, 33, 198, 61.7, 9, 4, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 48, 32, 192, 99.7, 11, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (45, 47, 'midnight', 1.31, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (45, 11, 'midnight', 1.08, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (45, 36, 'lunch', 1.52, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (45, 179.5, 57.1, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 36, 48, 384, 94.7, 15, 4, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 46, 19, 152, 95.8, 13, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 35, 35, 350, 57.8, 9, 2, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 17, 'midnight', 1.98, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 8, 'snack', 0.66, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (46, 153.7, 81.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (47, 9, 57, 456, 69.4, 15, 4, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (47, 5, 'lunch', 1.85, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (47, 50, 'breakfast', 1.32, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (47, 22, 'dinner', 0.95, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (47, 150.4, 51.4, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (48, 33, 24, 192, 56.9, 8, 1, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (48, 24, 57, 513, 77.9, 8, 2, '2025-07-02', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (48, 21, 54, 378, 92.6, 11, 4, '2025-07-02', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 28, 'snack', 0.71, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 37, 'lunch', 1.77, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (48, 171.7, 55.3, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (49, 34, 27, 189, 88.0, 11, 3, '2025-07-02', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (49, 23, 17, 119, 63.5, 8, 1, '2025-07-02', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 4, 'midnight', 1.08, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 29, 'breakfast', 0.72, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 16, 'lunch', 0.93, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (49, 167.2, 84.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (50, 50, 43, 430, 61.4, 12, 1, '2025-07-02', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (50, 7, 'snack', 0.5, '2025-07-02', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (50, 10, 'breakfast', 0.78, '2025-07-02', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (50, 167.8, 50.8, '2025-07-02', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 22, 20, 140, 83.2, 11, 5, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 3, 59, 295, 63.7, 10, 5, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (1, 41, 25, 125, 49.2, 13, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (1, 3, 'lunch', 0.74, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (1, 18, 'dinner', 1.53, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (1, 37, 'dinner', 1.83, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (1, 180.6, 84.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (2, 39, 38, 380, 89.2, 11, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (2, 41, 'lunch', 1.72, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (2, 28, 'dinner', 0.62, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (2, 169.3, 51.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (3, 29, 14, 84, 28.3, 10, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (3, 48, 28, 224, 37.0, 13, 1, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (3, 15, 'breakfast', 0.54, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (3, 1, 'midnight', 0.98, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (3, 162.9, 64.6, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (4, 49, 13, 130, 94.7, 7, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (4, 36, 31, 248, 49.0, 7, 1, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (4, 47, 57, 513, 81.4, 5, 3, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 13, 'midnight', 1.34, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 36, 'breakfast', 1.73, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (4, 46, 'lunch', 0.57, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (4, 158.6, 68.5, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (5, 40, 60, 300, 70.0, 13, 4, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 10, 'lunch', 1.56, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 8, 'dinner', 0.99, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (5, 18, 'dinner', 1.05, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (5, 169.8, 85.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (6, 20, 43, 215, 61.4, 13, 1, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (6, 35, 20, 140, 94.9, 15, 3, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 9, 'midnight', 1.25, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 3, 'snack', 1.78, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 31, 'snack', 1.58, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (6, 13, 'midnight', 1.31, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (6, 164.5, 61.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (7, 14, 16, 112, 70.1, 6, 1, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (7, 40, 41, 287, 23.9, 7, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 23, 'snack', 0.84, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (7, 13, 'dinner', 1.34, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (7, 183.7, 71.4, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (8, 14, 39, 312, 57.0, 12, 3, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (8, 2, 14, 140, 56.6, 14, 5, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 21, 'snack', 1.13, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 8, 'midnight', 1.69, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 48, 'midnight', 1.49, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (8, 22, 'breakfast', 1.57, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (8, 179.9, 71.6, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (9, 38, 12, 108, 32.8, 13, 3, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 13, 'breakfast', 1.47, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 14, 'dinner', 1.97, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 15, 'snack', 1.83, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (9, 5, 'breakfast', 0.9, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (9, 158.1, 83.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (10, 44, 22, 176, 29.2, 8, 4, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (10, 6, 31, 217, 31.2, 13, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 17, 'lunch', 1.44, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 26, 'snack', 0.63, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 7, 'snack', 1.19, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (10, 20, 'breakfast', 1.71, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (10, 155.9, 80.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (11, 33, 16, 160, 51.2, 13, 3, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (11, 11, 52, 416, 62.8, 5, 3, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 40, 'snack', 0.53, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 7, 'dinner', 1.51, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (11, 20, 'breakfast', 1.44, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (11, 174.6, 56.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 31, 20, 180, 41.3, 15, 2, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 43, 10, 90, 31.0, 6, 5, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (12, 29, 23, 161, 91.4, 11, 3, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 36, 'dinner', 1.24, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (12, 41, 'lunch', 0.99, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (12, 169.8, 78.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 26, 58, 464, 55.9, 15, 4, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 48, 46, 276, 74.0, 11, 1, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (13, 14, 46, 230, 37.8, 5, 3, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 12, 'snack', 1.12, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 37, 'lunch', 1.34, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 38, 'breakfast', 1.69, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (13, 1, 'dinner', 1.93, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (13, 178.8, 60.5, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (14, 31, 49, 490, 52.3, 6, 3, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (14, 32, 45, 225, 52.9, 11, 1, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (14, 50, 'midnight', 1.92, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (14, 43, 'lunch', 1.69, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (14, 31, 'dinner', 1.83, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (14, 188.0, 50.5, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (15, 49, 43, 344, 55.3, 11, 2, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (15, 13, 'snack', 1.02, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (15, 32, 'breakfast', 0.95, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (15, 159.4, 56.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (16, 1, 49, 343, 81.8, 5, 2, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 24, 'breakfast', 0.73, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 32, 'snack', 1.69, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 28, 'dinner', 1.47, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (16, 36, 'breakfast', 1.1, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (16, 178.9, 72.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (17, 11, 14, 70, 84.0, 11, 4, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (17, 37, 53, 318, 56.9, 15, 1, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 9, 'breakfast', 1.45, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 49, 'lunch', 0.96, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 2, 'breakfast', 0.53, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (17, 18, 'snack', 1.84, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (17, 177.2, 54.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (18, 48, 57, 513, 76.7, 9, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (18, 13, 'midnight', 0.55, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (18, 40, 'snack', 0.79, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (18, 45, 'dinner', 1.39, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (18, 188.8, 85.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (19, 33, 12, 108, 64.5, 10, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (19, 17, 28, 168, 55.4, 15, 4, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (19, 33, 'snack', 1.03, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (19, 8, 'snack', 1.47, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (19, 157.4, 75.6, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (20, 17, 24, 120, 72.4, 6, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (20, 36, 'midnight', 0.73, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (20, 15, 'lunch', 0.82, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (20, 162.0, 67.2, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (21, 45, 50, 250, 85.3, 9, 2, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (21, 22, 27, 270, 52.5, 11, 2, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 30, 'snack', 0.72, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (21, 24, 'midnight', 1.58, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (21, 176.2, 74.3, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (22, 23, 17, 153, 33.2, 12, 2, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (22, 24, 38, 266, 32.1, 6, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 5, 'breakfast', 1.15, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 30, 'snack', 0.58, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (22, 20, 'breakfast', 0.51, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (22, 155.6, 63.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (23, 30, 26, 182, 48.1, 6, 2, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (23, 20, 44, 308, 46.2, 12, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 29, 'dinner', 1.96, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (23, 42, 'dinner', 0.84, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (23, 158.4, 83.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (24, 19, 15, 135, 34.1, 13, 3, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 27, 'dinner', 0.6, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 14, 'breakfast', 2.0, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (24, 46, 'dinner', 1.37, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (24, 186.6, 74.2, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (25, 14, 55, 495, 40.2, 7, 2, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (25, 42, 'lunch', 0.76, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (25, 50, 'dinner', 1.71, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (25, 152.3, 86.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (26, 50, 55, 495, 96.3, 11, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 17, 'lunch', 0.56, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 37, 'dinner', 1.42, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 43, 'lunch', 0.64, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (26, 44, 'midnight', 1.06, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (26, 164.5, 66.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (27, 7, 40, 320, 65.6, 14, 3, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (27, 32, 21, 168, 76.9, 10, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (27, 35, 14, 98, 33.8, 13, 3, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 34, 'dinner', 0.57, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 12, 'lunch', 1.77, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (27, 11, 'breakfast', 1.66, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (27, 183.9, 73.1, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (28, 28, 38, 190, 88.5, 11, 1, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (28, 14, 18, 144, 52.7, 14, 1, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (28, 20, 31, 248, 55.5, 7, 2, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (28, 46, 'dinner', 0.94, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (28, 41, 'midnight', 1.12, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (28, 178.3, 71.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (29, 30, 40, 280, 59.3, 15, 2, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (29, 13, 56, 392, 77.7, 13, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (29, 30, 'breakfast', 0.77, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (29, 7, 'lunch', 1.54, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (29, 45, 'midnight', 0.53, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (29, 172.6, 84.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (30, 45, 28, 252, 35.6, 5, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (30, 1, 54, 486, 85.3, 15, 1, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (30, 24, 55, 440, 35.8, 14, 1, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 29, 'midnight', 0.88, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (30, 10, 'lunch', 0.83, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (30, 156.0, 51.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (31, 36, 59, 590, 98.7, 11, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (31, 1, 17, 136, 71.2, 9, 3, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (31, 1, 'lunch', 0.53, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (31, 47, 'snack', 1.92, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (31, 162.5, 80.5, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 17, 41, 410, 30.8, 15, 4, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 4, 49, 294, 33.7, 5, 2, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (32, 16, 55, 385, 56.6, 14, 1, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 41, 'lunch', 1.2, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 32, 'breakfast', 1.23, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 20, 'midnight', 1.65, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (32, 16, 'lunch', 1.2, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (32, 170.4, 80.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (33, 31, 12, 72, 67.2, 9, 4, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (33, 32, 33, 264, 44.3, 12, 3, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (33, 43, 38, 342, 55.3, 10, 3, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (33, 13, 'midnight', 0.74, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (33, 6, 'breakfast', 0.8, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (33, 185.7, 63.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (34, 19, 36, 252, 58.5, 13, 4, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (34, 21, 24, 144, 65.7, 12, 2, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (34, 40, 'lunch', 1.74, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (34, 39, 'breakfast', 0.89, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (34, 175.6, 84.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (35, 30, 39, 273, 28.4, 14, 2, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 31, 'lunch', 0.98, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 39, 'lunch', 0.76, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 4, 'dinner', 1.1, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (35, 24, 'lunch', 1.9, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (35, 183.3, 64.4, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (36, 9, 29, 174, 23.5, 6, 1, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 32, 'breakfast', 1.11, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (36, 16, 'midnight', 1.97, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (36, 184.1, 57.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (37, 10, 34, 170, 60.5, 6, 2, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 2, 'lunch', 1.82, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 20, 'breakfast', 0.6, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 48, 'breakfast', 1.13, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (37, 31, 'snack', 0.58, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (37, 177.1, 54.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (38, 17, 22, 154, 83.1, 15, 1, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (38, 7, 19, 152, 36.6, 8, 3, '2025-07-03', 'evening', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 42, 'dinner', 1.54, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 11, 'dinner', 0.72, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (38, 30, 'midnight', 1.3, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (38, 185.5, 89.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (39, 32, 19, 171, 51.7, 9, 4, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (39, 50, 57, 399, 79.7, 10, 5, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (39, 48, 35, 210, 58.3, 10, 2, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 12, 'midnight', 0.58, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 43, 'lunch', 2.0, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 12, 'breakfast', 1.03, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (39, 11, 'lunch', 1.44, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (39, 153.9, 69.9, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (40, 36, 35, 315, 96.2, 14, 1, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (40, 45, 'midnight', 0.83, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (40, 8, 'dinner', 1.42, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (40, 156.6, 61.3, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (41, 24, 52, 468, 80.6, 15, 5, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (41, 21, 31, 279, 53.2, 11, 5, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 13, 'lunch', 0.53, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 18, 'dinner', 1.44, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 10, 'midnight', 1.26, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (41, 25, 'dinner', 0.78, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (41, 161.7, 76.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (42, 21, 37, 296, 61.5, 7, 5, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (42, 28, 16, 80, 45.4, 9, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 13, 'midnight', 0.74, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 40, 'snack', 1.06, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 28, 'snack', 1.46, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (42, 19, 'dinner', 1.54, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (42, 161.9, 86.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (43, 47, 55, 275, 87.8, 15, 2, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (43, 7, 44, 440, 70.4, 9, 1, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (43, 9, 'breakfast', 1.17, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (43, 28, 'dinner', 1.6, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (43, 40, 'snack', 0.77, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (43, 185.4, 84.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (44, 22, 46, 368, 42.8, 14, 2, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (44, 10, 35, 280, 35.2, 14, 1, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (44, 21, 'lunch', 1.3, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (44, 38, 'snack', 1.02, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (44, 173.8, 82.4, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 14, 10, 90, 56.4, 7, 5, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 36, 18, 180, 33.1, 12, 2, '2025-07-03', 'dawn', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (45, 43, 42, 420, 56.4, 14, 4, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (45, 28, 'breakfast', 1.34, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (45, 30, 'midnight', 1.5, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (45, 177.3, 78.7, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 7, 33, 198, 21.6, 14, 5, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 50, 19, 190, 76.8, 6, 4, '2025-07-03', 'evening', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (46, 45, 26, 182, 66.4, 8, 3, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 37, 'dinner', 1.05, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 27, 'snack', 0.9, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 32, 'breakfast', 1.14, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (46, 8, 'snack', 1.49, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (46, 181.0, 75.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (47, 4, 16, 80, 67.2, 9, 5, '2025-07-03', 'morning', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (47, 47, 60, 420, 88.8, 9, 2, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (47, 1, 43, 344, 39.6, 14, 4, '2025-07-03', 'afternoon', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (47, 14, 'breakfast', 0.6, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (47, 45, 'snack', 0.93, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (47, 168.9, 54.8, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (48, 39, 20, 180, 53.4, 13, 4, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (48, 50, 35, 210, 60.6, 11, 4, '2025-07-03', 'night', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 17, 'lunch', 1.93, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 12, 'snack', 1.37, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 6, 'lunch', 1.71, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (48, 7, 'breakfast', 1.33, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (48, 178.2, 61.0, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (49, 48, 58, 348, 42.0, 5, 2, '2025-07-03', 'night', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (49, 2, 55, 330, 27.7, 7, 5, '2025-07-03', 'morning', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 18, 'midnight', 1.97, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 12, 'snack', 0.92, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (49, 26, 'lunch', 0.66, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (49, 182.8, 77.5, '2025-07-03', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (50, 33, 54, 432, 88.5, 15, 3, '2025-07-03', 'afternoon', NOW());
INSERT INTO exercise_sessions (user_id, exercise_catalog_id, duration_minutes, calories_burned, weight, reps, sets, exercise_date, time_period, created_at) VALUES (50, 31, 32, 192, 52.1, 7, 3, '2025-07-03', 'dawn', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (50, 16, 'snack', 1.04, '2025-07-03', NOW());
INSERT INTO meal_logs (user_id, food_item_id, meal_time, quantity, log_date, created_at) VALUES (50, 37, 'midnight', 1.34, '2025-07-03', NOW());
INSERT INTO health_records (user_id, height, weight, record_date, created_at) VALUES (50, 151.8, 81.1, '2025-07-03', NOW());
COMMIT;