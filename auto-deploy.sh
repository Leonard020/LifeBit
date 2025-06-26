#!/bin/bash

# LifeBit 완전 자동화 배포 스크립트
# 작성자: LifeBit 팀
# 버전: 1.0

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 스크립트 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# 로깅 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_deploy() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }

# 환경 변수 로드
load_env() {
    log_info "환경 변수 로드 중..."
    
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        log_success "환경 변수 로드 완료"
    else
        log_error ".env 파일이 없습니다. .env.example을 참고하여 .env 파일을 생성해주세요."
        exit 1
    fi
}

# 의존성 확인
check_dependencies() {
    log_info "의존성 확인 중..."
    
    local missing_deps=()
    
    # 필수 도구들 확인
    for cmd in aws terraform ansible-playbook docker; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_error "다음 도구들이 설치되지 않았습니다: ${missing_deps[*]}"
        log_error "설치 방법.md를 참고하여 필요한 도구들을 설치해주세요."
        exit 1
    fi
    
    # AWS 자격 증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 자격 증명이 설정되지 않았습니다."
        exit 1
    fi
    
    log_success "모든 의존성 확인 완료"
}

# 기존 리소스 정리 (선택사항)
cleanup_existing() {
    local force_clean=${1:-false}
    log_info "기존 AWS 리소스 정리 여부를 확인합니다..."

    # 기존 인스턴스 확인
    local existing_instances=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
        --query 'Reservations[*].Instances[*].InstanceId' \
        --output text 2>/dev/null | tr -d ' \n\r')
    
    if [[ -z "$existing_instances" ]]; then
        log_info "정리할 기존 LifeBit 리소스가 없습니다."
        return
    fi

    log_warning "기존 LifeBit 인스턴스가 발견되었습니다: $existing_instances"
    
    local reply="n"
    if [[ "$force_clean" == true ]]; then
        log_info "--force-clean 플래그가 사용되어 기존 리소스를 자동으로 정리합니다."
        reply="y"
    else
        read -p "기존 리소스를 정리하고 새로 배포하시겠습니까? (y/N): " -r reply
    fi

    if [[ "$reply" =~ ^[Yy]$ ]]; then
        log_info "기존 리소스 정리 중..."
        if [[ -f "$PROJECT_ROOT/aws-cleanup.sh" ]]; then
            bash "$PROJECT_ROOT/aws-cleanup.sh" --force
            log_success "기존 리소스 정리 완료."
        else
            log_error "aws-cleanup.sh 스크립트를 찾을 수 없습니다."
            exit 1
        fi
    else
        log_info "기존 리소스를 정리하지 않고 배포를 계속합니다."
    fi
}

# Terraform 인프라 배포
deploy_infrastructure() {
    log_deploy "Terraform 인프라 배포 시작..."
    
    cd "$PROJECT_ROOT/infrastructure"
    
    # Terraform 초기화
    log_info "Terraform 초기화 중..."
    terraform init
    
    # tfvars 파일 생성
    log_info "Terraform 변수 파일 생성 중..."
    cat > terraform.tfvars << EOF
aws_access_key_id = "$AWS_ACCESS_KEY_ID"
aws_secret_access_key = "$AWS_SECRET_ACCESS_KEY"
aws_region = "$AWS_DEFAULT_REGION"
EOF
    
    # Terraform 계획 생성
    log_info "Terraform 계획 생성 중..."
    terraform plan -out=tfplan
    
    # Terraform 적용
    log_info "Terraform 인프라 배포 중..."
    terraform apply -auto-approve tfplan
    
    # SSH 키 저장
    log_info "SSH 프라이빗 키를 ~/.ssh/lifebit.pem에 저장 중..."
    mkdir -p ~/.ssh
    terraform output -raw ssh_private_key > ~/.ssh/lifebit.pem
    chmod 600 ~/.ssh/lifebit.pem
    log_success "SSH 프라이빗 키 저장 완료."
    
    # 서버 IP 추출
    SERVER_IP=$(terraform output -raw public_ip)
    log_success "인프라 배포 완료! 서버 IP: $SERVER_IP"
    
    cd "$PROJECT_ROOT"
}

# SSH 연결 테스트
test_ssh_connection() {
    log_info "SSH 연결 테스트 중..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log_info "SSH 연결 시도 $attempt/$max_attempts..."
        
        if ssh -i ~/.ssh/lifebit.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=no ubuntu@$SERVER_IP "echo 'SSH 연결 성공'" &> /dev/null; then
            log_success "SSH 연결 성공!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "SSH 연결 실패. 서버가 준비되지 않았습니다."
    exit 1
}

# Ansible 배포
deploy_applications() {
    log_deploy "Ansible 애플리케이션 배포 시작..."
    
    cd "$PROJECT_ROOT/ansible"
    
    # inventory.ini 업데이트
    log_info "Ansible inventory 업데이트 중..."
    cat > inventory.ini << EOF
[lifebit_servers]
$SERVER_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/lifebit.pem ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF
    
    # Ansible playbook 실행
    log_info "Ansible playbook 실행 중..."
    ansible-playbook -i inventory.ini playbook.yml
    
    log_success "애플리케이션 배포 완료!"
    
    cd "$PROJECT_ROOT"
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태 확인 중..."
    
    local services=(
        "http://$SERVER_IP:3000"  # Frontend
        "http://$SERVER_IP:8080"  # Spring Boot API
        "http://$SERVER_IP:8000"  # FastAPI
        "http://$SERVER_IP:8082"  # Nginx Proxy
    )
    
    for service in "${services[@]}"; do
        log_info "서비스 확인: $service"
        
        if curl -s --connect-timeout 10 "$service" > /dev/null; then
            log_success "✅ $service - 정상 작동"
        else
            log_warning "⚠️ $service - 응답 없음"
        fi
    done
}

# 배포 정보 출력
show_deployment_info() {
    log_success "🎉 LifeBit 배포 완료!"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}📋 배포 정보${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🌐 서버 IP:${NC} $SERVER_IP"
    echo -e "${BLUE}🔗 서비스 URL:${NC}"
    echo "   • Frontend:      http://$SERVER_IP:3000"
    echo "   • API (Spring):  http://$SERVER_IP:8080"
    echo "   • API (FastAPI): http://$SERVER_IP:8000"
    echo "   • Nginx Proxy:   http://$SERVER_IP:8082"
    echo
    echo -e "${BLUE}📁 SSH 접속:${NC}"
    echo "   ssh -i ~/.ssh/lifebit.pem ubuntu@$SERVER_IP"
    echo
    echo -e "${BLUE}🔧 관리 명령어:${NC}"
    echo "   • 서비스 상태: docker ps"
    echo "   • 로그 확인: docker logs <container_name>"
    echo "   • 재시작: docker-compose restart"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 배포 실패 시 정리
cleanup_on_failure() {
    log_error "배포 중 오류가 발생했습니다."
    read -p "실패한 리소스를 정리하시겠습니까? (y/N): " -r
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "실패한 리소스 정리 중..."
        bash "$PROJECT_ROOT/aws-cleanup.sh" --force
    fi
}

# 메인 실행 함수
main() {
    log_info "🚀 LifeBit 완전 자동화 배포 시작 (v1.0)"

    local force_clean=false
    # --force-clean 인자 확인
    if [[ "${1:-}" == "--force-clean" ]]; then
        force_clean=true
    fi
    
    # 오류 발생 시 정리 함수 실행
    trap cleanup_on_failure ERR
    
    # 배포 단계
    load_env
    check_dependencies
    cleanup_existing "$force_clean"
    deploy_infrastructure
    test_ssh_connection
    deploy_applications
    check_services
    show_deployment_info
    
    log_success "🎉 LifeBit 자동화 배포 완료!"
}

# 스크립트 실행
main "$@" 