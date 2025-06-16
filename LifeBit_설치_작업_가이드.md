# LifeBit 프로젝트 설치 작업 가이드

## 📋 목차
1. [사전 준비사항](#사전-준비사항)
2. [개발 환경 설정](#개발-환경-설정)
3. [프로젝트 클론 및 초기 설정](#프로젝트-클론-및-초기-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [백엔드 API 설정](#백엔드-api-설정)
6. [프론트엔드 설정](#프론트엔드-설정)
7. [AI API 설정](#ai-api-설정)
8. [전체 서비스 실행](#전체-서비스-실행)
9. [설치 확인 및 테스트](#설치-확인-및-테스트)
10. [문제 해결](#문제-해결)

---

## 🔧 사전 준비사항

### 1. 필수 소프트웨어 설치

#### Java Development Kit (JDK) 21
```bash
# Java 버전 확인
java -version

# 설치되지 않은 경우 다운로드
# Windows: https://adoptium.net/temurin/releases/
# 또는 Oracle JDK: https://www.oracle.com/java/technologies/downloads/

# 환경변수 설정 (Windows)
set JAVA_HOME=C:\Program Files\Java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%
```

**주석:** Spring Boot 3.x는 Java 17 이상이 필요하며, 프로젝트에서는 Java 21 사용

#### Python 3.13.5
```bash
# Python 버전 확인
python --version

# 설치되지 않은 경우 다운로드
# https://www.python.org/downloads/release/python-3135/

# 설치 시 "Add Python to PATH" 체크 필수
```

**주석:** FastAPI와 uvicorn은 Python 3.7+를 요구하지만, 프로젝트에서는 3.13.5 사용

#### Node.js (Latest LTS)
```bash
# Node.js 버전 확인
node --version
npm --version

# 설치되지 않은 경우 다운로드
# https://nodejs.org/
```

**주석:** LTS 버전을 사용하여 안정성 확보

#### Pnpm (Latest LTS)
```bash
# Pnpm 설치
npm install -g pnpm

# 또는 PowerShell 설치 스크립트
iwr https://get.pnpm.io/install.ps1 -useb | iex

# 버전 확인
pnpm --version
```

**주석:** Pnpm은 npm보다 빠르고 디스크 공간을 절약하는 패키지 매니저

#### Docker Desktop
```bash
# Docker 설치 확인
docker --version
docker-compose --version

# 설치되지 않은 경우 다운로드
# https://www.docker.com/products/docker-desktop/

# Windows에서는 WSL2 설치 필요할 수 있음
```

**주석:** PostgreSQL 데이터베이스를 컨테이너로 실행하기 위해 필요

### 2. 개발 도구 설치

#### Visual Studio Code
```bash
# VS Code 다운로드
# https://code.visualstudio.com/

# 추천 확장 프로그램
# - PostgreSQL (Microsoft)
# - Python (Microsoft)
# - Java Extension Pack (Microsoft)
# - ES7+ React/Redux/React-Native snippets
# - Tailwind CSS IntelliSense
```

#### Git
```bash
# Git 설치 확인
git --version

# 설치되지 않은 경우 다운로드
# https://git-scm.com/
```

---

## 🚀 개발 환경 설정

### 1. 시스템 환경변수 설정 (Windows)

```bash
# 시스템 환경변수 설정
# 제어판 > 시스템 > 고급 시스템 설정 > 환경 변수

# JAVA_HOME 설정
JAVA_HOME = C:\Program Files\Java\jdk-21

# PATH에 추가
PATH = %JAVA_HOME%\bin;%PATH%

# Node.js PATH 확인
PATH = C:\Program Files\nodejs\;%PATH%
```

### 2. PowerShell 실행 정책 설정

```powershell
# PowerShell을 관리자 권한으로 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**주석:** Python 가상환경 활성화 스크립트 실행을 위해 필요

### 3. 방화벽 설정

```bash
# Windows Defender 방화벽에서 다음 포트 허용
# - 5173 (Vite Frontend)
# - 8080 (Spring Boot API)
# - 8001 (FastAPI)
# - 5432 (PostgreSQL)
```

---

## 📥 프로젝트 클론 및 초기 설정

### 1. 프로젝트 클론

```bash
# 프로젝트 디렉토리로 이동
cd /d/pro2

# Git 저장소 클론
git clone <repository-url> LifeBit
cd LifeBit

# 또는 기존 프로젝트 폴더 사용
cd /d/pro2/LifeBit
```

### 2. 프로젝트 구조 확인

```bash
# 프로젝트 구조 확인
tree /f

# 예상 구조:
# LifeBit/
# ├── apps/
# │   ├── core-api-spring/     # Spring Boot 백엔드
# │   ├── frontend-vite/       # React/Vite 프론트엔드
# │   └── ai-api-fastapi/      # FastAPI AI 서비스
# ├── packages/
# │   └── shared-types/        # 공유 타입 정의
# ├── docker-compose.yml       # PostgreSQL 컨테이너
# ├── package.json             # 루트 패키지 설정
# └── pnpm-workspace.yaml      # Workspace 설정
```

### 3. 루트 의존성 설치

```bash
# 프로젝트 루트에서 실행
pnpm install
```

**주석:** Monorepo 구조에서 모든 패키지의 의존성을 한 번에 설치

---

## 🗄️ 데이터베이스 설정

### 1. Docker 컨테이너 실행

```bash
# PostgreSQL 컨테이너 실행
docker-compose up -d

# 컨테이너 상태 확인
docker ps

# 로그 확인
docker logs lifebit_postgres
```

**주석:** PostgreSQL 컨테이너가 완전히 시작되기까지 10-30초 소요

### 2. 데이터베이스 연결 설정

#### VS Code PostgreSQL 확장 사용
```bash
# VS Code에서 PostgreSQL 확장 설치 후 연결 설정

# 연결 정보:
Name: lifebit_postgres
Host: 127.0.0.1
Port: 5432
Database: lifebit_db
Username: lifebit_user
Password: lifebit_password
```

#### 또는 psql 명령어 사용
```bash
# PostgreSQL 접속
docker exec -it lifebit_postgres psql -U lifebit_user -d lifebit_db

# 데이터베이스 목록 확인
\l

# 연결 종료
\q
```

### 3. 초기 데이터베이스 스키마 생성

```bash
# VS Code에서 PostgreSQL 확장 사용 시:
# 1. LifeBit.SQL 파일 열기
# 2. Ctrl+A로 전체 선택
# 3. Execute 버튼 클릭 또는 Ctrl+Shift+Q

# 또는 psql 사용:
docker exec -i lifebit_postgres psql -U lifebit_user -d lifebit_db < LifeBit.SQL
```

**주석:** SQL 파일은 반드시 UTF-8 인코딩으로 저장되어야 하며, 전체 스크립트를 한 번에 실행

---

## ☕ 백엔드 API 설정

### 1. Spring Boot 프로젝트 설정

```bash
# Spring Boot 디렉토리로 이동
cd apps/core-api-spring

# Maven Wrapper 권한 확인 (Linux/Mac)
chmod +x mvnw

# Windows에서는 mvnw.cmd 사용
```

### 2. 데이터베이스 연결 설정

```bash
# application.properties 또는 application.yml 파일 확인
# 데이터베이스 연결 정보가 올바른지 확인

# 예상 설정:
spring.datasource.url=jdbc:postgresql://localhost:5432/lifebit_db
spring.datasource.username=lifebit_user
spring.datasource.password=lifebit_password
```

### 3. Spring Boot 서버 실행

```bash
# 개발 모드로 실행
./mvnw spring-boot:run

# 또는 Windows에서
mvnw.cmd spring-boot:run

# 또는 직접 Maven 사용
mvn spring-boot:run
```

**주석:** Spring Boot 서버는 기본적으로 8080 포트에서 실행

---

## 🎨 프론트엔드 설정

### 1. Vite 프로젝트 설정

```bash
# 프론트엔드 디렉토리로 이동
cd apps/frontend-vite

# 의존성 설치
pnpm install
```

### 2. 환경 설정 확인

```bash
# .env 파일 확인 (필요한 경우)
# API 엔드포인트 설정 확인

# 예상 설정:
VITE_API_URL=http://localhost:8080
VITE_AI_API_URL=http://localhost:8001
```

### 3. 개발 서버 실행

```bash
# 개발 서버 실행
pnpm dev

# 또는 특정 포트로 실행
pnpm dev --port 5173
```

**주석:** Vite 개발 서버는 기본적으로 5173 포트에서 실행

---

## 🤖 AI API 설정

### 1. Python 가상환경 생성

```bash
# AI API 디렉토리로 이동
cd apps/ai-api-fastapi

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
venv\Scripts\activate

# 가상환경 활성화 (macOS/Linux)
source venv/bin/activate
```

### 2. Python 의존성 설치

```bash
# pip 업그레이드
python -m pip install --upgrade pip

# 의존성 설치
pip install -r requirements.txt

# 또는 개별 패키지 설치
pip install fastapi uvicorn
```

### 3. FastAPI 서버 실행

```bash
# 개발 모드로 실행
uvicorn main:app --reload --port 8001

# 또는 프로덕션 모드
uvicorn main:app --host 0.0.0.0 --port 8001
```

**주석:** FastAPI 서버는 기본적으로 8001 포트에서 실행

---

## 🚀 전체 서비스 실행

### 1. 서비스 실행 순서

```bash
# 1. 데이터베이스 실행 (새 터미널)
docker-compose up -d

# 2. Spring Boot API 실행 (새 터미널)
cd apps/core-api-spring
mvnw.cmd spring-boot:run

# 3. FastAPI 실행 (새 터미널)
cd apps/ai-api-fastapi
venv\Scripts\activate
uvicorn main:app --reload --port 8001

# 4. Frontend 실행 (새 터미널)
cd apps/frontend-vite
pnpm dev
```

### 2. 서비스 포트 확인

```bash
# 포트 사용 확인
netstat -ano | findstr :5432  # PostgreSQL
netstat -ano | findstr :8080  # Spring Boot
netstat -ano | findstr :8001  # FastAPI
netstat -ano | findstr :5173  # Vite
```

### 3. 서비스 상태 확인

```bash
# Docker 컨테이너 상태
docker ps

# Spring Boot API 상태
curl http://localhost:8080/actuator/health

# FastAPI 상태
curl http://localhost:8001/docs

# Frontend 상태
curl http://localhost:5173
```

---

## ✅ 설치 확인 및 테스트

### 1. 브라우저 접속 확인

```bash
# 각 서비스 접속 URL
Frontend: http://localhost:5173
Spring Boot API: http://localhost:8080
FastAPI Docs: http://localhost:8001/docs
```

### 2. API 엔드포인트 테스트

```bash
# Spring Boot API 테스트
curl -X GET http://localhost:8080/api/health

# FastAPI 테스트
curl -X GET http://localhost:8001/health

# 데이터베이스 연결 테스트
docker exec -it lifebit_postgres psql -U lifebit_user -d lifebit_db -c "SELECT version();"
```

### 3. 프론트엔드 기능 테스트

```bash
# 브라우저에서 다음 기능 확인:
# 1. 페이지 로딩
# 2. API 호출
# 3. 데이터 표시
# 4. 사용자 인터페이스 동작
```

---

## 🔧 문제 해결

### 1. 일반적인 문제 해결

#### 포트 충돌 해결
```bash
# 포트 사용 확인
netstat -ano | findstr :<PORT>

# 프로세스 종료
taskkill /PID <PID> /F
```

#### 의존성 문제 해결
```bash
# 캐시 삭제
pnpm store prune
pip cache purge

# 의존성 재설치
rm -rf node_modules
pnpm install
```

#### 가상환경 문제 해결
```bash
# 가상환경 재생성
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 로그 확인

```bash
# Docker 로그
docker logs lifebit_postgres

# Spring Boot 로그
# application.properties에 추가: logging.level.root=DEBUG

# FastAPI 로그
# main.py에 추가: logging.basicConfig(level=logging.DEBUG)
```

### 3. 환경변수 확인

```bash
# Java 환경변수
echo %JAVA_HOME%
java -version

# Python 환경변수
python --version
pip --version

# Node.js 환경변수
node --version
npm --version
pnpm --version
```

---

## 📝 추가 참고사항

### 1. 개발 워크플로우

```bash
# 1. 데이터베이스 시작
docker-compose up -d

# 2. 백엔드 API 개발
cd apps/core-api-spring
mvnw.cmd spring-boot:run

# 3. AI API 개발
cd apps/ai-api-fastapi
venv\Scripts\activate
uvicorn main:app --reload --port 8001

# 4. 프론트엔드 개발
cd apps/frontend-vite
pnpm dev
```

### 2. 프로덕션 배포 준비

```bash
# Spring Boot JAR 빌드
cd apps/core-api-spring
mvnw.cmd clean package

# Frontend 빌드
cd apps/frontend-vite
pnpm build

# FastAPI 프로덕션 실행
cd apps/ai-api-fastapi
uvicorn main:app --host 0.0.0.0 --port 8001
```

### 3. 유용한 명령어

```bash
# 모든 서비스 중지
docker-compose down
taskkill /f /im java.exe
taskkill /f /im node.exe

# 로그 확인
docker logs -f lifebit_postgres

# 데이터베이스 백업
docker exec lifebit_postgres pg_dump -U lifebit_user lifebit_db > backup.sql
```

---

## 📞 지원 및 문의

### 문제 발생 시 확인사항
1. 모든 필수 소프트웨어가 올바른 버전으로 설치되었는지 확인
2. 환경변수가 올바르게 설정되었는지 확인
3. 포트 충돌이 없는지 확인
4. 방화벽 설정을 확인

### 추가 지원
- 프로젝트 README.md 확인
- 각 기술 스택 공식 문서 참조
- 개발팀에 문의

**마지막 업데이트:** 2024년 12월 19일  
**작성자:** 개발팀  
**버전:** 1.0  
**적용 환경:** Windows 10/11, Java 21, Python 3.13.5, Node.js LTS 