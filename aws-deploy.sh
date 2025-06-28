#!/bin/bash

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 배너 출력
echo -e "${BLUE}"
cat << "EOF"
 _      _  __      ____  _ _   
| |    (_)/ _|    |  _ \(_) |  
| |     _| |_ ___ | |_) |_| |_ 
| |    | |  _/ _ \|  _ <| | __|
| |____| | ||  __/| |_) | | |_ 
|______|_|_| \___||____/|_|\__|
                               
AWS 배포 시작...
EOF
echo -e "${NC}"

# 환경 변수 설정
export AWS_REGION="${AWS_REGION:-ap-northeast-2}"
export PROJECT_NAME="${PROJECT_NAME:-lifebit}"
export ENVIRONMENT="${ENVIRONMENT:-production}"
export INSTANCE_TYPE="${INSTANCE_TYPE:-t3.medium}"

log_info "배포 설정:"
log_info "  - AWS Region: $AWS_REGION"
log_info "  - Project Name: $PROJECT_NAME"
log_info "  - Environment: $ENVIRONMENT"
log_info "  - Instance Type: $INSTANCE_TYPE"

# 필수 도구 확인
log_info "필수 도구 확인 중..."

command -v terraform >/dev/null 2>&1 || {
    log_error "Terraform이 설치되지 않았습니다. https://terraform.io/downloads 에서 설치해주세요."
    exit 1
}

command -v ansible >/dev/null 2>&1 || {
    log_error "Ansible이 설치되지 않았습니다. 'pip install ansible' 또는 패키지 매니저로 설치해주세요."
    exit 1
}

command -v aws >/dev/null 2>&1 || {
    log_error "AWS CLI가 설치되지 않았습니다. https://aws.amazon.com/cli/ 에서 설치해주세요."
    exit 1
}

log_success "모든 필수 도구가 설치되어 있습니다."

# AWS 자격 증명 확인
log_info "AWS 자격 증명 확인 중..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    log_error "AWS 자격 증명이 설정되지 않았습니다. 'aws configure'를 실행해주세요."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_success "AWS 계정 ID: $AWS_ACCOUNT_ID"

# SSH 키 생성 (존재하지 않는 경우)
SSH_KEY_PATH="$HOME/.ssh/lifebit_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    log_info "SSH 키 생성 중..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "lifebit-deployment-key"
    chmod 600 "$SSH_KEY_PATH"
    chmod 644 "${SSH_KEY_PATH}.pub"
    log_success "SSH 키가 생성되었습니다: $SSH_KEY_PATH"
else
    log_info "기존 SSH 키를 사용합니다: $SSH_KEY_PATH"
fi

# Terraform 디렉토리로 이동
cd infrastructure/terraform

# Terraform 초기화
log_info "Terraform 초기화 중..."
terraform init

# Terraform 계획 확인
log_info "Terraform 실행 계획 확인 중..."
terraform plan \
    -var="aws_region=$AWS_REGION" \
    -var="project_name=$PROJECT_NAME" \
    -var="environment=$ENVIRONMENT" \
    -var="instance_type=$INSTANCE_TYPE" \
    -var="public_key_path=${SSH_KEY_PATH}.pub"

# 사용자 확인
echo ""
log_warning "위의 Terraform 계획을 검토하세요."
read -p "계속 진행하시겠습니까? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "배포가 취소되었습니다."
    exit 0
fi

# Terraform 적용
log_info "AWS 인프라 생성 중... (약 3-5분 소요)"
terraform apply -auto-approve \
    -var="aws_region=$AWS_REGION" \
    -var="project_name=$PROJECT_NAME" \
    -var="environment=$ENVIRONMENT" \
    -var="instance_type=$INSTANCE_TYPE" \
    -var="public_key_path=${SSH_KEY_PATH}.pub"

# 퍼블릭 IP 가져오기
EC2_PUBLIC_IP=$(terraform output -raw instance_public_ip)
INSTANCE_ID=$(terraform output -raw instance_id)

log_success "AWS 인프라가 생성되었습니다!"
log_info "EC2 퍼블릭 IP: $EC2_PUBLIC_IP"
log_info "인스턴스 ID: $INSTANCE_ID"

# 프로젝트 루트로 돌아가기
cd ../..

# SSH 연결 대기
log_info "EC2 인스턴스 초기화 대기 중... (약 3-5분 소요)"
for i in {1..60}; do
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "echo 'SSH 연결 성공'" 2>/dev/null; then
        log_success "SSH 연결이 성공했습니다."
        break
    fi
    echo -n "."
    sleep 10
    if [ $i -eq 60 ]; then
        log_error "SSH 연결 시간이 초과되었습니다."
        exit 1
    fi
done

# user_data 스크립트 완료 대기 (개선된 로직)
log_info "시스템 초기화 완료 대기 중... (최대 10분 소요)"
max_wait=600  # 10분으로 단축
elapsed=0
user_data_completed=false

while [ $elapsed -lt $max_wait ]; do
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "test -f /home/ubuntu/.user-data-completed" 2>/dev/null; then
        log_success "시스템 초기화가 완료되었습니다."
        user_data_completed=true
        break
    fi
    echo -n "."
    sleep 20
    elapsed=$((elapsed + 20))
done

if [ "$user_data_completed" = false ]; then
    log_warning "시스템 초기화 완료 확인 시간이 초과되었습니다."
    log_info "unattended-upgrades 문제를 수동으로 해결합니다..."
    
    # unattended-upgrades 문제 해결
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
        sudo systemctl stop unattended-upgrades.service || true
        sudo systemctl disable unattended-upgrades.service || true
        sudo pkill -f unattended-upgrade || true
        sudo apt-get install -y rsync htop vim tree jq || true
        echo 'Manual setup completed'
    " 2>/dev/null || log_warning "수동 설정에 일부 실패했지만 계속 진행합니다."
    
    log_info "계속 진행합니다..."
fi

# Ansible 인벤토리 파일 생성
log_info "Ansible 인벤토리 생성 중..."
cat > infrastructure/ansible/inventory << EOF
[lifebit_servers]
lifebit_server ansible_host=$EC2_PUBLIC_IP ansible_user=ubuntu ansible_ssh_private_key_file=$SSH_KEY_PATH

[lifebit_servers:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

# Ansible 플레이북 실행
log_info "Ansible로 애플리케이션 배포 중... (약 10-15분 소요)"
cd infrastructure/ansible

# Ansible 연결 테스트
log_info "Ansible 연결 테스트 중..."
if ! ansible lifebit_servers -m ping; then
    log_error "Ansible 연결 테스트에 실패했습니다."
    exit 1
fi

# 플레이북 실행 (재시도 로직 포함)
log_info "Ansible 플레이북 실행 중..."
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    log_info "플레이북 실행 시도 $(($retry_count + 1))/$max_retries..."
    
    if ansible-playbook playbook.yml; then
        log_success "Ansible 플레이북이 성공적으로 실행되었습니다."
        break
    else
        retry_count=$(($retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            log_warning "플레이북 실행에 실패했습니다. 30초 후 재시도합니다..."
            sleep 30
        else
            log_error "플레이북 실행에 $max_retries 번 실패했습니다."
            log_error "수동으로 다음 명령을 실행해보세요:"
            log_error "  cd infrastructure/ansible"
            log_error "  ansible-playbook playbook.yml -vvv"
            exit 1
        fi
    fi
done

cd ../..

# 배포 정보 저장
log_info "배포 정보 저장 중..."
cat > .deployment_info << EOF
# LifeBit AWS 배포 정보
DEPLOYMENT_DATE=$(date)
AWS_REGION=$AWS_REGION
PROJECT_NAME=$PROJECT_NAME
ENVIRONMENT=$ENVIRONMENT
EC2_PUBLIC_IP=$EC2_PUBLIC_IP
INSTANCE_ID=$INSTANCE_ID
INSTANCE_TYPE=$INSTANCE_TYPE

# 접속 URL
FRONTEND_URL=http://$EC2_PUBLIC_IP:3000
CORE_API_URL=http://$EC2_PUBLIC_IP:8080
AI_API_URL=http://$EC2_PUBLIC_IP:8001
NGINX_URL=http://$EC2_PUBLIC_IP

# SSH 접속
SSH_COMMAND="ssh -i $SSH_KEY_PATH ubuntu@$EC2_PUBLIC_IP"
EOF

# 배포 완료 메시지
echo ""
log_success "🎉 LifeBit AWS 배포가 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         배포 완료 정보${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 프론트엔드:${NC}     http://$EC2_PUBLIC_IP:3000"
echo -e "${BLUE}🔧 Core API:${NC}      http://$EC2_PUBLIC_IP:8080"
echo -e "${BLUE}🤖 AI API:${NC}        http://$EC2_PUBLIC_IP:8001"
echo -e "${BLUE}🌐 Nginx (통합):${NC}  http://$EC2_PUBLIC_IP"
echo ""
echo -e "${BLUE}🔑 SSH 접속:${NC}"
echo -e "   ssh -i $SSH_KEY_PATH ubuntu@$EC2_PUBLIC_IP"
echo ""
echo -e "${BLUE}📊 모니터링:${NC}"
echo -e "   Health Check: http://$EC2_PUBLIC_IP:8080/actuator/health"
echo -e "   Container Status: docker ps"
echo ""
echo -e "${YELLOW}⚠️  주의사항:${NC}"
echo -e "   - 서비스가 완전히 시작되기까지 2-3분 정도 더 소요될 수 있습니다."
echo -e "   - 배포 정보는 .deployment_info 파일에 저장되었습니다."
echo -e "   - 리소스 정리는 './aws-destroy.sh'를 실행하세요."
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "배포 스크립트 실행이 완료되었습니다!" 