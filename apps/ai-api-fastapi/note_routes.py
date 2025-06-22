# note_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ExerciseChatInput, ExerciseChatOutput, MealInput
from typing import Optional
from models import FoodItem

router = APIRouter(tags=["note"])  # 태그 설정 중요

# 🍽️ 식단 기록 저장 API
@router.post("/diet")
def save_diet_record(data: MealInput, db: Session = Depends(get_db)):
    # 1. food_item_id가 없으면 food_items에 자동 생성
    food_item_id = data.food_item_id
    debug_info = {}
    if not food_item_id and hasattr(data, 'food_name') and hasattr(data, 'nutrition'):
        # 음식명 중복 체크
        food_item = db.query(FoodItem).filter(FoodItem.name == data.food_name).first()
        debug_info['food_item_search'] = f"Found: {food_item is not None}"
        if not food_item:
            nutrition = getattr(data, 'nutrition', {})
            food_item = FoodItem(
                name=data.food_name,
                calories=nutrition.get('calories'),
                carbs=nutrition.get('carbs'),
                protein=nutrition.get('protein'),
                fat=nutrition.get('fat'),
                serving_size=nutrition.get('serving_size')
            )
            db.add(food_item)
            db.commit()
            db.refresh(food_item)
            debug_info['food_item_created'] = food_item.food_item_id
        food_item_id = food_item.food_item_id
    debug_info['final_food_item_id'] = food_item_id
    # food_item_id가 여전히 없으면 에러 반환
    if not food_item_id:
        return {"error": "food_item_id가 없습니다. 음식명/영양정보를 확인하세요.", "debug": debug_info}

    # 2. meal_logs에 모든 필드 저장 (Spring 구조와 호환)
    nutrition = getattr(data, 'nutrition', None) or {}
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

    # 3. 저장된 정보 반환 (Spring DTO와 최대한 맞춤)
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
