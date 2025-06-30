from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import openai, os, json
from dotenv import load_dotenv
import tempfile
from auth_routes import router as auth_router
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from schemas import ExerciseChatInput, DailyExerciseRecord, ExerciseChatOutput, ExerciseRecord, MealInput
import models
from note_routes import router as note_router, estimate_grams_from_korean_amount
import requests
from normalize_utils import normalize_exercise_name

# 🔧 환경 감지 및 데이터베이스 설정 오버라이드
def setup_database():
    """환경에 따른 데이터베이스 설정"""
    # 프로덕션 환경 감지 (Docker, 환경변수 등)
    is_production = (
        os.getenv("DATABASE_URL") or 
        os.getenv("DB_HOST") or 
        os.path.exists("/.dockerenv") or
        os.getenv("NODE_ENV") == "production" or
        os.getenv("SPRING_PROFILES_ACTIVE") == "production"
    )
    
    if is_production:
        print("[DB] Production environment detected - Using production database settings")
        # 프로덕션 환경용 데이터베이스 URL
        db_user = os.getenv("DB_USER", "lifebit_user")
        db_password = os.getenv("DB_PASSWORD", "lifebit_password")
        db_name = os.getenv("DB_NAME", "lifebit_db")
        db_host = os.getenv("DB_HOST", "postgres-db")
        db_port = os.getenv("DB_PORT", "5432")
        
        production_database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        print(f"[DB] Using production database URL: {production_database_url.replace(db_password, '***')}")
        
        # 프로덕션용 엔진 설정 (연결 풀 최적화)
        production_engine = create_engine(
            production_database_url,
            connect_args={
                "options": "-c timezone=Asia/Seoul",
                "connect_timeout": 30,
                "application_name": "LifeBit-AI-API"
            },
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
            pool_timeout=30,
            echo=False,
            future=True
        )
        production_session = sessionmaker(autocommit=False, autoflush=False, bind=production_engine)
        
        return production_engine, production_session
    else:
        print("[DB] Local development environment detected - Using default database settings")
        # 로컬 환경에서는 기존 database.py 사용
        from database import engine, SessionLocal
        return engine, SessionLocal

# 환경별 데이터베이스 설정
engine, SessionLocal = setup_database()

# FastAPI 의존성으로 사용할 DB 세션 함수 (오버라이드)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 새로 추가: 차트 분석 서비스 import
from analytics_service import HealthAnalyticsService

# Load .env from project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Also try to load local .env in ai-api-fastapi directory
local_env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=local_env_path, override=False)  # Don't override existing values

# 환경 변수 로드 확인
print("[ENV] Environment variables loaded:")
print(f"[ENV] KAKAO_CLIENT_ID: {os.getenv('KAKAO_CLIENT_ID')}")
print(f"[ENV] GOOGLE_CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
print(f"[ENV] KAKAO_REDIRECT_URI: {os.getenv('KAKAO_REDIRECT_URI')}")
print(f"[ENV] GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI')}")

# Food Data API constants
# (Remove all FOOD_STD_API_* and FOOD_PROC_API_* variables and related prints)

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()
app.include_router(note_router, prefix="/api/py/note")  # ✅ 라우터 등록

# =======================
# CORS 설정 (동적/배포 대응)
# =======================

# 1) 환경 변수 CORS_ALLOWED_ORIGINS 에 콤마로 구분된 도메인/IP 목록이 있으면 우선 사용
# 2) 없으면 정규식(https?://.*) 으로 모든 Origin 허용
#    - allow_credentials=True 와 함께 쓰려면 와일드카드(*) 대신 정규식을 사용해야 함

cors_env = os.getenv("CORS_ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS")

if cors_env:
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
else:
    # 정규식으로 http/https 모든 출처 허용
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )

# 라우터 등록
app.include_router(auth_router, prefix="/api/py/auth")

# DB 테이블 생성 (지연 초기화)
def init_database():
    try:
        models.Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database initialization delayed: {e}")

# 앱 시작 시 데이터베이스 초기화 시도
@app.on_event("startup")
async def startup_event():
    init_database()

# 차트 분석 서비스 인스턴스 생성
analytics_service = HealthAnalyticsService()

# GPT 기능 활성화 플래그
USE_GPT = os.getenv("OPENAI_API_KEY") is not None

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

# 🚩 [운동 기록 추출 프롬프트] - 사용자 요구사항에 맞게 수정
EXERCISE_EXTRACTION_PROMPT = """
당신은 LifeBit의 운동 기록 AI 어시스턴트입니다.
사용자와 친근하고 자연스러운 대화를 통해 운동 정보를 정확히 수집하고 정리하는 역할을 합니다.

🎯 **진행 순서: extraction → validation → confirmation**

📋 **수집할 필수 정보:**
[기구 근력운동]
- 운동명 (exercise) ✅ 필수
- 분류 (category): "근력운동" ✅ 자체 판단
- 중분류 (subcategory): "가슴", "등", "하체", "복근", "팔", "어깨" ✅ 자체 판단  
- 무게 (weight) ✅ 필수
- 세트 (sets) ✅ 필수
- 횟수 (reps) ✅ 필수

[맨몸 근력운동]
- 운동명 (exercise) ✅ 필수
- 분류 (category): "근력운동" ✅ 자체 판단
- 중분류 (subcategory): "가슴", "등", "하체", "복근", "팔", "어깨" ✅ 자체 판단
- 세트 (sets) ✅ 필수
- 횟수 (reps) ✅ 필수
- 무게: 사용자 프로필의 몸무게 자동 적용 (사용자가 수정 가능)

[유산소 운동]
- 운동명 (exercise) ✅ 필수
- 분류 (category): "유산소운동" ✅ 자체 판단
- 중분류 (subcategory): "유산소운동" ✅ 자체 판단
- 운동시간 (duration_min) ✅ 필수

🔍 **운동 분류 자동 판단 규칙:**
[근력운동 - 가슴]: 벤치프레스, 푸시업, 체스트프레스, 딥스, 플라이, 체스트플라이
[근력운동 - 등]: 풀업, 랫풀다운, 바벨로우, 시티드로우, 데드리프트, 철봉
[근력운동 - 하체]: 스쿼트, 레그프레스, 런지, 레그컬, 레그익스텐션, 칼프레이즈
[근력운동 - 어깨]: 숄더프레스, 사이드레이즈, 프론트레이즈, 리어델트플라이
[근력운동 - 팔]: 바이셉스컬, 트라이셉스, 해머컬, 딥스, 이두컬, 삼두컬
[근력운동 - 복근]: 크런치, 플랭크, 레그레이즈, 싯업, 플라잭

[유산소운동]: 달리기, 조깅, 워킹, 걷기, 수영, 자전거, 사이클링, 줄넘기, 등산, 하이킹, 트레드밀, 런닝머신, 일립티컬

💬 **응답 형식 (JSON):**
{
  "response_type": "extraction|validation|confirmation",
  "system_message": {
    "data": {
      "exercise": "운동명",
      "category": "근력운동|유산소운동",
      "subcategory": "가슴|등|하체|복근|팔|어깨|유산소운동|null",
      "weight": 무게|null,
      "sets": 세트수|null,
      "reps": 횟수|null,
      "duration_min": 시간|null,
      "is_bodyweight": true|false
    },
    "missing_fields": ["누락된_필드들"],
    "next_step": "validation|confirmation"
  },
  "user_message": {
    "text": "사용자에게 보여줄 친근한 메시지"
  }
}

🔄 **진행 조건:**
- 모든 필수 정보 수집 완료 → 바로 confirmation 단계로
- 일부 정보 누락 → validation 단계로

📝 **대화 예시:**
사용자: "벤치프레스 60kg 3세트 10회 했어요"
AI: "벤치프레스 운동 기록이 완료되었습니다! 💪

✅ 운동명: 벤치프레스
💪 분류: 근력운동 (가슴)
🏋️ 무게: 60kg
🔢 세트: 3세트
🔄 횟수: 10회

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '아니오'라고 해주세요!"
"""

# 🚩 [운동 기록 검증 프롬프트] - 사용자 요구사항에 맞게 수정
EXERCISE_VALIDATION_PROMPT = """
당신은 LifeBit의 운동 기록 검증 도우미입니다.
누락된 필수 정보를 한 번에 하나씩만 질문하여 수집합니다.

📋 **필수 정보 검증 규칙:**
[기구 근력운동] 운동명, 무게, 세트, 횟수
[맨몸 근력운동] 운동명, 세트, 횟수
[유산소 운동] 운동명, 운동시간 (2가지 만)

💬 **응답 형식:**
{
  "response_type": "validation",
  "system_message": {
    "data": {현재까지_수집된_데이터},
    "missing_fields": ["다음에_물어볼_필드"],
    "next_step": "validation|confirmation"
  },
  "user_message": {
    "text": "친근한 질문 메시지 (한 번에 하나씩만)"
  }
}

🎯 **질문 예시:**
- weight: "몇 kg으로 하셨나요? 💪"
- sets: "몇 세트 하셨어요? 🔢"
- reps: "한 세트에 몇 회씩 하셨나요? 🔄"
- duration_min: "몇 분 동안 운동하셨나요? ⏱️"

⚠️ **중요 규칙:**
- 한 번에 하나의 필드만 질문
- 모든 필수 정보 수집 완료 시 confirmation 단계로 이동
- 유산소 운동에서는 무게/세트/횟수/ 중분류를 묻지 않음
"""

# 🚩 [운동 기록 확인 프롬프트] - 사용자 요구사항에 맞게 수정
EXERCISE_CONFIRMATION_PROMPT = """
당신은 LifeBit의 운동 기록 확인 도우미입니다.
수집된 정보를 사용자에게 최종 확인받습니다.

💬 **응답 형식:**
{
  "response_type": "confirmation",
  "system_message": {
    "data": {
      "exercise": "운동명",
      "category": "근력운동|유산소운동",
      "subcategory": "부위|null",
      "weight": 무게|null,
      "sets": 세트|null,
      "reps": 횟수|null,
      "duration_min": 시간|null,
      "is_bodyweight": true|false
    },
    "next_step": "complete"
  },
  "user_message": {
    "text": "운동 기록 확인 메시지와 정보 표시"
  }
}

📝 **표시 형식:**
[기구 근력운동]
"✅ 운동명: 벤치프레스
💪 분류: 근력운동 (가슴)
🏋️ 무게: 60kg
🔢 세트: 3세트
🔄 횟수: 10회

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '아니오'라고 해주세요!"

[유산소 운동]
"✅ 운동명: 달리기
🏃 분류: 유산소운동
⏱️ 운동시간: 30분

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '아니오'라고 해주세요!"

[맨몸 운동]
"✅ 운동명: 푸시업
💪 분류: 근력운동 (가슴, 맨몸)
🔢 세트: 3세트
🔄 횟수: 15회

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '아니오'라고 해주세요!"
"""

# 🚩 [식단 기록 추출 프롬프트] - 사용자 요구사항에 맞게 수정 (영양성분 계산 포함)
DIET_EXTRACTION_PROMPT = """
당신은 LifeBit의 식단 기록 AI 어시스턴트입니다.
사용자와 친근하고 자연스러운 대화를 통해 식단 정보를 정확히 수집합니다.

[중요]
- 사용자가 한 문장에 여러 음식을 언급하면, parsed_data는 각 음식을 별도의 객체로 갖는 배열(array)로 반환하세요.
- 음식이 하나만 언급된 경우에도 parsed_data는 한 개의 객체를 가진 배열로 반환하세요.
- 예시:
  User: "아침에 식빵 1개와 계란후라이 2개 먹었어요"
  parsed_data: [
    { "food_name": "식빵", "amount": "1개", "meal_time": "아침" },
    { "food_name": "계란후라이", "amount": "2개", "meal_time": "아침" }
  ]
- 여러 음식 정보를 하나의 객체로 합치지 마세요. 반드시 각 음식마다 별도의 객체로 배열에 담아 반환하세요.

🎯 **진행 순서: extraction → validation → confirmation**

📋 **수집할 필수 정보 (3가지만):**
- 음식명 (food_name) ✅ 필수
- 섭취량 (amount) ✅ 필수 (자체 판단하여 1인분, 1개, 1공기 등으로 표현)
- 식사시간 (meal_time) ✅ 필수 ("아침", "점심", "저녁", "야식", "간식" 중 하나)

🍽️ **섭취량 자체 판단 가이드:**
- 밥류: "1공기", "반공기", "2공기"
- 과일: "1개", "2개", "반개"
- 계란: "1개", "2개"
- 일반 음식: "1인분", "반인분", "2인분"
- 액체: "1컵", "200ml", "500ml"

⏰ **식사시간 분류:**
- 아침: 사용자가 "아침" 언급 또는 오전 시간대
- 점심: 사용자가 "점심" 언급 또는 낮 시간대
- 저녁: 사용자가 "저녁" 언급 또는 저녁 시간대
- 야식: 사용자가 "야식" 명시적 언급
- 간식: 위에 해당하지 않는 경우 또는 "간식" 언급

💬 **응답 형식 (JSON):**
{
  "response_type": "extraction|validation|confirmation",
  "system_message": {
    "data": [
      { "food_name": "음식명", "amount": "섭취량", "meal_time": "아침|점심|저녁|야식|간식" },
      ...
    ],
    "missing_fields": ["누락된_필드들"],
    "next_step": "validation|confirmation"
  },
  "user_message": {
    "text": "사용자에게 보여줄 친근한 메시지"
  }
}

⚠️ **중요사항:**
- 영양성분(칼로리, 탄수화물, 단백질, 지방)은 자동으로 계산됩니다
- 기본 3가지 정보(음식명, 섭취량, 식사시간)만 수집합니다
- 데이터베이스에 없는 음식은 인터넷에서 영양정보를 검색하여 자동 생성됩니다

🔄 **진행 조건:**
- 모든 필수 정보 수집 완료 → 바로 confirmation 단계로
- 일부 정보 누락 → validation 단계로

📝 **대화 예시:**
사용자: "아침에 계란 2개 먹었어요"
AI: "아침 식사 기록이 완료되었습니다! 🥚

✅ 음식명: 계란
📏 섭취량: 2개
⏰ 식사시간: 아침

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '아니오'라고 해주세요!"
"""

# 🚩 [식단 기록 확인 프롬프트] - 사용자 요구사항에 맞게 수정 (영양성분 표시 포함)
DIET_CONFIRMATION_PROMPT = """
당신은 LifeBit의 식단 기록 확인 도우미입니다.
수집된 정보를 사용자에게 최종 확인받습니다.

💬 **응답 형식:**
{
  "response_type": "confirmation",
  "system_message": {
    "data": {
      "food_name": "음식명",
      "amount": "섭취량",
      "meal_time": "아침|점심|저녁|야식|간식"
    },
    "next_step": "complete"
  },
  "user_message": {
    "text": "식단 기록 확인 메시지와 정보 표시"
  }
}

📝 **표시 형식:**
"✅ 음식명: 계란
📏 섭취량: 2개
⏰ 식사시간: 아침

이 정보가 맞나요? 맞으면 '저장', 수정이 필요하면 '수정'라고 해주세요!"

⚠️ **중요 사항:**
- 섭취량은 반드시 g 또는 ml 단위로 표시
- 영양 정보는 GPT 기반으로 자동 계산됩니다
- 데이터베이스에 없는 음식은 인터넷에서 검색하여 자동 생성됩니다
- 확인 후 저장 진행
"""

# 🚩 [식단 기록 검증 프롬프트] - 사용자 요구사항에 맞게 수정
DIET_VALIDATION_PROMPT = """
당신은 LifeBit의 식단 기록 검증 도우미입니다.
누락된 필수 정보를 한 번에 하나씩만 질문하여 수집합니다.

📋 **필수 정보 검증 규칙:**
- 음식명 (food_name) ✅ 필수
- 섭취량 (amount) ✅ 필수
- 식사시간 (meal_time) ✅ 필수

💬 **응답 형식:**
{
  "response_type": "validation",
  "system_message": {
    "data": {현재까지_수집된_데이터},
    "missing_fields": ["다음에_물어볼_필드"],
    "next_step": "validation|confirmation"
  },
  "user_message": {
    "text": "친근한 질문 메시지 (한 번에 하나씩만)"
  }
}

🎯 **질문 예시:**
- food_name: "어떤 음식을 드셨나요? 🍽️"
- amount: "어느 정도 양을 드셨나요? (예: 1개, 1인분, 1공기) 📏"
- meal_time: "언제 드셨나요? (아침/점심/저녁/야식/간식) ⏰"

⚠️ **중요 규칙:**
- 한 번에 하나의 필드만 질문
- 모든 필수 정보 수집 완료 시 confirmation 단계로 이동
- 3가지 정보가 모두 충족될 때까지 반복 질문
- 영양 정보는 자동으로 계산되므로 사용자에게 묻지 않습니다
"""

# 채팅 요청을 위한 스키마
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []
    record_type: Optional[str] = None  # "exercise" or "diet" or None
    chat_step: Optional[str] = None
    current_data: Optional[dict] = None  # 현재 수집된 데이터
    meal_time_mapping: Optional[dict] = None  # 식단 시간 매핑
    user_id: Optional[int] = None  # 사용자 ID 추가 

# 차트 분석 요청을 위한 스키마
class AnalyticsRequest(BaseModel):
    user_id: int
    period: str = "month"  # day, week, month, year

# 헬스 체크 엔드포인트
@app.get("/api/py/health")
def health_check():
    return {"status": "OK", "service": "LifeBit AI-API"}

# 간단한 헬스 체크 엔드포인트 (Docker healthcheck용)
@app.get("/health")
def simple_health_check():
    return {"status": "OK", "service": "LifeBit AI-API"}

# 🚀 새로 추가: 건강 데이터 종합 분석 엔드포인트
@app.post("/api/py/analytics/health-report")
async def generate_health_analytics_report(request: AnalyticsRequest):
    """건강 데이터 종합 분석 리포트 생성"""
    try:
        analytics_service = HealthAnalyticsService()
        
        # 종합 리포트 생성 (period 매개변수 전달)
        report = await analytics_service.generate_comprehensive_report(request.user_id, request.period)
        
        return {
            "status": "success",
            "report": report,
            "period": request.period,
            "user_id": request.user_id,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"[ERROR] 건강 리포트 생성 실패: {str(e)}")
        return {
            "status": "error", 
            "message": f"건강 리포트 생성 중 오류가 발생했습니다: {str(e)}",
            "period": request.period,
            "user_id": request.user_id
        }

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
    """운동 패턴 분석 엔드포인트"""
    try:
        analytics_service = HealthAnalyticsService()
        
        # 건강 데이터 조회 (period 매개변수 사용)
        health_data = await analytics_service.fetch_health_data(request.user_id, request.period)
        
        # 운동 패턴 분석 (period 매개변수 전달)
        analysis = analytics_service.analyze_exercise_patterns(
            health_data.get('exercise_sessions', []), 
            request.period
        )
        
        return {
            "status": "success",
            "data": analysis,
            "period": request.period,
            "user_id": request.user_id
        }
        
    except Exception as e:
        print(f"[ERROR] 운동 패턴 분석 실패: {str(e)}")
        return {
            "status": "error",
            "message": f"운동 패턴 분석 중 오류가 발생했습니다: {str(e)}",
            "period": request.period,
            "user_id": request.user_id
        }

# 🚀 AI 기반 건강 조언 엔드포인트
@app.post("/api/py/analytics/ai-insights")
async def get_ai_health_insights(request: AnalyticsRequest):
    """AI 기반 개인화된 건강 인사이트 제공"""
    try:
        analytics_service = HealthAnalyticsService()
        
        # 건강 데이터 조회
        health_data = await analytics_service.fetch_health_data(request.user_id, request.period)
        
        # AI 인사이트 생성
        insights = analytics_service.generate_ai_insights(
            health_data.get('health_records', []),
            health_data.get('exercise_sessions', [])
        )
        
        return {
            "status": "success",
            "insights": insights,
            "period": request.period,
            "user_id": request.user_id
        }
        
    except Exception as e:
        print(f"[ERROR] AI 인사이트 생성 실패: {str(e)}")
        return {
            "status": "error",
            "message": f"AI 인사이트 생성 중 오류가 발생했습니다: {str(e)}",
            "period": request.period,
            "user_id": request.user_id
        }

# 음성 업로드 → Whisper + GPT + 기록 저장
@app.post("/api/py/voice")
async def process_voice(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        # Whisper로 음성 변환
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(await file.read())
            temp_path = tmp.name

        with open(temp_path, "rb") as f:
            transcript = openai.Audio.transcribe("whisper-1", f)  # type: ignore

        user_text = transcript.get("text", "") if hasattr(transcript, 'get') else str(transcript)  # type: ignore
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
            extraction_response = openai.ChatCompletion.create(  # type: ignore
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": extraction_prompt},
                    {"role": "user", "content": user_text}
                ],
                temperature=0.3
            )

            parsed_data = json.loads(extraction_response.choices[0].message["content"])  # type: ignore
            print("[INFO] GPT 파싱 결과:", json.dumps(parsed_data, indent=2, ensure_ascii=False))

            # 2. 데이터 검증
            validation_response = openai.ChatCompletion.create(  # type: ignore
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": validation_prompt},
                    {"role": "user", "content": json.dumps(parsed_data)}
                ],
                temperature=0.3
            )

            validation_result = json.loads(validation_response.choices[0].message["content"])  # type: ignore

            # 3. 데이터가 완전한 경우에만 확인 단계로 진행
            # --- 아래 블록은 미완성/불필요 코드이므로 주석 처리 (linter 에러 방지) ---
            '''
            if validation_result.get("status") == "complete":
                confirmation_response = openai.ChatCompletion.create(  # type: ignore
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": confirmation_prompt},
                        {"role": "user", "content": json.dumps(parsed_data)}
                    ],
                    temperature=0.3
                )

                confirmation_text = confirmation_response.choices[0].message["content"]

                # 🚀 [핵심 로직] confirmation 단계에서 "네" 응답 시 실제 DB 저장 실행
                response_type = parsed_response.get("response_type", "success")
                
                # Always ensure parsed_data is an array for diet records
                parsed_data = parsed_response.get("system_message", {}).get("data")
                if record_type == "diet":
                    if parsed_data:
                        if isinstance(parsed_data, dict):
                            parsed_data = [parsed_data]
                        elif not isinstance(parsed_data, list):
                            parsed_data = [parsed_data]
                    else:
                        parsed_data = []
                
                if (response_type == "confirmation" and 
                    request.message.strip().lower() in ["네", "yes", "y", "저장", "기록해줘", "완료", "끝"] and 
                    request.current_data and 
                    request.record_type):
                    
                    print(f"[🚀 AUTO-SAVE] 확인 응답 받음 → 실제 DB 저장 시작")
                    print(f"  기록 타입: {request.record_type}")
                    print(f"  수집된 데이터: {request.current_data}")
                    
                    try:
                        if request.record_type == "diet":
                            # 🍽️ 식단 자동 저장
                            # user_id 우선순위: request.user_id > current_data.user_id > 기본값 3
                            user_id = (request.user_id or 
                                      request.current_data.get("user_id") or 
                                      3)
                            user_id = int(user_id)
                            
                            # 여러 음식이 있는 경우 각각 저장
                            foods_to_save = parsed_data if isinstance(parsed_data, list) else [parsed_data]
                            saved_results = []
                            
                            for food_data in foods_to_save:
                                if not food_data or not food_data.get("food_name"):
                                    continue
                                    
                                # GPT를 사용하여 그램 수 추정
                                amount_str = food_data.get("amount", "1개")
                                estimated_grams = estimate_grams_from_korean_amount(food_data["food_name"], amount_str)
                                
                                # 식사시간 변환
                                meal_time_mapping = {
                                    "아침": "breakfast",
                                    "점심": "lunch", 
                                    "저녁": "dinner",
                                    "야식": "snack",
                                    "간식": "snack"
                                }
                                meal_time_eng = meal_time_mapping.get(food_data.get("meal_time", "간식"), "snack")
                                
                                # note_routes.py의 save_diet_record 사용
                                from note_routes import save_diet_record
                                from schemas import MealInput
                                
                                meal_input = MealInput(
                                    user_id=user_id,
                                    food_name=food_data["food_name"],
                                    quantity=estimated_grams,
                                    meal_time=meal_time_eng,
                                    log_date=date.today()
                                )
                                
                                # DB 객체 생성 (FastAPI의 Depends와 동일한 방식)
                                from database import SessionLocal
                                db = SessionLocal()
                                
                                try:
                                    save_result = save_diet_record(meal_input, db)
                                    saved_results.append(save_result)
                                    print(f"[✅ SUCCESS] 음식 저장 완료: {food_data['food_name']}")
                                finally:
                                    db.close()
                                
                            # 저장 결과 요약 메시지 생성
                            if saved_results:
                                food_names = [food.get("food_name", "알 수 없는 음식") for food in foods_to_save if food]
                                food_list = ", ".join(food_names)
                                
                                return {
                                    "type": "saved",
                                    "message": f"✅ 식단 기록이 성공적으로 저장되었습니다!\n\n📋 저장된 음식:\n• {food_list}\n\n영양정보는 자동으로 계산되어 데이터베이스에 저장되었습니다.",
                                    "parsed_data": request.current_data,
                                    "save_results": saved_results,
                                    "missing_fields": [],
                                    "suggestions": []
                                }
                            else:
                                return {
                                    "type": "save_error",
                                    "message": "저장할 음식 정보가 없습니다.",
                                    "parsed_data": request.current_data,
                                    "missing_fields": [],
                                    "suggestions": []
                                }
                                
                        elif request.record_type == "exercise":
                            # 🏋️ 운동 자동 저장 (향후 구현)
                            print(f"[INFO] 운동 자동 저장은 향후 구현 예정")
                            
                    except Exception as save_error:
                        print(f"[❌ ERROR] 자동 저장 실패: {save_error}")
                        return {
                            "type": "save_error",
                            "message": f"저장 중 오류가 발생했습니다: {str(save_error)}\n다시 시도해 주세요.",
                            "parsed_data": request.current_data,
                            "missing_fields": [],
                            "suggestions": []
                        }
            
            # 일반적인 응답 (저장하지 않는 경우)
            return {
                "type": parsed_response.get("response_type", "success"),
                "message": parsed_response.get("user_message", {}).get("text", "응답을 처리했습니다."),
                "parsed_data": parsed_data,
                "record_type": record_type,
                "suggestions": []
            }
            '''
        else:
            # GPT 비활성화 상태
            return {"type": "error", "message": "GPT 기능이 비활성화되어 있습니다."}

    except Exception as e:
        print(f"[ERROR] Voice processing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"음성 처리 중 오류가 발생했습니다: {e}"
        )

def determine_chat_step_automatically(message: str, current_data: dict, record_type: str) -> str:
    """
    사용자 요구사항에 맞게 extraction → validation → confirmation 단계를 자동 판단합니다.
    """
    # 확인 키워드가 있으면 저장 또는 완료
    confirmation_keywords = ["네", "맞아요", "저장", "기록", "완료", "끝", "ok", "yes"]
    if any(keyword in message.lower() for keyword in confirmation_keywords):
        return "confirmation"
    
    # 수정 키워드가 있으면 validation으로 돌아감
    modification_keywords = ["아니오", "수정", "바꿔", "아니야", "틀려", "no"]
    if any(keyword in message.lower() for keyword in modification_keywords):
        return "validation"
    
    # 현재 데이터가 없거나 비어있으면 extraction
    if not current_data or current_data == {}:
        return "extraction"
    
    if record_type == "exercise":
        exercise = current_data.get("exercise", "").lower()
        
        # 운동 분류 자동 판단
        cardio_keywords = ["달리기", "조깅", "워킹", "걷기", "수영", "자전거", "사이클링", "줄넘기", "등산", "하이킹", "트레드밀", "런닝머신", "일립티컬"]
        is_cardio = any(keyword in exercise for keyword in cardio_keywords)
        
        bodyweight_keywords = ["푸시업", "풀업", "플랭크", "크런치", "싯업", "버피"]
        is_bodyweight = any(keyword in exercise for keyword in bodyweight_keywords)
        
        if is_cardio:
            # 유산소 운동: 운동명, 운동시간
            required_fields = ["exercise", "duration_min"]
        elif is_bodyweight:
            # 맨몸 근력운동: 운동명, 세트, 횟수
            required_fields = ["exercise", "sets", "reps"]
        else:
            # 기구 근력운동: 운동명, 무게, 세트, 횟수
            required_fields = ["exercise", "weight", "sets", "reps"]
        
        missing_fields = [field for field in required_fields if not current_data.get(field)]
        
        # 모든 필수 정보가 있으면 confirmation, 누락이 있으면 validation
        return "confirmation" if not missing_fields else "validation"
    
    elif record_type == "diet":
        # 식단 기록: 음식명, 섭취량, 식사시간 (3가지 필수 정보)
        required_fields = ["food_name", "amount", "meal_time"]
        missing_fields = [field for field in required_fields if not current_data.get(field)]
        
        # 모든 필수 정보가 있으면 confirmation, 누락이 있으면 validation
        return "confirmation" if not missing_fields else "validation"
    
    return "extraction"

def is_bodyweight_exercise(exercise_name: str) -> bool:
    """맨몸 운동 여부 판단"""
    bodyweight_exercises = ["푸시업", "풀업", "플랭크", "크런치", "싯업", "버피"]
    return any(ex in exercise_name.lower() for ex in bodyweight_exercises)

@app.post("/api/py/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
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

            # 자동으로 단계 판단
            auto_step = determine_chat_step_automatically(
                request.message, 
                request.current_data or {}, 
                request.record_type
            )
            
            # 자동 판단된 단계로 프롬프트 선택
            if request.record_type == "exercise":
                if auto_step == "validation":
                    system_prompt = EXERCISE_VALIDATION_PROMPT
                elif auto_step == "confirmation":
                    system_prompt = EXERCISE_CONFIRMATION_PROMPT
                else:
                    system_prompt = EXERCISE_EXTRACTION_PROMPT
            else:
                if auto_step == "validation":
                    system_prompt = DIET_VALIDATION_PROMPT
                elif auto_step == "confirmation":
                    system_prompt = DIET_CONFIRMATION_PROMPT
                else:
                    system_prompt = DIET_EXTRACTION_PROMPT
            
            # 디버깅 로그 추가
            print(f"[DEBUG] 받은 current_data: {request.current_data}")
            print(f"[DEBUG] 자동 판단된 단계: {auto_step}")
            
            # 현재 데이터를 프롬프트에 포함
            if request.current_data and request.current_data != {}:
                current_data_str = f"\n\n**현재 수집된 데이터:**\n{json.dumps(request.current_data, ensure_ascii=False, indent=2)}"
                system_prompt = system_prompt + current_data_str
                print(f"[DEBUG] 프롬프트에 current_data 추가됨")

            # GPT 호출 메시지 구성
            messages = [
                {"role": "system", "content": system_prompt},
                *((request.conversation_history or [])[-5:]), # 이전 대화기록 불러오기
                {"role": "user", "content": request.message}
            ]

            # ChatCompletion API 실행
            response = openai.ChatCompletion.create(  # type: ignore
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3
            )

            # 응답 JSON 파싱
            raw = response.choices[0].message["content"]  # type: ignore
            
            try:
                # JSON 응답인지 확인하고 파싱
                if raw.strip().startswith('{') and raw.strip().endswith('}'):
                    parsed_response = json.loads(raw)
                    
                    # 운동 기록인 경우 칼로리 소모량 자동 계산 적용
                    if request.record_type == "exercise" and parsed_response.get("system_message", {}).get("data"):
                        data = parsed_response["system_message"]["data"]
                        
                        # 운동 정보가 충분하면 칼로리 소모량 계산
                        if data.get("exercise"):
                            calories_burned = calculate_exercise_calories_from_gpt(data)
                            data["calories_burned"] = calories_burned
                    
                    # 🚀 [핵심 로직] confirmation 단계에서 "네" 응답 시 실제 DB 저장 실행
                    response_type = parsed_response.get("response_type", "success")
                    user_message = request.message.strip()
                    if request.record_type == "exercise" and response_type == "confirmation":
                        # 사용자가 "네"라고 답하면 저장
                        if user_message in ["네", "예", "저장", "ㅇ", "y", "yes", "Y", "YES"]:
                            data = parsed_response["system_message"]["data"]
                            # user_id가 None일 경우 예외 처리
                            user_id = request.user_id if request.user_id is not None else data.get("user_id")
                            if user_id is None:
                                raise HTTPException(status_code=400, detail="user_id가 필요합니다.")
                            user_id = int(user_id)
                            # ExerciseRecord로 변환
                            record = ExerciseRecord(
                                user_id=user_id,
                                name=data.get("exercise"),
                                weight=data.get("weight"),
                                sets=data.get("sets"),
                                reps=data.get("reps"),
                                duration_minutes=data.get("duration_min"),
                                calories_burned=data.get("calories_burned"),
                                exercise_date=request.current_data.get("exercise_date") if request.current_data else None
                            )
                            # 카탈로그 자동 생성/조회 및 저장
                            category = getattr(record, 'category', None)
                            subcategory = getattr(record, 'subcategory', None)
                            catalog = get_or_create_exercise_catalog(db, record.name, category, subcategory, None)
                            sets = record.sets
                            reps = record.reps
                            weight = record.weight
                            if catalog and getattr(catalog, 'body_part', None) == 'cardio':
                                sets = 1
                                reps = None
                                weight = None
                            exercise = models.ExerciseSession(
                                user_id=record.user_id,
                                exercise_catalog_id=getattr(catalog, 'exercise_catalog_id', None),
                                notes=record.name,
                                weight=weight,
                                sets=sets,
                                reps=reps,
                                duration_minutes=record.duration_minutes,
                                calories_burned=record.calories_burned,
                                exercise_date=record.exercise_date
                            )
                            db.add(exercise)
                            db.commit()
                            db.refresh(exercise)
                            return {
                                "type": "save_success",
                                "message": f"운동 기록 저장 성공! (ID: {exercise.exercise_session_id})",
                                "id": exercise.exercise_session_id
                            }
                    
                    # 일반적인 응답 (저장하지 않는 경우)
                    return {
                        "type": parsed_response.get("response_type", "success"),
                        "message": parsed_response.get("user_message", {}).get("text", "응답을 처리했습니다."),
                        "parsed_data": parsed_response.get("system_message", {}).get("data"),
                        "missing_fields": parsed_response.get("system_message", {}).get("missing_fields", []),
                        "suggestions": []
                    }
                else:
                    # 일반 텍스트 응답
                    return {
                        "type": "incomplete",
                        "message": raw,
                        "suggestions": []
                    }
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 텍스트로 처리
                return {
                    "type": "incomplete",
                    "message": raw,
                    "suggestions": []
                }
        else:
            # GPT 비활성화 상태
            return {"type": "error", "message": "GPT 기능이 비활성화되어 있습니다."}

    except Exception as e:
        print(f"[ERROR] Chat error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"채팅 처리 중 오류가 발생했습니다: {e}"
        )

# --- ExerciseCatalog 자동 조회/생성 함수 ---
def get_or_create_exercise_catalog(db, name, category=None, subcategory=None, description=None):
    """
    운동명, 분류, 부위 등으로 ExerciseCatalog를 조회하거나 없으면 생성
    (AI 분석 결과만 사용, 하드코딩/키워드 매핑 없음)
    """
    normalized_name = normalize_exercise_name(name)
    # body_part는 반드시 AI에서 subcategory로 전달, 없으면 에러
    if not subcategory:
        raise HTTPException(status_code=400, detail="운동 부위(subcategory)가 누락되었습니다. AI 분석 결과를 확인하세요.")
    # 한글 → 영문 Enum 변환 (LifeBit.sql body_part_type 참고)
    mapping = {
        '가슴': 'chest', '등': 'back', '하체': 'legs', '어깨': 'shoulders',
        '팔': 'arms', '복근': 'abs', '유산소': 'cardio', '전신': 'full_body'
    }
    body_part = mapping.get(subcategory, None)
    if not body_part:
        raise HTTPException(status_code=400, detail=f"알 수 없는 운동 부위(subcategory): {subcategory}")
    # DB에서 이름+부위로 조회
    catalog = db.query(models.ExerciseCatalog).filter(
        models.ExerciseCatalog.name == normalized_name,
        models.ExerciseCatalog.body_part == body_part
    ).first()
    if catalog:
        return catalog
    # 없으면 생성
    catalog = models.ExerciseCatalog(
        name=normalized_name,
        exercise_type=category or None,
        body_part=body_part,
        description=description or None
    )
    db.add(catalog)
    db.commit()
    db.refresh(catalog)
    return catalog

# 🏋️‍♂️ 운동 기록 저장 (Chat 기반)
@app.post("/api/py/note/exercise")
def save_exercise_record(data: ExerciseRecord, db: Session = Depends(get_db)):
    # AI에서 운동명, 분류, 부위 등 전달받음 (하드코딩/키워드 매핑 없음)
    catalog = None
    if hasattr(data, 'exercise_catalog_id') and data.exercise_catalog_id:
        catalog = db.query(models.ExerciseCatalog).filter(
            models.ExerciseCatalog.exercise_catalog_id == data.exercise_catalog_id
        ).first()
    else:
        # name, category, subcategory, description 활용 (AI 분석 결과만)
        name = getattr(data, 'name', None)
        category = getattr(data, 'category', None)
        subcategory = getattr(data, 'subcategory', None)
        description = getattr(data, 'description', None)
        if name and subcategory:
            catalog = get_or_create_exercise_catalog(db, name, category, subcategory, description)
        else:
            raise HTTPException(status_code=400, detail="운동명(name) 또는 부위(subcategory)가 누락되었습니다. AI 분석 결과를 확인하세요.")
    # 하드코딩 분기 없이 AI가 넘긴 값만 그대로 저장
    exercise = models.ExerciseSession(
        user_id=data.user_id,
        exercise_catalog_id=getattr(catalog, 'exercise_catalog_id', None),
        notes=data.name,
        weight=data.weight,
        sets=data.sets,
        reps=data.reps,
        duration_minutes=data.duration_minutes,
        calories_burned=data.calories_burned,
        exercise_date=data.exercise_date
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return {"message": "운동 기록 저장 성공", "id": exercise.exercise_session_id}

# 🍽️ 식단 기록 저장 (Chat 기반) - COMMENTED OUT: Use note_routes.py instead
# class DietRecord(BaseModel):
#     user_id: int
#     food_name: str
#     amount: str  # 섭취량 (예: "5개", "100g", "1그릇")
#     meal_time: str  # "아침|점심|저녁|야식|간식"
# @app.post("/api/py/note/diet")
# def save_diet_record(data: DietRecord, db: Session = Depends(get_db)):

# ✅ 오늘 날짜 운동 기록 조회
@app.get("/api/py/note/exercise/daily", response_model=list[DailyExerciseRecord])
def get_today_exercise(user_id: int, date: Optional[date] = date.today(), db: Session = Depends(get_db)):
    records = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.user_id == user_id,
        models.ExerciseSession.exercise_date == date
    ).all()

    results = []
    for record in records:
        results.append(DailyExerciseRecord(
            exercise_session_id=int(record.exercise_session_id),  # type: ignore
            name=str(record.notes) if record.notes is not None else "운동",  # type: ignore
            weight=f"{record.weight}kg" if record.weight is not None else "체중",  # type: ignore
            sets=int(record.sets) if record.sets is not None else 1,  # type: ignore
            reps=int(record.reps) if record.reps is not None else 1,  # type: ignore
            time=f"{record.duration_minutes}분" if record.duration_minutes is not None else "0분"  # type: ignore
        ))

    return results

# 🧪 식단 저장 로직 테스트용 API
@app.post("/api/py/test/diet-save")
def test_diet_save(db: Session = Depends(get_db)):
    """새로운 식단 저장 로직을 테스트합니다."""
    from schemas import MealInput
    
    test_data = MealInput(
        user_id=2,  # 테스트 사용자
        food_name="말린 살구",  # DB에 없는 음식으로 테스트
        quantity=50.0,  # 50g
        meal_time="snack",
        log_date=date.today()
    )
    
    try:
        from note_routes import save_diet_record
        result = save_diet_record(test_data, db)
        return {
            "test_status": "SUCCESS",
            "message": "식단 저장 로직 테스트 완료",
            "result": result
        }
    except Exception as e:
        return {
            "test_status": "FAILED", 
            "error": str(e)
        }

# 📋 오늘 식단 기록 조회 API  
@app.get("/api/py/note/diet/daily")
def get_today_diet(user_id: int, target_date: Optional[str] = None, db: Session = Depends(get_db)):
    """사용자의 오늘 식단 기록을 조회합니다."""
    if target_date:
        query_date = date.fromisoformat(target_date)
    else:
        query_date = date.today()
    
    records = db.query(models.MealLog).filter(
        models.MealLog.user_id == user_id,
        models.MealLog.log_date == query_date
    ).all()
    
    results = []
    for record in records:
        # food_item 정보도 함께 조회
        food_item = db.query(models.FoodItem).filter(
            models.FoodItem.food_item_id == record.food_item_id
        ).first()
        
        results.append({
            "meal_log_id": record.meal_log_id,
            "food_item_id": record.food_item_id,
            "food_name": food_item.name if food_item else "Unknown",
            "quantity": float(record.quantity),  # type: ignore
            "meal_time": record.meal_time,
            "log_date": str(record.log_date),
            "nutrition": {
                "calories": float(record.calories) if record.calories else None,
                "carbs": float(record.carbs) if record.carbs else None,
                "protein": float(record.protein) if record.protein else None,
                "fat": float(record.fat) if record.fat else None
            },
            "created_at": str(record.created_at)
        })
    
    return {
        "user_id": user_id,
        "date": str(query_date),
        "total_records": len(results),
        "records": results
    }

# 🆕 GPT 기반 새로운 food_item 생성 API
@app.post("/api/py/food-items/create-from-gpt")
def create_food_item_from_gpt(food_name: str, db: Session = Depends(get_db)):
    """
    GPT를 사용하여 새로운 음식 아이템을 생성합니다.
    기존 DB에 없는 음식의 영양정보를 GPT로 계산하여 food_items 테이블에 추가합니다.
    """
    try:
        # 이미 존재하는지 확인
        existing_food = db.query(models.FoodItem).filter(
            models.FoodItem.name == food_name
        ).first()
        
        if existing_food:
            return {
                "message": "이미 존재하는 음식입니다",
                "food_item_id": existing_food.food_item_id,
                "food_name": existing_food.name
            }
        
        # note_routes.py의 enhanced nutrition calculation 사용
        from note_routes import calculate_nutrition_from_gpt_for_100g
        nutrition_data = calculate_nutrition_from_gpt_for_100g(food_name, db)
        
        # 새로운 food_item 생성
        new_food_item = models.FoodItem(
            name=food_name,
            serving_size=100.0,  # 기본 100g
            calories=nutrition_data['calories'],
            carbs=nutrition_data['carbs'],
            protein=nutrition_data['protein'],
            fat=nutrition_data['fat']
        )
        
        db.add(new_food_item)
        db.commit()
        db.refresh(new_food_item)
        
        print(f"[SUCCESS] 새로운 음식 아이템 생성: {food_name}")
        print(f"  Food Item ID: {new_food_item.food_item_id}")
        print(f"  칼로리: {nutrition_data['calories']}kcal/100g")
        print(f"  영양정보 출처: {nutrition_data.get('source', 'unknown')}")
        
        return {
            "message": "새로운 음식 아이템 생성 성공",
            "food_item_id": new_food_item.food_item_id,
            "food_name": new_food_item.name,
            "nutrition": nutrition_data
        }
        
    except Exception as e:
        print(f"[ERROR] 음식 아이템 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=f"음식 아이템 생성 실패: {e}")

# GPT 기반 칼로리 소모량 계산 함수 (운동용)
def calculate_exercise_calories_from_gpt(exercise_data: dict) -> float:
    """
    GPT를 사용하여 운동 데이터를 기반으로 칼로리 소모량을 계산합니다.
    """
    try:
        if exercise_data.get('category') == '유산소운동':
            # 유산소 운동 칼로리 계산
            duration = exercise_data.get('duration_min', 0)
            exercise_name = exercise_data.get('exercise', '')
            
            calories = duration * 7  # 기본 공식: 1분당 7kcal
            
            # 운동 강도에 따른 조정
            if any(keyword in exercise_name.lower() for keyword in ['달리기', '조깅', '런닝']):
                calories = duration * 10
            elif any(keyword in exercise_name.lower() for keyword in ['걷기', '워킹']):
                calories = duration * 4
            elif any(keyword in exercise_name.lower() for keyword in ['수영']):
                calories = duration * 12
            elif any(keyword in exercise_name.lower() for keyword in ['자전거', '사이클']):
                calories = duration * 8
                
        else:
            # 근력 운동 칼로리 계산
            weight = exercise_data.get('weight', 70)  # 기본 체중 70kg
            sets = exercise_data.get('sets', 1)
            reps = exercise_data.get('reps', 1)
            
            # 기본 공식: (무게 × 세트 × 횟수 × 0.05) + (운동시간 × 5)
            # 근력운동 시간 추정: 세트 × 2분
            estimated_duration = sets * 2
            calories = (weight * sets * reps * 0.05) + (estimated_duration * 5)
        
        calories = round(calories, 1)
        
        # 디버그 콘솔 출력 (운동 기록용)
        print(f"[DEBUG] 칼로리 소모량 계산 완료:")
        print(f"  운동명: {exercise_data.get('exercise', '')}")
        print(f"  분류: {exercise_data.get('category', '')}")
        if exercise_data.get('category') == '유산소운동':
            print(f"  운동시간: {exercise_data.get('duration_min', 0)}분")
        else:
            print(f"  무게: {exercise_data.get('weight', 0)}kg")
            print(f"  세트: {exercise_data.get('sets', 0)}세트")
            print(f"  횟수: {exercise_data.get('reps', 0)}회")
        print(f"  칼로리 소모: {calories}kcal")
        
        return calories
        
    except Exception as e:
        print(f"[ERROR] 칼로리 계산 실패: {e}")
        return 100.0  # 기본값

# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
