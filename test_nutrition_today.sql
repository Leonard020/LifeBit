-- 🍽️ 오늘 날짜 영양소 테스트 데이터
-- log_date를 오늘로 설정하여 영양소 통계가 정확히 표시되도록 함

-- 기존 오늘 데이터 삭제 (중복 방지)
DELETE FROM meal_logs WHERE user_id = 1 AND log_date = CURRENT_DATE;

-- 오늘 날짜로 영양소 데이터 추가
INSERT INTO meal_logs (
    user_id,
    food_item_id,
    meal_time,
    quantity,
    log_date,
    input_source,
    validation_status,
    calories,
    carbs,
    protein,
    fat,
    created_at
) VALUES 
-- 🌅 아침 식사 (총 690kcal, 탄수화물 109.5g, 단백질 41.5g, 지방 7.35g)
(1, 1, 'breakfast', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 525.0, 109.5, 10.5, 3.75, NOW()),
(1, 11, 'breakfast', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 165.0, 0.0, 31.0, 3.6, NOW()),

-- 🍽️ 점심 식사 (총 503kcal, 탄수화물 68.6g, 단백질 20.9g, 지방 12.4g)
(1, 8, 'lunch', 300.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 480.0, 65.0, 18.0, 12.0, NOW()),
(1, 23, 'lunch', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 23.0, 3.6, 2.9, 0.4, NOW()),

-- 🌙 저녁 식사 (총 484kcal, 탄수화물 40.0g, 단백질 40.7g, 지방 18.2g)
(1, 15, 'dinner', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 312.0, 0.0, 37.5, 18.0, NOW()),
(1, 31, 'dinner', 200.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 172.0, 40.0, 3.2, 0.2, NOW()),

-- 🍎 간식 (총 252kcal, 탄수화물 26.7g, 단백질 6.8g, 지방 15.3g)
(1, 38, 'snack', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 78.0, 20.6, 0.4, 0.3, NOW()),
(1, 20, 'snack', 30.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 174.0, 6.1, 6.4, 15.0, NOW());

-- 📊 결과 확인 쿼리
SELECT 
    '🍽️ 오늘의 영양소 통계' as title,
    SUM(calories) as total_calories,
    SUM(carbs) as total_carbs,
    SUM(protein) as total_protein,
    SUM(fat) as total_fat,
    COUNT(*) as meal_count
FROM meal_logs 
WHERE user_id = 1 AND log_date = CURRENT_DATE;

-- 📅 식사별 상세 확인
SELECT 
    meal_time,
    fi.name as food_name,
    quantity,
    calories,
    carbs,
    protein,
    fat,
    log_date,
    created_at
FROM meal_logs ml
JOIN food_items fi ON ml.food_item_id = fi.food_item_id
WHERE ml.user_id = 1 AND ml.log_date = CURRENT_DATE
ORDER BY 
    CASE meal_time 
        WHEN 'breakfast' THEN 1
        WHEN 'lunch' THEN 2  
        WHEN 'dinner' THEN 3
        WHEN 'snack' THEN 4
    END,
    ml.created_at; 