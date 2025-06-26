# note_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ExerciseChatInput, ExerciseChatOutput, MealInput
from typing import Optional
from models import FoodItem
import openai
import os
import requests

router = APIRouter(tags=["note"])  # 태그 설정 중요

# Import nutrition calculation functions from main.py
print("[ENV DEBUG] FOOD_STD_API_ENDPOINT:", os.getenv("FOOD_STD_API_ENDPOINT"))

def calculate_nutrition_from_gpt_for_100g(food_name: str) -> dict:
    try:
        # Only use GPT to generate nutrition info
        prompt = f"""
{food_name} 100g의 영양정보를 알려주세요.
다음 형식으로만 답변하세요:
칼로리: [숫자] kcal
탄수화물: [숫자] g
단백질: [숫자] g
지방: [숫자] g
"""
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=100
        )
        result = response.choices[0].message["content"].strip()
        print(f"[GPT] '{food_name}' 100g 기준 영양소 계산 결과: {result}")
        # 결과 파싱
        lines = result.split('\n')
        nutrition = {'calories': 200, 'carbs': 10, 'protein': 10, 'fat': 5}  # 기본값
        for line in lines:
            if '칼로리:' in line:
                nutrition['calories'] = float(''.join(filter(str.isdigit, line.split(':')[1])))
            elif '탄수화물:' in line:
                nutrition['carbs'] = float(''.join(filter(str.isdigit, line.split(':')[1])))
            elif '단백질:' in line:
                nutrition['protein'] = float(''.join(filter(str.isdigit, line.split(':')[1])))
            elif '지방:' in line:
                nutrition['fat'] = float(''.join(filter(str.isdigit, line.split(':')[1])))
        return nutrition
    except Exception as e:
        print(f"[ERROR] GPT 영양소 계산 실패: {e}")
        return {'calories': 200, 'carbs': 10, 'protein': 10, 'fat': 5}

def calculate_nutrition_from_gpt(food_name: str, amount: str) -> dict:
    try:
        # 100g 기준 영양정보 계산
        base_nutrition = calculate_nutrition_from_gpt_for_100g(food_name)
        # 섭취량에서 숫자 추출
        import re
        amount_match = re.findall(r'[\d.]+', amount)
        if amount_match:
            amount_value = float(amount_match[0])
            scale = amount_value / 100.0
            nutrition = {
                'calories': round(base_nutrition['calories'] * scale, 1),
                'carbs': round(base_nutrition['carbs'] * scale, 1),
                'protein': round(base_nutrition['protein'] * scale, 1),
                'fat': round(base_nutrition['fat'] * scale, 1)
            }
            print(f"[GPT] '{food_name}' 섭취량 '{amount}' 기준 영양소: {nutrition}")
            return nutrition
        else:
            return base_nutrition
    except Exception as e:
        print(f"[ERROR] GPT 영양소 계산 실패: {e}")
        return {'calories': 200, 'carbs': 10, 'protein': 10, 'fat': 5}

# 🍽️ 식단 기록 저장 API
@router.post("/diet")
def save_diet_record(data: MealInput, db: Session = Depends(get_db)):
    # 1. food_item_id가 없으면 food_items에 자동 생성
    food_item_id = data.food_item_id
    debug_info = {}
    
    if not food_item_id and hasattr(data, 'food_name') and data.food_name:
        # 음식명 중복 체크
        food_item = db.query(FoodItem).filter(FoodItem.name == data.food_name).first()
        debug_info['food_item_search'] = f"Found: {food_item is not None}"
        
        if not food_item:
            print(f"[INFO] '{data.food_name}' 음식이 DB에 없음 → GPT로 자동 생성")
            
            # GPT로 100g 기준 영양정보 계산
            nutrition_data = calculate_nutrition_from_gpt_for_100g(data.food_name)
            
            food_item = FoodItem(
                name=data.food_name,
                calories=nutrition_data.get('calories'),
                carbs=nutrition_data.get('carbs'),
                protein=nutrition_data.get('protein'),
                fat=nutrition_data.get('fat'),
                serving_size=100.0  # 기본 100g
            )
            db.add(food_item)
            db.commit()
            db.refresh(food_item)
            debug_info['food_item_created'] = food_item.food_item_id
            print(f"[SUCCESS] 새로운 음식 생성 완료 - food_item_id: {food_item.food_item_id}")
        else:
            print(f"[INFO] 기존 음식 발견 - food_item_id: {food_item.food_item_id}")
            
        food_item_id = food_item.food_item_id
    
    debug_info['final_food_item_id'] = food_item_id
    
    # food_item_id가 여전히 없으면 에러 반환
    if not food_item_id:
        return {"error": "food_item_id가 없습니다. 음식명/영양정보를 확인하세요.", "debug": debug_info}

    # 2. 사용자 섭취량 기준 영양정보 계산 (GPT 활용)
    user_nutrition = {}
    if hasattr(data, 'food_name') and data.food_name:
        # quantity를 amount 형태로 변환 (예: 60.0 -> "60g")
        amount_str = f"{data.quantity}g"
        user_nutrition = calculate_nutrition_from_gpt(data.food_name, amount_str)

    # 3. meal_logs에 모든 필드 저장 (Spring 구조와 호환)
    nutrition = getattr(data, 'nutrition', None) or user_nutrition
    meal_log = models.MealLog(
        user_id=data.user_id,
        food_item_id=food_item_id,
        quantity=data.quantity,
        log_date=data.log_date,
        meal_time=data.meal_time,
        calories=nutrition.get('calories'),
        carbs=nutrition.get('carbs'),
        protein=nutrition.get('protein'),
        fat=nutrition.get('fat'),
    )
    db.add(meal_log)
    db.commit()
    db.refresh(meal_log)

    print(f"[SUCCESS] 식단 기록 저장 완료:")
    print(f"  meal_log_id: {meal_log.meal_log_id}")
    print(f"  food_item_id: {meal_log.food_item_id}")
    print(f"  quantity: {meal_log.quantity}")
    print(f"  meal_time: {meal_log.meal_time}")
    print(f"  영양정보 - 칼로리: {meal_log.calories}kcal")

    # 4. 저장된 정보 반환 (Spring DTO와 최대한 맞춤)
    return {
        "message": "식단 기록 저장 성공",
        "meal_log_id": meal_log.meal_log_id,
        "food_item_id": meal_log.food_item_id,
        "user_id": meal_log.user_id,
        "quantity": float(meal_log.quantity),
        "log_date": str(meal_log.log_date),
        "meal_time": meal_log.meal_time,
        "calories": float(meal_log.calories) if meal_log.calories is not None else None,
        "carbs": float(meal_log.carbs) if meal_log.carbs is not None else None,
        "protein": float(meal_log.protein) if meal_log.protein is not None else None,
        "fat": float(meal_log.fat) if meal_log.fat is not None else None,
        "created_at": str(meal_log.created_at) if meal_log.created_at else None,
        "debug": debug_info
    }

@router.get("/diet/daily")
def get_today_diet(user_id: int, date: Optional[str] = None, db: Session = Depends(get_db)):
    from datetime import date as dt_date
    if date is None:
        date = dt_date.today().isoformat()
    # date가 string이면 date 타입으로 변환
    if isinstance(date, str):
        date = dt_date.fromisoformat(date)
    records = db.query(models.MealLog).filter(
        models.MealLog.user_id == user_id,
        models.MealLog.log_date == date
    ).all()
    return [
        {
            "meal_log_id": r.meal_log_id,
            "food_item_id": r.food_item_id,
            "quantity": float(r.quantity),
            "log_date": r.log_date,
            "meal_time": r.meal_time,
            "calories": float(r.calories) if r.calories is not None else None,
            "carbs": float(r.carbs) if r.carbs is not None else None,
            "protein": float(r.protein) if r.protein is not None else None,
            "fat": float(r.fat) if r.fat is not None else None,
        } for r in records
    ]

@router.delete("/diet/{meal_log_id}")
def delete_diet_record(meal_log_id: int, db: Session = Depends(get_db)):
    record = db.query(models.MealLog).filter(models.MealLog.meal_log_id == meal_log_id).first()
    if not record:
        return {"message": "해당 식단 기록이 존재하지 않습니다."}
    db.delete(record)
    db.commit()
    return {"message": "식단 기록 삭제 성공"}
