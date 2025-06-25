#!/bin/bash

# ================================================
# LifeBit 클라우드 자동화 배포 스크립트 (학원 프로젝트용)
# ================================================
# Terraform + Ansible을 이용한 완전 자동화 배포

set -e

# ================================================
# 설정 및 변수
# ================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$PROJECT_ROOT/logs/deploy-cloud-$TIMESTAMP.log"

# 배포 모드 설정
DEPLOY_MODE="${1:-full}"  # full, infra-only, app-only
ENVIRONMENT="${2:-demo}"  # demo, dev, prod
DRY_RUN="${3:-false}"     # true, false
AUTO_APPROVE="${4:-false}"    # true, false

# 고유 이름 접미사
NAME_SUFFIX="${5:-$(date +%m%d%H%M)}"

# NCP 설정 (환경변수에서 로드)
NCP_ACCESS_KEY="${NCP_ACCESS_KEY}"
NCP_SECRET_KEY="${NCP_SECRET_KEY}"
NCP_REGION="${NCP_REGION:-KR}"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# ================================================
# 로그 함수
# ================================================
setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    exec > >(tee -a "$LOG_FILE")
    exec 2>&1
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ================================================
# 배너 출력
# ================================================
show_banner() {
    cat << 'EOF'
  _      _  __      ____  _ _   
 | |    (_)/ _|    |  _ \(_) |  
 | |     _| |_ ___ | |_) |_| |_ 
 | |    | |  _/ _ \|  _ <| | __|
 | |____| | ||  __/| |_) | | |_ 
 |______|_|_| \___||____/|_|\__|

 ☁️  LifeBit 클라우드 자동화 배포 시스템 ☁️
 Terraform + Ansible 완전 자동화
EOF
    
    echo ""
    echo "================================================"
    echo "배포 모드: $DEPLOY_MODE"
    echo "환경: $ENVIRONMENT"
    echo "DRY RUN: $DRY_RUN"
    echo "AUTO_APPROVE: $AUTO_APPROVE"
    echo "시작 시간: $(date)"
    echo "로그 파일: $LOG_FILE"
    echo "================================================"
    echo ""
}

# ================================================
# 사전 요구사항 검사
# ================================================
check_prerequisites() {
    log_step "사전 요구사항 검사"
    
    # Terraform 확인
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform이 설치되어 있지 않습니다."
        log_info "Terraform 설치: https://www.terraform.io/downloads.html"
        exit 1
    fi
    
    # Ansible 확인
    if ! command -v ansible-playbook &> /dev/null; then
        log_error "Ansible이 설치되어 있지 않습니다."
        log_info "Ansible 설치: pip install ansible"
        exit 1
    fi
    
    # NCP 인증 정보 확인
    if [ -z "$NCP_ACCESS_KEY" ] || [ -z "$NCP_SECRET_KEY" ]; then
        log_error "NCP 인증 정보가 설정되지 않았습니다."
        log_info "환경변수 설정: export NCP_ACCESS_KEY=your_key"
        log_info "환경변수 설정: export NCP_SECRET_KEY=your_secret"
        exit 1
    fi
    
    # Git 상태 확인
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Git 작업 디렉토리에 커밋되지 않은 변경사항이 있습니다."
        if [ "$AUTO_APPROVE" = "true" ]; then
            log_info "AUTO_APPROVE 모드: 변경사항 무시하고 계속 진행합니다."
        else
            read -p "계속 진행하시겠습니까? (y/N): " confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                log_info "배포가 취소되었습니다."
                exit 0
            fi
        fi
    fi
    
    log_success "모든 사전 요구사항이 충족되었습니다."
}

# ================================================
# Terraform 인프라 배포
# ================================================
deploy_infrastructure() {
    log_step "Terraform 인프라 배포"
    
    cd "$PROJECT_ROOT/infrastructure"
    
    # Terraform 초기화
    log_info "Terraform 초기화 중..."
    terraform init
    
    # Terraform 계획 확인
    log_info "Terraform 계획 생성 중..."
    terraform plan \
        -var="ncp_access_key=$NCP_ACCESS_KEY" \
        -var="ncp_secret_key=$NCP_SECRET_KEY" \
        -var="environment=$ENVIRONMENT" \
        -var="name_suffix=$NAME_SUFFIX" \
        -var-file="single-server.tfvars" \
        -out="tfplan-$TIMESTAMP"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN 모드: Terraform 계획만 확인합니다."
        return 0
    fi
    
    if [ "$AUTO_APPROVE" = "true" ]; then
        log_info "AUTO_APPROVE 모드: 사용자 확인을 건너뜁니다."
    else
        log_warning "위의 Terraform 계획을 검토하세요."
        read -p "인프라를 배포하시겠습니까? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            log_info "인프라 배포가 취소되었습니다."
            exit 0
        fi
    fi
    
    # Terraform 적용
    log_info "Terraform 인프라 배포 중..."
    terraform apply "tfplan-$TIMESTAMP"
    
    # 서버 IP 추출
    SERVER_IP=$(terraform output -raw public_ip)
    log_success "인프라 배포 완료! 서버 IP: $SERVER_IP"
    
    # Ansible 인벤토리 업데이트
    update_ansible_inventory "$SERVER_IP"
}

# ================================================
# Ansible 인벤토리 업데이트
# ================================================
update_ansible_inventory() {
    local server_ip="$1"
    log_step "Ansible 인벤토리 업데이트"
    
    local inventory_file="$PROJECT_ROOT/ansible/inventory.ini"
    
    # 백업 생성
    cp "$inventory_file" "$inventory_file.backup-$TIMESTAMP"
    
    # 서버 IP 업데이트
    sed -i "s/lifebit-demo-server ansible_host=.*/lifebit-$ENVIRONMENT-server ansible_host=$server_ip/g" "$inventory_file"
    # ansible_host placeholder (백워드 호환)
    sed -i "s/ansible_host=YOUR_SERVER_IP_HERE/ansible_host=$server_ip/g" "$inventory_file"

    # SSH 개인키 경로 업데이트
    local key_name="$(terraform output -raw login_key_name)"
    sed -i "s|ansible_ssh_private_key_file=.*|ansible_ssh_private_key_file=~/.ssh/${key_name}.pem|g" "$inventory_file"
    
    log_success "Ansible 인벤토리 업데이트 완료"
}

# ================================================
# SSH 키 설정 (완벽한 방법)
# ================================================
setup_ssh_keys() {
    log_step "SSH 키 설정"
    
    cd "$PROJECT_ROOT/infrastructure"
    
    # SSH 키 이름 생성 (고유성 보장)
    local timestamp=$(date +%m%d%H%M%S)
    local key_name="lifebit-auto-key-$timestamp"
    local key_file="$HOME/.ssh/$key_name.pem"
    
    # 기존 키 정리 (충돌 방지)
    if [ -f terraform.tfvars.auto ]; then
        local old_key=$(grep "login_key_name" terraform.tfvars.auto 2>/dev/null | cut -d'"' -f2 || true)
        if [ -n "$old_key" ] && [ "$old_key" != "$key_name" ]; then
            log_info "기존 SSH 키 정리: $old_key"
            cd "$HOME/.ncloud" && ./ncloud vserver deleteLoginKeys --keyNameList "$old_key" >/dev/null 2>&1 || true
            rm -f "$HOME/.ssh/$old_key.pem" 2>/dev/null || true
        fi
    fi
    
    # 네이버 클라우드 CLI 접근 가능성 확인
    if ! cd "$HOME/.ncloud" && ./ncloud help >/dev/null 2>&1; then
        log_error "네이버 클라우드 CLI에 접근할 수 없습니다"
        exit 1
    fi
    
    # 네이버 클라우드에서 SSH 키 생성
    log_info "네이버 클라우드에서 새 SSH 키 생성: $key_name"
    
    local key_response
    if ! key_response=$(cd "$HOME/.ncloud" && ./ncloud vserver createLoginKey --keyName "$key_name" --output json 2>&1); then
        log_error "SSH 키 생성 실패: $key_response"
        exit 1
    fi
    
    # JSON 응답 유효성 확인
    if ! echo "$key_response" | jq empty 2>/dev/null; then
        log_error "SSH 키 생성 응답이 유효하지 않습니다: $key_response"
        exit 1
    fi
    
    # Private key 추출 및 저장
    local private_key
    if ! private_key=$(echo "$key_response" | jq -r '.createLoginKeyResponse.privateKey' 2>/dev/null); then
        log_error "Private key 추출 실패"
        exit 1
    fi
    
    if [ -z "$private_key" ] || [ "$private_key" = "null" ]; then
        log_error "Private key가 비어있습니다"
        exit 1
    fi
    
    # SSH 키 파일 저장
    echo "$private_key" > "$key_file"
    chmod 400 "$key_file"
    
    # 키 유효성 검사 (여러 방법으로)
    if ! ssh-keygen -l -f "$key_file" >/dev/null 2>&1; then
        log_error "생성된 SSH 키가 유효하지 않습니다"
        rm -f "$key_file"
        cd "$HOME/.ncloud" && ./ncloud vserver deleteLoginKeys --keyNameList "$key_name" >/dev/null 2>&1 || true
        exit 1
    fi
    
    # 키 fingerprint 확인
    local fingerprint=$(ssh-keygen -l -f "$key_file" 2>/dev/null | awk '{print $2}')
    log_info "SSH 키 fingerprint: $fingerprint"
    
    # Terraform 변수 파일 생성 (백업 포함)
    if [ -f terraform.tfvars.auto ]; then
        cp terraform.tfvars.auto "terraform.tfvars.auto.backup-$(date +%Y%m%d_%H%M%S)"
    fi
    
    cat > terraform.tfvars.auto << EOF
# Auto-generated SSH key configuration
login_key_name = "$key_name"

# Generated on: $(date)
# Key file: $key_file
# Fingerprint: $fingerprint
EOF
    
    # 전역 변수로 키 정보 저장 (다른 함수에서 사용)
    export LIFEBIT_SSH_KEY_NAME="$key_name"
    export LIFEBIT_SSH_KEY_FILE="$key_file"
    
    log_success "SSH 키 설정 완료"
    log_info "키 이름: $key_name"
    log_info "키 파일: $key_file"
}

# ================================================
# 서버 연결 대기
# ================================================
wait_for_server() {
    local server_ip="$1"
    log_step "서버 연결 대기"
    
    log_info "서버 부팅 대기 중... (최대 5분)"
    
    # SSH 키 정보 확인 (전역 변수 우선, 없으면 파일에서 읽기)
    local key_name="${LIFEBIT_SSH_KEY_NAME}"
    local key_file="${LIFEBIT_SSH_KEY_FILE}"
    
    if [ -z "$key_name" ] || [ -z "$key_file" ]; then
        if [ -f terraform.tfvars.auto ]; then
            key_name=$(grep "login_key_name" terraform.tfvars.auto | cut -d'"' -f2)
            key_file="$HOME/.ssh/${key_name}.pem"
        else
            log_error "SSH 키 정보를 찾을 수 없습니다"
            exit 1
        fi
    fi
    
    # SSH 키 파일 존재 확인
    if [ ! -f "$key_file" ]; then
        log_error "SSH 키 파일이 존재하지 않습니다: $key_file"
        exit 1
    fi
    
    log_info "SSH 키 사용: $key_name ($key_file)"
    
    # SSH 연결 시도 (더 안정적인 옵션들)
    for i in {1..30}; do
        if ssh -o ConnectTimeout=10 \
               -o StrictHostKeyChecking=no \
               -o UserKnownHostsFile=/dev/null \
               -o PreferredAuthentications=publickey \
               -o PasswordAuthentication=no \
               -o LogLevel=ERROR \
               -i "$key_file" \
               ubuntu@"$server_ip" "echo 'SSH 연결 성공'" >/dev/null 2>&1; then
            log_success "서버 연결 확인 완료"
            return 0
        fi
        
        # 진단 정보 (5번째마다)
        if [ $((i % 5)) -eq 0 ]; then
            log_info "연결 진단 중... (시도 $i/30)"
            
            # 포트 22 열려있는지 확인
            if timeout 3 bash -c "</dev/tcp/$server_ip/22" >/dev/null 2>&1; then
                log_info "포트 22 열림 - SSH 데몬 응답 대기 중"
            else
                log_warning "포트 22 닫힘 - 서버 부팅 중"
            fi
        else
            log_info "서버 연결 시도 중... ($i/30)"
        fi
        
        sleep 10
    done
    
    # 최종 실패 시 진단 정보
    log_error "서버 연결 실패 - 진단 정보:"
    log_error "서버 IP: $server_ip"
    log_error "SSH 키: $key_file"
    
    # 마지막 verbose SSH 시도
    log_error "마지막 SSH 연결 시도 (verbose):"
    ssh -v -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$key_file" ubuntu@"$server_ip" "echo test" 2>&1 | head -20
    
    exit 1
}

# ================================================
# Ansible 애플리케이션 배포
# ================================================
deploy_application() {
    log_step "Ansible 애플리케이션 배포"
    
    cd "$PROJECT_ROOT"
    
    # Ansible 플레이북 실행
    log_info "애플리케이션 배포 중..."
    ansible-playbook \
        -i ansible/inventory.ini \
        ansible/playbook.yml \
        --extra-vars "env=$ENVIRONMENT" \
        --extra-vars "git_repository_url=$(git config --get remote.origin.url)" \
        --extra-vars "git_branch=$(git branch --show-current)" \
        -v
    
    log_success "애플리케이션 배포 완료"
}

# ================================================
# 배포 검증
# ================================================
verify_deployment() {
    log_step "배포 검증"
    
    cd "$PROJECT_ROOT/infrastructure"
    local server_ip=$(terraform output -raw public_ip)
    
    local services=(
        "http://$server_ip:8082:Nginx Proxy"
        "http://$server_ip:3000:Frontend"
        "http://$server_ip:8080/actuator/health:Spring Boot API"
        "http://$server_ip:8001/docs:FastAPI"
        "http://$server_ip:3001:Grafana"
        "http://$server_ip:9090:Prometheus"
    )
    
    log_info "서비스 헬스체크 시작..."
    
    for service_info in "${services[@]}"; do
        local url="${service_info%:*}"
        local name="${service_info##*:}"
        
        log_info "헬스체크: $name"
        
        for i in {1..5}; do
            if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
                log_success "✓ $name 정상"
                break
            else
                log_warning "헬스체크 재시도 ($i/5): $name"
                sleep 15
            fi
            
            if [ $i -eq 5 ]; then
                log_error "✗ $name 헬스체크 실패"
            fi
        done
    done
}

# ================================================
# 접속 정보 출력
# ================================================
show_deployment_info() {
    cd "$PROJECT_ROOT/infrastructure"
    local server_ip=$(terraform output -raw public_ip)
    
    cat << EOF

🎉 클라우드 배포 완료!

🌐 접속 정보:
   서버 IP: $server_ip
   
📱 서비스 URLs:
   - 통합 접속 (Nginx):  http://$server_ip:8082
   - Frontend:           http://$server_ip:3000
   - Spring Boot API:    http://$server_ip:8080
   - FastAPI:            http://$server_ip:8001
   - Grafana:            http://$server_ip:3001 (admin/grafana_secure_password)
   - Prometheus:         http://$server_ip:9090
   - Airflow:            http://$server_ip:8081 (admin/admin123)

🔑 SSH 접속:
   ssh -i ~/.ssh/${LIFEBIT_SSH_KEY_NAME:-$(grep "login_key_name" terraform.tfvars.auto | cut -d'"' -f2)}.pem ubuntu@$server_ip

📋 관리 명령어:
   - 서비스 상태: docker ps
   - 로그 확인: docker-compose -f docker-compose.single-server.yml logs -f
   - 서비스 재시작: docker-compose -f docker-compose.single-server.yml restart

💰 예상 비용: 월 3-5만원 (NCP 서버 1대)

EOF
}

# ================================================
# 메인 실행 함수
# ================================================
main() {
    setup_logging
    show_banner
    
    case "$DEPLOY_MODE" in
        "full")
            check_prerequisites
            setup_ssh_keys  # SSH 키를 먼저 생성
            deploy_infrastructure

            # DRY_RUN 모드에서는 인프라만 계획 후 종료
            if [ "$DRY_RUN" = "true" ]; then
                log_info "DRY_RUN 모드: 인프라 계획 확인 후 종료합니다."
                exit 0
            fi

            log_info "서버가 안정적으로 부팅되고 클라우드 초기화를 진행할 시간을 줍니다. (2분 대기)"
            sleep 120

            SERVER_IP=$(cd "$PROJECT_ROOT/infrastructure" && terraform output -raw public_ip)
            wait_for_server "$SERVER_IP"
            deploy_application
            verify_deployment
            show_deployment_info
            ;;
        "infra-only")
            check_prerequisites
            setup_ssh_keys  # SSH 키를 먼저 생성
            deploy_infrastructure
            show_deployment_info
            ;;
        "app-only")
            check_prerequisites
            deploy_application
            verify_deployment
            show_deployment_info
            ;;
        *)
            log_error "잘못된 배포 모드: $DEPLOY_MODE"
            log_info "사용법: $0 [full|infra-only|app-only] [demo|dev|prod] [true|false] [true|false] [name_suffix]"
            exit 1
            ;;
    esac
    
    echo
    echo "==============================================="
    echo "✅ 클라우드 자동화 배포 완료!"
    echo "==============================================="
    echo "📋 배포 로그: $LOG_FILE"
    echo
}

# 스크립트 실행
main "$@" 
