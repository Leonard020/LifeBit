# note_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ExerciseChatInput, ExerciseChatOutput, MealInput
from typing import Optional

router = APIRouter(tags=["note"])  # 태그 설정 중요

# 🍽️ 식단 기록 저장 API
@router.post("/diet")
def save_diet_record(data: MealInput, db: Session = Depends(get_db)):
    meal_log = models.MealLog(
        user_id=data.user_id,
        food_item_id=data.food_item_id,
        quantity=data.quantity,
        log_date=data.log_date,
        meal_time=data.meal_time
    )
    db.add(meal_log)
    db.commit()
    db.refresh(meal_log)
    return {"message": "식단 기록 저장 성공", "id": meal_log.meal_log_id}

@router.get("/diet/daily")
def get_today_diet(user_id: int, date: Optional[str] = None, db: Session = Depends(get_db)):
    from datetime import date as dt_date
    if date is None:
        date = dt_date.today().isoformat()
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
            "meal_time": r.meal_time
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
