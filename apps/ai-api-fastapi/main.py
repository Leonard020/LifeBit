from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models
from database import engine, get_db
import openai, os, json
from dotenv import load_dotenv
import tempfile
from auth_routes import router as auth_router
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import date

# 새로 추가: 차트 분석 서비스 import
from analytics_service import HealthAnalyticsService

# Load .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# 환경 변수 로드 확인
print("[ENV] Environment variables loaded:")
print(f"[ENV] KAKAO_CLIENT_ID: {os.getenv('KAKAO_CLIENT_ID')}")
print(f"[ENV] GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
print(f"[ENV] KAKAO_REDIRECT_URI: {os.getenv('KAKAO_REDIRECT_URI')}")
print(f"[ENV] GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# CORS 설정
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# 라우터 등록
app.include_router(auth_router, prefix="/api/auth")

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

# 차트 분석 서비스 인스턴스 생성
analytics_service = HealthAnalyticsService()

# ChatGPT 시스템 프롬프트 정의
CHAT_SYSTEM_PROMPT = """
당신은 LifeBit의 AI 어시스턴트입니다.
사용자의 건강한 라이프스타일을 돕기 위해 운동과 식단에 대한 기록을 도와줍니다.

응답 규칙:
1. 사용자가 운동 기록이나 식단 기록 버튼을 누르지 않은 상태라면,
   👉 "안녕하세요! 운동이나 식단을 기록하시려면 먼저 상단의 '운동 기록' 또는 '식단 기록' 버튼을 선택해 주세요."
2. 운동/식단 버튼이 눌린 상태에서만 정보 수집을 시작합니다.
3. 운동과 식단 외의 질문에는 아래 문구로 안내합니다:
   👉 "LifeBit은 현재 운동과 식단에 대한 정보만 기록하고 있어요. 그 외의 질문에는 답변이 어려운 점 양해 부탁드립니다!"
4. 모든 답변은 친절하고 간결하게, 하지만 보기 좋게 정리합니다.
5. 오류나 이상이 발생하면 자체 판단 후 적절한 문구를 안내합니다.
"""

# 🚩 [운동 기록 추출 프롬프트]
EXERCISE_EXTRACTION_PROMPT = """
당신은 LifeBit의 운동 기록 AI 어시스턴트입니다.
사용자와 친근하고 자연스러운 대화를 하면서 운동 정보를 수집합니다.

📋 **수집할 정보:**
1. 운동명 (exercise): 사용자가 한 운동
2. 대분류 (category): "유산소" 또는 "근력" 
3. 중분류 (subcategory): "가슴", "등", "하체", "팔", "복근", "어깨" 중 하나 (근력운동만)
4. 시간대 (time_period): 현재 대화 시간 기준으로 자동 설정 (질문하지 않음)
5. 무게 (weight): kg 단위 (근력운동만, 맨몸운동은 제외)
6. 세트 (sets): 세트 수 (근력운동만)
7. 횟수 (reps): 회 수 (근력운동만)
8. 운동시간 (duration_min): 분 단위 (유산소운동만)
9. 소모칼로리 (calories_burned): 자동 계산

🏋️ **운동 분류 규칙:**
[유산소 운동] → category: "유산소", subcategory: null
- 달리기, 조깅, 워킹, 걷기, 수영, 자전거, 사이클링, 줄넘기, 등산, 하이킹, 트레드밀
- 필수: duration_min만 수집 ("몇 분 동안 운동하셨나요?" 형식으로 질문)
- 제외: weight, sets, reps는 수집하지 않음

[근력 운동] → category: "근력"
- 가슴: 벤치프레스, 푸시업, 체스트프레스, 딥스, 플라이
- 등: 풀업, 랫풀다운, 바벨로우, 시티드로우, 데드리프트
- 하체: 스쿼트, 레그프레스, 런지, 레그컬, 레그익스텐션
- 어깨: 숄더프레스, 사이드레이즈, 프론트레이즈, 리어델트
- 팔: 바이셉스컬, 트라이셉스, 해머컬, 딥스
- 복근: 크런치, 플랭크, 레그레이즈, 싯업

[맨몸 운동 판별]
- 푸시업, 풀업, 플랭크, 크런치, 싯업, 버피, 스쿼트(무게 없이) → is_bodyweight: true

⏰ **시간대 자동 설정 (현재 시간 기준):**
- 오전: 06:00-11:59
- 오후: 12:00-17:59  
- 저녁: 18:00-23:59
- 새벽: 00:00-05:59
※ 사용자에게 시간대를 묻지 말고 자동으로 설정할 것

💬 **응답 형식:**
{
  "response_type": "need_info | complete | confirmation",
  "system_message": {
    "data": {
      "exercise": "운동명",
      "category": "유산소 | 근력",
      "subcategory": "가슴|등|하체|팔|복근|어깨 (근력만)",
      "time_period": "현재시간_기준_자동설정",
      "is_bodyweight": true/false,
      "weight": null/숫자,
      "sets": null/숫자,
      "reps": null/숫자,
      "duration_min": null/숫자,
      "calories_burned": 계산된_실제값
    },
    "missing_fields": ["weight", "sets", "reps"],
    "next_step": "validation | confirmation"
  },
  "user_message": {
    "text": "사용자에게 보여줄 자연어 메시지",
    "display_format": "🏋️‍♂️ {exercise} 운동 정보\\n\\n✅ 운동명: {exercise}\\n💪 분류: {category}({subcategory})\\n⏰ 시간대: {time_period}\\n💪 무게: {weight}kg\\n🔢 세트: {sets}세트\\n🔄 횟수: {reps}회\\n⏱️ 시간: {duration_min}분\\n🔥 칼로리: {calories_burned}kcal"
  }
}

🔥 **칼로리 계산 공식 (실제 계산 필수):**
[근력운동]
- 기본 계산: (무게 × 세트 × 횟수 × 0.045) + (운동강도계수)
- 가슴/등/하체: × 1.2 (대근육)
- 어깨/팔: × 1.0 (소근육)  
- 복근: × 0.8 (코어)
- 맨몸운동: (세트 × 횟수 × 체중70kg기준 × 0.03)

[유산소운동]
- 달리기: 시간(분) × 11kcal
- 걷기: 시간(분) × 5kcal  
- 수영: 시간(분) × 9kcal
- 자전거: 시간(분) × 7kcal
- 기타: 시간(분) × 8kcal

🎯 **대화 예시:**
사용자: "스쿼트 했어요"
AI: "스쿼트 하셨군요! 💪 몇 kg으로 운동하셨나요?"

사용자: "푸시업 했어요"  
AI: "푸시업 하셨네요! 몇 세트 하셨나요?"

사용자: "달리기 했어요"
AI: "달리기 하셨군요! 🏃‍♂️ 몇 분 동안 운동하셨나요?"

사용자: "30분 달렸어요"
AI: "달리기 30분 하셨군요! 🏃‍♂️ 훌륭하네요. 30분 × 11kcal = 330kcal 소모하셨습니다!"

📌 **주의사항:**
- 모든 대화는 친근하고 격려하는 톤으로
- 필수 정보가 부족하면 한 번에 하나씩만 질문
- 불필요한 정보는 수집하지 않음 (유산소는 weight/sets/reps 제외)
- 시간대는 절대 질문하지 말고 현재 시간 기준으로 자동 설정
- 칼로리는 반드시 실제 계산된 값을 제공할 것
- 유산소 운동은 "얼마나 달렸는지" 대신 "몇 분 동안" 형식으로 질문
"""

# 🚩 [운동 기록 검증 프롬프트]
EXERCISE_VALIDATION_PROMPT = """
당신은 LifeBit의 운동 기록 검증 도우미입니다.
수집된 정보를 확인하고 누락된 필수 정보를 요청합니다.

📋 **필수 정보 검증 규칙:**

[유산소 운동]
- exercise (운동명) ✅ 필수
- category: "유산소" ✅ 필수  
- duration_min (운동시간) ✅ 필수
- time_period (시간대) ✅ 자동설정 (현재시간 기준)
- calories_burned (자동 계산) ✅ 필수

[근력 운동 - 기구/중량 운동]
- exercise (운동명) ✅ 필수
- category: "근력" ✅ 필수
- subcategory (부위) ✅ 필수
- weight (무게) ✅ 필수
- sets (세트) ✅ 필수  
- reps (횟수) ✅ 필수
- time_period (시간대) ✅ 자동설정 (현재시간 기준)
- calories_burned (자동 계산) ✅ 필수

[근력 운동 - 맨몸 운동]
- exercise (운동명) ✅ 필수
- category: "근력" ✅ 필수
- subcategory (부위) ✅ 필수
- sets (세트) ✅ 필수
- reps (횟수) ✅ 필수  
- time_period (시간대) ✅ 자동설정 (현재시간 기준)
- is_bodyweight: true ✅ 필수
- calories_burned (자동 계산) ✅ 필수

💬 **응답 형식:**
{
  "response_type": "need_info | complete",
  "system_message": {
    "data": {현재까지_수집된_모든_데이터},
    "missing_fields": ["다음에_물어볼_필드명"],
    "next_step": "validation | confirmation"
  },
  "user_message": {
    "text": "친근한 질문 메시지",
    "display_format": "현재까지_수집된_정보_표시"
  }
}

🎯 **친근한 질문 예시:**
- weight: "몇 kg으로 하셨나요? 💪"
- sets: "몇 세트 하셨어요? 💪"  
- reps: "한 세트에 몇 회씩 하셨나요? 💪"
- duration_min: "몇 분 동안 운동하셨나요? ⏱️"
※ time_period는 절대 질문하지 말고 현재 시간 기준으로 자동 설정

📌 **검증 완료 조건:**
- 필수 필드가 모두 채워짐
- 칼로리가 반드시 계산되어야 함 (계산 중 상태는 허용하지 않음)
- 시간대는 현재 시간 기준으로 자동 설정
- response_type: "complete"
- next_step: "confirmation"

⚠️ **중요 검증 규칙:**
1. 칼로리가 계산되지 않았거나 null이면 절대 complete 상태로 넘어가지 않음
2. 모든 필수 필드가 채워져야 함
3. 맨몸 운동은 weight 필드가 필요하지 않음
4. 유산소 운동은 weight, sets, reps 필드가 필요하지 않음
5. 시간대(time_period)는 절대 질문하지 말고 현재 시간 기준으로 자동 설정
"""

# 🚩 [운동 기록 확인 프롬프트]  
EXERCISE_CONFIRMATION_PROMPT = """
당신은 LifeBit의 운동 기록 요약 도우미입니다.
최종 수집된 정보를 사용자에게 확인받습니다.

💬 **응답 형식:**
{
  "response_type": "confirmation",
  "system_message": {
    "data": {
      "exercise": "최종_운동명",
      "category": "유산소|근력", 
      "subcategory": "부위|null",
      "time_period": "현재시간_기준_자동설정",
      "is_bodyweight": true/false,
      "weight": 무게|null,
      "sets": 세트수|null,
      "reps": 횟수|null, 
      "duration_min": 시간|null,
      "calories_burned": 실제_계산된_칼로리
    },
    "next_step": "complete"
  },
  "user_message": {
    "text": "운동 기록이 완료되었습니다! 아래 내용이 맞는지 확인해주세요.",
    "display_format": "🏋️‍♂️ 운동 기록 확인\\n\\n{formatted_exercise_info}\\n\\n맞으면 '네', 수정이 필요하면 '아니오'라고 해주세요!"
  }
}

📝 **표시 형식:**
[근력 운동]
✅ 운동명: 스쿼트
💪 분류: 근력운동 (하체)  
⏰ 시간대: 오후 (자동설정)
🏋️ 무게: 60kg
🔢 세트: 3세트
🔄 횟수: 10회
🔥 소모 칼로리: 180kcal

[유산소 운동]  
✅ 운동명: 달리기
🏃 분류: 유산소운동
⏰ 시간대: 오전 (자동설정)
⏱️ 운동시간: 30분
🔥 소모 칼로리: 330kcal

[맨몸 운동]
✅ 운동명: 푸시업
💪 분류: 근력운동 (가슴, 맨몸)  
⏰ 시간대: 오후 (자동설정)
🔢 세트: 3세트
🔄 횟수: 15회
🔥 소모 칼로리: 95kcal

📌 **주의사항:**
- 입력된 정보만 표시
- 칼로리는 반드시 계산되어야 함 (계산 중 상태 불허)
- 시간대는 현재 시간 기준 자동 설정으로 표시
- 확인 후 '네'면 DB 저장 진행
- 칼로리 계산이 완료된 후에만 확인 단계 진입
"""

# 🚩 [식단 기록 추출 프롬프트]
DIET_EXTRACTION_PROMPT = """
당신은 LifeBit의 식단 기록 AI 어시스턴트입니다.  
사용자와 친근하고 자연스러운 대화를 하면서 식단 정보를 수집합니다.

📋 **수집할 정보:**
1. 음식명 (food_name): 사용자가 먹은 음식
2. 섭취량 (amount): "1개", "1인분", "200g" 등 구체적인 양
3. 섭취 시간 (meal_time): "아침", "점심", "저녁", "간식", "야식" 중 하나
4. 영양 정보 (nutrition): 음식명과 섭취량 기준 자동 계산
   - 칼로리 (calories): kcal
   - 탄수화물 (carbs): g
   - 단백질 (protein): g  
   - 지방 (fat): g

🍽️ **섭취 시간 분류:**
- 아침: 05:00-10:59
- 점심: 11:00-14:59
- 저녁: 15:00-20:59
- 간식: 21:00-04:59 (밤 늦은 시간)
- 야식: 사용자가 명시적으로 "야식"이라고 할 때

💬 **응답 형식:**
{
  "response_type": "need_info | complete | confirmation",
  "system_message": {
    "data": {
      "food_name": "음식명",
      "amount": "섭취량",
      "meal_time": "아침|점심|저녁|간식|야식",
      "nutrition": {
        "calories": 계산된_칼로리,
        "carbs": 계산된_탄수화물,
        "protein": 계산된_단백질,
        "fat": 계산된_지방
      }
    },
    "missing_fields": ["amount", "meal_time"],
    "next_step": "validation | confirmation"
  },
  "user_message": {
    "text": "사용자에게 보여줄 자연어 메시지",
    "display_format": "🍽️ {food_name} 식단 정보\\n\\n✅ 음식명: {food_name}\\n📏 섭취량: {amount}\\n⏰ 섭취시간: {meal_time}\\n🔥 칼로리: {calories}kcal\\n🍞 탄수화물: {carbs}g\\n🥩 단백질: {protein}g\\n🧈 지방: {fat}g"
  }
}

🧮 **영양소 계산 가이드:**
[주식류]
- 밥(1공기 210g): 칼로리 300kcal, 탄수화물 65g, 단백질 6g, 지방 1g
- 라면(1개 120g): 칼로리 500kcal, 탄수화물 70g, 단백질 12g, 지방 18g
- 빵(식빵 1장 30g): 칼로리 80kcal, 탄수화물 15g, 단백질 3g, 지방 1g

[단백질류]  
- 계란(1개 60g): 칼로리 90kcal, 탄수화물 1g, 단백질 7g, 지방 6g
- 닭가슴살(100g): 칼로리 165kcal, 탄수화물 0g, 단백질 31g, 지방 4g
- 소고기(100g): 칼로리 250kcal, 탄수화물 0g, 단백질 26g, 지방 15g

[과일류]
- 사과(1개 200g): 칼로리 105kcal, 탄수화물 27g, 단백질 0g, 지방 0g
- 바나나(1개 120g): 칼로리 105kcal, 탄수화물 27g, 단백질 1g, 지방 0g

[기타]
- 우유(1컵 240ml): 칼로리 150kcal, 탄수화물 12g, 단백질 8g, 지방 8g

🎯 **대화 예시:**
사용자: "아침에 계란 먹었어요"
AI: "계란 드셨군요! 🥚 몇 개 드셨나요?"

사용자: "라면 먹었어요"  
AI: "라면 드셨네요! 🍜 몇 봉지 드셨나요? 그리고 언제 드셨는지 알려주세요."

사용자: "사과 1개 점심에 먹었어요"
AI: "사과 1개 점심에 드셨군요! 🍎 영양 정보를 계산해드릴게요."

📌 **주의사항:**
- 모든 대화는 친근하고 격려하는 톤으로
- 필수 정보가 부족하면 한 번에 하나씩만 질문
- 영양소는 일반적인 표준값 기준으로 계산
- 섭취 시간은 현재 시간 기준으로 자동 설정 가능
- 입력되지 않은 정보는 display_format에서 제외
"""

# 🚩 [식단 기록 검증 프롬프트]
DIET_VALIDATION_PROMPT = """
당신은 LifeBit의 식단 기록 검증 도우미입니다.  
수집된 정보를 확인하고 누락된 필수 정보를 요청합니다.

📋 **필수 정보 검증 규칙:**
- food_name (음식명) ✅ 필수
- amount (섭취량) ✅ 필수
- meal_time (섭취시간) ✅ 필수  
- nutrition (영양정보) ✅ 필수
  - calories (칼로리) ✅ 필수
  - carbs (탄수화물) ✅ 필수
  - protein (단백질) ✅ 필수
  - fat (지방) ✅ 필수

💬 **응답 형식:**
{
  "response_type": "need_info | complete",
  "system_message": {
    "data": {현재까지_수집된_모든_데이터},
    "missing_fields": ["다음에_물어볼_필드명"],
    "next_step": "validation | confirmation"
  },
  "user_message": {
    "text": "친근한 질문 메시지",
    "display_format": "현재까지_수집된_정보_표시"
  }
}

🎯 **친근한 질문 예시:**
- amount: "어느 정도 양을 드셨나요? (예: 1개, 1인분, 200g) 🍽️"
- meal_time: "언제 드셨나요? (아침/점심/저녁/간식/야식) 🕐"

📌 **검증 완료 조건:**
- 필수 필드가 모두 채워짐
- 영양소가 계산됨  
- response_type: "complete"
- next_step: "confirmation"
"""

# 🚩 [식단 기록 확인 프롬프트]
DIET_CONFIRMATION_PROMPT = """
당신은 LifeBit의 식단 기록 요약 도우미입니다.
최종 수집된 정보를 사용자에게 확인받습니다.

💬 **응답 형식:**
{
  "response_type": "confirmation",
  "system_message": {
    "data": {
      "food_name": "최종_음식명",
      "amount": "최종_섭취량",
      "meal_time": "최종_섭취시간",
      "nutrition": {
        "calories": 계산된_칼로리,
        "carbs": 계산된_탄수화물,
        "protein": 계산된_단백질,
        "fat": 계산된_지방
      }
    },
    "next_step": "complete"
  },
  "user_message": {
    "text": "아래 식단 기록이 맞는지 확인해주세요!",
    "display_format": "🍽️ 식단 기록 확인\\n\\n{formatted_meal_info}\\n\\n맞으면 '네', 수정이 필요하면 '아니오'라고 해주세요!"
  }
}

📝 **표시 형식:**
✅ 음식명: 계란
📏 섭취량: 2개
⏰ 섭취시간: 아침
📊 영양 정보:
  🔥 칼로리: 180kcal
  🍞 탄수화물: 2g
  🥩 단백질: 14g
  🧈 지방: 12g

📌 **주의사항:**
- 입력된 정보만 표시
- 영양소는 반드시 계산되어야 함
- 확인 후 '네'면 DB 저장 진행
"""

# 채팅 요청을 위한 스키마
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []
    record_type: Optional[str] = None  # "exercise" or "diet" or None
    chat_step: Optional[str] = None 

# 차트 분석 요청을 위한 스키마
class AnalyticsRequest(BaseModel):
    user_id: int
    period: str = "month"  # day, week, month, year

# 헬스 체크 엔드포인트
@app.get("/")
def health_check():
    return {"status": "OK", "service": "LifeBit AI-API"}

# 🚀 새로 추가: 건강 데이터 종합 분석 엔드포인트
@app.post("/api/py/analytics/health-report")
async def generate_health_analytics_report(request: AnalyticsRequest):
    """사용자의 건강 데이터를 종합 분석하여 차트와 인사이트를 제공"""
    try:
        print(f"[INFO] 건강 분석 요청 - 사용자 ID: {request.user_id}, 기간: {request.period}")
        
        # 종합 분석 리포트 생성
        report = await analytics_service.generate_comprehensive_report(
            user_id=request.user_id,
            period=request.period
        )
        
        if report['status'] == 'error':
            raise HTTPException(
                status_code=500, 
                detail=f"분석 실패: {report.get('message', '알 수 없는 오류')}"
            )
        
        print(f"[INFO] 분석 완료 - 건강기록: {report['data_summary']['health_records_count']}개, "
              f"운동세션: {report['data_summary']['exercise_sessions_count']}개")
        
        return {
            "status": "success",
            "message": "건강 데이터 분석이 완료되었습니다.",
            "report": report
        }
        
    except Exception as e:
        print(f"[ERROR] 건강 분석 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"건강 분석 중 오류가 발생했습니다: {str(e)}"
        )

# 🚀 체중 트렌드 분석 엔드포인트
@app.post("/api/py/analytics/weight-trends")
async def analyze_weight_trends_endpoint(request: AnalyticsRequest):
    """체중 변화 트렌드만 분석"""
    try:
        data = await analytics_service.fetch_health_data(request.user_id, request.period)
        analysis = analytics_service.analyze_weight_trends(data['health_records'])
        
        return {
            "status": "success",
            "analysis": analysis,
            "chart": analytics_service.generate_weight_chart(data['health_records'], analysis)
        }
        
    except Exception as e:
        print(f"[ERROR] 체중 분석 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚀 운동 패턴 분석 엔드포인트
@app.post("/api/py/analytics/exercise-patterns")
async def analyze_exercise_patterns_endpoint(request: AnalyticsRequest):
    """운동 패턴만 분석"""
    try:
        data = await analytics_service.fetch_health_data(request.user_id, request.period)
        analysis = analytics_service.analyze_exercise_patterns(data['exercise_sessions'])
        
        return {
            "status": "success",
            "analysis": analysis,
            "chart": analytics_service.generate_exercise_chart(data['exercise_sessions'], analysis)
        }
        
    except Exception as e:
        print(f"[ERROR] 운동 분석 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# 🚀 AI 기반 건강 조언 엔드포인트
@app.post("/api/py/analytics/ai-insights")
async def get_ai_health_insights(request: AnalyticsRequest):
    """AI 기반 개인화된 건강 조언 생성"""
    try:
        data = await analytics_service.fetch_health_data(request.user_id, request.period)
        
        weight_analysis = analytics_service.analyze_weight_trends(data['health_records'])
        bmi_analysis = analytics_service.analyze_bmi_health_status(data['health_records'])
        exercise_analysis = analytics_service.analyze_exercise_patterns(data['exercise_sessions'])
        
        insights = analytics_service.generate_ai_insights(weight_analysis, bmi_analysis, exercise_analysis)
        
        return {
            "status": "success",
            "insights": insights,
            "analysis_summary": {
                "weight": weight_analysis,
                "bmi": bmi_analysis,
                "exercise": exercise_analysis
            }
        }
        
    except Exception as e:
        print(f"[ERROR] AI 인사이트 생성 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

USE_GPT = os.getenv("USE_GPT", "False").lower() == "true"

# 음성 업로드 → Whisper + GPT + 기록 저장
@app.post("/api/py/voice")
async def process_voice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Whisper로 음성 변환
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await file.read())
            temp_path = tmp.name

        with open(temp_path, "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)

        user_text = transcript["text"]
        print("[INFO] Whisper 결과:", user_text)

        # 간단 룰베이스로 GPT 프롬프트 분기 (운동/식단 구분)
        if any(keyword in user_text for keyword in ["밥", "먹었", "식사", "점심", "저녁", "아침", "간식"]):
            extraction_prompt = DIET_EXTRACTION_PROMPT
            validation_prompt = DIET_VALIDATION_PROMPT
            confirmation_prompt = DIET_CONFIRMATION_PROMPT
            record_type = "diet"
        else:
            extraction_prompt = EXERCISE_EXTRACTION_PROMPT
            validation_prompt = EXERCISE_VALIDATION_PROMPT
            confirmation_prompt = EXERCISE_CONFIRMATION_PROMPT
            record_type = "exercise"

        # GPT 호출
        if USE_GPT:
            # 1. 데이터 추출
            extraction_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": extraction_prompt},
                    {"role": "user", "content": user_text}
                ],
                temperature=0.3
            )

            parsed_data = json.loads(extraction_response.choices[0].message["content"])
            print("[INFO] GPT 파싱 결과:", json.dumps(parsed_data, indent=2, ensure_ascii=False))

            # 2. 데이터 검증
            validation_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": validation_prompt},
                    {"role": "user", "content": json.dumps(parsed_data)}
                ],
                temperature=0.3
            )

            validation_result = json.loads(validation_response.choices[0].message["content"])

            # 3. 데이터가 완전한 경우에만 확인 단계로 진행
            if validation_result["status"] == "complete":
                confirmation_response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": confirmation_prompt},
                        {"role": "user", "content": json.dumps(parsed_data)}
                    ],
                    temperature=0.3
                )

                confirmation_text = confirmation_response.choices[0].message["content"]

                # ✅ DB 저장로직
                if record_type == "exercise":
                    for exercise in parsed_data:
                        new_record = models.ExerciseSession(
                            user_id=1,  # (임시 사용자)
                            exercise_catalog_id=None,
                            duration_minutes=exercise.get("duration_min", 30),
                            calories_burned=exercise.get("calories_burned", 200),
                            weight=exercise.get("weight"),
                            reps=exercise.get("reps"),
                            sets=exercise.get("sets"),
                            notes=exercise["exercise"],
                            exercise_date=date.today()
                        )
                        db.add(new_record)

                elif record_type == "diet":
                    for food in parsed_data:
                        new_record = models.MealLog(
                            user_id=1,
                            food_item_id=None,
                            quantity=food["amount"],
                            calories=food.get("calories", 0),
                            carbs=food.get("carbs", 0),
                            protein=food.get("protein", 0),
                            fat=food.get("fat", 0),
                            meal_time=food["time_period"],
                            log_date=date.today()
                        )
                        db.add(new_record)

                db.commit()

                return {
                    "status": "success",
                    "type": record_type,
                    "parsed_data": parsed_data,
                    "validation": validation_result,
                    "confirmation": confirmation_text
                }
            else:
                return {
                    "status": "incomplete",
                    "type": record_type,
                    "validation": validation_result
                }

        else:
            return {"status": "error", "message": "GPT 기능 비활성화됨"}

    except Exception as e:
        print("[ERROR]", str(e))
        db.rollback()
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

# 채팅 엔드포인트
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="메시지가 비어있습니다.")

        # GPT 호출
        if USE_GPT:
            # 기록 타입이 선택되지 않은 경우
            if not request.record_type:
                return {
                    "type": "initial",
                    "message": "안녕하세요! 운동이나 식단을 기록하시려면 먼저 상단의 '운동 기록' 또는 '식단 기록' 버튼을 선택해 주세요."
                }

            # 단계(chat_step)에 따라 시스템 프롬프트 선택
            if request.record_type == "exercise":
                if request.chat_step == "validation":
                    system_prompt = EXERCISE_VALIDATION_PROMPT
                elif request.chat_step == "confirmation":
                    system_prompt = EXERCISE_CONFIRMATION_PROMPT
                else:
                    system_prompt = EXERCISE_EXTRACTION_PROMPT
            else:
                if request.chat_step == "validation":
                    system_prompt = DIET_VALIDATION_PROMPT
                elif request.chat_step == "confirmation":
                    system_prompt = DIET_CONFIRMATION_PROMPT
                else:
                    system_prompt = DIET_EXTRACTION_PROMPT

            # GPT 호출 메시지 구성
            messages = [
                {"role": "system", "content": system_prompt},
                *request.conversation_history,
                {"role": "user", "content": request.message}
            ]

            # ChatCompletion API 실행
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7
            )

            # 응답 JSON 파싱
            raw = response.choices[0].message["content"]
            try:
                ai_response = json.loads(raw)
                
                # 프론트엔드 호환 형식으로 변환
                frontend_response = {
                    "type": "incomplete",  # 기본값
                    "message": "",
                    "parsed_data": None
                }
                
                # AI 응답에서 정보 추출
                if "system_message" in ai_response and "data" in ai_response["system_message"]:
                    parsed_data = ai_response["system_message"]["data"]
                    
                    # 모든 필수 필드가 있는지 확인
                    missing_fields = ai_response["system_message"].get("missing_fields", [])
                    
                    if len(missing_fields) == 0:
                        frontend_response["type"] = "success"
                        frontend_response["parsed_data"] = parsed_data
                    else:
                        frontend_response["type"] = "incomplete"
                        frontend_response["missingFields"] = missing_fields
                
                # 사용자에게 보여줄 메시지
                if "user_message" in ai_response and "text" in ai_response["user_message"]:
                    frontend_response["message"] = ai_response["user_message"]["text"]
                else:
                    frontend_response["message"] = "처리 중 오류가 발생했습니다."
                
                return frontend_response
                
            except json.JSONDecodeError:
                return {"type": "error", "message": raw}

        # GPT 비활성화 상태
        return {"type": "error", "message": "GPT 기능이 비활성화되어 있습니다."}

    except Exception as e:
        print(f"[ERROR] Chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"채팅 처리 중 오류가 발생했습니다: {e}"
        )

# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
