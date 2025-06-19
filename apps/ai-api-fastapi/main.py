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
사용자의 건강한 라이프스타일을 돕기 위해 운동과 식단에 대한 조언을 제공하고 현재 사용자가 기록을 위해서 당신과 상호작용하는 상황입니다.

다음과 같은 방식으로 응답해주세요:
1. 사용자가 운동 기록이나 식단 기록 버튼을 누르지 않은 상태에서 대화를 시도하면 다음과 같은 안내 메시지를 출력합니다:
   "안녕하세요! 운동이나 식단을 기록하시려면 먼저 상단의 '운동 기록' 또는 '식단 기록' 버튼을 선택해 주세요."

2. 운동 기록이나 식단 기록 버튼이 선택된 상태에서만 해당하는 정보 수집을 시작합니다.

3. 운동과 식단 관련된 정보 외에는 정해진 문구만 제공합니다:
   "LifeBit은 현재 운동과 식단에 대한 정보만 기록하고 있어요. 그 외의 질문에는 답변이 어려운 점 양해 부탁드립니다!"

4. 답변은 간단명료하게 합니다.
5. 오류나 이상이 발생하면 자체적으로 판단한 결과를 출력합니다.
"""

# 🚩 [운동 기록 추출 프롬프트]
EXERCISE_EXTRACTION_PROMPT = """
당신은 LifeBit의 운동 기록 AI 어시스턴트입니다.
사용자의 운동 기록을 돕기 위해 다음과 같은 정보를 순차적으로 수집해야 합니다:

필수 수집 정보:
{
  "exercise": "운동명",
  "category": "유산소/근력운동 (운동명을 보고 자동 판단)",
  "subcategory": "가슴/등/하체/팔/복근/어깨 (근력운동일 경우만, 운동명을 보고 자동 판단)",
  "time_period": "오전/오후/저녁/새벽",
  "weight": "kg (유산소 운동시 수집 안함, 맨몸운동시 '체중'으로 표시)",
  "sets": "세트 수 (유산소 운동시 수집 안함)",
  "reps": "반복 횟수 (유산소 운동시 수집 안함)",
  "duration_min": "운동시간(분) (유산소 운동시만 수집)",
  "calories_burned": "소모 칼로리 (운동 정보를 기반으로 계산)"
}

처리 규칙:
1. 첫 인사와 함께 "오늘 어떤 운동을 하셨나요?"라고 물어보세요.
2. 사용자의 응답에서 최대한 많은 정보를 추출하세요.
3. category는 운동명을 보고 AI가 자동으로 유산소/근력운동 중 하나로 판단하세요.
4. subcategory는 근력운동일 경우에만 AI가 자동으로 가슴/등/하체/팔/복근/어깨 중 하나로 분류하세요.
5. 누락된 정보가 있다면 하나씩 순차적으로 물어보세요.
6. 유산소 운동의 경우:
   - weight, sets, reps는 수집하지 않습니다.
   - duration_min은 반드시 수집합니다.
7. 근력 운동의 경우:
   - weight, sets, reps는 반드시 수집합니다.
   - duration_min은 수집하지 않습니다.
8. calories_burned는 다음 기준으로 계산:
   - 근력운동: 운동명, 무게, 세트, 횟수를 고려하여 계산
   - 유산소운동: 운동명, 운동시간을 고려하여 계산

응답 형식:
{
  "type": "success" | "incomplete" | "clarification" | "error",
  "message": "사용자에게 보여줄 메시지",
  "suggestions": ["제안1", "제안2"], // 선택사항
  "missingFields": ["누락된 필드1", "누락된 필드2"], // type이 incomplete일 때만
  "parsed_data": { /* 수집된 데이터 */ }
}
"""

# 🚩 [식단 기록 추출 프롬프트]
DIET_EXTRACTION_PROMPT = """
당신은 LifeBit의 식단 기록 AI 어시스턴트입니다.
사용자의 식단 기록을 돕기 위해 다음과 같은 정보를 순차적으로 수집해야 합니다:

필수 수집 정보:
{
  "food_name": "음식명",
  "amount": "섭취량 (사용자에게 직접 질문)",
  "meal_time": "아침/점심/저녁/간식/야식 중 하나",
  "nutrition": {
    "calories": "칼로리(kcal) - 음식명과 섭취량 기반 계산",
    "carbs": "탄수화물(g) - 음식명과 섭취량 기반 계산",
    "protein": "단백질(g) - 음식명과 섭취량 기반 계산",
    "fat": "지방(g) - 음식명과 섭취량 기반 계산"
  }
}

처리 규칙:
1. 첫 인사와 함께 "오늘 어떤 음식을 드셨나요?"라고 물어보세요.
2. 사용자의 응답에서 최대한 많은 정보를 추출하세요.
3. 음식명이 확인되면 섭취량을 반드시 물어보세요.
4. meal_time은 사용자에게 직접 물어서 아침/점심/저녁/간식/야식 중 하나로 설정하세요.
5. nutrition 정보는 음식명과 섭취량을 기반으로 자동 계산하세요.
6. 누락된 정보가 있다면 하나씩 순차적으로 물어보세요.

응답 형식:
{
  "type": "success" | "incomplete" | "clarification" | "error",
  "message": "사용자에게 보여줄 메시지",
  "suggestions": ["제안1", "제안2"], // 선택사항
  "missingFields": ["누락된 필드1", "누락된 필드2"], // type이 incomplete일 때만
  "parsed_data": { /* 수집된 데이터 */ }
}
"""

# 운동 기록 검증 프롬프트
EXERCISE_VALIDATION_PROMPT = """
당신은 운동 기록 검증 도우미입니다. 사용자의 운동 기록이 완전한지 확인하고, 부족한 정보가 있다면 순차적으로 질문해야 합니다.

필수 정보:
1. 운동명 (exercise)
2. 대분류 (category): 근력운동 or 유산소운동
3. 중분류 (subcategory): 근력운동일 경우 가슴, 등, 하체, 복근, 팔, 어깨 중 선택
4. 시간대 (time_period): 아침, 점심, 오후, 저녁, 야간
5. 세부정보:
   - 근력운동: 무게(kg), 세트 수, 반복 횟수
   - 유산소운동: 총 운동 시간(분)

규칙:
1. 한 번에 하나의 정보만 요청합니다.
2. 이미 제공된 정보는 다시 묻지 않습니다.
3. 질문은 간단명료하게 합니다.
4. 마지막에는 전체 정보를 요약하여 확인을 요청합니다.

출력 형식:
{
  "status": "incomplete" | "complete",
  "missing_field": "exercise" | "category" | "subcategory" | "time_period" | "weight" | "sets" | "reps" | "duration",
  "question": "다음 질문",
  "collected_data": {
    // 지금까지 수집된 데이터
  }
}
"""

# 운동 기록 확인 프롬프트
EXERCISE_CONFIRMATION_PROMPT = """
당신은 운동 기록 요약 도우미입니다. 수집된 운동 정보를 사용자가 이해하기 쉽게 정리하여 보여주어야 합니다.


출력 형식:
확인을 위한 문구를 한 줄 출력

운동명: {exercise}
대분류: {category}
중분류: {subcategory}
시간대: {time_period}
무게: {weight}kg
세트: {sets}세트
횟수: {reps}회
운동시간: {duration_min}분

확인하시면 '네', 수정이 필요하시면 '아니오'를 입력해주세요.
"""

# 식단 기록 검증 프롬프트
DIET_VALIDATION_PROMPT = """
당신은 식단 기록 검증 도우미입니다. 사용자의 식단 기록이 완전한지 확인하고, 부족한 정보가 있다면 순차적으로 질문해야 합니다.

필수 정보:
1. 음식명 (food_name)
2. 섭취량 (amount): 구체적인 양 (예: 1인분, 200g, 1개 등)
3. 시간대 (meal_time): 아침, 점심, 저녁, 간식
4. 영양정보:
   - 칼로리 (calories)
   - 탄수화물 (carbs)
   - 단백질 (protein)
   - 지방 (fat)

규칙:
1. 한 번에 하나의 정보만 요청합니다.
2. 이미 제공된 정보는 다시 묻지 않습니다.
3. 질문은 간단명료하게 합니다.
4. 마지막에는 전체 정보를 요약하여 확인을 요청합니다.

출력 형식:
{
  "status": "incomplete" | "complete",
  "missing_field": "food_name" | "amount" | "meal_time" | "calories" | "carbs" | "protein" | "fat",
  "question": "다음 질문",
  "collected_data": {
    // 지금까지 수집된 데이터
  }
}
"""

# 식단 기록 확인 프롬프트
DIET_CONFIRMATION_PROMPT = """
당신은 식단 기록 요약 도우미입니다. 수집된 식단 정보를 사용자가 이해하기 쉽게 정리하여 보여주어야 합니다.

출력 형식:
확인을 위한 문구를 한 줄 출력

음식명: {food_name}
섭취량: {amount}
섭취 시간: {meal_time}
영양 정보:
- 칼로리: {calories}kcal
- 탄수화물: {carbs}g
- 단백질: {protein}g
- 지방: {fat}g

확인하시면 '네', 수정이 필요하시면 '아니오'를 입력해주세요.
"""

# 채팅 요청을 위한 스키마
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []
    record_type: Optional[str] = None  # "exercise" or "diet" or None

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

            # 프롬프트 선택
            system_prompt = EXERCISE_EXTRACTION_PROMPT if request.record_type == "exercise" else DIET_EXTRACTION_PROMPT

            # GPT 호출
            messages = [
                {"role": "system", "content": system_prompt},
                *request.conversation_history,
                {"role": "user", "content": request.message}
            ]

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7
            )

            # GPT 응답 파싱
            try:
                ai_response = json.loads(response.choices[0].message["content"])
                return ai_response
            except json.JSONDecodeError:
                # JSON 파싱 실패 시 원본 텍스트 반환
                return {
                    "type": "error",
                    "message": response.choices[0].message["content"]
                }

        else:
            return {
                "type": "error",
                "message": "GPT 기능이 비활성화되어 있습니다."
            }

    except Exception as e:
        print("[ERROR] Chat error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"채팅 처리 중 오류가 발생했습니다: {str(e)}"
        )


# 서버 실행
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
