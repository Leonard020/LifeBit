# LifeBit AWS 배포 가이드

## 🚀 개요

LifeBit 프로젝트를 AWS EC2 환경에 자동으로 배포하는 가이드입니다.

### 📋 요구사항

- AWS 계정 및 Access Key/Secret Key
- Terraform (>= 1.0)
- Ansible (>= 2.9)
- AWS CLI (>= 2.0)

### 💰 예상 비용

- **t3.small (2vCPU, 2GB RAM)**: 월 2-3만원
- **EIP**: 무료 (EC2와 연결된 경우)
- **데이터 전송**: 월 1GB 무료

## 🔧 빠른 시작

### 1. 환경 설정

```bash
# AWS 인증 정보 설정
export AWS_ACCESS_KEY_ID='your-access-key'
export AWS_SECRET_ACCESS_KEY='your-secret-key'
export AWS_DEFAULT_REGION='ap-northeast-2'

# 자동 설정 스크립트 실행
./setup-aws.sh
```

### 2. 자동 배포

```bash
# 전체 배포 (Terraform + Ansible)
./deploy-aws.sh
```

## 📁 프로젝트 구조

```
LifeBit/
├── infrastructure/          # Terraform 인프라 코드
│   ├── main.tf             # AWS 리소스 정의
│   ├── variables.tf        # 변수 정의
│   ├── outputs.tf          # 출력 값
│   ├── terraform.tfvars    # 기본 변수 값
│   └── single-server.tfvars # 단일 서버 설정
├── ansible/                # Ansible 배포 코드
│   ├── inventory.ini       # 서버 목록
│   ├── playbook.yml        # 배포 플레이북
│   ├── group_vars/         # 그룹 변수
│   └── templates/          # 템플릿 파일
├── apps/                   # 애플리케이션 코드
├── LifeBit.sql            # 데이터베이스 스키마
├── setup-aws.sh           # AWS 환경 설정
├── deploy-aws.sh          # 자동 배포 스크립트
├── aws-cleanup.sh         # AWS 리소스 정리
└── ncloud-cleanup.sh      # NCP 리소스 정리
```

## 🏗️ 인프라 구성

### AWS 리소스

- **VPC**: 10.0.0.0/16
- **퍼블릭 서브넷**: 10.0.1.0/24 (ap-northeast-2a)
- **EC2 인스턴스**: t3.small (Ubuntu 22.04 LTS)
- **보안 그룹**: 모든 포트 허용 (데모용)
- **EIP**: 고정 퍼블릭 IP
- **SSH 키**: 자동 생성

### 애플리케이션 서비스

- **Frontend (React)**: 포트 3000
- **Spring Boot API**: 포트 8080
- **FastAPI**: 포트 8001
- **Airflow**: 포트 8081
- **Grafana**: 포트 3001
- **Prometheus**: 포트 9090
- **Nginx Proxy**: 포트 8082
- **PostgreSQL**: 포트 5432 (Docker)

## 🔄 배포 프로세스

### 1단계: Terraform 인프라 생성
```bash
cd infrastructure
terraform init
terraform plan -var-file=single-server.tfvars
terraform apply -var-file=single-server.tfvars
```

### 2단계: SSH 키 저장
```bash
terraform output -raw ssh_private_key > ~/.ssh/lifebit.pem
chmod 600 ~/.ssh/lifebit.pem
```

### 3단계: Ansible inventory 업데이트
```bash
# 퍼블릭 IP 확인
terraform output public_ip

# inventory.ini 파일에서 YOUR_AWS_EC2_PUBLIC_IP_HERE를 실제 IP로 변경
```

### 4단계: Ansible 배포
```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
```

## 🗄️ 데이터베이스 초기화

PostgreSQL은 Docker Compose로 실행되며, `LifeBit.sql` 파일이 자동으로 적용됩니다:

- 테이블 생성
- 함수 및 트리거 설정
- 인덱스 생성
- 초기 데이터 삽입

## 🔍 모니터링

### 시스템 모니터링
- **Node Exporter**: 시스템 메트릭 수집
- **Prometheus**: 메트릭 저장
- **Grafana**: 대시보드 시각화

### 애플리케이션 모니터링
- **헬스체크**: 5분마다 자동 실행
- **메모리 모니터링**: 10분마다 자동 실행
- **로그 로테이션**: 일별 자동 정리

## 🛠️ 관리 명령어

### 서비스 상태 확인
```bash
# SSH 접속
ssh -i ~/.ssh/lifebit.pem ubuntu@<PUBLIC_IP>

# Docker 컨테이너 상태
docker-compose ps

# 시스템 서비스 상태
systemctl status docker nginx fail2ban node_exporter
```

### 로그 확인
```bash
# 애플리케이션 로그
docker-compose logs -f

# 시스템 로그
tail -f /opt/lifebit/logs/health-check.log
tail -f /opt/lifebit/logs/memory.log
```

### 백업
```bash
# 데이터베이스 백업
docker-compose exec postgres-db pg_dump -U lifebit_user lifebit_db > backup.sql
```

## 🧹 정리

### AWS 리소스 정리
```bash
# 전체 리소스 정리
./aws-cleanup.sh all

# 또는 수동 정리
cd infrastructure
terraform destroy -var-file=single-server.tfvars
```

### 로컬 정리
```bash
# SSH 키 삭제
rm ~/.ssh/lifebit.pem

# Terraform 캐시 정리
cd infrastructure
rm -rf .terraform terraform.tfstate*
```

## 🔧 문제 해결

### SSH 연결 실패
```bash
# EC2 인스턴스 상태 확인
aws ec2 describe-instances --instance-ids <INSTANCE_ID>

# 보안 그룹 확인
aws ec2 describe-security-groups --group-ids <SG_ID>
```

### Docker 컨테이너 문제
```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs <SERVICE_NAME>
```

### 메모리 부족
```bash
# 메모리 사용량 확인
free -h
docker stats

# 불필요한 컨테이너 정리
docker system prune -f
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. AWS 인증 정보가 올바른지 확인
2. EC2 인스턴스가 실행 중인지 확인
3. 보안 그룹에서 SSH 포트(22)가 열려있는지 확인
4. Ansible 플레이북 로그 확인

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 