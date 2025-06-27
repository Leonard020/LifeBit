# note_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ExerciseChatInput, ExerciseChatOutput, MealInput
from typing import Optional, Union
from models import FoodItem
import openai
import os
import requests
import json
import re
from datetime import date as dt_date

router = APIRouter(tags=["note"])  # 태그 설정 중요

# Import nutrition calculation functions from main.py
print("[ENV DEBUG] FOOD_STD_API_ENDPOINT:", os.getenv("FOOD_STD_API_ENDPOINT"))

def search_food_in_database(food_name: str, db: Session) -> Optional[FoodItem]:
    """
    데이터베이스에서 음식을 검색합니다.
    정확한 이름 매칭과 부분 매칭을 모두 시도합니다.
    """
    try:
        # 1. 정확한 이름 매칭
        exact_match = db.query(FoodItem).filter(FoodItem.name == food_name).first()
        if exact_match:
            print(f"[DB SEARCH] 정확한 매칭 발견: {food_name}")
            return exact_match
        
        # 2. 부분 매칭 (포함 관계)
        partial_matches = db.query(FoodItem).filter(
            FoodItem.name.contains(food_name)
        ).all()
        
        if partial_matches:
            # 가장 유사한 매칭 선택 (길이 차이가 가장 작은 것)
            best_match = min(partial_matches, key=lambda x: abs(len(str(x.name)) - len(food_name)))  # type: ignore
            print(f"[DB SEARCH] 부분 매칭 발견: {food_name} -> {best_match.name}")
            return best_match
        
        # 3. 역방향 부분 매칭 (검색어가 DB 항목에 포함되는 경우)
        reverse_matches = db.query(FoodItem).filter(
            FoodItem.name.like(f"%{food_name}%")
        ).all()
        
        if reverse_matches:
            best_match = min(reverse_matches, key=lambda x: abs(len(str(x.name)) - len(food_name)))  # type: ignore
            print(f"[DB SEARCH] 역방향 매칭 발견: {food_name} -> {best_match.name}")
            return best_match
        
        print(f"[DB SEARCH] 매칭 없음: {food_name}")
        return None
        
    except Exception as e:
        print(f"[ERROR] 데이터베이스 검색 실패: {e}")
        return None

def search_nutrition_on_internet(food_name: str) -> dict:
    """
    인터넷에서 음식 영양정보를 검색합니다.
    GPT를 사용하여 신뢰할 수 있는 영양정보를 생성합니다.
    """
    try:
        prompt = f"""
당신은 영양 전문가입니다. {food_name}의 정확한 영양정보를 제공해주세요.

다음 형식의 JSON으로만 답변해주세요:
{{
  "calories": 100g당_칼로리(kcal),
  "carbs": 100g당_탄수화물(g),
  "protein": 100g당_단백질(g),
  "fat": 100g당_지방(g),
  "source": "internet_search"
}}

주의사항:
- 100g 기준으로 계산
- 일반적인 조리법 기준
- 소수점 첫째자리까지 반올림
- 다른 설명이나 텍스트는 포함하지 마세요
"""
        
        # OpenAI API 호출 (버전에 따라 다를 수 있음)
        try:
            # 새로운 API 방식 시도
            response = openai.chat.completions.create(  # type: ignore
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=200
            )
            result = response.choices[0].message.content.strip() if response.choices[0].message.content else ""  # type: ignore
        except:
            # 기존 API 방식 시도
            response = openai.ChatCompletion.create(  # type: ignore
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=200
            )
            result = response.choices[0].message["content"].strip()  # type: ignore
        
        print(f"[INTERNET SEARCH] GPT 응답: {result}")
        
        # JSON 파싱
        nutrition_data = json.loads(result)
        
        # 기본값 검증
        if not all(key in nutrition_data for key in ['calories', 'carbs', 'protein', 'fat']):
            raise ValueError("필수 영양정보가 누락되었습니다")
        
        print(f"[INTERNET SEARCH] 영양정보 생성 완료: {nutrition_data}")
        return nutrition_data
        
    except Exception as e:
        print(f"[ERROR] 인터넷 검색 실패: {e}")
        # 기본값 반환
        return {
            "calories": 200.0,
            "carbs": 30.0,
            "protein": 10.0,
            "fat": 5.0,
            "source": "default"
        }

def calculate_nutrition_from_gpt_for_100g(food_name: str, db: Session) -> dict:
    """
    GPT를 사용하여 음식의 100g 기준 영양정보를 계산합니다.
    먼저 데이터베이스를 검색하고, 없으면 인터넷에서 검색합니다.
    """
    try:
        print(f"[NUTRITION CALC] 시작: {food_name}")
        
        # 1. 데이터베이스에서 기존 음식 검색
        existing_food = search_food_in_database(food_name, db)
        
        if existing_food:
            print(f"[NUTRITION CALC] DB에서 발견: {existing_food.name}")
            return {
                "calories": float(existing_food.calories) if existing_food.calories is not None else 200.0,  # type: ignore
                "carbs": float(existing_food.carbs) if existing_food.carbs is not None else 30.0,  # type: ignore
                "protein": float(existing_food.protein) if existing_food.protein is not None else 10.0,  # type: ignore
                "fat": float(existing_food.fat) if existing_food.fat is not None else 5.0,  # type: ignore
                "source": "database",
                "food_item_id": existing_food.food_item_id
            }
        
        # 2. 데이터베이스에 없으면 인터넷에서 검색
        print(f"[NUTRITION CALC] DB에 없음, 인터넷 검색 시작: {food_name}")
        internet_nutrition = search_nutrition_on_internet(food_name)
        
        # 3. 새로운 음식 아이템 생성
        new_food_item = FoodItem(
            name=food_name,
            calories=internet_nutrition.get('calories', 200.0),
            carbs=internet_nutrition.get('carbs', 30.0),
            protein=internet_nutrition.get('protein', 10.0),
            fat=internet_nutrition.get('fat', 5.0),
            serving_size=100.0  # 기본 100g
        )
        
        db.add(new_food_item)
        db.commit()
        db.refresh(new_food_item)
        
        print(f"[NUTRITION CALC] 새로운 음식 생성 완료: {new_food_item.food_item_id}")
        
        return {
            "calories": internet_nutrition.get('calories', 200.0),
            "carbs": internet_nutrition.get('carbs', 30.0),
            "protein": internet_nutrition.get('protein', 10.0),
            "fat": internet_nutrition.get('fat', 5.0),
            "source": "internet_created",
            "food_item_id": new_food_item.food_item_id
        }
        
    except Exception as e:
        print(f"[ERROR] 영양정보 계산 실패: {e}")
        return {
            "calories": 200.0,
            "carbs": 30.0,
            "protein": 10.0,
            "fat": 5.0,
            "source": "error_default"
        }

def calculate_nutrition_from_gpt(food_name: str, amount: str, db: Session) -> dict:
    """
    GPT를 사용하여 음식의 섭취량 기준 영양정보를 계산합니다.
    """
    try:
        # 100g 기준 영양정보 계산 (DB 검색 포함)
        base_nutrition = calculate_nutrition_from_gpt_for_100g(food_name, db)
        
        # 섭취량에서 숫자 추출
        amount_match = re.findall(r'[\d.]+', amount)
        if amount_match:
            amount_value = float(amount_match[0])
            scale = amount_value / 100.0
            nutrition = {
                'calories': round(base_nutrition['calories'] * scale, 1),
                'carbs': round(base_nutrition['carbs'] * scale, 1),
                'protein': round(base_nutrition['protein'] * scale, 1),
                'fat': round(base_nutrition['fat'] * scale, 1),
                'source': base_nutrition.get('source', 'unknown'),
                'food_item_id': base_nutrition.get('food_item_id')
            }
            print(f"[NUTRITION CALC] 섭취량 기준 영양소: {nutrition}")
            return nutrition
        else:
            return base_nutrition
    except Exception as e:
        print(f"[ERROR] 섭취량 영양소 계산 실패: {e}")
        return {
            'calories': 200.0,
            'carbs': 30.0,
            'protein': 10.0,
            'fat': 5.0,
            'source': 'error_default'
        }

# 🍽️ 식단 기록 저장 API
@router.post("/diet")
def save_diet_record(data: MealInput, db: Session = Depends(get_db)):
    # 1. food_item_id가 없으면 food_items에 자동 생성
    food_item_id = data.food_item_id  # type: ignore
    debug_info = {}
    
    if not food_item_id and hasattr(data, 'food_name') and data.food_name:
        # 음식명 중복 체크
        food_item = db.query(FoodItem).filter(FoodItem.name == data.food_name).first()
        debug_info['food_item_search'] = f"Found: {food_item is not None}"
        
        if not food_item:
            print(f"[INFO] '{data.food_name}' 음식이 DB에 없음 → GPT로 자동 생성")
            
            # GPT로 100g 기준 영양정보 계산 (DB 검색 + 인터넷 검색 포함)
            nutrition_data = calculate_nutrition_from_gpt_for_100g(data.food_name, db)
            
            # 새로운 음식 아이템이 생성되었는지 확인
            if nutrition_data.get('source') == 'internet_created':
                # 이미 생성되었으므로 DB에서 다시 조회
                food_item = db.query(FoodItem).filter(FoodItem.food_item_id == nutrition_data['food_item_id']).first()
                debug_info['food_item_created'] = food_item.food_item_id if food_item else None
                print(f"[SUCCESS] 새로운 음식 생성 완료 - food_item_id: {food_item.food_item_id if food_item else 'None'}")
            else:
                # 기존 DB 항목 사용
                food_item = db.query(FoodItem).filter(FoodItem.food_item_id == nutrition_data['food_item_id']).first()
                debug_info['food_item_found'] = food_item.food_item_id if food_item else None
                print(f"[INFO] 기존 음식 사용 - food_item_id: {food_item.food_item_id if food_item else 'None'}")
        else:
            print(f"[INFO] 기존 음식 발견 - food_item_id: {food_item.food_item_id}")
            
        food_item_id = food_item.food_item_id if food_item else None
    
    debug_info['final_food_item_id'] = food_item_id
    
    # food_item_id가 여전히 없으면 에러 반환
    if food_item_id is None:
        return {"error": "food_item_id가 없습니다. 음식명/영양정보를 확인하세요.", "debug": debug_info}

    # 2. 사용자 섭취량 기준 영양정보 계산 (GPT 활용)
    user_nutrition = {}
    if hasattr(data, 'food_name') and data.food_name:
        # quantity를 amount 형태로 변환 (예: 60.0 -> "60g")
        amount_str = f"{data.quantity}g"
        user_nutrition = calculate_nutrition_from_gpt(data.food_name, amount_str, db)

    # 3. meal_logs에 저장 (Spring 구조와 호환)
    meal_log = models.MealLog(
        user_id=data.user_id,
        food_item_id=food_item_id,
        quantity=data.quantity,
        log_date=data.log_date,
        meal_time=data.meal_time,
    )
    db.add(meal_log)
    db.commit()
    db.refresh(meal_log)

    print(f"[SUCCESS] 식단 기록 저장 완료:")
    print(f"  meal_log_id: {meal_log.meal_log_id}")
    print(f"  food_item_id: {meal_log.food_item_id}")
    print(f"  quantity: {meal_log.quantity}")
    print(f"  meal_time: {meal_log.meal_time}")
    print(f"  nutrition_source: {user_nutrition.get('source', 'unknown')}")

    # 4. 저장된 정보 반환 (Spring DTO와 최대한 맞춤)
    return {
        "message": "식단 기록 저장 성공",
        "meal_log_id": meal_log.meal_log_id,
        "food_item_id": meal_log.food_item_id,
        "user_id": meal_log.user_id,
        "quantity": float(meal_log.quantity),  # type: ignore
        "log_date": str(meal_log.log_date),
        "meal_time": meal_log.meal_time,
        "created_at": str(meal_log.created_at) if meal_log.created_at is not None else None,  # type: ignore
        "nutrition_source": user_nutrition.get('source', 'unknown'),
        "debug": debug_info
    }

@router.get("/diet/daily")
def get_today_diet(user_id: int, date: Optional[str] = None, db: Session = Depends(get_db)):
    target_date: Union[str, dt_date]
    if date is None:
        target_date = dt_date.today()
    else:
        # date가 string이면 date 타입으로 변환
        if isinstance(date, str):
            target_date = dt_date.fromisoformat(date)
        else:
            target_date = date
    
    records = db.query(models.MealLog).filter(
        models.MealLog.user_id == user_id,
        models.MealLog.log_date == target_date
    ).all()
    return [
        {
            "meal_log_id": r.meal_log_id,
            "food_item_id": r.food_item_id,
            "quantity": float(r.quantity),  # type: ignore
            "log_date": r.log_date,
            "meal_time": r.meal_time,
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
