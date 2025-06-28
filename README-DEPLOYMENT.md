# LifeBit AWS 배포 가이드

이 문서는 LifeBit 애플리케이션을 AWS에 배포하는 방법을 설명합니다.

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [배포 과정](#배포-과정)
3. [리소스 정리](#리소스-정리)
4. [트러블슈팅](#트러블슈팅)
5. [비용 정보](#비용-정보)

## 🛠️ 사전 요구사항

### 필수 도구 설치

1. **Terraform** (v1.0+)
   ```bash
   # macOS
   brew install terraform
   
   # Ubuntu/Debian
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   ```

2. **Ansible** (v2.9+)
   ```bash
   # macOS
   brew install ansible
   
   # Ubuntu/Debian
   sudo apt install ansible
   
   # Python pip
   pip install ansible
   ```

3. **AWS CLI** (v2.0+)
   ```bash
   # macOS
   brew install awscli
   
   # Ubuntu/Debian
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

### AWS 자격 증명 설정

```bash
aws configure
```

다음 정보를 입력하세요:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name: `ap-northeast-2`
- Default output format: `json`

## 🚀 배포 과정

### 1. 환경 변수 설정 (선택사항)

```bash
export AWS_REGION="ap-northeast-2"
export PROJECT_NAME="lifebit"
export ENVIRONMENT="production"
export INSTANCE_TYPE="t3.medium"
```

### 2. 배포 실행

```bash
./aws-deploy.sh
```

배포 과정:
1. **사전 검사** (1분): 필수 도구 및 AWS 자격 증명 확인
2. **SSH 키 생성** (1분): 배포용 SSH 키 페어 생성
3. **인프라 생성** (3-5분): Terraform으로 AWS 리소스 생성
4. **인스턴스 초기화** (3-5분): EC2 인스턴스 부팅 및 Docker 설치
5. **애플리케이션 배포** (10-15분): Ansible로 애플리케이션 배포

### 3. 배포 완료 확인

배포가 완료되면 다음 URL에서 애플리케이션에 접근할 수 있습니다:

- **프론트엔드**: `http://[EC2_IP]:3000`
- **Core API**: `http://[EC2_IP]:8080`
- **AI API**: `http://[EC2_IP]:8001`
- **통합 접근**: `http://[EC2_IP]` (Nginx 리버스 프록시)

## 🗑️ 리소스 정리

### 모든 AWS 리소스 삭제

```bash
./aws-destroy.sh
```

⚠️ **주의**: 이 명령은 다음을 완전히 삭제합니다:
- EC2 인스턴스 및 모든 데이터
- Elastic IP
- VPC 및 네트워킹 리소스
- 보안 그룹
- 키 페어

## 🔧 트러블슈팅

### 일반적인 문제

#### 1. SSH 연결 실패
```bash
# SSH 키 권한 확인
ls -la ~/.ssh/lifebit_key*
chmod 600 ~/.ssh/lifebit_key

# 수동 SSH 연결 테스트
ssh -i ~/.ssh/lifebit_key ubuntu@[EC2_IP]
```

#### 2. Docker 서비스 확인
```bash
# EC2 인스턴스에 접속 후
sudo systemctl status docker
docker ps
docker-compose -f docker-compose.prod.yml ps
```

#### 3. 애플리케이션 로그 확인
```bash
# 컨테이너 로그 확인
docker logs lifebit_core_api_prod
docker logs lifebit_ai_api_prod
docker logs lifebit_frontend_prod
docker logs lifebit_postgres_prod
```

#### 4. 포트 접근 문제
```bash
# 방화벽 상태 확인
sudo ufw status

# 포트 열기
sudo ufw allow 3000
sudo ufw allow 8080
sudo ufw allow 8001
```

### 헬스체크 URL

- **Core API**: `http://[EC2_IP]:8080/actuator/health`
- **AI API**: `http://[EC2_IP]:8001/health`
- **Frontend**: `http://[EC2_IP]:3000`

## 💰 비용 정보

### 예상 월 비용 (서울 리전 기준)

| 리소스 | 타입 | 월 비용 (USD) |
|--------|------|---------------|
| EC2 인스턴스 | t3.medium | ~$30 |
| EBS 볼륨 | gp3 30GB | ~$3 |
| Elastic IP | 1개 | ~$4 |
| 데이터 전송 | 1GB | ~$1 |
| **총 예상 비용** | | **~$38** |

### 비용 최적화 팁

1. **사용하지 않을 때 인스턴스 중지**
   ```bash
   aws ec2 stop-instances --instance-ids [INSTANCE_ID]
   ```

2. **완전한 리소스 정리**
   ```bash
   ./aws-destroy.sh
   ```

3. **더 작은 인스턴스 타입 사용**
   ```bash
   export INSTANCE_TYPE="t3.small"  # ~$15/월
   ./aws-deploy.sh
   ```

## 📊 모니터링

### 시스템 리소스 모니터링

```bash
# EC2 인스턴스 접속 후
htop                    # CPU/메모리 사용률
df -h                   # 디스크 사용률
docker stats            # 컨테이너 리소스 사용률
```

### 애플리케이션 모니터링

```bash
# 서비스 상태 확인
curl http://localhost:8080/actuator/health
curl http://localhost:8001/health

# 로그 실시간 모니터링
docker logs -f lifebit_core_api_prod
```

## 🔒 보안 고려사항

1. **SSH 키 관리**: SSH 키를 안전하게 보관하고 공유하지 마세요
2. **환경 변수**: API 키 등 민감한 정보는 환경 변수로 관리
3. **방화벽**: 필요한 포트만 열어두세요
4. **정기 업데이트**: 시스템 및 애플리케이션 정기 업데이트

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. 배포 로그: 스크립트 실행 중 출력된 로그
2. AWS 콘솔: EC2, VPC 등 리소스 상태
3. 애플리케이션 로그: Docker 컨테이너 로그
4. 시스템 로그: `/var/log/` 디렉토리

---

**참고**: 이 배포 설정은 학원 프로젝트 및 데모 목적으로 최적화되어 있습니다. 프로덕션 환경에서는 추가적인 보안 및 확장성 고려사항이 필요할 수 있습니다. 