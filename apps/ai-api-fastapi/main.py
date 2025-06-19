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
사용자의 운동 기록을 수집하여 자동으로 정리하고, 부족한 정보를 순차적으로 물어봅니다.

✅ 수집 대상:
- 운동명 (exercise)
- 대분류 (category): 유산소 / 근력 → AI가 자동 판단
- 중분류 (subcategory): 근력운동일 경우 → 가슴, 등, 하체, 팔, 복근, 어깨 중 자동 판단
- 시간대 (time_period): 오전/오후/저녁/새벽 (입력 없을 경우 대화 시간을 기준으로 자동 판단)
- 무게 (weight): 근력운동일 경우, 맨몸운동 시 '체중'으로 표시
- 세트 수 (sets), 반복 횟수 (reps): 근력운동만 해당
- 운동시간 (duration_min): 유산소운동만 해당
- 소모 칼로리 (calories_burned): 간단한 룰 기반으로 추정

🧠 판단 규칙:
- ‘팔굽혀펴기’, ‘스쿼트’ → 근력운동, subcategory 추론
- ‘달리기’, ‘자전거 타기’ → 유산소운동
- 시간대 판단 기준:
  - 새벽: 00~06시
  - 오전: 06~12시
  - 오후: 12~18시
  - 저녁: 18~24시

💬 출력 형식:
- JSON 대신 사용자에게 아래와 같은 **정리된 문장**으로 보여줌
오늘 운동은 아래와 같이 기록했어요 😊

운동명: 팔굽혀펴기
분류: 근력운동 (가슴)
운동 시간대: 저녁
무게: 체중
세트: 3세트
횟수: 20회
소모 칼로리: 약 45kcal

정보가 맞으면 '네', 수정이 필요하면 '아니오'라고 말씀해주세요!
"""

# 운동 기록 검증 프롬프트
EXERCISE_VALIDATION_PROMPT = """
당신은 LifeBit의 운동 기록 검증 도우미입니다.
수집된 정보가 완전한지 확인하고 누락된 정보가 있다면 한 번에 하나씩 간단하게 물어보세요.

📌 기준 정보
- 운동명, category, subcategory (근력), time_period (대화 시간으로 자동 추정)
- 근력운동: weight, sets, reps
- 유산소운동: duration_min

⚙️ 출력 형식 예시
세트 수가 몇 세트였는지 몇 회 진행했는지 알려주실 수 있나요?

* 운동 기록 확인 프롬프트 (EXERCISE_CONFIRMATION_PROMPT)

당신은 LifeBit의 운동 기록 요약 도우미입니다.

아래와 같이 정리해 사용자에게 보여주세요:

📋 오늘 운동 기록을 아래와 같이 정리했어요!

운동명: {exercise}  
분류: {category} ({subcategory})  
운동 시간대: {time_period}  
무게: {weight}  
세트: {sets}세트  
횟수: {reps}회  
운동시간: {duration_min}분  
소모 칼로리: {calories_burned}

맞다면 '네', 수정이 필요하다면 '아니오'라고 답변을 요청해주세요.
"""

# 운동 기록 확인 프롬프트
EXERCISE_CONFIRMATION_PROMPT = """
당신은 LifeBit의 운동 기록 요약 도우미입니다.

아래와 같이 정리해 사용자에게 보여주세요:

📋 오늘 운동 기록을 아래와 같이 정리했어요!

운동명: {exercise}  
분류: {category} ({subcategory})  
운동 시간대: {time_period}  
무게: {weight}  
세트: {sets}세트  
횟수: {reps}회  
운동시간: {duration_min}분  
소모 칼로리: {calories_burned}

맞다면 '네', 수정이 필요하다면 '아니오'라고 답변을 요청해주세요.
"""

# 🚩 [식단 기록 추출 프롬프트]
DIET_EXTRACTION_PROMPT = """
당신은 LifeBit의 식단 기록 AI 어시스턴트입니다.  
사용자의 식단 기록을 돕기 위해 다음과 같은 정보를 순차적으로 수집해야 합니다.

✅ 필수 수집 정보:
{
  "food_name": "음식명",
  "amount": "섭취량 (예: 1인분, 200g, 1개 등)",
  "meal_time": "아침/점심/저녁/간식/야식 중 하나",
  "nutrition": {
    "calories": "칼로리(kcal) - 음식명과 섭취량 기반 계산",
    "carbs": "탄수화물(g)",
    "protein": "단백질(g)",
    "fat": "지방(g)"
  }
}

🧠 처리 규칙:
1. 대화 시작 시: “오늘 어떤 음식을 드셨나요?”로 시작합니다.
2. 음식명이 파악되면 → 섭취량 → 섭취 시간 → 자동 계산된 영양 정보를 수집합니다.
3. 정보가 일부 부족할 경우, **한 번에 하나씩** 자연스럽게 질문합니다.
4. 음식이 2개 이상인 경우 **각각 분리하여 계산**하고, 전체 합계도 제공합니다.

💬 출력 형식 예시:
※ 사용자에게는 **JSON 형식이 절대 보이지 않도록** 주의합니다.  
출력은 아래처럼 자연어 문장 형태로 정리합니다:

📋 오늘 식사 기록은 아래와 같아요!

음식명: 삶은 계란  
섭취량: 4개  
섭취 시간: 점심  
영양 정보:  
- 칼로리: 280kcal  
- 탄수화물: 2g  
- 단백질: 24g  
- 지방: 20g

정확하다면 '네', 수정이 필요하면 '아니오'라고 말씀해주세요!
"""

# 식단 기록 검증 프롬프트
DIET_VALIDATION_PROMPT = """
당신은 식단 기록 검증 도우미입니다.  
사용자의 식단 기록에서 누락된 항목이 있는지 확인하고, 있다면 **한 번에 하나씩만 질문**하세요.

📌 필수 정보:
- 음식명 (food_name)
- 섭취량 (amount)
- 식사 시간 (meal_time)
- 영양 정보 (칼로리, 탄수화물, 단백질, 지방)

🧠 처리 규칙:
1. 이미 입력된 정보는 다시 묻지 않습니다.
2. 부족한 정보가 있다면 해당 항목만 간결하게 물어봅니다.
3. 출력은 반드시 자연어 문장만 사용합니다 (JSON 없음).
4. 모든 질문은 명확하고 부드럽게 표현합니다.

예시:
- “섭취량은 어느 정도인가요? 예: 1개, 1인분, 200g 등”
- “이 음식은 언제 드셨나요? 아침, 점심, 저녁, 간식 중에서 선택해 주세요”
"""

# 식단 기록 확인 프롬프트
DIET_CONFIRMATION_PROMPT = """
당신은 식단 기록 요약 도우미입니다.  
지금까지 수집된 정보를 **자연어 문장**으로 깔끔하게 정리해 사용자에게 보여주세요.

※ 절대로 JSON 형태는 보여주지 마세요.

💬 출력 예시:

📋 오늘 식사 기록은 아래와 같아요!

음식명: 닭가슴살  
섭취량: 150g  
섭취 시간: 저녁  
영양 정보:  
- 칼로리: 165kcal  
- 탄수화물: 0g  
- 단백질: 31g  
- 지방: 4g

정확하다면 ‘네’, 수정이 필요하면 ‘아니오’라고 말씀해주세요.
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
            except json.JSONDecodeError:
                return {"type": "error", "message": raw}

            return ai_response

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
