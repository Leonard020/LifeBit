# 🗄️ LifeBit 데이터베이스 연결 설정 가이드

## 📋 개요
LifeBit 프로젝트의 데이터베이스 연결을 로컬 개발 환경에서 설정하는 방법을 안내합니다.

## ⚙️ 환경별 설정

### 🏠 로컬 개발 환경 (기본 설정)
현재 코드는 **로컬 환경**을 기본으로 설정되어 있습니다.

#### 데이터베이스 연결 정보:
- **호스트**: `localhost`
- **포트**: `5432`
- **데이터베이스명**: `lifebit_db`  
- **사용자명**: `lifebit_user`
- **비밀번호**: `lifebit_password`

### 🛠️ 설정 방법

#### 1. PostgreSQL 로컬 설치 및 설정
```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 설치 (macOS)
brew install postgresql
brew services start postgresql

# PostgreSQL 설치 (Windows)
# https://www.postgresql.org/download/windows/ 에서 다운로드
```

#### 2. 데이터베이스 및 사용자 생성
```sql
-- PostgreSQL에 접속
sudo -u postgres psql

-- 데이터베이스 생성
CREATE DATABASE lifebit_db;

-- 사용자 생성 및 권한 부여
CREATE USER lifebit_user WITH PASSWORD 'lifebit_password';
GRANT ALL PRIVILEGES ON DATABASE lifebit_db TO lifebit_user;
GRANT ALL ON SCHEMA public TO lifebit_user;
GRANT CREATE ON SCHEMA public TO lifebit_user;

-- 접속 종료
\q
```

#### 3. 환경 변수 확인
`.env` 파일에서 다음 설정이 올바른지 확인:
```env
# 로컬 개발 환경용 설정
DB_HOST=localhost
DB_USER=lifebit_user
DB_PASSWORD=lifebit_password
DB_NAME=lifebit_db
DB_PORT=5432
```

#### 4. 연결 테스트
```bash
# PostgreSQL 직접 연결 테스트
psql -h localhost -p 5432 -U lifebit_user -d lifebit_db

# 연결 성공 시 다음과 같이 표시됩니다:
# psql (14.x)
# Type "help" for help.
# lifebit_db=>
```

### 🐳 Docker 환경에서 실행하는 경우
Docker Compose를 사용할 때는 자동으로 `postgres-db` 호스트명을 사용합니다.

```bash
# Docker 환경에서 실행
docker-compose -f docker-compose.single-server.yml up -d

# 환경 변수가 자동으로 다음과 같이 설정됩니다:
# DB_HOST=postgres-db (docker-compose.yml에서 설정)
```

## 🔧 트러블슈팅

### 📝 연결 실패 시 체크리스트

#### 1. PostgreSQL 서비스 상태 확인
```bash
# Ubuntu/Debian
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql

# Windows
# 서비스 관리자에서 PostgreSQL 서비스 확인
```

#### 2. 포트 확인
```bash
# PostgreSQL이 5432 포트에서 실행 중인지 확인
sudo netstat -tulpn | grep 5432
# 또는
sudo ss -tulpn | grep 5432
```

#### 3. 방화벽 설정 확인
```bash
# Ubuntu/Debian
sudo ufw status

# 5432 포트가 열려있는지 확인하고 필요시 허용
sudo ufw allow 5432
```

#### 4. PostgreSQL 접속 권한 확인
`/etc/postgresql/14/main/pg_hba.conf` 파일에서 다음 라인이 있는지 확인:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

#### 5. PostgreSQL 서버 재시작
```bash
# Ubuntu/Debian
sudo systemctl restart postgresql

# macOS
brew services restart postgresql
```

### 🆘 자주 발생하는 오류 및 해결방법

#### `connection refused` 오류
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
```
**해결방법**: PostgreSQL 서비스가 실행되지 않았습니다.
```bash
sudo systemctl start postgresql
```

#### `authentication failed` 오류
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: FATAL: password authentication failed for user "lifebit_user"
```
**해결방법**: 사용자나 비밀번호가 올바르지 않습니다. 데이터베이스에서 사용자를 다시 생성하세요.

#### `database does not exist` 오류
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: FATAL: database "lifebit_db" does not exist
```
**해결방법**: 데이터베이스가 생성되지 않았습니다. 위의 데이터베이스 생성 단계를 다시 수행하세요.

## 🚀 애플리케이션 실행

### FastAPI (AI 서비스)
```bash
cd apps/ai-api-fastapi
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

### Spring Boot (핵심 API)
```bash
cd apps/core-api-spring
./mvnw spring-boot:run
```

### Frontend (React)
```bash
cd apps/frontend-vite
npm install
npm run dev
```

## 📞 지원

문제가 계속 발생하면 다음을 확인해주세요:

1. **환경 변수**: `.env` 파일의 DB 설정이 올바른지 확인
2. **PostgreSQL 버전**: 12 이상 버전 사용 권장
3. **방화벽**: localhost 연결이 차단되지 않았는지 확인
4. **권한**: PostgreSQL 사용자 권한이 올바르게 설정되었는지 확인

추가 도움이 필요하면 팀 채널에 문의해주세요! 🙋‍♀️🙋‍♂️ 