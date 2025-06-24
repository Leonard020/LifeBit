# 🚀 LifeBit 팀 마이그레이션 가이드

## 📋 개요
LifeBit 프로젝트에 새로 참여하는 팀원을 위한 환경 설정 가이드입니다.

---

## 🔧 데이터베이스 연결 문제 해결

### ❌ 문제 상황
- **에러 메시지**: `Connection refused` 또는 `Host not found: postgres-db`
- **원인**: Docker 환경용 설정이 로컬 개발 환경에서 사용됨

### ✅ 해결 방법

#### 1️⃣ 환경변수 설정 (.env 파일)

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```bash
# 데이터베이스 설정 (로컬 개발용)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lifebit_db
DB_USER=lifebit_user
DB_PASSWORD=lifebit_password

# 기타 필수 설정
OPENAI_API_KEY=your-api-key-here
USE_GPT=false
JWT_SECRET=your-jwt-secret-here-minimum-256-bits
```

#### 2️⃣ PostgreSQL 로컬 설치

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
[PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치

#### 3️⃣ 데이터베이스 설정

```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE lifebit_db;
CREATE USER lifebit_user WITH PASSWORD 'lifebit_password';
GRANT ALL PRIVILEGES ON DATABASE lifebit_db TO lifebit_user;

# 종료
\q
```

#### 4️⃣ 애플리케이션 실행

**FastAPI (AI API):**
```bash
cd apps/ai-api-fastapi
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Spring Boot (Core API):**
```bash
cd apps/core-api-spring
# 로컬 프로파일로 실행
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

**Frontend:**
```bash
cd apps/frontend-vite
npm install
npm run dev
```

---

## 🐳 Docker 환경에서 개발하기

전체 스택을 Docker로 실행하려면:

```bash
# 단일 서버 배포
./scripts/deploy-single-server.sh

# 또는 개별 서비스
docker-compose up -d postgres-db  # 데이터베이스만
docker-compose up -d              # 전체 서비스
```

---

## 🔍 연결 확인 방법

### 1️⃣ 데이터베이스 연결 테스트
```bash
# PostgreSQL 직접 연결
psql -h localhost -U lifebit_user -d lifebit_db

# 또는
telnet localhost 5432
```

### 2️⃣ 애플리케이션 헬스체크
```bash
# Spring Boot
curl http://localhost:8080/actuator/health

# FastAPI
curl http://localhost:8001/api/py/health

# Frontend
curl http://localhost:3000
```

---

## 🛠️ 환경별 설정

### 로컬 개발 환경
- **DB_HOST**: `localhost`
- **Spring Profile**: `local`
- **포트**: 기본 포트 사용 (5432, 8080, 8001, 3000)

### Docker 환경
- **DB_HOST**: `postgres-db` (자동 감지)
- **Spring Profile**: `docker`
- **네트워크**: lifebit-network

### 프로덕션 환경
- **DB_HOST**: 실제 DB 서버 주소
- **Spring Profile**: `prod`
- **SSL/TLS**: 활성화

---

## 📞 문제 해결

### 🔧 자주 발생하는 문제들

#### 1. "Connection refused" 오류
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 서비스 시작
sudo systemctl start postgresql
```

#### 2. "Authentication failed" 오류
```bash
# 비밀번호 재설정
sudo -u postgres psql
ALTER USER lifebit_user PASSWORD 'lifebit_password';
```

#### 3. "Database does not exist" 오류
```bash
# 데이터베이스 재생성
sudo -u postgres createdb lifebit_db
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lifebit_db TO lifebit_user;"
```

#### 4. 환경변수 인식 안 됨
```bash
# .env 파일 위치 확인 (프로젝트 루트)
ls -la .env

# 환경변수 수동 설정
export DB_HOST=localhost
export DB_PORT=5432
```

---

## 🎯 팀 협업 가이드

### 1️⃣ 브랜치 전략
- `main`: 프로덕션 코드
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치

### 2️⃣ 환경 동기화
```bash
# 최신 코드 동기화
git pull origin develop

# 의존성 업데이트
cd apps/core-api-spring && ./mvnw clean install
cd apps/ai-api-fastapi && pip install -r requirements.txt
cd apps/frontend-vite && npm install
```

### 3️⃣ 데이터베이스 마이그레이션
```bash
# Spring Boot가 자동으로 스키마 업데이트
# 새로운 테이블이나 컬럼이 추가되면 자동 반영
```

---

## 📚 추가 자료

- [PostgreSQL 설치 가이드](https://www.postgresql.org/docs/current/installation.html)
- [Docker 설치 가이드](https://docs.docker.com/get-docker/)
- [Spring Boot 프로파일](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.profiles)
- [FastAPI 환경변수](https://fastapi.tiangolo.com/advanced/settings/)

---

## 🆘 긴급 연락처

문제가 해결되지 않으면 다음 방법으로 연락:

1. **Slack**: #lifebit-dev 채널
2. **이슈 등록**: GitHub Issues
3. **팀 리드**: @your-team-lead

---

**마지막 업데이트**: 2024년 6월 24일  
**작성자**: LifeBit 개발팀 