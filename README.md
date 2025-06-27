# LifeBit - 건강 관리 플랫폼

LifeBit은 사용자의 건강한 라이프스타일을 돕는 종합적인 건강 관리 플랫폼입니다. 운동 기록, 식단 관리, AI 기반 추천 시스템을 통해 개인화된 건강 관리 서비스를 제공합니다.

## 🏗️ 프로젝트 구조

```
LifeBit/
├── apps/
│   ├── core-api-spring/          # Spring Boot 메인 API 서버 (포트: 8080)
│   ├── ai-api-fastapi/           # FastAPI AI 서비스 (포트: 8001)
│   ├── frontend-vite/            # React + Vite 프론트엔드 (포트: 5173)
│   └── airflow-pipeline/         # Airflow 데이터 파이프라인 (포트: 8080)
├── packages/
│   └── shared-types/             # 공유 TypeScript 타입 정의
├── scripts/                      # 실행 스크립트
├── infrastructure/               # 인프라 자동화 (Terraform + Ansible)
├── docker-compose.local.yml      # 로컬 개발용 Docker 설정
└── LifeBit.sql                   # PostgreSQL 스키마 및 초기 데이터
```

## 🛠️ 기술 스택

### Backend
- **Core API**: Spring Boot 3.5.0, Java 21, PostgreSQL
- **AI API**: FastAPI, Python 3.11+, OpenAI GPT
- **Database**: PostgreSQL 16
- **Data Pipeline**: Apache Airflow

### Frontend
- **Framework**: React 18, TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI, Tailwind CSS
- **State Management**: TanStack Query
- **Package Manager**: pnpm

### Infrastructure & DevOps
- **Cloud**: AWS EC2 (단일 인스턴스)
- **Container**: Docker & Docker Compose
- **IaC**: Terraform
- **Configuration Management**: Ansible
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt

## 🌐 서비스 포트 정보

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend (Nginx) | 80/443 | 웹 서버 (HTTP/HTTPS) |
| Core API (Spring) | 8080 | 메인 API 서버 |
| AI API (FastAPI) | 8001 | AI 서비스 API |
| PostgreSQL | 5432 | 데이터베이스 |
| Airflow Web UI | 8080 | 데이터 파이프라인 관리 |

## 🚀 자동화 배포 아키텍처

### AWS 단일 인스턴스 구성
```
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 t3.medium                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Nginx     │  │   Docker    │  │ PostgreSQL  │         │
│  │  (80/443)   │  │   Compose   │  │   (5432)    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Docker Containers                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Frontend    │  │ Core API    │  │ AI API      │ │   │
│  │  │ (React)     │  │ (Spring)    │  │ (FastAPI)   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📋 배포 전제 조건

### 1. AWS 계정 및 권한
- AWS 계정 생성
- IAM 사용자 생성 (EC2, RDS, S3 권한)
- AWS CLI 설정
- SSH 키페어 생성

### 2. 도메인 설정
- 도메인 구매 또는 기존 도메인 준비
- Route 53에서 도메인 관리
- SSL 인증서 발급 준비

### 3. 환경 변수 준비
```bash
# AWS 설정
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="ap-northeast-2"

# 도메인 설정
export DOMAIN_NAME="your-domain.com"
export SUBDOMAIN="api.your-domain.com"

# 데이터베이스 설정
export DB_PASSWORD="secure-password-here"
export DB_NAME="lifebit_db"
export DB_USER="lifebit_user"

# OpenAI API 키
export OPENAI_API_KEY="your-openai-api-key"

# 소셜 로그인 설정
export KAKAO_CLIENT_ID="your-kakao-client-id"
export GOOGLE_CLIENT_ID="your-google-client-id"
```

## 🔧 로컬 개발 환경 (기존 유지)

### 사전 요구사항
- Node.js 18+
- Java 21
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16

### 1. 저장소 클론
```bash
git clone <repository-url>
cd LifeBit
```

### 2. 환경 변수 설정
```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env

# 각 서비스별 환경 변수 설정
cp apps/ai-api-fastapi/.env.example apps/ai-api-fastapi/.env
cp apps/frontend-vite/.env.example apps/frontend-vite/.env
```

### 3. 데이터베이스 실행
```bash
# PostgreSQL 컨테이너 실행
docker-compose -f docker-compose.local.yml up -d postgres-db
```

### 4. 의존성 설치
```bash
# 루트 레벨 의존성
pnpm install

# 프론트엔드 의존성
cd apps/frontend-vite
pnpm install

# AI API 의존성
cd ../ai-api-fastapi
pip install -r requirements.txt

# Core API 의존성 (Maven이 자동으로 처리)
cd ../core-api-spring
```

### 5. 개발 서버 실행
```bash
# Windows
pnpm run dev:windows

# macOS/Linux
pnpm run dev:mac
```

## 🚀 자동화 배포 프로세스

### 1단계: 인프라 프로비저닝 (Terraform)

#### Terraform 구성 파일 구조
```
infrastructure/
├── terraform/
│   ├── main.tf              # 메인 Terraform 설정
│   ├── variables.tf         # 변수 정의
│   ├── outputs.tf           # 출력 값
│   ├── providers.tf         # AWS 프로바이더 설정
│   ├── security.tf          # 보안 그룹 설정
│   ├── ec2.tf              # EC2 인스턴스 설정
│   └── route53.tf          # DNS 설정
├── ansible/
│   ├── inventory/
│   │   └── hosts.yml       # 인벤토리 파일
│   ├── group_vars/
│   │   └── all.yml         # 공통 변수
│   ├── roles/
│   │   ├── common/         # 기본 시스템 설정
│   │   ├── docker/         # Docker 설치
│   │   ├── nginx/          # Nginx 설정
│   │   ├── postgresql/     # PostgreSQL 설정
│   │   ├── ssl/            # SSL 인증서 설정
│   │   └── deploy/         # 애플리케이션 배포
│   └── playbook.yml        # 메인 플레이북
└── scripts/
    ├── deploy.sh           # 배포 스크립트
    └── rollback.sh         # 롤백 스크립트
```

#### Terraform 실행
```bash
cd infrastructure/terraform

# 초기화
terraform init

# 계획 확인
terraform plan

# 인프라 생성
terraform apply
```

### 2단계: 서버 설정 (Ansible)

#### Ansible 플레이북 실행
```bash
cd infrastructure/ansible

# 서버 설정
ansible-playbook -i inventory/hosts.yml playbook.yml

# SSL 인증서 설정
ansible-playbook -i inventory/hosts.yml playbook.yml --tags ssl
```

### 3단계: 애플리케이션 배포

#### Docker Compose 프로덕션 설정
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: lifebit_postgres_prod
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./LifeBit.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped

  core-api:
    build: ./apps/core-api-spring
    container_name: lifebit_core_api
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/${DB_NAME}
      SPRING_DATASOURCE_USERNAME: ${DB_USER}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:8080:8080"
    depends_on:
      - postgres
    restart: unless-stopped

  ai-api:
    build: ./apps/ai-api-fastapi
    container_name: lifebit_ai_api
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "127.0.0.1:8001:8001"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build: ./apps/frontend-vite
    container_name: lifebit_frontend
    ports:
      - "127.0.0.1:3000:80"
    restart: unless-stopped

volumes:
  postgres_data:
```

## 💰 비용 최적화 전략

### 1. 인스턴스 선택
- **t3.medium**: 2 vCPU, 4GB RAM (월 약 $30)
- 스팟 인스턴스 고려 (50-70% 절약 가능)

### 2. 스토리지 최적화
- EBS gp3 볼륨 사용 (gp2 대비 20% 절약)
- 필요한 최소 용량만 할당

### 3. 네트워크 최적화
- 단일 AZ 사용
- 데이터 전송 최소화

### 4. 모니터링 및 로깅
- CloudWatch 기본 모니터링만 사용
- 상세 모니터링 비활성화

### 5. 백업 전략
- EBS 스냅샷 주기적 생성
- S3에 로그 백업 (IA 스토리지 사용)

## 🔒 보안 설정

### 1. 네트워크 보안
```terraform
# security.tf
resource "aws_security_group" "lifebit_sg" {
  name        = "lifebit-security-group"
  description = "Security group for LifeBit application"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # SSH (제한 필요)
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 2. 애플리케이션 보안
- 환경 변수로 민감 정보 관리
- HTTPS 강제 적용
- CORS 설정 최적화
- JWT 토큰 관리

## 📊 모니터링 및 로깅

### 1. 애플리케이션 모니터링
```yaml
# docker-compose.prod.yml에 추가
services:
  prometheus:
    image: prom/prometheus
    container_name: lifebit_prometheus
    ports:
      - "127.0.0.1:9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    container_name: lifebit_grafana
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

### 2. 로그 관리
```yaml
# docker-compose.prod.yml에 추가
services:
  loki:
    image: grafana/loki
    container_name: lifebit_loki
    ports:
      - "127.0.0.1:3100:3100"

  promtail:
    image: grafana/promtail
    container_name: lifebit_promtail
    volumes:
      - /var/log:/var/log
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
```

## 🔄 CI/CD 파이프라인

### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-northeast-2
    
    - name: Deploy with Ansible
      run: |
        cd infrastructure/ansible
        ansible-playbook -i inventory/hosts.yml playbook.yml --tags deploy
```

## 🚨 장애 대응 및 롤백

### 1. 자동 롤백 스크립트
```bash
#!/bin/bash
# scripts/rollback.sh

echo "Starting rollback process..."

# 이전 버전으로 롤백
docker-compose -f docker-compose.prod.yml down
docker image tag lifebit_frontend:previous lifebit_frontend:latest
docker-compose -f docker-compose.prod.yml up -d

echo "Rollback completed"
```

### 2. 헬스 체크
```bash
#!/bin/bash
# scripts/health-check.sh

# 각 서비스 헬스 체크
curl -f http://localhost:8080/actuator/health || exit 1
curl -f http://localhost:8001/health || exit 1
curl -f http://localhost:3000 || exit 1

echo "All services are healthy"
```

## 📝 배포 체크리스트

### 배포 전 확인사항
- [ ] AWS 계정 및 권한 설정 완료
- [ ] 도메인 및 SSL 인증서 준비
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 백업 (필요시)
- [ ] 로컬 테스트 완료

### 배포 중 확인사항
- [ ] Terraform 인프라 생성 성공
- [ ] Ansible 서버 설정 완료
- [ ] Docker 컨테이너 실행 확인
- [ ] 데이터베이스 연결 확인
- [ ] SSL 인증서 적용 확인

### 배포 후 확인사항
- [ ] 웹사이트 접속 확인
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 연결 테스트
- [ ] 로그 모니터링 설정
- [ ] 백업 스케줄 설정

## 🆘 문제 해결

### 일반적인 문제들
1. **포트 충돌**: `netstat -tulpn | grep :포트번호`
2. **메모리 부족**: `free -h` 및 컨테이너 리소스 제한
3. **디스크 공간**: `df -h` 및 로그 정리
4. **네트워크 연결**: `ping` 및 `telnet` 테스트

### 로그 확인
```bash
# Docker 로그 확인
docker logs lifebit_core_api
docker logs lifebit_ai_api
docker logs lifebit_frontend

# 시스템 로그 확인
journalctl -u docker
journalctl -u nginx
```

## 📞 지원 및 연락처

- **프로젝트 리더**: [이름]
- **기술 문의**: [이메일]
- **문서**: [위키 링크]

---

**주의사항**: 이 배포 가이드는 학원 프로젝트용으로 작성되었으며, 프로덕션 환경에서는 추가적인 보안 및 성능 최적화가 필요할 수 있습니다. 