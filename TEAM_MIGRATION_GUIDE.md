# 팀원을 위한 변경사항 가이드

## 🔄 **변경사항 요약**

최근 CORS 문제 해결 및 Docker 환경 개선을 위해 일부 파일이 수정되었습니다.
**로컬 개발 환경에는 영향이 없도록** 설계되었습니다.

---

## ✅ **로컬 개발자에게 영향 없는 이유**

### 1. **환경변수 기본값 유지**
```typescript
// apps/frontend-vite/src/config/env.ts
BASE_URL: import.meta.env.VITE_CORE_API_URL || 'http://localhost:8080',
AI_API_URL: import.meta.env.VITE_AI_API_URL || 'http://localhost:8001',
```
- 환경변수 없으면 → 기존 로컬 포트 사용
- **변경 불필요**: 기존대로 개발 가능

### 2. **CORS 설정 확장**
```java
// Spring Boot - 로컬 개발 포트 포함
.allowedOrigins("http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000")
```
```python
# FastAPI - 로컬 개발 포트 포함  
origins = ["http://localhost:3000", "http://localhost:5173", ...]
```
- **기존 포트 유지**: `localhost:5173` (Vite), `localhost:8080` (Spring), `localhost:8001` (FastAPI)
- **추가 포트**: Docker 환경용만 추가

---

## 🚀 **로컬 개발 환경 그대로 사용**

### 기존 방식 (변경 없음):
```bash
# 1. 백엔드 실행
cd apps/core-api-spring && ./mvnw spring-boot:run  # :8080
cd apps/ai-api-fastapi && uvicorn main:app --reload --port 8001  # :8001

# 2. 프론트엔드 실행
cd apps/frontend-vite && npm run dev  # :5173
```

### 접속 URL (기존과 동일):
- **프론트엔드**: http://localhost:5173
- **Spring Boot**: http://localhost:8080  
- **FastAPI**: http://localhost:8001

---

## 🐳 **Docker 환경 (선택사항)**

Docker를 사용하고 싶은 팀원만 사용:

### 환경변수 설정:
```bash
cd apps/frontend-vite
cp .env.example .env

# .env 파일에서 다음 두 줄 주석 해제:
VITE_CORE_API_URL=http://localhost:8082/api
VITE_AI_API_URL=http://localhost:8082/ai
```

### Docker 실행:
```bash
docker-compose -f docker-compose.single-server.yml up -d
# → http://localhost:8082 접속
```

---

## 📋 **체크리스트**

### 로컬 개발자가 확인할 것:
- [ ] 기존 개발 방식 그대로 사용 가능
- [ ] `localhost:5173` → `localhost:8080`, `localhost:8001` 연결 정상
- [ ] CORS 오류 없음
- [ ] 환경변수 설정 불필요

### 문제 발생 시:
1. **CORS 오류**: 브라우저 캐시 삭제
2. **포트 충돌**: `lsof -i :5173` 확인 후 프로세스 종료
3. **환경변수 문제**: `.env` 파일 삭제 후 재시작

---

## 🤝 **팀 협업 권장사항**

### 1. **환경 선택**:
- **로컬 개발** (기본): 빠른 개발 사이클
- **Docker 환경** (선택): 전체 시스템 테스트

### 2. **환경변수 관리**:
- `.env` 파일은 개인별 관리 (Git 추적 안함)
- `.env.example` 참고하여 필요 시 설정

### 3. **문제 해결**:
- 기존 방식으로 안 되면 팀에 문의
- Docker 관련 문제는 선택사항이므로 무시 가능

---

## 💡 **요약**

**🎯 핵심**: 기존 로컬 개발 방식은 전혀 변경되지 않았습니다!

- ✅ 포트 번호 동일
- ✅ 실행 방법 동일  
- ✅ 환경변수 설정 불필요
- ✅ CORS 문제 해결됨

**추가된 것**: Docker 환경 옵션 (선택사항) 