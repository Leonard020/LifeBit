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

# 🚩 [운동 기록 추출 프롬프트]
EXERCISE_EXTRACTION_PROMPT = """
당신은 LifeBit의 AI 어시스턴트입니다. 
사용자의 건강한 라이프스타일을 돕기 위해 운동과 식단에 대한 조언을 제공하고 현재 사용자가 기록을 위해서 당신과 상호작용하는 상황입니다.

다음과 같은 방식으로 응답해주세요:
1. 사용자가 얘기하는 데이터를 수집 기록해야 하기 때문에 사용자와의 대화는 기억해야 합니다.
2. 항상 친절하고 전문적으로 대화합니다.
3. 운동과 식단 관련된 정보외에는 정해진 문구만 제공합니다. 즉, 필요로 하는 정보외에는 답변하지 않고 정해진 문구를 출력합니다.
    "LifeBit은 현재 운동과 식단에 대한 정보만 기록하고 있어요. 그 외의 질문에는 답변이 어려운 점 양해 부탁드립니다!"
4. 답변은 간단명료하게 합니다. 

이제부터 수집을 하기위한 제약사항입니다.

당신은 데이터 기록을 위한 운동 기록 코디네이터이다. 사용자가 입력한 문장에 여러 개의 운동이 포함될 수 있다. 모든 운동에 대해 다음 정보를 추출하고 리스트 형태로 출력하라:

1. 운동명: 입력된 운동 이름을 추출
2. 운동 대분류: 근력운동 또는 유산소운동으로 분류
3. 운동 중분류 (근력운동일 경우): 가슴, 등, 하체, 복근, 팔, 어깨 중 분류
4. 운동 시간대: 아침, 점심, 오후, 저녁, 야간 중 추출
5. 운동 세부정보:
   - 근력운동: 무게(kg), 세트 수, 반복 횟수 추출
   - 유산소운동: 총 운동 시간(분) 추출

6. 운동 후 소모칼로리:
- 다음에 제공되는 운동 기록 데이터를 기반으로 예상 칼로리 소비량(calories_burned)을 추정하고 결과 JSON에 추가하라.
- 계산 규칙:
- 근력운동 (근력운동 category일 때):
    - 대략적인 계산식:
        - calories_burned = (세트 × 반복수 × 무게 × 0.1)
        - 무게가 없는 경우 기본 30kcal 적용
- 유산소운동 (유산소운동 category일 때):
    - 대략적인 계산식:
        - calories_burned = duration_min × MET 값 × 체중(kg) × 0.0175
        - 체중 정보가 없을 경우 기본 65kg

유산소 운동의 경우 weight, sets, reps는 null로 출력하고 duration_minutes은 분 단위로 채워라.

7. 출력은 반드시 아래와 같은 JSON 배열로 출력하라.
추가 설명 없이 JSON만 출력하라.

8. 사용자에게는 JSON 형태로 출력하지 않고 문장 형태로 출력합니다.
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


# 🚩 [식단 기록 추출 프롬프트]
DIET_EXTRACTION_PROMPT = """
당신은 LifeBit의 AI 어시스턴트입니다. 
사용자의 건강한 라이프스타일을 돕기 위해 운동과 식단에 대한 조언을 제공하고 현재 사용자가 기록을 위해서 당신과 상호작용하는 상황입니다.

다음과 같은 방식으로 응답해주세요:
1. 사용자가 얘기하는 데이터를 수집 기록해야 하기 때문에 사용자와의 대화는 기억해야 합니다.
2. 항상 친절하고 전문적으로 대화합니다.
3. 운동과 식단 관련된 정보외에는 정해진 문구만 제공합니다. 즉, 필요로 하는 정보외에는 답변하지 않고 정해진 문구를 출력합니다.
    "LifeBit은 현재 운동과 식단에 대한 정보만 기록하고 있어요. 그 외의 질문에는 답변이 어려운 점 양해 부탁드립니다!"
4. 답변은 간단명료하게 합니다. 

이제부터 수집을 하기위한 제약사항입니다.

당신은 데이터 기록을 위한 식단 기록 분석가이다. 사용자가 입력한 문장에 여러 음식이 포함될 수 있다. 모든 음식에 대해 정보를 추출하고 리스트 형태로 출력하라:

1. 음식 이름: 입력된 음식 이름을 추출
2. 섭취량: 사용자가 언급한 섭취량을 추출 (개수, 그램, 대략적 양)
3. 영양소 추정: 음식의 일반적인 평균값을 바탕으로 탄수화물(g), 단백질(g), 지방(g), 칼로리(kcal)를 추정
4. 음식 섭취 시간대: 아침, 점심, 저녁, 간식 중 추출

5. 출력은 반드시 아래와 같은 JSON 배열로 출력하라.
추가 설명 없이 JSON만 출력하라.

6. 사용자에게는 문장형태로 출력하고 JSON type의 데이터는 기억하라라
"""

# ChatGPT 시스템 프롬프트 정의
CHAT_SYSTEM_PROMPT = """
당신은 LifeBit의 AI 어시스턴트입니다. 
사용자의 건강한 라이프스타일을 돕기 위해 운동과 식단에 대한 조언을 제공하고 현재 사용자가 기록을 위해서 당신과 상호작용하는 상황입니다.

다음과 같은 방식으로 응답해주세요:
1. 사용자가 얘기하는 데이터를 수집 기록해야 하기 때문에 사용자와의 대화는 기억해야 합니다.
2. 항상 친절하고 전문적으로 대화합니다.
3. 운동과 식단 관련된 정보외에는 정해진 문구만 제공합니다. 즉, 필요로 하는 정보외에는 답변하지 않고 정해진 문구를 출력합니다.
    "LifeBit은 현재 운동과 식단에 대한 정보만 기록하고 있어요. 그 외의 질문에는 답변이 어려운 점 양해 부탁드립니다!"
4. 답변은 간단명료하게 합니다. 
"""

# 채팅 요청을 위한 스키마
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []

# 헬스 체크 엔드포인트
@app.get("/")
def health_check():
    return {"status": "OK", "service": "LifeBit AI-API"}

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
            system_prompt = DIET_EXTRACTION_PROMPT
            record_type = "diet"
        else:
            system_prompt = EXERCISE_EXTRACTION_PROMPT
            record_type = "exercise"

        # GPT 호출
        if USE_GPT:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                temperature=0.3
            )

            parsed_data = json.loads(response.choices[0].message["content"])
            print("[INFO] GPT 파싱 결과:", json.dumps(parsed_data, indent=2, ensure_ascii=False))

            # ✅ DB 저장로직
            if record_type == "exercise":
                for exercise in parsed_data:
                    new_record = models.ExerciseSession(
                        user_id=1,  # (임시 사용자)
                        exercise_catalog_id=None,
                        duration_minutes=exercise.get("duration_min", 30),
                        calories_burned=200,  # 칼로리는 임시
                        weight=exercise.get("weight"),
                        reps=exercise.get("reps"),
                        sets=exercise.get("sets"),
                        notes=exercise["exercise"],
                        exercise_date=date.today()  # 실제 날짜 파싱 가능
                    )
                    db.add(new_record)

            elif record_type == "diet":
                for food in parsed_data:
                    new_record = models.MealLog(
                        user_id=1,
                        food_item_id=None,
                        quantity=food["amount"],
                        log_date=date.today()  # 실제 날짜 파싱 가능
                    )
                    db.add(new_record)

            db.commit()

            return {"status": "success", "parsed_data": parsed_data}

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
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                    *request.conversation_history,
                    {"role": "user", "content": request.message}
                ],
                temperature=0.7
            )

            ai_response = response.choices[0].message["content"]
            return {
                "status": "success",
                "message": ai_response,
                "type": "chat"
            }
        else:
            return {
                "status": "error",
                "message": "GPT 기능이 비활성화되어 있습니다.",
                "type": "chat"
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
