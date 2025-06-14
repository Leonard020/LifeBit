# LifeBit Project

## 시작하기

### 1. AI API (FastAPI) 실행 [터미널 하나 열기기]
```bash
# AI API 디렉토리로 이동
cd apps/ai-api-fastapi

# Python 가상환경 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# FastAPI 서버 실행
uvicorn main:app --reload --port 8001
```

### 3. Core API (Spring Boot) 실행 [터미널 새로 하나 열기]
```bash
# Core API 디렉토리로 이동
cd apps/core-api-spring

# Spring Boot 서버 실행
./mvnw spring-boot:run
```

### 4. Frontend (Vite) 실행 [터미널 새로 하나 열기][총 3개의 터미널이 열려 있어야 함]
```bash
# Frontend 디렉토리로 이동
cd apps/frontend-vite

# 개발 서버 실행
pnpm dev
```

## 서비스 포트
- Frontend: http://localhost:5173
- Core API: http://localhost:8080
- AI API: http://localhost:8001