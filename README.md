# 🏃‍♀️ LifeBit - AI 기반 개인 건강 관리 플랫폼

[공식 GitHub 저장소 바로가기](https://github.com/Hyeon6492/LifeBit?tab=readme-ov-file#-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%86%8C%EA%B0%9C)

---

<p align="center">
  <a href="https://lifebit.store/" target="_blank" style="font-size:1.2em; font-weight:bold; background:#f5f5f5; border-radius:8px; padding:8px 18px; color:#4f46e5; text-decoration:none; border:1px solid #e0e0e0;">
    🚀 <b>실서비스 바로가기: https://lifebit.store/</b>
  </a>
</p>

---

## 📋 목차
- [프로젝트 소개 및 방향성](#-프로젝트-소개-및-방향성)
- [주요 기능](#-주요-기능)
- [시스템 아키텍처](#-시스템-아키텍처)
- [기술 스택](#-기술-스택)
- [폴더/파일 구조](#-주요-폴더파일-구조)
- [시작하기](#-시작하기)
- [API 문서](#-api-문서)
- [배포](#-배포)
- [문서](#-문서)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

---

## 🌟 프로젝트 소개 및 방향성

**LifeBit**은 AI와 데이터 기반의 스마트 건강관리 플랫폼입니다. 
운동, 식단, 체중, 랭킹, 업적 등 건강의 모든 여정을 한 곳에서 관리하며, 
AI 추천·실시간 소통·개인화·소셜 동기부여를 통해 건강한 습관을 만들고 유지할 수 있도록 돕습니다.

- **AI 기반 개인화 건강관리**: GPT 기반 맞춤형 운동/식단 추천
- **실시간 소통**: 자연어 채팅, 실시간 피드백
- **포괄적 건강 추적**: 운동/식단/체중/랭킹/업적 통합 관리
- **소셜 동기부여**: 랭킹, 배지, 실시간 채팅 등 커뮤니티 기능
- **확장성**: 클라우드 인프라, IaC, 컨테이너 기반 설계

---

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
- **자동화 파이프라인**: Apache Airflow 기반 일일 데이터 분석 (설계만 존재, 미구현)
- **통계 대시보드**: 개인 및 전체 사용자 통계 제공
- **트렌드 분석**: 시계열 데이터 기반 건강 트렌드 분석

---

## 🏗️ 시스템 아키텍처

```mermaid
graph TB
    FE([🖥️ Frontend: React+Vite])
    CORE([🛠️ Core API: Spring Boot])
    AI([🤖 AI API: FastAPI])
    AF([📊 Airflow Pipeline])
    DB[(🗄️ PostgreSQL)]
    OPENAI([🌐 OpenAI API])
    SOCIAL([🔑 소셜 로그인: 카카오, 구글])

    FE --> CORE
    FE --> AI
    CORE --> DB
    AI --> DB
    AI --> OPENAI
    CORE --> SOCIAL
    AF --> DB
    AF --> AI
```

| 구성요소 | 설명 |
|---|---|
| 🖥️ Frontend | React+Vite 기반 사용자 인터페이스 |
| 🛠️ Core API | Spring Boot, 핵심 비즈니스 로직 및 인증/데이터 처리 |
| 🤖 AI API | FastAPI, AI 추천·분석 서비스 (OpenAI 연동) |
| 📊 Airflow Pipeline | 데이터 분석/자동화 파이프라인 (설계만 존재) |
| 🗄️ PostgreSQL | 메인 데이터베이스 |
| 🌐 OpenAI API | GPT 기반 AI 추천/분석 외부 서비스 |
| 🔑 소셜 로그인 | 카카오/구글 등 외부 인증 연동 |

---

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
- **Pipeline**: Apache Airflow (폴더/설계만 존재, 미구현)
- **Analytics**: Python, Pandas, Matplotlib, Seaborn

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (Reverse Proxy)
- **Deployment**: AWS EC2, Terraform, Ansible

---

## 📁 주요 폴더/파일 구조

```
LifeBit/
  ├── apps/
  │   ├── core-api-spring/      # Spring Boot 백엔드
  │   ├── ai-api-fastapi/       # FastAPI AI API
  │   ├── airflow-pipeline/     # (설계만 존재, 미구현) 데이터 파이프라인
  │   └── frontend-vite/        # React 프론트엔드
  ├── infrastructure/           # IaC, Nginx, Terraform, Ansible 등
  ├── scripts/                  # 배포/운영 스크립트
  ├── docs/                     # 프로젝트 문서
  ├── LifeBit.sql               # DB 스키마
  ├── trigger.sql               # DB 트리거/함수
  ├── docker-compose.local.yml  # 로컬 개발용 도커 컴포즈
  ├── docker-compose.prod.yml   # 프로덕션 도커 컴포즈
  └── README.md
```

---

## 🚀 시작하기

### 📋 사전 요구사항
- **Java**: OpenJDK 21+
- **Python**: 3.11.9
- **Node.js**: Latest LTS
- **pnpm**: Latest
- **Docker**: 20.10+
- **PostgreSQL**: 15+ (또는 Docker)

### 🔧 설치 및 실행

1. **저장소 다운로드**
   - **Git 사용:**
     ```bash
     git clone https://github.com/Hyeon6492/LifeBit.git
     cd LifeBit
     ```
   - **또는 GitHub 웹사이트에서 ZIP 다운로드:**
     - [https://github.com/Hyeon6492/LifeBit](https://github.com/Hyeon6492/LifeBit) 접속 → Code 버튼 클릭 → Download ZIP
     - 압축 해제 후 원하는 폴더에서 사용

2. **데이터베이스 설정 (Docker)**
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```
   - 컨테이너 중지 및 삭제(정리) 시:
     ```bash
     docker compose -f docker-compose.local.yml down
     ```
     위 명령어는 모든 컨테이너를 중지하고, 네트워크/볼륨 등도 정리합니다.

3. **의존성 설치**
```bash
# 프로젝트 루트에서
pnpm install

# AI API 의존성 설치
cd apps/ai-api-fastapi
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cd ../..

# Frontend 의존성 설치
cd apps/frontend-vite
pnpm install
cd ../..
```
4. **환경 변수 설정**
```bash
cp apps/ai-api-fastapi/.env.example apps/ai-api-fastapi/.env
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

---

## 🌐 서비스 접속

- <span style="font-size:1.1em; font-weight:bold; color:#4f46e5;">🌐 <a href="https://lifebit.store/" target="_blank">https://lifebit.store</a> (실제 배포 서비스, 도메인 연결 완료)</span>
- **로컬 프론트엔드**: http://localhost:5173
- **Core API**: http://localhost:8080
- **AI API**: http://localhost:8001
- **API 문서**: http://localhost:8080/swagger-ui.html

> **lifebit.store**는 실제 도메인에 연결된 배포 버전입니다. 언제든 접속하여 최신 기능을 체험해보세요!

---

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

---

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

---

## ⚠️ Airflow 데이터 파이프라인 안내
- `apps/airflow-pipeline/` 폴더는 설계/예정 상태이며, 실제 파이프라인 구현은 추후 진행됩니다.

---

## 📚 문서
프로젝트 관련 상세 문서는 `docs/` 디렉토리에서 확인할 수 있습니다:
- [설치 방법](docs/설치%20방법.md)
- [실행 방법](docs/실행%20방법.md)
- [배포 가이드](docs/배포%20가이드.md)
- [데이터베이스 연결 방법](docs/데이터베이스%20연결%20방법.md)
- [랭킹 등급 산정 로직 가이드](docs/랭킹%20등급%20산정%20로직%20가이드.md)
- [Airflow 적용 가이드](docs/Airflow%20적용%20가이드.md)

---

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

---

## 📄 라이선스
이 프로젝트는 ISC 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👥 팀
LifeBit은 건강한 디지털 라이프스타일을 추구하는 개발팀에 의해 개발되었습니다.

---

**🌟 건강한 습관, 스마트한 관리 - LifeBit과 함께하세요! 🌟**

[🚀 시작하기](#-시작하기) • [📚 문서](#-문서) • [🤝 기여하기](#-기여하기) 