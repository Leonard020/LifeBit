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
log_deploy() { echo -e "${PURPLE}[DEPLOY]${NC} $1"; }

# 환경 변수 확인
check_environment() {
    log_info "환경 변수 확인 중..."
    
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_error "AWS 인증 정보가 설정되지 않았습니다."
        log_info "다음 명령으로 설정하세요:"
        echo "export AWS_ACCESS_KEY_ID='your-access-key'"
        echo "export AWS_SECRET_ACCESS_KEY='your-secret-key'"
        exit 1
    fi
    
    log_success "AWS 인증 정보 확인 완료"
}

# Terraform 인프라 생성
deploy_infrastructure() {
    log_deploy "AWS 인프라 생성 시작..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # Terraform 계획 확인
    log_info "Terraform 계획 생성 중..."
    if terraform plan \
        -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
        -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
        -var="aws_region=$AWS_DEFAULT_REGION" \
        -var-file=single-server.tfvars \
        -out=tfplan; then
        log_success "Terraform 계획 생성 완료"
    else
        log_error "Terraform 계획 생성 실패"
        exit 1
    fi
    
    # 사용자 확인
    log_warning "인프라를 생성하시겠습니까? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "배포가 취소되었습니다."
        exit 0
    fi
    
    # Terraform 적용
    log_info "Terraform 인프라 생성 중..."
    if terraform apply tfplan; then
        log_success "Terraform 인프라 생성 완료"
    else
        log_error "Terraform 인프라 생성 실패"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# SSH 키 저장
save_ssh_key() {
    log_info "SSH 키 저장 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # SSH 키 추출 및 저장
    if terraform output -raw ssh_private_key > ~/.ssh/lifebit.pem; then
        chmod 600 ~/.ssh/lifebit.pem
        log_success "SSH 키 저장 완료: ~/.ssh/lifebit.pem"
    else
        log_error "SSH 키 저장 실패"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
}

# Ansible inventory 업데이트
update_inventory() {
    log_info "Ansible inventory 업데이트 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # 퍼블릭 IP 추출
    PUBLIC_IP=$(terraform output -raw public_ip)
    
    if [[ -z "$PUBLIC_IP" ]]; then
        log_error "퍼블릭 IP를 가져올 수 없습니다."
        exit 1
    fi
    
    log_info "퍼블릭 IP: $PUBLIC_IP"
    
    cd "$SCRIPT_DIR"
    
    # inventory.ini 업데이트
    sed -i "s/YOUR_AWS_EC2_PUBLIC_IP_HERE/$PUBLIC_IP/g" ansible/inventory.ini
    
    log_success "Ansible inventory 업데이트 완료"
}

# Ansible 배포
deploy_application() {
    log_deploy "Ansible 애플리케이션 배포 시작..."
    
    # SSH 연결 테스트
    log_info "SSH 연결 테스트 중..."
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    if ssh -i ~/.ssh/lifebit.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@"$PUBLIC_IP" "echo 'SSH 연결 성공'"; then
        log_success "SSH 연결 확인 완료"
    else
        log_error "SSH 연결 실패"
        log_info "EC2 인스턴스가 완전히 부팅될 때까지 잠시 기다린 후 다시 시도하세요."
        exit 1
    fi
    
    # Ansible 플레이북 실행
    log_info "Ansible 플레이북 실행 중..."
    if ansible-playbook -i ansible/inventory.ini ansible/playbook.yml; then
        log_success "Ansible 배포 완료"
    else
        log_error "Ansible 배포 실패"
        exit 1
    fi
}

# 배포 완료 정보 출력
show_deployment_info() {
    log_success "🎉 LifeBit AWS 배포 완료!"
    
    cd "$SCRIPT_DIR/infrastructure"
    
    echo
    log_info "📋 배포 정보:"
    echo "서버 IP: $(terraform output -raw public_ip)"
    echo "SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$(terraform output -raw public_ip)"
    
    echo
    log_info "🌐 애플리케이션 URLs:"
    echo "Frontend:     http://$(terraform output -raw public_ip):3000"
    echo "Spring API:   http://$(terraform output -raw public_ip):8080"
    echo "FastAPI:      http://$(terraform output -raw public_ip):8001"
    echo "Airflow:      http://$(terraform output -raw public_ip):8081"
    echo "Grafana:      http://$(terraform output -raw public_ip):3001"
    echo "Prometheus:   http://$(terraform output -raw public_ip):9090"
    echo "Nginx Proxy:  http://$(terraform output -raw public_ip):8082"
    
    echo
    log_info "💰 예상 비용: 월 2-3만원 (t3.small)"
    
    cd "$SCRIPT_DIR"
}

# 배포 전 AWS 리소스 정리
main() {
    log_deploy "🚀 LifeBit AWS 자동 배포 시작..."
    
    log_info "배포 전 AWS 리소스 정리(aws-cleanup.sh) 실행..."
    ./aws-cleanup.sh || true
    
    check_environment
    deploy_infrastructure
    save_ssh_key
    update_inventory
    wait_for_ssh_ready
    deploy_application
    show_deployment_info
}

# SSH 연결 재시도 로직 (최대 5분, 10초 간격)
wait_for_ssh_ready() {
    log_info "EC2 SSH 연결 대기 중... (최대 5분)"
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    local max_attempts=30
    local attempt=1
    while (( attempt <= max_attempts )); do
        if ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@"$PUBLIC_IP" 'echo OK' 2>/dev/null | grep -q OK; then
            log_success "SSH 연결 성공 (시도: $attempt)"
            return 0
        else
            log_warning "SSH 연결 대기 중... ($attempt/$max_attempts)"
            sleep 10
        fi
        ((attempt++))
    done
    log_error "5분 내 SSH 연결 실패. 인스턴스 상태/보안그룹/키를 확인하세요."
    exit 1
}

main "$@" 