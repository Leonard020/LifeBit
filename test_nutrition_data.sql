-- 🍽️ 영양소 테스트용 더미 데이터 추가
-- 현재 날짜에 사용자 ID 2번에 대한 식단 기록 추가

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
    fat
) VALUES 
-- 오늘 아침 식사 (사용자 ID 2번)
(2, 1, 'breakfast', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 525.0, 109.5, 10.5, 3.75),
(2, 11, 'breakfast', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 165.0, 0.0, 31.0, 3.6),
(2, 17, 'breakfast', 50.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 78.0, 0.6, 6.3, 5.3),

-- 오늘 점심 식사 (사용자 ID 2번)
(2, 8, 'lunch', 300.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 480.0, 65.0, 18.0, 12.0),
(2, 23, 'lunch', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 23.0, 3.6, 2.9, 0.4),
(2, 24, 'lunch', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 34.0, 7.0, 2.8, 0.4),

-- 오늘 저녁 식사 (사용자 ID 2번)
(2, 15, 'dinner', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 312.0, 0.0, 37.5, 18.0),
(2, 31, 'dinner', 200.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 172.0, 40.0, 3.2, 0.2),
(2, 25, 'dinner', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 25.0, 6.0, 1.3, 0.1),

-- 오늘 간식 (사용자 ID 2번)
(2, 38, 'snack', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 78.0, 20.6, 0.4, 0.3),
(2, 20, 'snack', 30.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 174.0, 6.1, 6.4, 15.0),
(2, 39, 'snack', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 90.0, 23.1, 0.6, 0.45);

-- 확인용 쿼리 (사용자 ID 2번)
SELECT 
    ml.meal_time,
    ml.quantity,
    ml.calories,
    ml.carbs,
    ml.protein,
    ml.fat,
    fi.name as food_name
FROM meal_logs ml
JOIN food_items fi ON ml.food_item_id = fi.food_item_id
WHERE ml.user_id = 2 
AND ml.log_date = CURRENT_DATE
ORDER BY ml.meal_time, ml.created_at;

-- 영양소 합계 확인 (사용자 ID 2번)
SELECT 
    '총합계' as meal_time,
    SUM(ml.calories) as total_calories,
    SUM(ml.carbs) as total_carbs,
    SUM(ml.protein) as total_protein,
    SUM(ml.fat) as total_fat,
    COUNT(*) as meal_count
FROM meal_logs ml
WHERE ml.user_id = 2 
AND ml.log_date = CURRENT_DATE; 