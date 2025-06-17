# LifeBit

LifeBit는 개인의 건강과 생활 패턴을 관리하고 개선하는 데 도움을 주는 AI 기반의 건강 관리 플랫폼입니다. 음성 인식과 AI를 활용하여 사용자의 운동과 식단을 쉽게 기록하고 관리할 수 있도록 도와줍니다.

## 주요 기능

### 1. 음성 기반 기록 시스템
- OpenAI Whisper를 활용한 음성 인식
  - 음성 파일(.webm)을 텍스트로 변환
  - 다국어 지원
  - 실시간 음성 처리
  - 노이즈 제거 및 음성 품질 향상
- GPT-3.5를 통한 자연어 처리
  - 음성 텍스트의 자동 분류 (운동/식단)
  - 컨텍스트 기반의 지능적 응답
  - 사용자 의도 파악 및 추천
  - 맞춤형 피드백 제공
- 음성으로 운동과 식단 기록을 쉽게 입력
  - 음성 명령으로 빠른 기록
  - 자연스러운 대화형 인터페이스
  - 다중 명령어 처리
  - 오류 수정 및 편집 기능

### 2. 운동 관리
- 운동 세션 기록
  - 운동 유형 분류
  - 운동 시간 추적
  - 운동 강도 기록
  - 운동 부위 지정
  - 운동 세트 및 반복 횟수 기록
- 운동 시간 및 소모 칼로리 추적
  - 자동 칼로리 계산
  - 운동 시간 모니터링
  - 운동 강도별 칼로리 소모량 계산
  - 목표 달성률 추적
- 운동 일지 관리
  - 상세한 운동 노트
  - 운동 패턴 분석
  - 진행 상황 추적
  - 운동 목표 설정 및 관리
  - 운동 히스토리 조회

### 3. 식단 관리
- 식사 기록
  - 음식 항목 등록
  - 식사 시간 기록
  - 식사 유형 분류
  - 식사 장소 기록
  - 식사 메모 추가
- 음식 섭취량 추적
  - 정확한 수량 기록
  - 영양소 정보 연동
  - 칼로리 자동 계산
  - 영양소 균형 분석
  - 알레르기 정보 관리
- 식단 일지 관리
  - 식사 패턴 분석
  - 영양 균형 모니터링
  - 식단 추천
  - 식사 계획 수립
  - 식단 히스토리 조회

### 4. AI 기반 분석
- 음성 데이터의 자동 분류
  - 운동/식단 컨텍스트 인식
  - 사용자 의도 파악
  - 감정 분석
  - 사용자 선호도 학습
- 운동/식단 기록의 자동 카테고리화
  - 데이터 구조화
  - 메타데이터 추출
  - 태그 자동 생성
  - 연관성 분석
- 사용자 패턴 분석
  - 생활 패턴 인사이트
  - 개선 추천
  - 목표 달성 예측
  - 맞춤형 피드백

## 프로젝트 구조

```
LifeBit/
├── apps/                    # 애플리케이션 소스 코드
│   ├── ai-api-fastapi/     # AI API (FastAPI)
│   │   ├── main.py         # 메인 API 엔드포인트
│   │   ├── models.py       # 데이터베이스 모델
│   │   ├── schemas.py      # Pydantic 스키마
│   │   ├── auth_routes.py  # 인증 관련 라우트
│   │   ├── database.py     # 데이터베이스 설정
│   │   └── requirements.txt # Python 의존성
│   ├── core-api-spring/    # Core API (Spring Boot)
│   │   ├── src/           # 소스 코드
│   │   └── pom.xml        # Maven 설정
│   └── frontend-vite/      # Frontend (Vite + React)
│       ├── src/           # 소스 코드
│       │   ├── components/ # UI 컴포넌트
│       │   ├── pages/     # 페이지 컴포넌트
│       │   ├── hooks/     # 커스텀 훅
│       │   ├── utils/     # 유틸리티 함수
│       │   └── types/     # TypeScript 타입
│       ├── public/        # 정적 파일
│       └── package.json   # 의존성 관리
├── packages/              # 공유 패키지
├── scripts/              # 실행 스크립트
│   ├── start-ai-api.ps1  # Windows AI API 실행
│   ├── start-core-api.ps1 # Windows Core API 실행
│   ├── start-frontend.ps1 # Windows Frontend 실행
│   ├── start-ai-api.sh   # Mac AI API 실행
│   ├── start-core-api.sh # Mac Core API 실행
│   └── start-frontend.sh # Mac Frontend 실행
└── docker-compose.yml    # Docker 설정
```

## 기술 스택

### Backend
- **AI API (FastAPI)**
  - Python 3.11.9
  - OpenAI API (Whisper, GPT-3.5)
  - SQLAlchemy (ORM)
  - FastAPI (웹 프레임워크)
  - Pydantic (데이터 검증)
  - PostgreSQL (데이터베이스)
  - Python-dotenv (환경 변수)
  - Uvicorn (ASGI 서버)

- **Core API (Spring Boot)**
  - Java SDK 21
  - Spring Boot
  - JPA/Hibernate
  - Spring Security
  - RESTful API
  - Spring Data JPA
  - Spring Web
  - Spring Validation

### Frontend
- **Vite + React**
  - Node.js (Latest LTS)
  - TypeScript
  - React 18
  - Tailwind CSS
  - Radix UI
  - React Query
  - React Router
  - Recharts (데이터 시각화)
  - React Hook Form
  - Zod (폼 검증)
  - Axios (HTTP 클라이언트)
  - Date-fns (날짜 처리)
  - Sonner (토스트 알림)

### Infrastructure
- **Package Manager**
  - pnpm (Latest LTS)
  - Workspace 관리
  - 의존성 최적화
  
- **Database**
  - Docker Compose를 통한 데이터베이스 설정
  - PostgreSQL 16
  - UUID 기반 식별자
  - 타임스탬프 추적
  - 데이터 백업 및 복구

- **인증 및 보안**
  - Google OAuth
  - Kakao OAuth
  - JWT 토큰
  - 환경 변수 기반 설정

## 데이터 모델

### ExerciseSession (운동 세션)
- exercise_session_id: Integer (PK)
- uuid: UUID
- user_id: Integer (FK)
- exercise_catalog_id: Integer
- duration_minutes: Integer
- calories_burned: Integer
- notes: Text
- exercise_date: Date
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (소프트 삭제)

### MealLog (식단 기록)
- meal_log_id: Integer (PK)
- uuid: UUID
- user_id: Integer (FK)
- food_item_id: Integer
- quantity: Decimal
- log_date: Date
- created_at: Timestamp
- updated_at: Timestamp
- deleted_at: Timestamp (소프트 삭제)

## 환경 설정

### AI API (.env)
```env
# OpenAI API 설정
OPENAI_API_KEY="Your API key"
USE_GPT=False

# OAuth 설정
KAKAO_REDIRECT_URI=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=
VITE_KAKAO_CLIENT_ID=
```

### Database (docker-compose.yml)
```yaml
POSTGRES_DB=lifebit_db
POSTGRES_USER=lifebit_user
POSTGRES_PASSWORD=lifebit_password
```

## 설치 방법

1. **필수 요구사항 설치**
   - Java SDK 21
   - Python 3.11.9
   - Node.js (Latest LTS)
   - pnpm (Latest LTS)
   - Docker & Docker Compose
   - Git

2. **데이터베이스 설정**
   ```bash
   docker-compose up -d
   ```

3. **프로젝트 의존성 설치**
   ```bash
   pnpm install
   ```

4. **AI API 설정**
   ```bash
   cd apps/ai-api-fastapi
   
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Mac
   python3 -m venv venv
   source venv/bin/activate
   
   pip install -r requirements.txt
   
   # .env 파일 설정
   cp .env.example .env
   # OPENAI_API_KEY를 설정해주세요
   ```

5. **Frontend 설정**
   ```bash
   cd apps/frontend-vite
   pnpm install
   
   # .env 파일 설정
   cp .env.example .env
   # OAuth 클라이언트 ID 설정
   ```

## 실행 방법

### Windows
```bash
pnpm dev:windows
```

### Mac
```bash
pnpm dev:mac
```

## API 엔드포인트

### AI API (FastAPI)
- `POST /api/py/voice`: 음성 파일을 업로드하여 운동/식단 기록 생성
  - Request: multipart/form-data (audio/webm)
  - Response: JSON (user_input, gpt_reply)
  - 기능: 음성 인식, GPT 처리, 데이터베이스 저장
- `GET /`: 헬스 체크
  - Response: JSON (status, service)
  - 기능: 서비스 상태 확인

### Core API (Spring Boot)
- `POST /api/v1/exercises`: 운동 기록 생성
- `GET /api/v1/exercises`: 운동 기록 조회
- `POST /api/v1/meals`: 식단 기록 생성
- `GET /api/v1/meals`: 식단 기록 조회

## 개발 가이드

### 프론트엔드 개발
- 컴포넌트 기반 아키텍처
  - Atomic Design 패턴 적용
  - 재사용 가능한 컴포넌트 설계
- TypeScript를 통한 타입 안정성
  - 인터페이스 정의
  - 타입 가드 활용
- Tailwind CSS를 활용한 반응형 디자인
  - 모바일 퍼스트 접근
  - 다크 모드 지원
- Radix UI를 통한 접근성 보장
  - ARIA 레이블
  - 키보드 네비게이션

### 백엔드 개발
- RESTful API 설계
  - 리소스 중심 설계
  - HTTP 메서드 적절한 사용
- 데이터베이스 마이그레이션 관리
  - Flyway 또는 Liquibase 사용
  - 버전 관리
- 환경 변수를 통한 설정 관리
  - 개발/스테이징/프로덕션 환경 분리
  - 보안 정보 관리
- 로깅 및 모니터링
  - 구조화된 로깅
  - 성능 모니터링
  - 에러 추적

## 배포 가이드

### 개발 환경
- 로컬 개발 서버
- Docker 컨테이너
- 데이터베이스 마이그레이션

### 스테이징 환경
- CI/CD 파이프라인
- 자동화된 테스트
- 성능 모니터링

### 프로덕션 환경
- 클라우드 인프라
- 로드 밸런싱
- 백업 및 복구

## 추가 문서

- [간단한 깃 사용법](./간단한%20깃%20사용법.md)
- [더미데이터](./더미데이터.md)
- [데이터베이스 연결 방법](./데이터%20베이스%20연결%20방법.md)
- [설치 방법](./설치%20방법.md)
- [실행 방법](./실행%20방법.md)
- [유용한 명령어](./유용한%20명령어.md)
