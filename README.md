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

### 일반 초기화
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

### 강제 동기화 (관리자용)
모든 사용자의 로컬 저장소를 강제로 원격 저장소의 상태로 동기화하려면, 다음 단계를 수행하세요:

1. 먼저 원격 저장소를 원하는 상태로 강제 업데이트:
```bash
# 원하는 커밋으로 강제 리셋
git reset --hard <commit-hash>
# 원격 저장소 강제 업데이트
git push -f origin main
```

2. 다른 사용자들에게 다음 명령어를 실행하도록 안내:
```bash
# 로컬 변경사항 강제 삭제 및 원격 저장소와 동기화
git fetch origin
git reset --hard origin/main
git clean -fd
```

주의사항:
- 강제 동기화는 모든 사용자의 로컬 변경사항을 삭제합니다
- 이 작업은 되돌릴 수 없으므로 신중하게 사용해야 합니다
- 필요한 변경사항이 있는 사용자는 먼저 백업해야 합니다
- 이 작업은 프로젝트 관리자만 수행해야 합니다 