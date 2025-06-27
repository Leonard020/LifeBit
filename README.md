# 🏃‍♀️ LifeBit - AI 기반 개인 건강 관리 플랫폼

<div align="center">

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-teal.svg)](https://fastapi.tiangolo.com/)
[![Apache Airflow](https://img.shields.io/badge/Apache%20Airflow-Pipeline-red.svg)](https://airflow.apache.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://www.postgresql.org/)

*AI 추천 시스템과 실시간 채팅을 통한 스마트 건강 관리 솔루션*

</div>

## 📋 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [시스템 아키텍처](#-시스템-아키텍처)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [API 문서](#-api-문서)
- [배포](#-배포)
- [문서](#-문서)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

## 🌟 프로젝트 소개

**LifeBit**은 AI 기술을 활용한 개인 건강 관리 플랫폼으로, 사용자의 운동, 식단, 건강 지표를 종합적으로 관리하고 개인 맞춤형 추천 서비스를 제공합니다.

### 💡 프로젝트 목표

- **개인화된 건강 관리**: AI 기반 개인 맞춤형 운동 및 식단 추천
- **실시간 소통**: 자연어 기반 채팅을 통한 직관적인 데이터 입력
- **포괄적 추적**: 운동, 식단, 체중 등 종합적 건강 지표 관리
- **사회적 동기부여**: 랭킹 시스템을 통한 사용자 간 건강한 경쟁

## 🚀 주요 기능

### 🤖 AI 기반 기능
- **스마트 데이터 입력**: 자연어 처리를 통한 음성/텍스트 기반 식단/운동 기록
- **개인화 추천**: OpenAI GPT를 활용한 맞춤형 운동 및 식단 추천
- **영양 분석**: AI 기반 음식 영양소 자동 계산 및 분석

### 📊 건강 관리
- **종합 대시보드**: 건강 지표 시각화 및 트렌드 분석
- **운동 관리**: 운동 세션 기록, 칼로리 소모량 추적
- **식단 관리**: 식사별 영양소 분석 및 일일 권장량 비교
- **체중 관리**: 체중 변화 추이 및 BMI 모니터링

### 🏆 소셜 기능
- **랭킹 시스템**: 활동 점수 기반 사용자 랭킹
- **성취 시스템**: 목표 달성 배지 및 리워드
- **실시간 채팅**: WebSocket 기반 사용자 간 소통

### 📈 데이터 분석
- **자동화 파이프라인**: Apache Airflow 기반 일일 데이터 분석
- **통계 대시보드**: 개인 및 전체 사용자 통계 제공
- **트렌드 분석**: 시계열 데이터 기반 건강 트렌드 분석

## 🏗️ 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[React + Vite<br/>사용자 인터페이스]
    end
    
    subgraph "API Gateway Layer"
        CORE[Spring Boot API<br/>핵심 비즈니스 로직]
        AI[FastAPI<br/>AI 서비스]
    end
    
    subgraph "Data Processing Layer"
        AF[Apache Airflow<br/>데이터 파이프라인]
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL<br/>메인 데이터베이스)]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API<br/>AI 추천]
        SOCIAL[소셜 로그인<br/>(카카오, 구글)]
    end
    
    FE --> CORE
    FE --> AI
    CORE --> DB
    AI --> DB
    AI --> OPENAI
    CORE --> SOCIAL
    AF --> DB
    AF --> AI
```

## 🛠️ 기술 스택

### Backend
- **Core API**: Java 21, Spring Boot 3.5.0, Spring Security, JPA/Hibernate
- **AI API**: Python 3.11, FastAPI, OpenAI API, Pandas, NumPy
- **Database**: PostgreSQL 15+, Flyway (Migration)
- **Authentication**: JWT, OAuth2 (카카오, 구글)

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **UI Library**: Tailwind CSS, Radix UI, Shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts, Chart.js

### Data Processing
- **Pipeline**: Apache Airflow
- **Analytics**: Python, Pandas, Matplotlib, Seaborn

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (Reverse Proxy)
- **Deployment**: AWS EC2, Terraform, Ansible

## 🚀 시작하기

### 📋 사전 요구사항

- **Java**: OpenJDK 21+
- **Python**: 3.11.9
- **Node.js**: Latest LTS
- **pnpm**: Latest
- **Docker**: 20.10+
- **PostgreSQL**: 15+ (또는 Docker)

### 🔧 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/your-username/LifeBit.git
cd LifeBit
```

2. **데이터베이스 설정 (Docker)**
```bash
docker compose -f docker-compose.local.yml up -d
```

3. **의존성 설치**
```bash
# 프로젝트 루트에서
pnpm install

# AI API 의존성 설치
cd apps/ai-api-fastapi
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cd ../..

# Frontend 의존성 설치
cd apps/frontend-vite
pnpm install
cd ../..
```

4. **환경 변수 설정**
```bash
# AI API 환경 변수 (.env.example 참고)
cp apps/ai-api-fastapi/.env.example apps/ai-api-fastapi/.env

# Frontend 환경 변수
cp apps/frontend-vite/.env.example apps/frontend-vite/.env
```

5. **애플리케이션 실행**

**개별 실행:**
```bash
# 터미널 1: AI API
cd apps/ai-api-fastapi
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8001

# 터미널 2: Core API
cd apps/core-api-spring
./mvnw spring-boot:run

# 터미널 3: Frontend
cd apps/frontend-vite
pnpm dev
```

**통합 실행:**
```bash
# Windows
pnpm dev:windows

# macOS/Linux
pnpm dev:mac
```

### 🌐 서비스 접속

- **Frontend**: http://localhost:5173
- **Core API**: http://localhost:8080
- **AI API**: http://localhost:8001
- **API 문서**: http://localhost:8080/swagger-ui.html

## 📚 API 문서

### Core API 엔드포인트

| 기능 | 엔드포인트 | 메소드 | 설명 |
|------|------------|--------|------|
| 인증 | `/api/auth/login` | POST | 사용자 로그인 |
| 인증 | `/api/auth/signup` | POST | 사용자 회원가입 |
| 건강기록 | `/api/health-records` | GET/POST | 건강 기록 조회/등록 |
| 운동 | `/api/exercise-sessions` | GET/POST | 운동 세션 관리 |
| 식단 | `/api/meal-logs` | GET/POST | 식단 기록 관리 |
| 랭킹 | `/api/ranking` | GET | 사용자 랭킹 조회 |

### AI API 엔드포인트

| 기능 | 엔드포인트 | 메소드 | 설명 |
|------|------------|--------|------|
| 채팅 | `/api/ai/chat` | POST | AI 채팅 및 데이터 추출 |
| 추천 | `/api/ai/recommendations` | GET | 개인화 운동/식단 추천 |
| 분석 | `/api/ai/analytics` | GET | 건강 데이터 분석 |

상세한 API 문서는 [Swagger UI](http://localhost:8080/swagger-ui.html)에서 확인할 수 있습니다.

## 🚀 배포

### AWS 단일 인스턴스 배포

프로젝트는 Terraform과 Ansible을 사용한 자동화 배포를 지원합니다.

#### 사전 요구사항
- AWS CLI 설치 및 설정 (`aws configure`)
- Terraform 설치
- Ansible 설치
- `.env` 파일 설정 (키페어는 자동 생성됨)

#### 배포 실행
```bash
# 배포
./aws-deploy.sh deploy

# 리소스 삭제
./aws-deploy.sh destroy
```

#### 주요 개선사항
- **자동 키페어 생성**: 수동으로 키페어를 생성할 필요 없음
- **자동 정리**: destroy 시 키페어와 로컬 키 파일도 자동 삭제
- **배포 정보 추적**: `.deployment_info` 파일로 배포 상태 관리

자세한 배포 가이드는 [배포 가이드](docs/배포%20가이드.md)를 참조하세요.

### Docker 컨테이너 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d
```

## 📖 문서

프로젝트 관련 상세 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:

- [설치 방법](docs/설치%20방법.md) - 개발 환경 설정 가이드
- [실행 방법](docs/실행%20방법.md) - 애플리케이션 실행 가이드
- [배포 가이드](docs/배포%20가이드.md) - AWS 배포 자동화 가이드
- [데이터베이스 연결 방법](docs/데이터베이스%20연결%20방법.md) - DB 설정 가이드
- [Airflow 적용 가이드](docs/Airflow%20적용%20가이드.md) - 데이터 파이프라인 가이드
- [랭킹 등급 산정 로직 가이드](docs/랭킹%20등급%20산정%20로직%20가이드.md) - 랭킹 시스템 설명

## 🤝 기여하기

LifeBit 프로젝트에 기여해주셔서 감사합니다!

### 개발 프로세스

1. 이 저장소를 Fork 합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push 합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

### 코딩 컨벤션

- **Java**: Google Java Style Guide
- **TypeScript**: Prettier + ESLint 설정 준수
- **Python**: PEP 8 스타일 가이드

## 📄 라이선스

이 프로젝트는 ISC 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

LifeBit은 건강한 디지털 라이프스타일을 추구하는 개발팀에 의해 개발되었습니다.

---

<div align="center">

**🌟 건강한 습관, 스마트한 관리 - LifeBit과 함께하세요! 🌟**

[🚀 시작하기](#-시작하기) • [📚 문서](#-문서) • [🤝 기여하기](#-기여하기)

</div> 