#!/bin/bash

# LifeBit 자동 배포 스크립트
# 사용법: ./scripts/deploy.sh [환경] [추가옵션]
# 예시: ./scripts/deploy.sh dev --force

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

# 사용법 출력
usage() {
    echo "사용법: $0 [환경] [옵션]"
    echo "환경: dev, staging, prod"
    echo "옵션:"
    echo "  --force       기존 인프라를 강제로 재생성"
    echo "  --skip-build  Docker 이미지 빌드 건너뛰기"
    echo "  --only-app    인프라 생성 없이 애플리케이션만 배포"
    echo "  --help        이 도움말 표시"
    exit 1
}

# 필수 도구 확인
check_prerequisites() {
    log_info "필수 도구 확인 중..."
    
    local missing_tools=()
    
    if ! command -v terraform &> /dev/null; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v ansible &> /dev/null; then
        missing_tools+=("ansible")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("docker-compose")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "다음 도구들이 설치되어 있지 않습니다: ${missing_tools[*]}"
        log_error "필수 도구를 설치한 후 다시 시도하세요."
        exit 1
    fi
    
    log_success "모든 필수 도구가 설치되어 있습니다."
}

# 환경 변수 검증
validate_environment() {
    local env=$1
    
    case $env in
        dev|staging|prod)
            log_info "환경: $env"
            ;;
        *)
            log_error "유효하지 않은 환경: $env"
            usage
            ;;
    esac
    
    # NCP 인증 정보 확인
    if [ -z "$NCP_ACCESS_KEY" ] || [ -z "$NCP_SECRET_KEY" ]; then
        log_error "NCP 인증 정보가 설정되지 않았습니다."
        log_error "다음 환경 변수를 설정하세요:"
        log_error "  export NCP_ACCESS_KEY=\"your-access-key\""
        log_error "  export NCP_SECRET_KEY=\"your-secret-key\""
        exit 1
    fi
}

# Terraform 인프라 배포
deploy_infrastructure() {
    local env=$1
    local force=$2
    
    log_info "Terraform 인프라 배포 시작..."
    
    cd infrastructure
    
    # Terraform 초기화
    terraform init
    
    # Terraform 플랜
    terraform plan \
        -var="ncp_access_key=$NCP_ACCESS_KEY" \
        -var="ncp_secret_key=$NCP_SECRET_KEY" \
        -var="environment=$env" \
        -out="terraform.plan"
    
    # 사용자 확인
    if [ "$force" != "true" ]; then
        read -p "위 계획으로 인프라를 배포하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_warning "배포가 취소되었습니다."
            exit 0
        fi
    fi
    
    # Terraform 적용
    terraform apply "terraform.plan"
    
    # 출력값 저장
    terraform output -json > "../terraform-outputs.json"
    
    cd ..
    
    log_success "인프라 배포가 완료되었습니다."
}

# Ansible 인벤토리 업데이트
update_ansible_inventory() {
    local env=$1
    
    log_info "Ansible 인벤토리 업데이트 중..."
    
    # Terraform 출력에서 IP 주소 추출
    local public_ip=$(jq -r '.public_ip.value' terraform-outputs.json)
    local ssh_key=$(jq -r '.login_key_name.value' terraform-outputs.json)
    
    if [ "$public_ip" = "null" ] || [ -z "$public_ip" ]; then
        log_error "Terraform 출력에서 공인 IP를 찾을 수 없습니다."
        exit 1
    fi
    
    # 인벤토리 파일 업데이트
    cat > ansible/inventory.ini << EOF
[lifebit_servers]
lifebit-${env}-web ansible_host=${public_ip} ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/${ssh_key}.pem

[lifebit_servers:vars]
ansible_user=ubuntu
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
ansible_python_interpreter=/usr/bin/python3

[${env}]
lifebit-${env}-web

[${env}:vars]
env=${env}
EOF
    
    log_success "Ansible 인벤토리가 업데이트되었습니다."
    log_info "서버 IP: $public_ip"
}

# 애플리케이션 배포
deploy_application() {
    local env=$1
    local skip_build=$2
    
    log_info "애플리케이션 배포 시작..."
    
    # Docker 이미지 빌드 (선택사항)
    if [ "$skip_build" != "true" ]; then
        log_info "Docker 이미지 빌드 중..."
        docker-compose build
    fi
    
    # Ansible 플레이북 실행
    cd ansible
    
    # 암호화된 변수 파일이 있는 경우 처리
    local vault_option=""
    if [ -f "group_vars/vault.yml" ]; then
        vault_option="--ask-vault-pass"
    fi
    
    ansible-playbook \
        -i inventory.ini \
        -e "env=$env" \
        -e "git_repository_url=$(git config --get remote.origin.url)" \
        -e "git_branch=$(git branch --show-current)" \
        $vault_option \
        playbook.yml
    
    cd ..
    
    log_success "애플리케이션 배포가 완료되었습니다."
}

# 배포 상태 확인
check_deployment_status() {
    log_info "배포 상태 확인 중..."
    
    local public_ip=$(jq -r '.public_ip.value' terraform-outputs.json)
    
    if [ "$public_ip" = "null" ] || [ -z "$public_ip" ]; then
        log_error "공인 IP를 찾을 수 없습니다."
        return 1
    fi
    
    # 서비스 상태 확인
    local services=(
        "http://${public_ip}:80/health"
        "http://${public_ip}:8001/api/py/health"
        "http://${public_ip}:8080/actuator/health"
        "http://${public_ip}:8081/"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        if curl -s --max-time 10 "$service" > /dev/null; then
            log_success "✓ $service"
        else
            log_error "✗ $service"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "모든 서비스가 정상적으로 실행되고 있습니다."
        echo
        echo "📋 배포 정보:"
        echo "  🌐 웹사이트: http://${public_ip}"
        echo "  📚 Spring API: http://${public_ip}/api/swagger-ui.html"
        echo "  🤖 FastAPI: http://${public_ip}/api/py/docs"
        echo "  🔄 Airflow: http://${public_ip}/airflow"
        echo "  🔐 SSH: ssh -i ~/.ssh/$(jq -r '.login_key_name.value' terraform-outputs.json).pem ubuntu@${public_ip}"
    else
        log_warning "일부 서비스에 문제가 있습니다: ${failed_services[*]}"
    fi
}

# 정리 함수
cleanup() {
    log_info "정리 작업 중..."
    
    # 임시 파일 정리
    rm -f infrastructure/terraform.plan
    
    log_success "정리가 완료되었습니다."
}

# 메인 실행 함수
main() {
    local env=""
    local force=false
    local skip_build=false
    local only_app=false
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|staging|prod)
                env="$1"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --only-app)
                only_app=true
                shift
                ;;
            --help)
                usage
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                usage
                ;;
        esac
    done
    
    # 환경 인자 필수 확인
    if [ -z "$env" ]; then
        log_error "환경을 지정해야 합니다."
        usage
    fi
    
    # 배포 시작
    log_info "===== LifeBit 자동 배포 시작 ====="
    log_info "환경: $env"
    log_info "시작 시간: $(date)"
    
    # 전체 프로세스 실행
    check_prerequisites
    validate_environment "$env"
    
    if [ "$only_app" != "true" ]; then
        deploy_infrastructure "$env" "$force"
        update_ansible_inventory "$env"
    fi
    
    deploy_application "$env" "$skip_build"
    
    # 상태 확인
    sleep 30  # 서비스 시작 대기
    check_deployment_status
    
    cleanup
    
    log_success "===== 배포가 성공적으로 완료되었습니다! ====="
    log_info "완료 시간: $(date)"
}

# 시그널 처리
trap cleanup EXIT

# 스크립트 실행
main "$@" 