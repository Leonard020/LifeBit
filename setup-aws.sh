#!/bin/bash
set -e

# 스크립트 정보
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로깅 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# AWS CLI 설정
setup_aws_cli() {
    log_info "AWS CLI 설정 중..."
    
    # AWS CLI 설치 확인
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되지 않았습니다. 먼저 설치해주세요."
        exit 1
    fi
    
    # AWS 인증 정보 확인
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_warning "AWS 인증 정보가 환경변수에 설정되지 않았습니다."
        log_info "AWS Access Key ID를 입력하세요:"
        read -r aws_access_key
        log_info "AWS Secret Access Key를 입력하세요:"
        read -rs aws_secret_key
        echo
        
        export AWS_ACCESS_KEY_ID="$aws_access_key"
        export AWS_SECRET_ACCESS_KEY="$aws_secret_key"
    fi
    
    # AWS 리전 설정
    export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
    
    # AWS CLI 설정 테스트
    if aws sts get-caller-identity &> /dev/null; then
        log_success "AWS CLI 설정 완료"
        aws sts get-caller-identity
    else
        log_error "AWS CLI 인증 실패"
        exit 1
    fi
}

# SSH 키 설정
setup_ssh_key() {
    log_info "SSH 키 설정 중..."
    
    # .ssh 디렉토리 생성
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    
    # SSH 키 파일 경로
    SSH_KEY_PATH="$HOME/.ssh/lifebit.pem"
    
    log_info "SSH 키 파일 경로: $SSH_KEY_PATH"
    log_success "SSH 키 설정 완료 (Terraform apply 후 키가 생성됩니다)"
}

# Terraform 초기화
setup_terraform() {
    log_info "Terraform 초기화 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # Terraform 초기화
    if terraform init; then
        log_success "Terraform 초기화 완료"
    else
        log_error "Terraform 초기화 실패"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# Ansible 설정
setup_ansible() {
    log_info "Ansible 설정 확인 중..."
    
    # Ansible 설치 확인
    if ! command -v ansible &> /dev/null; then
        log_warning "Ansible이 설치되지 않았습니다. 설치를 권장합니다."
        log_info "설치 명령: sudo dnf install ansible (Fedora/RHEL)"
    else
        log_success "Ansible 설치 확인 완료"
    fi
}

# 메인 실행
main() {
    log_info "🚀 LifeBit AWS 환경 설정 시작..."
    
    setup_aws_cli
    setup_ssh_key
    setup_terraform
    setup_ansible
    
    log_success "✅ AWS 환경 설정 완료!"
    
    echo
    log_info "📋 다음 단계:"
    echo "1. Terraform으로 인프라 생성:"
    echo "   cd infrastructure && terraform apply -var-file=single-server.tfvars"
    echo
    echo "2. SSH 키 저장 (Terraform apply 후):"
    echo "   terraform output -raw ssh_private_key > ~/.ssh/lifebit.pem && chmod 600 ~/.ssh/lifebit.pem"
    echo
    echo "3. Ansible inventory 업데이트:"
    echo "   terraform output public_ip"
    echo "   (결과 IP를 ansible/inventory.ini의 YOUR_AWS_EC2_PUBLIC_IP_HERE에 입력)"
    echo
    echo "4. Ansible로 서버 설정:"
    echo "   ansible-playbook -i ansible/inventory.ini ansible/playbook.yml"
}

main "$@" 