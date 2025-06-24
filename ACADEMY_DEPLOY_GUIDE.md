# 🎓 LifeBit 학원용 네이버클라우드 배포 가이드

## 📋 개요

이 가이드는 **학원 프로젝트용**으로 최적화된 LifeBit 애플리케이션을 네이버클라우드에 배포하는 방법을 설명합니다.

### 🎯 학원용 특징
- **단일 서버 구성**: 모든 서비스를 하나의 VM에서 실행
- **비용 최적화**: 월 3-5만원 예상 비용
- **간단한 설정**: 복잡한 로드밸런서, Auto Scaling 없음
- **Docker Compose**: 모든 서비스를 컨테이너로 실행

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────┐
│           NCP Virtual Machine           │
│  ┌─────────────────────────────────────┐ │
│  │        Docker Compose              │ │
│  │  ┌──────────┬──────────┬─────────┐ │ │
│  │  │Frontend  │Spring API│ FastAPI │ │ │
│  │  │  :3000   │  :8080   │  :8001  │ │ │
│  │  └──────────┴──────────┴─────────┘ │ │
│  │  ┌──────────┬──────────┬─────────┐ │ │
│  │  │PostgreSQL│  Redis   │ Airflow │ │ │
│  │  │  :5432   │  :6379   │  :8081  │ │ │
│  │  └──────────┴──────────┴─────────┘ │ │
│  │  ┌──────────┬──────────┬─────────┐ │ │
│  │  │ Grafana  │Prometheus│  Nginx  │ │ │
│  │  │  :3001   │  :9090   │  :8082  │ │ │
│  │  └──────────┴──────────┴─────────┘ │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🚀 배포 단계

### 1단계: 사전 준비

#### 1.1 필수 도구 설치
```bash
# Terraform 설치 (macOS)
brew install terraform

# Terraform 설치 (Linux)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Ansible 설치
pip install ansible

# 추가 패키지 설치
ansible-galaxy collection install community.docker
```

#### 1.2 NCP 인증 정보 설정
```bash
# 환경 변수 설정
export NCP_ACCESS_KEY="your-access-key"
export NCP_SECRET_KEY="your-secret-key"

# 또는 .env 파일 생성
echo "NCP_ACCESS_KEY=your-access-key" > infrastructure/.env
echo "NCP_SECRET_KEY=your-secret-key" >> infrastructure/.env
```

### 2단계: Terraform 인프라 배포

#### 2.1 Terraform 초기화
```bash
cd infrastructure/
terraform init
```

#### 2.2 배포 계획 확인
```bash
terraform plan -var-file="single-server.tfvars" \
  -var="ncp_access_key=$NCP_ACCESS_KEY" \
  -var="ncp_secret_key=$NCP_SECRET_KEY"
```

#### 2.3 인프라 배포
```bash
terraform apply -var-file="single-server.tfvars" \
  -var="ncp_access_key=$NCP_ACCESS_KEY" \
  -var="ncp_secret_key=$NCP_SECRET_KEY"
```

#### 2.4 배포 결과 확인
```bash
# 서버 정보 출력
terraform output

# SSH 키 다운로드
terraform output -raw ssh_private_key > ~/.ssh/lifebit-demo-key.pem
chmod 600 ~/.ssh/lifebit-demo-key.pem
```

### 3단계: Ansible 애플리케이션 배포

#### 3.1 인벤토리 파일 업데이트
```bash
cd ../ansible/

# Terraform 출력에서 서버 IP 확인
SERVER_IP=$(cd ../infrastructure && terraform output -raw public_ip)

# inventory.ini 파일 수정
sed -i "s/YOUR_SERVER_IP_HERE/$SERVER_IP/g" inventory.ini
```

#### 3.2 연결 테스트
```bash
ansible -i inventory.ini lifebit_servers -m ping
```

#### 3.3 애플리케이션 배포
```bash
# 전체 배포 실행
ansible-playbook -i inventory.ini playbook.yml

# 특정 태그만 실행 (예: 설정만)
ansible-playbook -i inventory.ini playbook.yml --tags config

# 배포 확인만 실행
ansible-playbook -i inventory.ini playbook.yml --tags verify
```

### 4단계: 배포 확인

#### 4.1 서비스 상태 확인
```bash
# SSH 접속
ssh -i ~/.ssh/lifebit-demo-key.pem root@$SERVER_IP

# 서비스 상태 확인
lifebit-status

# 컨테이너 상태 확인
docker ps
```

#### 4.2 웹 접속 확인
```bash
# 브라우저에서 다음 URL 접속:
echo "Frontend:     http://$SERVER_IP:3000"
echo "Spring API:   http://$SERVER_IP:8080"
echo "FastAPI:      http://$SERVER_IP:8001"
echo "Nginx Proxy:  http://$SERVER_IP:8082"
echo "Grafana:      http://$SERVER_IP:3001"
echo "Prometheus:   http://$SERVER_IP:9090"
echo "Airflow:      http://$SERVER_IP:8081"
```

## 🔧 설정 및 사용자 정의

### 환경 변수 수정
```bash
# 서버에 SSH 접속 후
vim /opt/lifebit/.env

# 변경 후 서비스 재시작
cd /opt/lifebit
docker-compose -f docker-compose.single-server.yml restart
```

### 로그 확인
```bash
# 전체 로그
lifebit-logs

# 특정 서비스 로그
lifebit-logs spring-api
lifebit-logs fastapi
lifebit-logs frontend
```

### 서비스 재시작
```bash
cd /opt/lifebit

# 전체 재시작
docker-compose -f docker-compose.single-server.yml restart

# 특정 서비스만 재시작
docker-compose -f docker-compose.single-server.yml restart spring-app
```

## 💰 비용 관리

### 예상 비용 (월간)
- **VM 인스턴스**: 2-3만원 (2vCPU, 4GB RAM)
- **공인 IP**: 5천원
- **네트워크 트래픽**: 1-2만원 (사용량에 따라)
- **총 예상 비용**: 3-5만원

### 비용 절약 팁
1. **개발 완료 후 서버 중지**: 사용하지 않을 때는 VM 중지
2. **불필요한 트래픽 최소화**: 개발/테스트용으로만 사용
3. **정기적인 리소스 모니터링**: Grafana로 리소스 사용량 확인

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. Docker 컨테이너 시작 실패
```bash
# 로그 확인
docker logs [container-name]

# 메모리 부족 시
docker system prune -f
```

#### 2. 포트 접근 불가
```bash
# 방화벽 확인
ufw status

# 포트 열기
ufw allow [port-number]/tcp
```

#### 3. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker exec lifebit-postgres pg_isready -U lifebit_user

# 연결 테스트
docker exec lifebit-postgres psql -U lifebit_user -d lifebit_db -c "SELECT 1;"
```

### 로그 위치
- **시스템 로그**: `/var/log/lifebit-init.log`
- **애플리케이션 로그**: `/opt/lifebit/logs/`
- **Docker 로그**: `docker logs [container-name]`

## 🔄 업데이트 및 재배포

### 코드 업데이트
```bash
# 서버에서 직접 업데이트
cd /opt/lifebit
git pull origin main
docker-compose -f docker-compose.single-server.yml build
docker-compose -f docker-compose.single-server.yml up -d
```

### Ansible로 재배포
```bash
# 로컬에서 재배포
ansible-playbook -i inventory.ini playbook.yml --tags deploy
```

## 🗑️ 리소스 정리

### 전체 삭제
```bash
cd infrastructure/
terraform destroy -var-file="single-server.tfvars" \
  -var="ncp_access_key=$NCP_ACCESS_KEY" \
  -var="ncp_secret_key=$NCP_SECRET_KEY"
```

### 부분 삭제
```bash
# 특정 리소스만 삭제
terraform destroy -target=ncloud_server.web
```

## 📞 지원 및 문의

### 학원 프로젝트 지원
- **문서**: 이 가이드 및 README.md
- **로그**: 서버의 `/var/log/lifebit-*.log` 파일
- **모니터링**: Grafana 대시보드 (http://서버IP:3001)

### 유용한 명령어 요약
```bash
# 상태 확인
lifebit-status

# 로그 확인  
lifebit-logs [service-name]

# 서비스 재시작
docker-compose -f docker-compose.single-server.yml restart [service]

# 전체 재배포
ansible-playbook -i inventory.ini playbook.yml
```

---

🎉 **학원 프로젝트용 LifeBit 배포 가이드 완료!**

이 가이드를 따라하면 네이버클라우드에 완전한 LifeBit 애플리케이션을 배포할 수 있습니다. 문제가 발생하면 로그를 확인하고 문제 해결 섹션을 참조하세요. 