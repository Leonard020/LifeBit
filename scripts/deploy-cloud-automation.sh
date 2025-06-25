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
        -var-file="terraform.tfvars" \
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
# Ansible 인벤토리 업데이트 (동적 사용자명 지원)
# ================================================
update_ansible_inventory() {
    local server_ip="$1"
    log_step "Ansible 인벤토리 업데이트 (동적 사용자명 지원)"
    
    local inventory_file="$PROJECT_ROOT/ansible/inventory.ini"
    
    # 백업 생성
    cp "$inventory_file" "$inventory_file.backup-$TIMESTAMP"
    
    # SSH 사용자명 결정 (성공한 사용자명 우선, 없으면 기본값)
    local ssh_username="${LIFEBIT_SSH_USERNAME:-ubuntu}"
    
    # SSH 키 정보 확인
    local key_name="${LIFEBIT_SSH_KEY_NAME}"
    local key_file="${LIFEBIT_SSH_KEY_FILE}"
    
    if [ -z "$key_name" ] || [ -z "$key_file" ]; then
        if [ -f terraform.tfvars ]; then
            key_name=$(grep "login_key_name" terraform.tfvars | cut -d'"' -f2)
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
    
    log_info "인벤토리 업데이트 정보:"
    log_info "  서버 IP: $server_ip"
    log_info "  SSH 사용자: $ssh_username"
    log_info "  SSH 키: $key_file"
    
    # 서버 IP 업데이트
    sed -i "s/lifebit-demo-server ansible_host=.*/lifebit-$ENVIRONMENT-server ansible_host=$server_ip/g" "$inventory_file"
    # ansible_host placeholder (백워드 호환)
    sed -i "s/ansible_host=YOUR_SERVER_IP_HERE/ansible_host=$server_ip/g" "$inventory_file"

    # SSH 사용자명 업데이트
    sed -i "s/ansible_user=.*/ansible_user=$ssh_username/g" "$inventory_file"
    # ansible_user placeholder (백워드 호환)
    sed -i "s/ansible_user=YOUR_SSH_USER/ansible_user=$ssh_username/g" "$inventory_file"

    # SSH 개인키 경로 업데이트 (절대 경로 사용)
    sed -i "s|ansible_ssh_private_key_file=.*|ansible_ssh_private_key_file=$key_file|g" "$inventory_file"
    # ansible_ssh_private_key_file placeholder (백워드 호환)
    sed -i "s|ansible_ssh_private_key_file=YOUR_KEY_PATH|ansible_ssh_private_key_file=$key_file|g" "$inventory_file"
    
    # SSH 연결 옵션 추가 (안정성 향상)
    sed -i "s/ansible_ssh_common_args=.*/ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=\/dev\/null -o ServerAliveInterval=60 -o ServerAliveCountMax=3'/g" "$inventory_file"
    # ansible_ssh_common_args placeholder (백워드 호환)
    sed -i "s/ansible_ssh_common_args=YOUR_SSH_OPTIONS/ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=\/dev\/null -o ServerAliveInterval=60 -o ServerAliveCountMax=3'/g" "$inventory_file"
    
    # 업데이트된 인벤토리 파일 확인
    log_info "업데이트된 인벤토리 파일 내용:"
    cat "$inventory_file" | grep -E "(ansible_host|ansible_user|ansible_ssh_private_key_file|ansible_ssh_common_args)" | while read line; do
        log_info "  $line"
    done
    
    log_success "Ansible 인벤토리 업데이트 완료"
}

# ================================================
# SSH 키 설정 (완벽한 다중 백업 방식)
# ================================================
setup_ssh_keys() {
    log_step "SSH 키 설정 (다중 백업 방식)"
    
    cd "$PROJECT_ROOT/infrastructure"
    
    # SSH 키 이름 생성 (고유성 보장)
    local timestamp=$(date +%m%d%H%M%S)
    local key_name="lifebit-auto-key-$timestamp"
    local key_file="$HOME/.ssh/$key_name.pem"
    
    # 기존 키 정리 (충돌 방지)
    if [ -f terraform.tfvars ]; then
        local old_key=$(grep "login_key_name" terraform.tfvars 2>/dev/null | cut -d'"' -f2 || true)
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
    
    # 방법 1: 네이버 클라우드에서 SSH 키 생성 (기본 방식)
    log_info "방법 1: 네이버 클라우드에서 SSH 키 생성 시도..."
    
    local key_response
    if key_response=$(cd "$HOME/.ncloud" && ./ncloud vserver createLoginKey --keyName "$key_name" --output json 2>&1); then
        # JSON 응답 유효성 확인
        if echo "$key_response" | jq empty 2>/dev/null; then
            # Private key 추출 및 저장
            local private_key
            if private_key=$(echo "$key_response" | jq -r '.createLoginKeyResponse.privateKey' 2>/dev/null); then
                if [ -n "$private_key" ] && [ "$private_key" != "null" ]; then
                    # SSH 키 파일 저장
                    echo "$private_key" > "$key_file"
                    chmod 400 "$key_file"
                    
                    # 키 유효성 검사
                    if ssh-keygen -l -f "$key_file" >/dev/null 2>&1; then
                        local fingerprint=$(ssh-keygen -l -f "$key_file" 2>/dev/null | awk '{print $2}')
                        log_success "방법 1 성공: SSH 키 생성 완료 (fingerprint: $fingerprint)"
                        
                        # Terraform 변수 파일 생성
                        create_terraform_vars "$key_name" "$key_file" "$fingerprint"
                        
                        # 전역 변수로 키 정보 저장
                        export LIFEBIT_SSH_KEY_NAME="$key_name"
                        export LIFEBIT_SSH_KEY_FILE="$key_file"
                        
                        return 0
                    fi
                fi
            fi
        fi
    fi
    
    log_warning "방법 1 실패: $key_response"
    
    # 방법 2: 로컬에서 SSH 키 생성 후 NCP에 업로드
    log_info "방법 2: 로컬에서 SSH 키 생성 후 NCP 업로드 시도..."
    
    # 로컬에서 SSH 키 생성
    if ssh-keygen -t rsa -b 2048 -f "$key_file" -N "" -C "lifebit-auto-$timestamp"; then
        # Public key 추출
        local public_key=$(ssh-keygen -y -f "$key_file")
        
        # NCP에 키 업로드 (import 방식)
        if cd "$HOME/.ncloud" && ./ncloud vserver importLoginKey --keyName "$key_name" --publicKey "$public_key" >/dev/null 2>&1; then
            log_success "방법 2 성공: 로컬 SSH 키를 NCP에 업로드 완료"
            
            # 키 유효성 검사
            local fingerprint=$(ssh-keygen -l -f "$key_file" 2>/dev/null | awk '{print $2}')
            
            # Terraform 변수 파일 생성
            create_terraform_vars "$key_name" "$key_file" "$fingerprint"
            
            # 전역 변수로 키 정보 저장
            export LIFEBIT_SSH_KEY_NAME="$key_name"
            export LIFEBIT_SSH_KEY_FILE="$key_file"
            
            return 0
        fi
    fi
    
    log_warning "방법 2 실패"
    
    # 방법 3: 기존 키 재사용 (최후의 수단)
    log_info "방법 3: 기존 SSH 키 재사용 시도..."
    
    local existing_keys=$(cd "$HOME/.ncloud" && ./ncloud vserver getLoginKeyList --output json 2>/dev/null | jq -r '.getLoginKeyListResponse.loginKeyList[].keyName' 2>/dev/null || true)
    
    if [ -n "$existing_keys" ]; then
        for existing_key in $existing_keys; do
            if [[ "$existing_key" == lifebit-auto-key-* ]]; then
                log_info "기존 키 발견: $existing_key"
                
                # 기존 키 파일 확인
                local existing_key_file="$HOME/.ssh/$existing_key.pem"
                if [ -f "$existing_key_file" ] && ssh-keygen -l -f "$existing_key_file" >/dev/null 2>&1; then
                    log_success "방법 3 성공: 기존 SSH 키 재사용 ($existing_key)"
                    
                    # Terraform 변수 파일 생성
                    create_terraform_vars "$existing_key" "$existing_key_file" "reused"
                    
                    # 전역 변수로 키 정보 저장
                    export LIFEBIT_SSH_KEY_NAME="$existing_key"
                    export LIFEBIT_SSH_KEY_FILE="$existing_key_file"
                    
                    return 0
                fi
            fi
        done
    fi
    
    # 모든 방법 실패
    log_error "모든 SSH 키 생성 방법이 실패했습니다"
    log_error "수동으로 SSH 키를 생성하고 NCP에 업로드해주세요"
    exit 1
}

# Terraform 변수 파일 생성 함수
create_terraform_vars() {
    local key_name="$1"
    local key_file="$2"
    local fingerprint="$3"
    
    # infrastructure 디렉토리로 이동
    cd "$PROJECT_ROOT/infrastructure"
    
    # 백업 생성
    if [ -f terraform.tfvars ]; then
        cp terraform.tfvars "terraform.tfvars.backup-$(date +%Y%m%d_%H%M%S)"
    fi
    
    cat > terraform.tfvars << EOF
# Auto-generated SSH key configuration
login_key_name = "$key_name"

# Generated on: $(date)
# Key file: $key_file
# Fingerprint: $fingerprint
# Method: ${4:-auto-generated}
EOF
    
    log_info "Terraform 변수 파일 생성 완료: $key_name"
}

# ================================================
# 서버 연결 대기 (완벽한 SSH 연결 보장)
# ================================================
wait_for_server() {
    local server_ip="$1"
    log_step "서버 연결 대기 (완벽한 SSH 연결 보장)"
    
    log_info "서버 부팅 대기 중... (최대 10분)"
    
    # SSH 키 정보 확인 (전역 변수 우선, 없으면 파일에서 읽기)
    local key_name="${LIFEBIT_SSH_KEY_NAME}"
    local key_file="${LIFEBIT_SSH_KEY_FILE}"
    
    if [ -z "$key_name" ] || [ -z "$key_file" ]; then
        if [ -f terraform.tfvars ]; then
            key_name=$(grep "login_key_name" terraform.tfvars | cut -d'"' -f2)
            key_file="$HOME/.ssh/${key_name}.pem"
        else
            log_error "SSH 키 정보를 찾을 수 없습니다"
            exit 1
        fi
    fi
    
    log_info "SSH 키 사용: $key_name ($key_file)"
    
    # 다양한 사용자명 시도 (XEN 하이퍼바이저 우선)
    local usernames=("root" "ubuntu" "admin" "ncp" "xenuser")
    
    # SSH 연결 시도 (더 안정적인 옵션들)
    for i in {1..60}; do
        # 각 사용자명으로 시도
        for username in "${usernames[@]}"; do
            log_info "SSH 연결 시도 ($i/60): $username@$server_ip"
            
            if ssh -o ConnectTimeout=15 \
                   -o StrictHostKeyChecking=no \
                   -o UserKnownHostsFile=/dev/null \
                   -o PreferredAuthentications=publickey \
                   -o PasswordAuthentication=no \
                   -o PubkeyAuthentication=yes \
                   -o LogLevel=ERROR \
                   -o ServerAliveInterval=60 \
                   -o ServerAliveCountMax=3 \
                   -i "$key_file" \
                   "$username@$server_ip" "echo 'SSH 연결 성공 - 사용자: $username'" >/dev/null 2>&1; then
                log_success "서버 연결 확인 완료 (사용자: $username)"
                
                # 성공한 사용자명을 전역 변수로 저장
                export LIFEBIT_SSH_USERNAME="$username"
                
                # SSH 연결 테스트 (상세 정보)
                log_info "SSH 연결 상세 테스트..."
                ssh -o ConnectTimeout=10 \
                    -o StrictHostKeyChecking=no \
                    -o UserKnownHostsFile=/dev/null \
                    -i "$key_file" \
                    "$username@$server_ip" "
                    echo '=== 시스템 정보 ==='
                    uname -a
                    echo '=== 디스크 사용량 ==='
                    df -h
                    echo '=== 메모리 사용량 ==='
                    free -h
                    echo '=== 네트워크 인터페이스 ==='
                    ip addr show
                    echo '=== SSH 데몬 상태 ==='
                    systemctl status ssh --no-pager -l
                    echo '=== SSH 키 확인 ==='
                    ls -la ~/.ssh/ || echo 'SSH 키 디렉토리 없음'
                " 2>/dev/null || log_warning "상세 정보 조회 실패 (정상적인 경우)"
                
                return 0
            fi
        done
        
        # 진단 정보 (10번째마다)
        if [ $((i % 10)) -eq 0 ]; then
            log_info "연결 진단 중... (시도 $i/60)"
            
            # 포트 22 열려있는지 확인
            if timeout 5 bash -c "</dev/tcp/$server_ip/22" >/dev/null 2>&1; then
                log_info "포트 22 열림 - SSH 데몬 응답 대기 중"
                
                # SSH 데몬 응답 확인
                if timeout 3 bash -c "echo 'SSH-2.0-OpenSSH' | nc -w 3 $server_ip 22" >/dev/null 2>&1; then
                    log_info "SSH 데몬 정상 응답 - 키 주입 문제일 수 있음"
                else
                    log_warning "SSH 데몬 응답 없음 - 서버 초기화 중"
                fi
            else
                log_warning "포트 22 닫힘 - 서버 부팅 중"
            fi
            
            # 서버 상태 확인 (ping)
            if ping -c 1 -W 3 "$server_ip" >/dev/null 2>&1; then
                log_info "서버 ping 정상"
            else
                log_warning "서버 ping 실패"
            fi
        else
            log_info "서버 연결 시도 중... ($i/60)"
        fi
        
        # XEN 하이퍼바이저는 키 주입에 더 오래 걸림
        sleep 15
    done
    
    # 최종 실패 시 진단 정보
    log_error "서버 연결 실패 - 상세 진단 정보:"
    log_error "서버 IP: $server_ip"
    log_error "SSH 키: $key_file"
    log_error "시도한 사용자명: ${usernames[*]}"
    
    # 마지막 verbose SSH 시도 (모든 사용자명으로)
    for username in "${usernames[@]}"; do
        log_error "마지막 SSH 연결 시도 (verbose) - $username:"
        ssh -v -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$key_file" "$username@$server_ip" "echo test" 2>&1 | head -10
        echo "---"
    done
    
    # SSH 키 문제 진단
    log_error "SSH 키 진단:"
    log_error "키 파일 권한: $(ls -la "$key_file")"
    log_error "키 타입: $(ssh-keygen -l -f "$key_file" 2>/dev/null | head -1 || echo '키 읽기 실패')"
    
    # NCP에서 키 상태 확인
    log_error "NCP SSH 키 상태 확인:"
    cd "$HOME/.ncloud" && ./ncloud vserver getLoginKeyList --output json 2>/dev/null | jq -r '.getLoginKeyListResponse.loginKeyList[] | select(.keyName == "'$key_name'")' 2>/dev/null || log_error "NCP 키 상태 확인 실패"
    
    log_error "SSH 연결 실패 - 수동 확인이 필요합니다"
    log_error "1. NCP 콘솔에서 서버 상태 확인"
    log_error "2. SSH 키가 서버에 제대로 주입되었는지 확인"
    log_error "3. 보안그룹에서 포트 22가 열려있는지 확인"
    
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
# 배포 검증 (개선된 버전)
# ================================================
verify_deployment() {
    log_step "배포 검증 (개선된 버전)"
    
    cd "$PROJECT_ROOT/infrastructure"
    local server_ip=$(terraform output -raw public_ip)
    
    # SSH 사용자명 결정
    local ssh_username="${LIFEBIT_SSH_USERNAME:-ubuntu}"
    local key_file="${LIFEBIT_SSH_KEY_FILE}"
    
    if [ -z "$key_file" ]; then
        if [ -f terraform.tfvars ]; then
            local key_name=$(grep "login_key_name" terraform.tfvars | cut -d'"' -f2)
            key_file="$HOME/.ssh/${key_name}.pem"
        fi
    fi
    
    local services=(
        "http://$server_ip:8082:Nginx Proxy"
        "http://$server_ip:3000:Frontend"
        "http://$server_ip:8080/actuator/health:Spring Boot API"
        "http://$server_ip:8001/docs:FastAPI"
        "http://$server_ip:3001:Grafana"
        "http://$server_ip:9090:Prometheus"
    )
    
    log_info "서비스 헬스체크 시작..."
    
    # 원격 헬스체크 스크립트 실행
    log_info "원격 헬스체크 스크립트 실행..."
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$key_file" "$ssh_username@$server_ip" "/opt/lifebit/health-check.sh"; then
        log_success "원격 헬스체크 성공"
    else
        log_warning "원격 헬스체크 실패 - 수동 확인 필요"
    fi
    
    # 메모리 사용량 확인
    log_info "메모리 사용량 확인..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$key_file" "$ssh_username@$server_ip" "
        echo '=== 메모리 사용량 ==='
        free -h
        echo '=== 디스크 사용량 ==='
        df -h
        echo '=== Docker 컨테이너 상태 ==='
        docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    " || log_warning "시스템 정보 조회 실패"
    
    # HTTP 헬스체크
    for service_info in "${services[@]}"; do
        local url="${service_info%:*}"
        local name="${service_info##*:}"
        
        log_info "HTTP 헬스체크: $name"
        
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
# 접속 정보 출력 (동적 SSH 사용자명 지원)
# ================================================
show_deployment_info() {
    cd "$PROJECT_ROOT/infrastructure"
    local server_ip=$(terraform output -raw public_ip)
    
    # SSH 사용자명 결정 (성공한 사용자명 우선, 없으면 기본값)
    local ssh_username="${LIFEBIT_SSH_USERNAME:-ubuntu}"
    local key_name="${LIFEBIT_SSH_KEY_NAME}"
    local key_file="${LIFEBIT_SSH_KEY_FILE}"
    
    if [ -z "$key_name" ] || [ -z "$key_file" ]; then
        if [ -f terraform.tfvars ]; then
            key_name=$(grep "login_key_name" terraform.tfvars | cut -d'"' -f2)
            key_file="$HOME/.ssh/${key_name}.pem"
        fi
    fi
    
    cat << EOF

🎉 클라우드 배포 완료!

🌐 접속 정보:
   서버 IP: $server_ip
   SSH 사용자: $ssh_username
   SSH 키: $key_file
   
📱 서비스 URLs:
   - 통합 접속 (Nginx):  http://$server_ip:8082
   - Frontend:           http://$server_ip:3000
   - Spring Boot API:    http://$server_ip:8080
   - FastAPI:            http://$server_ip:8001
   - Grafana:            http://$server_ip:3001 (admin/grafana_secure_password)
   - Prometheus:         http://$server_ip:9090
   - Airflow:            http://$server_ip:8081 (admin/admin123)

🔑 SSH 접속:
   ssh -i $key_file $ssh_username@$server_ip

📋 관리 명령어:
   - 서비스 상태: docker ps
   - 로그 확인: docker-compose -f docker-compose.single-server.yml logs -f
   - 서비스 재시작: docker-compose -f docker-compose.single-server.yml restart
   - 시스템 정보: ssh -i $key_file $ssh_username@$server_ip "df -h && free -h"
   - 헬스체크: ssh -i $key_file $ssh_username@$server_ip "/opt/lifebit/health-check.sh"
   - 메모리 모니터링: ssh -i $key_file $ssh_username@$server_ip "/opt/lifebit/memory-monitor.sh"
   - 로그 확인: ssh -i $key_file $ssh_username@$server_ip "tail -f /opt/lifebit/logs/health-check.log"

💰 예상 비용: 월 3-5만원 (NCP 서버 1대)

🔧 문제 해결:
   - SSH 연결 실패 시: NCP 콘솔에서 서버 상태 확인
   - 서비스 접속 불가 시: docker-compose -f docker-compose.single-server.yml ps
   - 로그 확인: docker-compose -f docker-compose.single-server.yml logs [서비스명]
   - 메모리 부족 시: ssh -i $key_file $ssh_username@$server_ip "/opt/lifebit/memory-monitor.sh"
   - 자동 백업: 매일 새벽 3시에 데이터베이스 백업 실행

EOF
}

# ================================================
# 메인 실행 함수 (완벽한 SSH 키 주입 보장)
# ================================================
main() {
    setup_logging
    show_banner
    
    case "$DEPLOY_MODE" in
        "full")
            check_prerequisites
            
            # 1단계: SSH 키 설정 (다중 백업 방식)
            log_step "1단계: SSH 키 설정"
            setup_ssh_keys
            
            # 2단계: Terraform 인프라 배포
            log_step "2단계: Terraform 인프라 배포"
            deploy_infrastructure

            # DRY_RUN 모드에서는 인프라만 계획 후 종료
            if [ "$DRY_RUN" = "true" ]; then
                log_info "DRY_RUN 모드: 인프라 계획 확인 후 종료합니다."
                exit 0
            fi

            # 3단계: 서버 안정화 대기 (XEN 하이퍼바이저 키 주입 시간 고려)
            log_step "3단계: 서버 안정화 대기"
            log_info "XEN 하이퍼바이저 서버가 완전히 부팅되고 SSH 키 주입이 완료될 때까지 대기합니다. (5분)"
            sleep 300

            # 4단계: SSH 연결 확인 (완벽한 연결 보장)
            log_step "4단계: SSH 연결 확인"
            SERVER_IP=$(cd "$PROJECT_ROOT/infrastructure" && terraform output -raw public_ip)
            wait_for_server "$SERVER_IP"
            
            # 5단계: Ansible 인벤토리 업데이트
            log_step "5단계: Ansible 인벤토리 업데이트"
            update_ansible_inventory "$SERVER_IP"
            
            # 6단계: Ansible 애플리케이션 배포
            log_step "6단계: Ansible 애플리케이션 배포"
            deploy_application
            
            # 7단계: 배포 검증
            log_step "7단계: 배포 검증"
            verify_deployment
            
            # 8단계: 배포 정보 출력
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
