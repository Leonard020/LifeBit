from pydantic import BaseModel
from datetime import date
from typing import Optional

# 🏋️ 운동 기록 - 요청용 (입력 데이터)
class ExerciseInput(BaseModel):
    user_id: int
    notes: str
    duration_minutes: Optional[int] = 30
    calories_burned: Optional[int] = 200
    exercise_date: Optional[date] = date.today()

# 🍽️ 식단 기록 - 요청용 (입력 데이터)
class MealInput(BaseModel):
    user_id: int
    food_item_id: Optional[int] = None
    quantity: float
    log_date: Optional[date] = date.today()

# (선택) 응답용 모델이 필요하면 아래 추가 가능
class ExerciseOutput(BaseModel):
    user_id: int
    notes: str
    duration_minutes: int
    calories_burned: int
    exercise_date: date

    class Config:
        orm_mode = True

class MealOutput(BaseModel):
    user_id: int
    food_item_id: Optional[int]
    quantity: float
    log_date: date

    class Config:
        orm_mode = True
