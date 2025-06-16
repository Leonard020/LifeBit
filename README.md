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

#windows
uvicorn main:app --reload --port 8001

#mac
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

## 저장소 초기화 방법

만약 저장소를 최신 상태로 초기화해야 하는 경우, 다음 명령어를 순서대로 실행하세요:

```bash
# 1. 현재 변경사항 모두 제거
git reset --hard

# 2. 원격 저장소의 최신 상태 가져오기
git fetch origin

# 3. 로컬 main 브랜치를 원격 main 브랜치와 동기화
git reset --hard origin/main

# 4. 불필요한 브랜치와 파일 정리
git clean -fd
```

이 명령어들은 로컬의 모든 변경사항을 제거하고 원격 저장소의 최신 상태로 초기화합니다.
주의: 이 작업은 로컬의 모든 변경사항을 삭제하므로, 필요한 변경사항이 있다면 먼저 백업해두세요. 