-- 🍽️ 영양소 테스트용 더미 데이터 추가
-- 현재 날짜에 사용자 ID 1번에 대한 식단 기록 추가

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
-- 오늘 아침 식사
(1, 1, 'breakfast', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 525.0, 109.5, 10.5, 3.75),
(1, 11, 'breakfast', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 165.0, 0.0, 31.0, 3.6),

-- 오늘 점심 식사  
(1, 8, 'lunch', 300.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 480.0, 65.0, 18.0, 12.0),
(1, 23, 'lunch', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 23.0, 3.6, 2.9, 0.4),

-- 오늘 저녁 식사
(1, 15, 'dinner', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 312.0, 0.0, 37.5, 18.0),
(1, 31, 'dinner', 200.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 172.0, 40.0, 3.2, 0.2),

-- 오늘 간식
(1, 38, 'snack', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 78.0, 20.6, 0.4, 0.3),
(1, 20, 'snack', 30.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 174.0, 6.1, 6.4, 15.0);

-- 확인용 쿼리
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
WHERE ml.user_id = 1 
AND ml.log_date = CURRENT_DATE
ORDER BY ml.meal_time, ml.created_at; 
-- 현재 날짜에 사용자 ID 1번에 대한 식단 기록 추가

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
-- 오늘 아침 식사
(1, 1, 'breakfast', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 525.0, 109.5, 10.5, 3.75),
(1, 11, 'breakfast', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 165.0, 0.0, 31.0, 3.6),

-- 오늘 점심 식사  
(1, 8, 'lunch', 300.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 480.0, 65.0, 18.0, 12.0),
(1, 23, 'lunch', 100.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 23.0, 3.6, 2.9, 0.4),

-- 오늘 저녁 식사
(1, 15, 'dinner', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 312.0, 0.0, 37.5, 18.0),
(1, 31, 'dinner', 200.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 172.0, 40.0, 3.2, 0.2),

-- 오늘 간식
(1, 38, 'snack', 150.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 78.0, 20.6, 0.4, 0.3),
(1, 20, 'snack', 30.0, CURRENT_DATE, 'TYPING', 'VALIDATED', 174.0, 6.1, 6.4, 15.0);

-- 확인용 쿼리
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
WHERE ml.user_id = 1 
AND ml.log_date = CURRENT_DATE
ORDER BY ml.meal_time, ml.created_at; 