# note_routes.py
from fastapi import APIRouter, Depends, HTTPException, Header
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
from korean_amount_normalizer import normalize_korean_amount
import logging
from auth_utils import verify_access_token

router = APIRouter(tags=["note"])  # 태그 설정 중요

# 🔧 JWT 토큰 검증 의존성 함수
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    JWT 토큰을 검증하고 현재 사용자 정보를 반환합니다.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization 헤더가 필요합니다"
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Bearer 토큰 형식이 올바르지 않습니다"
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = verify_access_token(token)
        return payload
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"토큰 검증 실패: {str(e)}"
        )

# 🔧 사용자 ID 추출 의존성 함수
async def get_current_user_id(current_user: dict = Depends(get_current_user)) -> int:
    """
    현재 사용자의 ID를 반환합니다.
    """
    user_id = current_user.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="토큰에서 사용자 ID를 추출할 수 없습니다"
        )
    return user_id

# Import nutrition calculation functions from main.py
print("[ENV DEBUG] FOOD_STD_API_ENDPOINT:", os.getenv("FOOD_STD_API_ENDPOINT"))

# Set up logging for ambiguous/fallback cases
log_path = os.path.join(os.path.dirname(__file__), 'ambiguous_amounts.log')
logging.basicConfig(filename=log_path, level=logging.INFO, format='%(asctime)s %(message)s')

COMMON_KOREAN_MEASUREMENTS = {
    '공기': 210, '그릇': 350, '접시': 100, '개': 100, '줄': 150, '조각': 120, '알': 10,
    '잔': 240, '캔': 250, '인분': 180, '장': 40, '스푼': 15
}
COMMON_KOREAN_FOODS = {
    '밥': 210, '공기밥': 210, '국': 350, '찌개': 350, '탕': 350, '김치': 50, '단무지': 50, '반찬': 50,
    '삼각김밥': 100, '김밥': 150, '계란': 60, '식빵': 40, '토스트': 80, '우유': 240, '콜라': 250, '사이다': 250, '밀키스': 250,
    '피자': 120, '곱창': 180, '떡볶이': 180, '삼겹살': 180, '불고기': 180, '샐러드': 100, '사과': 200, '바나나': 120, '방울토마토': 10
}

def search_food_in_database(food_name: str, db: Session) -> Optional[FoodItem]:
    """
    데이터베이스에서 음식을 검색합니다.
    정확한 이름 매칭을 우선하고, 공기밥/밥 등은 명시적으로 매핑합니다.
    부분 매칭은 마지막 수단으로만 사용합니다.
    """
    try:
        # 1. Exact match
        exact_match = db.query(FoodItem).filter(FoodItem.name == food_name).first()
        if exact_match:
            print(f"[DB SEARCH] 정확한 매칭 발견: {food_name}")
            return exact_match

        # 2. Manual mapping for common ambiguous names
        rice_aliases = ["밥", "공기밥", "흰밥", "밥 한공기", "밥 1공기"]
        if food_name in rice_aliases or ("밥" in food_name and len(food_name) <= 3):
            rice_match = db.query(FoodItem).filter(FoodItem.name.contains("공기밥")).first()
            if rice_match:
                print(f"[DB SEARCH] '밥'류 매핑: {food_name} -> {rice_match.name}")
                return rice_match

        # 3. Partial match (avoid matching short names to longer names like '김밥')
        if len(food_name) > 2:
            partial_matches = db.query(FoodItem).filter(FoodItem.name.contains(food_name)).all()
            # FoodItem 인스턴스이면서 name이 str인 것만 필터링
            filtered_matches = [x for x in partial_matches if hasattr(x, 'name') and isinstance(x.name, str)]
            if filtered_matches:
                # Prefer the shortest name or the one with the highest similarity
                try:
                    best_match = min(filtered_matches, key=lambda x: len(x.name) if isinstance(x.name, str) else 1000)
                except Exception:
                    best_match = filtered_matches[0]
                print(f"[DB SEARCH] 부분 매칭 발견: {food_name} -> {best_match.name}")
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
            # linter 에러 방지: response가 generator/list/dict 등 다양한 타입일 수 있으므로 예외처리
            result = None
            try:
                try:
                    # 가장 일반적인 openai.ChatCompletion 반환값 처리
                    result = response.choices[0].message["content"].strip()
                except Exception:
                    try:
                        # list로 변환 후 처리
                        resp_list = list(response)
                        result = resp_list[0].choices[0].message["content"].strip()
                    except Exception:
                        try:
                            # dict로 변환 후 처리
                            resp_dict = dict(response)
                            result = resp_dict.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                        except Exception:
                            result = None
            except Exception as e:
                print(f"[GRAM ESTIMATION][GPT RESPONSE] 파싱 에러: {e}")
                result = "180"
            if not result:
                result = "180"
            print(f"[GRAM ESTIMATION][GPT RESPONSE]: {result}")
        
        # JSON 파싱
        try:
            nutrition_data = json.loads(result if result is not None else '{}')
        except Exception:
            nutrition_data = {"calories": 200.0, "carbs": 30.0, "protein": 10.0, "fat": 5.0, "source": "default"}
        
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

def estimate_grams_from_korean_amount(food_name: str, amount: str) -> float:
    try:
        print(f"[GRAM ESTIMATION] Original: {food_name} {amount}")
        normalized_amount = normalize_korean_amount(amount)
        print(f"[GRAM ESTIMATION] Normalized: {food_name} {normalized_amount}")

        # Special case for cereal (시리얼)
        if '시리얼' in food_name:
            if '그릇' in normalized_amount or '한그릇' in normalized_amount:
                return 50  # Use 50g as a realistic bowl serving for cereal
            # If just '시리얼' with no amount, fallback to 30g (typical dry serving)
            if normalized_amount.strip() in ['', '1', '1개', '한개']:
                return 30

        # 1. Check for common measurement units in amount
        for unit, grams in COMMON_KOREAN_MEASUREMENTS.items():
            if unit in normalized_amount:
                logging.info(f"[COMMON_MEASUREMENT] {food_name} {normalized_amount}: Used={grams}g for unit '{unit}'")
                return grams
        # 2. Check for common foods in food_name
        for food, grams in COMMON_KOREAN_FOODS.items():
            if food in food_name:
                logging.info(f"[COMMON_FOOD] {food_name} {normalized_amount}: Used={grams}g for food '{food}'")
                return grams
        # ... rest of the estimation logic ...
        import re
        is_numeric = bool(re.match(r'^\d+(\.\d+)?$', normalized_amount.strip()))
        is_gram = 'g' in normalized_amount or '그램' in normalized_amount
        ambiguous_units = ['개', '알', '장', '조각', '쪽', '스푼', '큰술', '작은술', '봉지', '캔', '병', '줄', '입', '모', '덩이', '사발', '장', '판']
        side_dishes = ['깍두기', '김치', '단무지', '오이무침', '나물', '무생채', '콩나물', '시금치나물', '멸치볶음', '진미채', '무말랭이', '마늘쫑', '파김치', '열무김치', '총각김치', '파래무침']
        main_dishes = ['곱창', '떡볶이', '삼겹살', '불고기', '갈비', '치킨', '스테이크', '파스타', '돈까스', '제육볶음', '오므라이스', '비빔밥', '짜장면', '짬뽕', '순대국', '국밥', '라면', '칼국수', '우동', '피자', '햄버거', '핫도그', '샌드위치', '탕수육', '닭갈비', '찜닭', '닭볶음탕', '감자탕', '부대찌개', '해장국', '설렁탕', '곰탕', '갈비탕', '된장찌개', '김치찌개', '순두부찌개', '카레', '볶음밥', '오징어볶음', '낙지볶음', '쭈꾸미볶음', '닭발', '족발', '보쌈', '막국수', '냉면', '쫄면', '비빔국수', '콩국수', '잡채', '탕', '전골', '찜', '구이', '볶음', '조림', '찜닭', '찜갈비', '찜족발', '찜닭발', '찜오징어', '찜문어', '찜새우', '찜게', '찜조개', '찜홍합', '찜가리비', '찜전복', '찜낙지', '찜쭈꾸미', '찜문어', '찜오징어', '찜새우', '찜게', '찜조개', '찜홍합', '찜가리비', '찜전복', '찜낙지', '찜쭈꾸미']
        category_caps = {
            '캔': 250, '음료': 250, '밀키스': 250, '콜라': 250, '사이다': 250,
            '삼각김밥': 100, '김밥': 150, '빵': 80, '식빵': 80, '토스트': 80,
            '밥': 210, '공기밥': 210, '핫바': 100, '샌드위치': 120,
            '반찬': 50, '깍두기': 50, '김치': 50, '단무지': 50,
            '과일': 100, '사과': 200, '바나나': 120, '방울토마토': 10, '토마토': 100
        }
        # If side dish and unit is 접시, cap at 50g per 접시
        if any(sd in food_name for sd in side_dishes) and '접시' in normalized_amount:
            count_match = re.findall(r'\d+', normalized_amount)
            count = int(count_match[0]) if count_match else 1
            grams = 50 * count
            print(f"[GRAM ESTIMATION][SIDE DISH] {food_name} {normalized_amount}: capped at {grams}g ({count} 접시)")
            return grams
        # If ambiguous unit or just a number, always ask GPT
        if any(unit in normalized_amount for unit in ambiguous_units) or is_numeric:
            import openai
            prompt = (
                f"너는 한국어로 입력된 음식 기록을 정확히 해석하고, 음식의 일반적인 1회 제공량(그램 단위)을 추정하는 전문가야.\n"
                f"음식이 한국 음식이 아니더라도, 반드시 한국어 표현과 한국인의 식문화, 상식, 그리고 전세계적으로 통용되는 일반적인 음식 상식을 바탕으로 합리적인 1회 제공량(그램)을 추정해.\n"
                f"절대 1g, 0g, 10000g 같은 비현실적인 값은 답하지 마. 10g 미만이나 2000g 초과도 피해야 해.\n"
                f"수량이 모호하거나 애매하면, 한국에서 가장 흔히 먹는 1회 제공량을 보수적으로 추정해서 답해.\n"
                f"음식별로 일반적인 1회 제공량 예시:\n"
                f"- 김치 1접시=50g, 김치(수량 없음)=50g, 단무지 1접시=30g,\n"
                f"- 밥 1공기=210g, 미역국 1그릇=350g, 삼각김밥 1개=100g, 김밥 1줄=150g,\n"
                f"- 계란 1개=60g, 식빵 1장=40g, 토스트 1장=80g, 핫바 1개=100g,\n"
                f"- 우유 1컵=240g, 밀키스 1캔=250g, 콜라 1캔=250g, 사이다 1캔=250g,\n"
                f"- 방울토마토 1알=10g, 사과 1개=200g, 바나나 1개=120g, 토마토 1개=100g,\n"
                f"- 아이스크림 1개=100g, 곱창 1인분=180g,\n"
                f"- 반찬류(김치, 단무지, 나물 등) 수량 없으면 50g,\n"
                f"- 음료(캔, 컵, 병 등) 수량 없으면 250g,\n"
                f"- 피자 1조각=120g, 치킨 1조각=80g, 스테이크 1인분=200g, 샐러드 1접시=100g,\n"
                f"- 햄버거 1개=200g, 감자튀김 1인분=100g, 파스타 1접시=200g, 스프 1그릇=250g,\n"
                f"- 기타 애매한 경우 180g.\n"
                f"\n"
                f"반드시 숫자만, 단위 없이 답변해. 예시 답변: 210\n"
                f"\n"
                f"음식명: {food_name}\n수량: {normalized_amount}"
            )
            print(f"[GRAM ESTIMATION][GPT PROMPT]: {prompt}")
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=30
            )
            result = response.choices[0].message["content"].strip()
            print(f"[GRAM ESTIMATION][GPT RESPONSE]: {result}")
            number_match = re.search(r"\d+(?:\.\d+)?", result)
            grams = float(number_match.group(0)) if number_match else float('nan')
            # Always fallback to 180g if GPT returns 1, NaN, or any clearly invalid value
            if grams != grams or grams > 2000:
                logging.info(f"[FALLBACK] {food_name} {normalized_amount}: GPT={result} (invalid/NaN/too large). Fallback 180g used.")
                grams = 180
            # Side dish and other food-specific fallback for too small values
            if grams == 1 or grams < 10:
                if any(sd in food_name for sd in side_dishes):
                    logging.info(f"[FALLBACK] {food_name} {normalized_amount}: GPT={result} (too small/side dish). Fallback 50g used.")
                    grams = 50
                elif any(md in food_name for md in main_dishes):
                    logging.info(f"[FALLBACK] {food_name} {normalized_amount}: GPT={result} (too small/main dish). Fallback 180g used.")
                    grams = 180
                else:
                    logging.info(f"[FALLBACK] {food_name} {normalized_amount}: GPT={result} (too small/ambiguous). Fallback 180g used.")
                    grams = 180
            # Category-based cap (never fallback to 250g)
            count_match = re.findall(r'\d+', normalized_amount)
            count = int(count_match[0]) if count_match else 1
            per_unit = grams / count if count > 0 else grams
            relevant_category = next((cat for cat in category_caps if cat in food_name or cat in normalized_amount), None)
            # Only apply category cap if it's less than 180g for non-side dishes
            if relevant_category and per_unit > category_caps[relevant_category]:
                cap = category_caps[relevant_category]
                if cap >= 180 and not any(sd in food_name for sd in side_dishes):
                    grams = 180 * count
                else:
                    grams = cap * count
                logging.info(f"[FALLBACK] {food_name} {normalized_amount}: per_unit={per_unit}g > cap({cap})g. Used={grams}g")
            # --- Universal fallback: never allow 1g, 0g, or <10g for any food ---
            if grams is None or grams != grams or grams < 10 or grams == 1:
                if any(sd in food_name for sd in side_dishes):
                    grams = 50
                else:
                    grams = 180
                logging.info(f"[UNIVERSAL FALLBACK] {food_name} {normalized_amount}: Used={grams}g")
            return grams
        # Special handling for pizza
        if '피자' in food_name:
            if '조각' in normalized_amount:
                count_match = re.findall(r'\d+', normalized_amount)
                count = int(count_match[0]) if count_match else 1
                grams = 120 * count
                logging.info(f"[PIZZA] {food_name} {normalized_amount}: Set to {grams}g ({count} slice(s))")
                return grams
            else:
                grams = 180
                logging.info(f"[PIZZA] {food_name} {normalized_amount}: No unit/ambiguous, set to 180g")
                return grams
        # --- Rule-based fallback below ---
        amount_match = re.findall(r'[\d.]+', normalized_amount)
        num = float(amount_match[0]) if amount_match else 1.0
        amount_lower = normalized_amount.lower()
        food_lower = food_name.lower()
        recognized_units = ['그릇', '공기', '컵', '잔', '접시', '판', '개', '장', '조각', '쪽', '스푼', '큰술', '작은술', 'g', '그램']
        if any(unit in amount_lower for unit in recognized_units):
            relevant_category = next((cat for cat in category_caps if cat in food_name or cat in amount_lower), None)
            if relevant_category:
                return num * category_caps[relevant_category]
            if '그릇' in amount_lower or '공기' in amount_lower:
                if '밥' in food_lower or '쌀' in food_lower:
                    return num * 210
                elif '국' in food_lower or '탕' in food_lower or '찌개' in food_lower:
                    return num * 350
                elif '면' in food_lower or '라면' in food_lower:
                    return num * 300
                else:
                    return num * 300
            elif '컵' in amount_lower or '잔' in amount_lower:
                if '우유' in food_lower or '물' in food_lower or '주스' in food_lower:
                    return num * 240
                elif '쌀' in food_lower or '밥' in food_lower:
                    return num * 180
                else:
                    return num * 240
            elif '접시' in amount_lower or '판' in amount_lower:
                if any(sd in food_name for sd in side_dishes):
                    return num * 50
                if '김밥' in food_lower or '초밥' in food_lower:
                    return num * 200
                elif '샐러드' in food_lower:
                    return num * 150
                else:
                    return num * 250
            elif '개' in amount_lower or '장' in amount_lower:
                if '계란' in food_lower:
                    return num * 60
                elif '사과' in food_lower:
                    return num * 200
                elif '바나나' in food_lower:
                    return num * 120
                elif '햄버거' in food_lower:
                    return num * 200
                elif '피자' in food_lower:
                    return num * 300
                elif '빵' in food_lower or '토스트' in food_lower:
                    return num * 100
                else:
                    return num * 100
            elif '조각' in amount_lower or '쪽' in amount_lower:
                if '피자' in food_lower:
                    return num * 150
                elif '케이크' in food_lower:
                    return num * 80
                else:
                    return num * 75
            elif 'g' in amount_lower or '그램' in amount_lower:
                return num
        # If nothing matches, fallback to 180g
        print(f"[GRAM ESTIMATION] Fallback: {food_name} {normalized_amount}, using default 180g")
        logging.info(f"[AMBIGUOUS] {food_name} {normalized_amount}: No match, Used=180g")
        return 180.0
    except Exception as e:
        print(f"[GRAM ESTIMATION] Error estimating grams: {e}")
        logging.info(f"[ERROR] {food_name} {amount}: Exception {e}, Used=180g")
        return 180.0

# 🍽️ 식단 기록 저장 API
@router.post("/diet")
def save_diet_record(data: MealInput, current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
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
    estimated_quantity = data.quantity
    
    # 한국어 수량 표현인 경우 그램으로 변환
    if hasattr(data, 'food_name') and data.food_name:
        quantity_str = str(data.quantity)
        if not quantity_str.endswith('g') and not quantity_str.endswith('그램'):
            # 한국어 수량 표현인지 확인
            korean_units = ['그릇', '공기', '컵', '잔', '접시', '판', '개', '장', '조각', '쪽', '스푼', '큰술', '작은술']
            if any(unit in quantity_str for unit in korean_units):
                estimated_quantity = estimate_grams_from_korean_amount(data.food_name, quantity_str)
                print(f"[QUANTITY CONVERSION] {quantity_str} -> {estimated_quantity}g for {data.food_name}")
        
        # quantity를 amount 형태로 변환 (예: 60.0 -> "60g")
        amount_str = f"{estimated_quantity}g"
        user_nutrition = calculate_nutrition_from_gpt(data.food_name, amount_str, db)

    # 3. meal_logs에 저장 (Spring 구조와 호환)
    meal_log = models.MealLog(
        user_id=data.user_id,
        food_item_id=food_item_id,
        quantity=estimated_quantity,
        log_date=data.log_date,
        meal_time=data.meal_time,  # ← 원본 값 사용 (한글/영어 모두 지원)
    )
    db.add(meal_log)
    db.commit()
    db.refresh(meal_log)

    print(f"[SUCCESS] 식단 기록 저장 완료:")
    print(f"  meal_log_id: {meal_log.meal_log_id}")
    print(f"  food_item_id: {meal_log.food_item_id}")
    print(f"  original_quantity: {data.quantity}")
    print(f"  estimated_quantity: {estimated_quantity}g")
    print(f"  meal_time: {meal_log.meal_time}")
    print(f"  nutrition_source: {user_nutrition.get('source', 'unknown')}")

    # 4. 저장된 정보 반환 (Spring DTO와 최대한 맞춤)
    return {
        "message": "식단 기록 저장 성공",
        "meal_log_id": meal_log.meal_log_id,
        "food_item_id": meal_log.food_item_id,
        "user_id": meal_log.user_id,
        "quantity": float(meal_log.quantity) if hasattr(meal_log, 'quantity') and not hasattr(meal_log.quantity, '__clause_element__') else None,
        "original_quantity": str(data.quantity),
        "estimated_quantity": float(estimated_quantity) if not hasattr(estimated_quantity, '__clause_element__') else None,
        "log_date": str(meal_log.log_date),
        "meal_time": meal_log.meal_time,
        "created_at": str(meal_log.created_at) if meal_log.created_at is not None else None,  # type: ignore
        "nutrition_source": user_nutrition.get('source', 'unknown'),
        "debug": debug_info
    }

@router.get("/diet/daily")
def get_today_diet(current_user_id: int = Depends(get_current_user_id), date: Optional[str] = None, db: Session = Depends(get_db)):
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
            "quantity": float(r.quantity) if hasattr(r, 'quantity') and not isinstance(r.quantity, type(models.FoodItem.name)) else None,
            "log_date": r.log_date,
            "meal_time": r.meal_time,
        } for r in records
    ]

@router.delete("/diet/{meal_log_id}")
def delete_diet_record(meal_log_id: int, current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    record = db.query(models.MealLog).filter(models.MealLog.meal_log_id == meal_log_id).first()
    if not record:
        return {"message": "해당 식단 기록이 존재하지 않습니다."}
    db.delete(record)
    db.commit()
    return {"message": "식단 기록 삭제 성공"}
