# LifeBit 개발 환경 가이드

## 🚀 개발 환경 선택

LifeBit 프로젝트는 두 가지 개발 환경을 지원합니다:

### 1. 🐳 Docker 환경 (권장)
- **장점**: 환경 일관성, 쉬운 설정, 전체 시스템 테스트 가능
- **단점**: 리소스 사용량 높음, 빌드 시간 소요

### 2. 💻 로컬 개발 환경
- **장점**: 빠른 개발 사이클, 낮은 리소스 사용
- **단점**: 개별 서비스 설정 필요

---

## 🐳 Docker 환경 설정

### 실행 방법
```bash
# 전체 서비스 실행
docker-compose -f docker-compose.single-server.yml up -d

# 특정 서비스만 재시작
docker-compose -f docker-compose.single-server.yml restart frontend-app
```

### 접속 URL
- **통합 접속**: http://localhost:8082 (Nginx 프록시)
- **프론트엔드**: http://localhost:3000
- **Spring Boot API**: http://localhost:8080
- **FastAPI**: http://localhost:8001

### 환경변수 (Docker용)
```env
VITE_CORE_API_URL=http://localhost:8082/api
VITE_AI_API_URL=http://localhost:8082/ai
```

---

## 💻 로컬 개발 환경 설정

### 1. 백엔드 서비스 실행

#### PostgreSQL & Redis (Docker로 실행)
```bash
# 데이터베이스만 Docker로 실행
docker-compose -f docker-compose.single-server.yml up -d postgres-db redis-cache
```

#### Spring Boot API
```bash
cd apps/core-api-spring
./mvnw spring-boot:run
# 또는
./scripts/start-core-api.sh
```

#### FastAPI
```bash
cd apps/ai-api-fastapi
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
# 또는
./scripts/start-ai-api.sh
```

### 2. 프론트엔드 실행

#### 환경변수 설정
```bash
cd apps/frontend-vite
cp .env.example .env
```

`.env` 파일 내용 (로컬 개발용):
```env
# 로컬 개발 환경 - 기본값 사용 (환경변수 설정 불필요)
# VITE_CORE_API_URL=http://localhost:8080
# VITE_AI_API_URL=http://localhost:8001

# 소셜 로그인 키만 설정
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_KAKAO_CLIENT_ID=your-kakao-client-id
```

#### 실행
```bash
cd apps/frontend-vite
npm install
npm run dev
```

### 접속 URL (로컬 개발)
- **프론트엔드**: http://localhost:5173 (Vite 개발 서버)
- **Spring Boot API**: http://localhost:8080
- **FastAPI**: http://localhost:8001

---

## 🔧 CORS 설정 정보

### Docker 환경
- Nginx 프록시를 통해 모든 요청이 `localhost:8082`로 통합
- CORS 문제 없음

### 로컬 개발 환경
- 프론트엔드: `localhost:5173`
- 백엔드 CORS 설정에 `localhost:5173` 허용됨
- 직접 API 호출 시 CORS 문제 없음

---

## 🚨 주의사항

### 환경변수 우선순위
1. `.env` 파일의 환경변수
2. `config/env.ts`의 기본값

### 포트 충돌 해결
```bash
# 포트 사용 확인
lsof -i :8080
lsof -i :8001
lsof -i :5173

# 프로세스 종료
kill -9 <PID>
```

### 개발 환경별 URL 정리
| 환경 | 프론트엔드 | Core API | AI API | 통합 접속 |
|------|------------|----------|--------|-----------|
| Docker | :3000 | :8080 | :8001 | :8082 |
| 로컬 | :5173 | :8080 | :8001 | N/A |

---

## 🤝 팀 개발 권장사항

1. **Docker 환경 우선 사용**: 환경 일관성을 위해 Docker 사용 권장
2. **로컬 개발 시**: 백엔드는 Docker, 프론트엔드만 로컬 실행
3. **환경변수 관리**: `.env` 파일은 개인별로 관리, 공유하지 않음
4. **포트 표준화**: 가능한 기본 포트 사용

---

## 🆘 문제 해결

### CORS 오류 발생 시
1. 환경변수 확인: `VITE_CORE_API_URL`, `VITE_AI_API_URL`
2. 백엔드 CORS 설정 확인
3. 브라우저 캐시 삭제

### 환경변수 변경 후
```bash
# 프론트엔드 재시작 (로컬)
npm run dev

# 프론트엔드 재빌드 (Docker)
docker-compose -f docker-compose.single-server.yml build frontend-app
docker-compose -f docker-compose.single-server.yml restart frontend-app
``` 