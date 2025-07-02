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
    weekly_workout_target_set,
    weekly_chest_set,
    weekly_back_set,
    weekly_legs_set,
    weekly_shoulders_set,
    weekly_arms_set,
    weekly_abs_set,
    weekly_cardio_set,
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

    -- 각 운동 부위별 설정값의 합계로 weekly_workout_target_set 계산
    calculated_data.weekly_chest_set + 
    calculated_data.weekly_back_set + 
    calculated_data.weekly_legs_set + 
    calculated_data.weekly_shoulders_set + 
    calculated_data.weekly_arms_set + 
    calculated_data.weekly_abs_set + 
    calculated_data.weekly_cardio_set AS weekly_workout_target_set,
    
    -- 개별 운동 부위별 설정값
    calculated_data.weekly_chest_set,
    calculated_data.weekly_back_set,
    calculated_data.weekly_legs_set,
    calculated_data.weekly_shoulders_set,
    calculated_data.weekly_arms_set,
    calculated_data.weekly_abs_set,
    calculated_data.weekly_cardio_set,

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
        -- 운동 부위별 설정값 (목표와 동일하거나 약간 다르게)
        (random() * 3)::integer AS weekly_chest_set,
        (random() * 3)::integer AS weekly_back_set,
        (random() * 3)::integer AS weekly_legs_set,
        (random() * 2)::integer AS weekly_shoulders_set,
        (random() * 2)::integer AS weekly_arms_set,
        (random() * 3)::integer AS weekly_abs_set,
        (random() * 5)::integer AS weekly_cardio_set,
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



-- 신규 사용자 환영 알림 (admin 제외, 일반 사용자 10명)
INSERT INTO notification (user_id, type, ref_id, title, message)
SELECT user_id, 'SYSTEM', NULL, '신규 사용자 환영', 'LifeBit에 오신 것을 환영합니다! 첫 운동 기록을 남겨보세요.'
FROM users
WHERE role = 'USER'
ORDER BY user_id
LIMIT 10;

-- ===================================================================
-- 기본 데이터 (LifeBit.sql에서 이동)
-- ===================================================================

-- 기본 업적 데이터 삽입 (50개 - 체계적인 업적 시스템)
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

-- 기본 시스템 알림 데이터 삽입
INSERT INTO notification (user_id, type, ref_id, title, message, created_at, uuid) VALUES
-- 시스템 공용 알림 데이터 (user_id = NULL)
(NULL, 'SYSTEM', NULL, '앱 사용 팁', '앱의 다양한 기능을 활용해보세요. 더욱 효율적인 건강 관리가 가능합니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '단축키 안내', '앱 사용을 더욱 편리하게 해주는 단축키를 확인해보세요. 빠른 접근이 가능합니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '음성 인식 기능', '음성으로 운동 기록을 남길 수 있는 기능이 추가되었습니다. 편리하게 이용해보세요.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, 'AI 운동 추천', 'AI 운동 추천 기능을 활용해보세요. 개인 맞춤형 운동을 추천받을 수 있습니다.', NOW(), gen_random_uuid()),
(NULL, 'SYSTEM', NULL, '데이터 동기화', '여러 기기에서 사용하실 때는 데이터 동기화를 확인해주세요. 모든 기기에서 동일한 정보를 확인할 수 있습니다.', NOW(), gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 신규가입자 전용 db
INSERT INTO notification_read (user_id, notification_id)
SELECT u.user_id, n.id
FROM users u
CROSS JOIN notification n
WHERE n.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM notification_read nr
    WHERE nr.user_id = u.user_id AND nr.notification_id = n.id
  );

-- 모든 사용자-업적 조합이 user_achievements에 없으면 생성 (중복 없이)
INSERT INTO user_achievements (user_id, achievement_id)
SELECT u.user_id, a.achievement_id
FROM users u
CROSS JOIN achievements a
WHERE NOT EXISTS (
  SELECT 1 FROM user_achievements ua WHERE ua.user_id = u.user_id AND ua.achievement_id = a.achievement_id
);





