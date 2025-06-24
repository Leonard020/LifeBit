# 🚀 LifeBit 자동화 배포 가이드

이 문서는 LifeBit 프로젝트의 완전 자동화된 배포 파이프라인 사용법을 설명합니다.

## 📋 목차

- [사전 요구사항](#사전-요구사항)
- [초기 설정](#초기-설정)
- [배포 실행](#배포-실행)
- [관리 명령어](#관리-명령어)
- [트러블슈팅](#트러블슈팅)

## 🛠️ 사전 요구사항

### 필수 도구 설치

```bash
# Terraform 설치
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Ansible 설치
sudo apt update
sudo apt install ansible

# Docker & Docker Compose 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# jq 설치 (JSON 파싱용)
sudo apt install jq
```

### NCP (Naver Cloud Platform) 설정

1. [NCP 콘솔](https://console.ncloud.com)에 로그인
2. 마이페이지 > 계정 관리 > 인증키 관리에서 API 인증키 발급
3. 환경 변수 설정:

```bash
export NCP_ACCESS_KEY="your-access-key"
export NCP_SECRET_KEY="your-secret-key"
```

## ⚙️ 초기 설정

### 1. 환경 변수 설정

```bash
# 환경 변수 파일 복사 및 편집
cp .env.example .env
vi .env
```

### 2. Git 저장소 설정

```bash
# 실제 저장소 URL로 변경
git remote set-url origin https://github.com/your-username/lifebit.git
```

### 3. 스크립트 실행 권한 부여

```bash
chmod +x scripts/deploy.sh
chmod +x infrastructure/scripts/web-setup.sh
```

## 🚀 배포 실행

### 전체 자동 배포 (권장)

```bash
# 개발 환경 배포
./scripts/deploy.sh dev

# 스테이징 환경 배포
./scripts/deploy.sh staging

# 프로덕션 환경 배포
./scripts/deploy.sh prod
```

### 부분 배포 옵션

```bash
# 기존 인프라 강제 재생성
./scripts/deploy.sh dev --force

# Docker 빌드 건너뛰기
./scripts/deploy.sh dev --skip-build

# 애플리케이션만 배포 (인프라 건너뛰기)
./scripts/deploy.sh dev --only-app
```

### 수동 단계별 배포

#### 1. 인프라 배포 (Terraform)

```bash
cd infrastructure

# 초기화
terraform init

# 계획 확인
terraform plan \
  -var="ncp_access_key=$NCP_ACCESS_KEY" \
  -var="ncp_secret_key=$NCP_SECRET_KEY" \
  -var="environment=dev"

# 배포 실행
terraform apply
```

#### 2. 애플리케이션 배포 (Ansible)

```bash
# 인벤토리 파일 업데이트 (Terraform 출력값 사용)
cd ansible

# 배포 실행
ansible-playbook -i inventory.ini playbook.yml
```

## 📊 배포 후 확인

### 서비스 URL

배포 완료 후 다음 URL들을 통해 서비스에 접근할 수 있습니다:

- **웹사이트**: http://[서버IP]
- **Spring API 문서**: http://[서버IP]/api/swagger-ui.html
- **FastAPI 문서**: http://[서버IP]/api/py/docs
- **Airflow 웹 UI**: http://[서버IP]/airflow
- **헬스 체크**: http://[서버IP]/health

### 서비스 상태 확인

```bash
# 서버에 SSH 접속
ssh -i ~/.ssh/[key-name].pem ubuntu@[서버IP]

# Docker 컨테이너 상태 확인
docker ps

# 로그 확인
docker-compose logs -f

# 개별 서비스 로그
docker-compose logs fastapi-app
docker-compose logs spring-app
docker-compose logs frontend-app
```

## 🛠️ 관리 명령어

### 서비스 관리

```bash
# 서비스 재시작
docker-compose restart

# 특정 서비스 재시작
docker-compose restart fastapi-app

# 서비스 중지
docker-compose down

# 서비스 시작 (빌드 포함)
docker-compose up -d --build
```

### 백업 및 복원

```bash
# 수동 백업 실행
sudo /usr/local/bin/backup-lifebit.sh

# 백업 파일 확인
ls -la /opt/backups/

# 데이터베이스 복원
docker exec -i lifebit_postgres psql -U lifebit_user lifebit_db < backup.sql
```

### 모니터링

```bash
# 시스템 모니터링 실행
sudo /usr/local/bin/monitor-lifebit.sh

# 리소스 사용량 확인
docker stats

# 디스크 사용량 확인
df -h
```

## 🔧 트러블슈팅

### 일반적인 문제

#### 1. Docker 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs [서비스명]

# 컨테이너 재빌드
docker-compose build --no-cache [서비스명]
docker-compose up -d [서비스명]
```

#### 2. 데이터베이스 연결 오류

```bash
# PostgreSQL 컨테이너 상태 확인
docker exec lifebit_postgres pg_isready -U lifebit_user

# 데이터베이스 재시작
docker-compose restart postgres-db
```

#### 3. 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# 스왑 확인
swapon --show

# 불필요한 Docker 이미지 정리
docker system prune -a
```

#### 4. 포트 충돌

```bash
# 포트 사용 확인
netstat -tulpn | grep [포트번호]

# 프로세스 종료
sudo kill -9 [PID]
```

### 로그 위치

- **애플리케이션 로그**: `/opt/lifebit/logs/`
- **Nginx 로그**: `/var/log/nginx/`
- **시스템 로그**: `/var/log/syslog`
- **Docker 로그**: `docker-compose logs`

### 유용한 디버깅 명령어

```bash
# 네트워크 연결 테스트
curl -I http://localhost:80

# DNS 확인
nslookup [도메인명]

# 방화벽 상태 확인
sudo ufw status

# 서비스 포트 확인
sudo ss -tulwn
```

## 🔄 업데이트 및 롤백

### 애플리케이션 업데이트

```bash
# 코드 업데이트 후 재배포
./scripts/deploy.sh dev --only-app

# 또는 수동으로
cd /opt/lifebit
git pull
docker-compose build
docker-compose up -d
```

### 인프라 업데이트

```bash
# Terraform 계획 확인
cd infrastructure
terraform plan

# 업데이트 적용
terraform apply
```

### 롤백

```bash
# Git을 통한 코드 롤백
git checkout [이전-커밋-해시]
docker-compose build
docker-compose up -d

# 백업을 통한 데이터베이스 롤백
docker exec -i lifebit_postgres psql -U lifebit_user lifebit_db < /opt/backups/db_backup_[날짜].sql
```

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:

1. 이 문서의 트러블슈팅 섹션을 확인
2. GitHub Issues에 문제 보고
3. 로그 파일과 함께 상세한 오류 정보 제공

## 📝 추가 정보

- [Docker 공식 문서](https://docs.docker.com/)
- [Terraform 공식 문서](https://www.terraform.io/docs/)
- [Ansible 공식 문서](https://docs.ansible.com/)
- [NCP 사용자 가이드](https://guide.ncloud-docs.com/)

---

**⚠️ 주의사항:**
- 프로덕션 환경에서는 반드시 백업을 먼저 수행하세요
- 인증 정보를 절대 Git 저장소에 커밋하지 마세요
- 정기적으로 보안 업데이트를 확인하고 적용하세요 