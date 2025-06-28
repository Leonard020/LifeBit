#!/bin/bash

# unattended-upgrades 문제 해결 스크립트

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

# 배포 정보 확인
if [ ! -f ".deployment_info" ]; then
    log_error "배포 정보 파일(.deployment_info)을 찾을 수 없습니다."
    
    # Terraform에서 IP 가져오기 시도
    if [ -f "infrastructure/terraform/terraform.tfstate" ]; then
        EC2_PUBLIC_IP=$(cd infrastructure/terraform && terraform output -raw instance_public_ip 2>/dev/null || echo "")
        if [ -z "$EC2_PUBLIC_IP" ]; then
            log_error "Terraform에서 IP를 가져올 수 없습니다."
            exit 1
        fi
        log_info "Terraform에서 IP를 가져왔습니다: $EC2_PUBLIC_IP"
    else
        log_error "Terraform 상태 파일도 찾을 수 없습니다."
        exit 1
    fi
else
    source .deployment_info
fi

SSH_KEY_PATH="$HOME/.ssh/lifebit_key"

log_info "unattended-upgrades 문제 해결 시작..."
log_info "서버 IP: $EC2_PUBLIC_IP"

# SSH 연결 확인
log_info "SSH 연결 확인 중..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "echo 'SSH OK'" 2>/dev/null; then
    log_error "SSH 연결에 실패했습니다."
    exit 1
fi
log_success "SSH 연결 성공"

# unattended-upgrades 문제 해결
log_info "unattended-upgrades 문제 해결 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'Starting unattended-upgrades fix...'
    
    # 1. unattended-upgrades 중지 및 비활성화
    sudo systemctl stop unattended-upgrades.service || true
    sudo systemctl disable unattended-upgrades.service || true
    
    # 2. 관련 프로세스 종료
    sudo pkill -f unattended-upgrade || true
    sudo pkill -f apt-get || true
    sudo pkill -f dpkg || true
    
    # 3. lock 파일 제거
    sudo rm -f /var/lib/dpkg/lock-frontend || true
    sudo rm -f /var/lib/dpkg/lock || true
    sudo rm -f /var/lib/apt/lists/lock || true
    sudo rm -f /var/cache/apt/archives/lock || true
    
    # 4. APT 설정 최적화
    sudo tee /etc/apt/apt.conf.d/99-disable-auto-updates > /dev/null << EOF
APT::Periodic::Update-Package-Lists \"0\";
APT::Periodic::Download-Upgradeable-Packages \"0\";
APT::Periodic::AutocleanInterval \"0\";
APT::Periodic::Unattended-Upgrade \"0\";
EOF
    
    # 5. 필수 패키지 설치
    export DEBIAN_FRONTEND=noninteractive
    sudo apt-get update -y || true
    sudo apt-get install -y rsync htop vim tree jq || true
    
    # 6. unattended-upgrades 완전 제거
    sudo apt-get remove -y unattended-upgrades || true
    sudo apt-get autoremove -y || true
    
    echo 'unattended-upgrades fix completed'
"

if [ $? -eq 0 ]; then
    log_success "unattended-upgrades 문제가 해결되었습니다!"
    log_info "이제 Ansible 플레이북을 다시 실행할 수 있습니다:"
    echo ""
    echo "cd infrastructure/ansible"
    echo "ansible-playbook playbook.yml"
else
    log_error "문제 해결에 실패했습니다."
    exit 1
fi 