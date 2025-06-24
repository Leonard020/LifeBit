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
    echo "  --test-ssh    SSH 연결만 테스트"
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
    
    if ! command -v jq &> /dev/null; then
        missing_tools+=("jq")
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
    
    # .env 파일 로드
    if [ -f ".env" ]; then
        log_info ".env 파일을 로드합니다..."
        source .env
    fi
    
    # NCP 인증 정보 확인
    if [ -z "$NCP_ACCESS_KEY" ] || [ -z "$NCP_SECRET_KEY" ]; then
        log_error "NCP 인증 정보가 설정되지 않았습니다."
        log_error "다음 환경 변수를 설정하거나 .env 파일에 추가하세요:"
        log_error "  export NCP_ACCESS_KEY=\"your-access-key\""
        log_error "  export NCP_SECRET_KEY=\"your-secret-key\""
        exit 1
    fi
}

# SSH 연결 테스트
test_ssh_connection() {
    local public_ip=$1
    local ssh_key=$2
    local max_attempts=30
    local attempt=1
    
    log_info "SSH 연결 테스트 중... (최대 ${max_attempts}번 시도)"
    
    while [ $attempt -le $max_attempts ]; do
        log_info "SSH 연결 시도 $attempt/$max_attempts..."
        
        if ssh -i ~/.ssh/${ssh_key}.pem \
               -o StrictHostKeyChecking=no \
               -o UserKnownHostsFile=/dev/null \
               -o ConnectTimeout=10 \
               -o ServerAliveInterval=5 \
               -o ServerAliveCountMax=3 \
               root@${public_ip} 'echo "SSH 연결 성공!"' 2>/dev/null; then
            log_success "SSH 연결이 성공했습니다!"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "SSH 연결에 실패했습니다. 서버 상태를 확인해주세요."
            return 1
        fi
        
        log_warning "SSH 연결 실패. 30초 후 재시도..."
        sleep 30
        ((attempt++))
    done
}

# Docker 이미지 빌드
build_docker_images() {
    log_info "Docker 이미지 빌드 시작..."
    
    # 빌드 순서: 의존성이 적은 순서대로
    local images=("fastapi" "spring" "airflow" "frontend")
    local build_args=""
    
    for image in "${images[@]}"; do
        case $image in
            "fastapi")
                log_info "FastAPI 이미지 빌드 중..."
                docker build -t lifebit-fastapi-app ./apps/ai-api-fastapi/ &
                ;;
            "spring")
                log_info "Spring Boot 이미지 빌드 중..."
                docker build -t lifebit-spring-app ./apps/core-api-spring/ &
                ;;
            "airflow")
                log_info "Airflow 이미지 빌드 중..."
                docker build -t lifebit-airflow-webserver ./apps/airflow-pipeline/ &
                docker build -t lifebit-airflow-scheduler ./apps/airflow-pipeline/ &
                ;;
            "frontend")
                log_info "Frontend 이미지 빌드 중..."
                docker build -f apps/frontend-vite/Dockerfile -t lifebit-frontend-app . &
                ;;
        esac
    done
    
    # 모든 백그라운드 빌드 완료 대기
    log_info "모든 Docker 이미지 빌드 완료 대기 중..."
    wait
    
    # 빌드 결과 확인
    log_info "빌드된 이미지 확인:"
    docker images | grep lifebit
    
    log_success "모든 Docker 이미지 빌드가 완료되었습니다."
}

# Terraform 인프라 배포
deploy_infrastructure() {
    local env=$1
    local force=$2
    
    log_info "Terraform 인프라 배포 시작..."
    
    cd infrastructure
    
    # Terraform 초기화
    terraform init
    
    # 기존 상태 확인
    if terraform state list | grep -q "ncloud_server.web" && [ "$force" = "true" ]; then
        log_warning "강제 모드: 기존 서버를 재생성합니다."
        terraform apply -auto-approve \
            -var="ncp_access_key=$NCP_ACCESS_KEY" \
            -var="ncp_secret_key=$NCP_SECRET_KEY" \
            -var="environment=$env" \
            -replace="ncloud_server.web"
    else
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
    fi
    
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
    
    # SSH 키 파일 확인 및 생성
    if [ ! -f ~/.ssh/${ssh_key}.pem ]; then
        log_info "SSH 키 파일을 생성합니다..."
        terraform -chdir=infrastructure output -raw login_key_private_key > ~/.ssh/${ssh_key}.pem
        chmod 600 ~/.ssh/${ssh_key}.pem
    fi
    
    # 인벤토리 파일 업데이트
    cat > ansible/inventory.ini << EOF
[lifebit_servers]
lifebit-${env}-web ansible_host=${public_ip} ansible_user=root ansible_ssh_private_key_file=~/.ssh/${ssh_key}.pem

[lifebit_servers:vars]
ansible_user=root
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=30 -o ServerAliveInterval=5 -o ServerAliveCountMax=3'
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_retries=3

[${env}]
lifebit-${env}-web

[${env}:vars]
env=${env}
git_repository_url=https://github.com/your-username/LifeBit.git
git_branch=main
EOF
    
    log_success "Ansible 인벤토리가 업데이트되었습니다."
    log_info "서버 IP: $public_ip"
    
    # SSH 연결 테스트
    test_ssh_connection "$public_ip" "$ssh_key"
}

# 애플리케이션 배포
deploy_application() {
    local env=$1
    local skip_build=$2
    
    log_info "애플리케이션 배포 시작..."
    
    # Docker 이미지 빌드 (선택사항)
    if [ "$skip_build" != "true" ]; then
        build_docker_images
    fi
    
    # Ansible 플레이북 실행
    cd ansible
    
    # 암호화된 변수 파일이 있는 경우 처리
    local vault_option=""
    if [ -f "group_vars/vault.yml" ]; then
        vault_option="--ask-vault-pass"
    fi
    
    log_info "Ansible 플레이북 실행 중..."
    ansible-playbook \
        -i inventory.ini \
        -e "env=$env" \
        -e "openai_api_key=${OPENAI_API_KEY:-your-api-key-here}" \
        -e "use_gpt=${USE_GPT:-False}" \
        $vault_option \
        playbook.yml
    
    cd ..
    
    log_success "애플리케이션 배포가 완료되었습니다."
}

# 배포 상태 확인
check_deployment_status() {
    local public_ip=$(jq -r '.public_ip.value' terraform-outputs.json)
    
    log_info "배포 상태 확인 중..."
    
    local services=(
        "http://${public_ip}:웹사이트"
        "http://${public_ip}/api:Spring API"
        "http://${public_ip}/api/py/docs:FastAPI 문서"
        "http://${public_ip}/airflow:Airflow"
    )
    
    for service in "${services[@]}"; do
        local url=$(echo $service | cut -d: -f1-2)
        local name=$(echo $service | cut -d: -f3)
        
        if curl -s --connect-timeout 10 "$url" > /dev/null; then
            log_success "$name: ✓ 정상"
        else
            log_warning "$name: ✗ 응답 없음"
        fi
    done
}

# 메인 함수
main() {
    local env=""
    local force=false
    local skip_build=false
    local only_app=false
    local test_ssh_only=false
    
    # 인자 파싱
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|staging|prod)
                env=$1
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
            --test-ssh)
                test_ssh_only=true
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
    
    # 환경 지정 확인
    if [ -z "$env" ]; then
        log_error "환경을 지정해야 합니다."
        usage
    fi
    
    # 시작 시간 기록
    local start_time=$(date +%s)
    
    log_info "LifeBit 자동 배포 시작 - 환경: $env"
    
    # 필수 도구 확인
    check_prerequisites
    
    # 환경 변수 검증
    validate_environment "$env"
    
    # SSH 테스트만 실행
    if [ "$test_ssh_only" = true ]; then
        if [ -f "terraform-outputs.json" ]; then
            local public_ip=$(jq -r '.public_ip.value' terraform-outputs.json)
            local ssh_key=$(jq -r '.login_key_name.value' terraform-outputs.json)
            test_ssh_connection "$public_ip" "$ssh_key"
        else
            log_error "terraform-outputs.json 파일을 찾을 수 없습니다."
        fi
        exit 0
    fi
    
    # 인프라 배포 (only-app 옵션이 아닌 경우)
    if [ "$only_app" != true ]; then
        deploy_infrastructure "$env" "$force"
        update_ansible_inventory "$env"
    fi
    
    # 애플리케이션 배포
    deploy_application "$env" "$skip_build"
    
    # 배포 상태 확인
    check_deployment_status
    
    # 완료 시간 계산
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "배포가 완료되었습니다! (소요 시간: ${duration}초)"
    
    # 배포 정보 출력
    local public_ip=$(jq -r '.public_ip.value' terraform-outputs.json)
    echo -e "${GREEN}===== 배포 완료 정보 =====${NC}"
    echo -e "웹사이트: ${BLUE}http://${public_ip}${NC}"
    echo -e "Spring API: ${BLUE}http://${public_ip}/api${NC}"
    echo -e "FastAPI 문서: ${BLUE}http://${public_ip}/api/py/docs${NC}"
    echo -e "Airflow: ${BLUE}http://${public_ip}/airflow${NC}"
    echo -e "SSH 접속: ${BLUE}ssh -i ~/.ssh/lifebit-${env}-key.pem root@${public_ip}${NC}"
}

# 스크립트 실행
main "$@" 