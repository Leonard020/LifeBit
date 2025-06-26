#!/bin/bash
set -e

# 스크립트 정보
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 체크포인트 및 로그 디렉토리
CHECKPOINT_DIR="$SCRIPT_DIR/.deploy_checkpoints"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/aws-deploy-$(date +%Y%m%d_%H%M%S).log"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로깅 함수 (파일과 콘솔에 동시 출력)
log_info() { 
    local msg="[INFO] $1"
    echo -e "${BLUE}$msg${NC}" | tee -a "$LOG_FILE"
}
log_success() { 
    local msg="[SUCCESS] $1"
    echo -e "${GREEN}$msg${NC}" | tee -a "$LOG_FILE"
}
log_warning() { 
    local msg="[WARNING] $1"
    echo -e "${YELLOW}$msg${NC}" | tee -a "$LOG_FILE"
}
log_error() { 
    local msg="[ERROR] $1"
    echo -e "${RED}$msg${NC}" | tee -a "$LOG_FILE"
}
log_deploy() { 
    local msg="[DEPLOY] $1"
    echo -e "${PURPLE}$msg${NC}" | tee -a "$LOG_FILE"
}

# 체크포인트 함수들
create_checkpoint() {
    local step_name="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    mkdir -p "$CHECKPOINT_DIR"
    echo "$timestamp" > "$CHECKPOINT_DIR/$step_name.done"
    log_success "체크포인트 저장: $step_name"
}

is_step_completed() {
    local step_name="$1"
    [[ -f "$CHECKPOINT_DIR/$step_name.done" ]]
}

clear_checkpoints() {
    if [[ -d "$CHECKPOINT_DIR" ]]; then
        rm -rf "$CHECKPOINT_DIR"
        log_info "이전 체크포인트 삭제됨"
    fi
}

list_completed_steps() {
    if [[ -d "$CHECKPOINT_DIR" ]]; then
        log_info "완료된 단계들:"
        for checkpoint in "$CHECKPOINT_DIR"/*.done; do
            if [[ -f "$checkpoint" ]]; then
                local step_name=$(basename "$checkpoint" .done)
                local timestamp=$(cat "$checkpoint")
                echo "  ✅ $step_name ($timestamp)"
            fi
        done
    fi
}

# 재시도 함수
retry_command() {
    local max_attempts="$1"
    local delay="$2"
    local description="$3"
    shift 3
    local command=("$@")
    
    local attempt=1
    while (( attempt <= max_attempts )); do
        log_info "$description (시도: $attempt/$max_attempts)"
        
        if "${command[@]}"; then
            log_success "$description 성공"
            return 0
        else
            if (( attempt < max_attempts )); then
                log_warning "$description 실패 - ${delay}초 후 재시도..."
                sleep "$delay"
            else
                log_error "$description 최종 실패"
                return 1
            fi
        fi
        ((attempt++))
    done
}

# 네트워크 연결 테스트
test_network_connectivity() {
    log_info "네트워크 연결 테스트 중..."
    
    # AWS API 연결 테스트
    if ! curl -s --max-time 10 https://ec2.ap-northeast-2.amazonaws.com > /dev/null; then
        log_error "AWS API 연결 실패 - 네트워크 상태를 확인하세요"
        return 1
    fi
    
    # GitHub 연결 테스트
    if ! curl -s --max-time 10 https://github.com > /dev/null; then
        log_warning "GitHub 연결 실패 - Docker Compose 다운로드에 문제가 있을 수 있습니다"
    fi
    
    log_success "네트워크 연결 테스트 완료"
}

# 초기화
initialize_logging() {
    mkdir -p "$LOG_DIR"
    log_deploy "🚀 LifeBit AWS 강화된 자동 배포 시작..."
    log_info "로그 파일: $LOG_FILE"
    log_info "체크포인트 디렉토리: $CHECKPOINT_DIR"
    
    # 기존 완료된 단계 표시
    list_completed_steps
}

# ===============================
# .env 파일 자동 로드
# ===============================
load_env_file() {
    if is_step_completed "load_env"; then
        log_info "⏭️  환경 변수 로드 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    local ENV_FILE="$SCRIPT_DIR/.env"
    if [[ -f "$ENV_FILE" ]]; then
        log_info ".env 파일을 로드합니다: $ENV_FILE"
        # .env 파일의 주석을 제외하고 가져와서 export
        set -a  # 자동 export 활성화
        # shellcheck disable=SC1090
        source "$ENV_FILE"
        set +a  # 자동 export 비활성화
        log_success ".env 로드 완료"
        create_checkpoint "load_env"
    else
        log_warning ".env 파일을 찾을 수 없습니다. 환경 변수에 의존합니다."
    fi
}

# 환경 변수 확인
check_environment() {
    if is_step_completed "check_env"; then
        log_info "⏭️  환경 변수 확인 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "환경 변수 확인 중..."
    
    if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
        log_error "AWS 인증 정보가 설정되지 않았습니다."
        log_info "다음 명령으로 설정하세요:"
        echo "export AWS_ACCESS_KEY_ID='your-access-key'"
        echo "export AWS_SECRET_ACCESS_KEY='your-secret-key'"
        echo "export AWS_DEFAULT_REGION='ap-northeast-2'"
        exit 1
    fi
    
    # AWS_DEFAULT_REGION 기본값 설정
    export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
    
    log_success "AWS 인증 정보 확인 완료"
    log_info "리전: $AWS_DEFAULT_REGION"
    
    # 네트워크 연결 테스트
    test_network_connectivity
    
    create_checkpoint "check_env"
}

# Terraform 초기화 및 검증
initialize_terraform() {
    if is_step_completed "terraform_init"; then
        log_info "⏭️  Terraform 초기화 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "Terraform 초기화 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # Terraform 초기화 (재시도 로직 포함)
    if retry_command 3 10 "Terraform 초기화" terraform init; then
        log_success "Terraform 초기화 완료"
    else
        log_error "Terraform 초기화 실패"
        cleanup_on_failure "terraform_init"
    fi
    
    # Terraform 검증
    if terraform validate; then
        log_success "Terraform 설정 검증 완료"
    else
        log_error "Terraform 설정 검증 실패"
        cleanup_on_failure "terraform_validate"
    fi
    
    cd "$SCRIPT_DIR"
    create_checkpoint "terraform_init"
}

# Terraform 인프라 생성
deploy_infrastructure() {
    if is_step_completed "terraform_apply"; then
        log_info "⏭️  인프라 생성 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_deploy "AWS 인프라 생성 시작..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # 기존 인프라 상태 확인
    if [[ -f "terraform.tfstate" ]] && terraform show > /dev/null 2>&1; then
        log_info "기존 인프라 상태 발견 - 상태 확인 중..."
        if terraform plan -detailed-exitcode \
            -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
            -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
            -var="aws_region=$AWS_DEFAULT_REGION" > /dev/null 2>&1; then
            log_success "기존 인프라가 최신 상태입니다"
            cd "$SCRIPT_DIR"
            create_checkpoint "terraform_apply"
            return 0
        fi
    fi
    
    # Terraform 계획 확인
    log_info "Terraform 계획 생성 중..."
    if retry_command 3 15 "Terraform 계획 생성" terraform plan \
        -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
        -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
        -var="aws_region=$AWS_DEFAULT_REGION" \
        -out=tfplan; then
        log_success "Terraform 계획 생성 완료"
    else
        log_error "Terraform 계획 생성 실패"
        cleanup_on_failure "terraform_plan"
    fi
    
    # Terraform 적용
    log_info "Terraform 인프라 생성 중..."
    if retry_command 2 30 "Terraform 인프라 생성" terraform apply -auto-approve tfplan; then
        log_success "Terraform 인프라 생성 완료"
    else
        log_error "Terraform 인프라 생성 실패"
        cleanup_on_failure "terraform_apply"
    fi
    
    cd "$SCRIPT_DIR"
    create_checkpoint "terraform_apply"
}

# SSH 키 저장
save_ssh_key() {
    if is_step_completed "ssh_key_save"; then
        log_info "⏭️  SSH 키 저장 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "SSH 키 저장 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # SSH 디렉토리 생성
    mkdir -p ~/.ssh
    
    # 기존 SSH 키 백업
    if [[ -f ~/.ssh/lifebit.pem ]]; then
        cp ~/.ssh/lifebit.pem ~/.ssh/lifebit.pem.backup.$(date +%Y%m%d_%H%M%S)
        log_info "기존 SSH 키 백업 완료"
    fi
    
    # SSH 키 추출 및 저장
    if terraform output -raw ssh_private_key > ~/.ssh/lifebit.pem; then
        chmod 600 ~/.ssh/lifebit.pem
        log_success "SSH 키 저장 완료: ~/.ssh/lifebit.pem"
    else
        log_error "SSH 키 저장 실패"
        cleanup_on_failure "ssh_key_save"
    fi
    
    cd "$SCRIPT_DIR"
    create_checkpoint "ssh_key_save"
}

# Ansible inventory 업데이트
update_inventory() {
    if is_step_completed "inventory_update"; then
        log_info "⏭️  Ansible inventory 업데이트 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "Ansible inventory 업데이트 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # 퍼블릭 IP 추출
    PUBLIC_IP=$(terraform output -raw public_ip)
    
    if [[ -z "$PUBLIC_IP" ]]; then
        log_error "퍼블릭 IP를 가져올 수 없습니다."
        cleanup_on_failure "public_ip_fetch"
    fi
    
    log_info "퍼블릭 IP: $PUBLIC_IP"
    
    cd "$SCRIPT_DIR"
    
    # inventory.ini의 __SERVER_IP__ 플레이스홀더를 실제 IP로 교체
    if sed -i.bak "s/__SERVER_IP__/$PUBLIC_IP/" ansible/inventory.ini; then
        log_success "inventory.ini 업데이트 완료: $PUBLIC_IP"
    else
        log_error "inventory.ini 업데이트 실패"
        cleanup_on_failure "inventory_update"
    fi
    
    log_success "Ansible inventory 업데이트 완료"
    create_checkpoint "inventory_update"
}

# SSH 연결 재시도 로직 (최대 10분, 15초 간격)
wait_for_ssh_ready() {
    if is_step_completed "ssh_ready"; then
        log_info "⏭️  SSH 연결 대기 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "EC2 SSH 연결 대기 중... (최대 10분)"
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # 기존 호스트 키 제거 (호스트 키 충돌 방지)
    ssh-keygen -R "$PUBLIC_IP" 2>/dev/null || true
    
    local max_attempts=40  # 40 * 15초 = 10분
    local attempt=1
    while (( attempt <= max_attempts )); do
        if timeout 20 ssh -i ~/.ssh/lifebit.pem \
            -o StrictHostKeyChecking=no \
            -o ConnectTimeout=15 \
            -o UserKnownHostsFile=/dev/null \
            ubuntu@"$PUBLIC_IP" 'echo "SSH OK"' 2>/dev/null | grep -q "SSH OK"; then
            log_success "SSH 연결 성공 (시도: $attempt)"
            
            log_info "서버 초기화(cloud-init) 완료 대기 중... (최대 5분)"
            if timeout 300 ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" 'cloud-init status --wait' 2>/dev/null; then
                log_success "서버 초기화 완료."
                create_checkpoint "ssh_ready"
                return 0
            else
                log_warning "서버 초기화(cloud-init) 대기 시간 초과. 계속 진행하지만 문제가 발생할 수 있습니다."
                # 실패하더라도 일단 진행하도록 return 0 처리. Ansible에서 재시도 로직이 있으므로.
                create_checkpoint "ssh_ready"
                return 0
            fi
        else
            log_warning "SSH 연결 대기 중... ($attempt/$max_attempts)"
            sleep 15
        fi
        ((attempt++))
    done
    
    log_error "10분 내 SSH 연결 실패"
    log_info "다음을 확인하세요:"
    log_info "1. EC2 인스턴스 상태: aws ec2 describe-instances --instance-ids \$(cd infrastructure && terraform output -raw server_id)"
    log_info "2. SSH 키 권한: ls -la ~/.ssh/lifebit.pem"
    log_info "3. 수동 SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
    cleanup_on_failure "ssh_connection_timeout"
}

# Docker Compose 버전 업데이트 (개선된 버전)
update_docker_compose() {
    if is_step_completed "docker_compose_update"; then
        log_info "⏭️  Docker Compose 업데이트 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "Docker Compose 최신 버전으로 업데이트 중..."
    
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # 여러 Docker Compose 다운로드 미러 시도
    local compose_urls=(
        "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64"
        "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64"
    )
    
    for url in "${compose_urls[@]}"; do
        log_info "Docker Compose 다운로드 시도: $url"
        
        if ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" << EOF
            set -e
            
            # 기존 docker-compose 제거
            sudo rm -f /usr/local/bin/docker-compose
            
            # Docker Compose 다운로드 (타임아웃과 재시도 포함)
            for i in {1..3}; do
                echo "다운로드 시도 \$i/3..."
                if curl -L --connect-timeout 60 --max-time 600 "$url" -o /tmp/docker-compose; then
                    echo "다운로드 성공"
                    break
                elif [ \$i -eq 3 ]; then
                    echo "다운로드 최종 실패"
                    exit 1
                else
                    echo "다운로드 실패 - 재시도..."
                    sleep 10
                fi
            done
            
            # 설치
            sudo mv /tmp/docker-compose /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            
            # 버전 확인
            /usr/local/bin/docker-compose --version
EOF
        then
            log_success "Docker Compose 업데이트 완료"
            create_checkpoint "docker_compose_update"
            return 0
        else
            log_warning "Docker Compose 다운로드 실패: $url"
        fi
    done
    
    log_error "모든 Docker Compose 다운로드 시도 실패"
    cleanup_on_failure "docker_compose_update"
}

# Ansible 배포 (개선된 재시도 로직)
deploy_application() {
    if is_step_completed "ansible_deploy"; then
        log_info "⏭️  Ansible 배포 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_deploy "Ansible 애플리케이션 배포 시작..."
    
    # SSH 연결 테스트
    log_info "SSH 연결 테스트 중..."
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    if timeout 15 ssh -i ~/.ssh/lifebit.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" "echo 'SSH 연결 성공'" 2>/dev/null; then
        log_success "SSH 연결 확인 완료"
    else
        log_error "SSH 연결 실패"
        log_info "수동으로 SSH 접속을 시도해보세요: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
        exit 1
    fi
    
    # Docker Compose 업데이트
    update_docker_compose
    
    # Ansible 플레이북 실행 (개선된 재시도 로직)
    log_info "Ansible 플레이북 실행 중..."
    local max_retries=3
    local retry=1
    
    while (( retry <= max_retries )); do
        log_info "Ansible 배포 시도 ($retry/$max_retries)..."
        
        # 배포 전 원격 서버 상태 확인 및 정리
        if (( retry > 1 )); then
            log_info "재시도 전 원격 서버 정리 중..."
            ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" "
                echo '=== 시스템 상태 확인 ==='
                df -h /
                free -h
                
                echo '=== Docker 정리 ==='
                sudo docker system prune -a -f --volumes 2>/dev/null || true
                sudo apt-get autoremove -y 2>/dev/null || true
                sudo apt-get autoclean 2>/dev/null || true
                sudo journalctl --vacuum-time=1d 2>/dev/null || true
                sudo find /tmp -type f -atime +1 -delete 2>/dev/null || true
                
                echo '=== 정리 후 디스크 상태 ==='
                df -h /
            " || true
        fi
        
        # Ansible 실행 (리소스 최적화 및 타임아웃 증가)
        if timeout 4800 ansible-playbook \
            -i ansible/inventory.ini \
            ansible/playbook.yml \
            --timeout 3600 \
            -v \
            --ssh-extra-args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=60 -o ServerAliveCountMax=10' \
            --extra-vars "server_public_ip=$PUBLIC_IP ansible_ssh_common_args='-o ServerAliveInterval=60 -o ServerAliveCountMax=10'"; then
            log_success "Ansible 배포 완료"
            create_checkpoint "ansible_deploy"
            return 0
        else
            if (( retry < max_retries )); then
                log_warning "Ansible 배포 실패 - 재시도 준비 중... (대기 시간 증가)"
                sleep 120  # 2분 대기로 증가
            else
                log_error "Ansible 배포 최종 실패 - 단계별 배포로 전환"
                return 1  # 실패를 반환하여 manual_docker_deploy 호출
            fi
        fi
        ((retry++))
    done
}

# 단계별 Docker 배포 (향상된 버전)
manual_docker_deploy() {
    if is_step_completed "manual_docker_deploy"; then
        log_info "⏭️  수동 Docker 배포 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "단계별 Docker 배포 시작 (용량 부족 방지)..."
    
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # 서버에서 단계별 Docker 빌드 및 배포
    if ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" << 'EOF'
        set -e
        
        echo "=== 시스템 상태 확인 ==="
        echo "디스크 사용률:"
        df -h /
        echo "메모리 사용률:"
        free -h
        echo "Docker 상태:"
        sudo systemctl status docker --no-pager -l || echo "Docker 서비스 확인 필요"
        
        echo "=== 애플리케이션 디렉토리로 이동 ==="
        cd /opt/lifebit || {
            echo "애플리케이션 디렉토리를 찾을 수 없습니다"
            ls -la /opt/ || true
            exit 1
        }
        
        echo "=== 기존 컨테이너 완전 정리 ==="
        sudo /usr/local/bin/docker-compose down --volumes --remove-orphans || true
        sudo docker system prune -a -f --volumes || true
        
        echo "=== 디스크 공간 확보 완료 ==="
        df -h /
        
        echo "=== 데이터베이스와 캐시 서비스 먼저 시작 ==="
        sudo /usr/local/bin/docker-compose up -d postgres-db redis-cache
        
        echo "=== 데이터베이스 준비 대기 (30초) ==="
        sleep 30
        sudo /usr/local/bin/docker-compose ps
        
        echo "=== 1단계: Spring Boot 빌드 및 시작 ==="
        if ! sudo /usr/local/bin/docker-compose build --no-cache spring-app; then
            echo "Spring 빌드 실패 - 시스템 정리 후 재시도"
            sudo docker system prune -f
            sleep 10
            sudo /usr/local/bin/docker-compose build --no-cache spring-app
        fi
        sudo /usr/local/bin/docker-compose up -d spring-app
        
        echo "=== 빌드 완료 후 정리 ==="
        sudo docker system prune -f
        df -h /
        
        echo "=== 2단계: FastAPI 빌드 및 시작 ==="
        if ! sudo /usr/local/bin/docker-compose build --no-cache fastapi-app; then
            echo "FastAPI 빌드 실패 - 시스템 정리 후 재시도"
            sudo docker system prune -f
            sleep 10
            sudo /usr/local/bin/docker-compose build --no-cache fastapi-app
        fi
        sudo /usr/local/bin/docker-compose up -d fastapi-app
        
        echo "=== 빌드 완료 후 정리 ==="
        sudo docker system prune -f
        df -h /
        
        echo "=== 3단계: Frontend 빌드 및 시작 ==="
        if ! sudo /usr/local/bin/docker-compose build --no-cache frontend-app; then
            echo "Frontend 빌드 실패 - 넘어가고 계속 진행"
        fi
        sudo /usr/local/bin/docker-compose up -d frontend-app || true
        
        echo "=== 4단계: Nginx 프록시 빌드 및 시작 ==="
        sudo /usr/local/bin/docker-compose up -d nginx-proxy || true
        
        echo "=== 최종 정리 ==="
        sudo docker system prune -f
        
        echo "=== 모든 서비스 상태 확인 ==="
        sleep 15
        sudo /usr/local/bin/docker-compose ps
        
        echo "=== 최종 디스크 사용률 ==="
        df -h /
        
        echo "=== 핵심 서비스 응답 테스트 ==="
        sleep 20
        
        # 서비스별 상태 확인
        services_status=""
        
        # PostgreSQL 연결 테스트
        if sudo docker exec lifebit-postgres pg_isready -U lifebit > /dev/null 2>&1; then
            echo "✅ PostgreSQL: 정상 연결"
            services_status="${services_status}postgres:ok "
        else
            echo "❌ PostgreSQL: 연결 실패"
            services_status="${services_status}postgres:fail "
        fi
        
        # Redis 연결 테스트
        if sudo docker exec lifebit-redis redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis: 정상 연결"
            services_status="${services_status}redis:ok "
        else
            echo "❌ Redis: 연결 실패"
            services_status="${services_status}redis:fail "
        fi
        
        # FastAPI 응답 테스트
        if curl -f -s --max-time 10 http://localhost:8001/api/py/health > /dev/null; then
            echo "✅ FastAPI: 정상 응답"
            services_status="${services_status}fastapi:ok "
        else
            echo "⏳ FastAPI: 시작 중..."
            services_status="${services_status}fastapi:starting "
        fi
        
        # Spring API 응답 테스트
        if curl -f -s --max-time 10 http://localhost:8080/actuator/health > /dev/null; then
            echo "✅ Spring API: 정상 응답"
            services_status="${services_status}spring:ok "
        else
            echo "⏳ Spring API: 시작 중..."
            services_status="${services_status}spring:starting "
        fi
        
        echo "=== 배포 완료 ==="
        echo "서비스 상태: $services_status"
        echo "핵심 서비스들이 배포되었습니다."
EOF
    then
        log_success "단계별 Docker 배포 완료"
        create_checkpoint "manual_docker_deploy"
    else
        log_error "단계별 Docker 배포 실패"
        log_info "수동 배포 가이드:"
        log_info "1. SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
        log_info "2. 애플리케이션 디렉토리: cd /opt/lifebit"
        log_info "3. Docker 상태 확인: sudo docker ps"
        log_info "4. 서비스 재시작: sudo /usr/local/bin/docker-compose restart"
        exit 1
    fi
}

# 배포 실패 시 자동 정리
cleanup_on_failure() {
    local failed_step="$1"
    log_error "배포 실패: $failed_step"
    log_warning "자동 정리를 시작합니다..."
    
    # 체크포인트 기반 부분 정리
    if is_step_completed "terraform_apply"; then
        log_info "Terraform 리소스 정리 중..."
        cd "$SCRIPT_DIR/infrastructure"
        terraform destroy \
            -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
            -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
            -var="aws_region=$AWS_DEFAULT_REGION" \
            -auto-approve 2>/dev/null || log_warning "Terraform 정리 중 오류 발생"
        cd "$SCRIPT_DIR"
    fi
    
    # 체크포인트 정리
    if [[ -d "$CHECKPOINT_DIR" ]]; then
        rm -rf "$CHECKPOINT_DIR"
        log_info "체크포인트 정리 완료"
    fi
    
    # SSH 키 정리
    if [[ -f ~/.ssh/lifebit.pem ]]; then
        rm -f ~/.ssh/lifebit.pem*
        log_info "SSH 키 정리 완료"
    fi
    
    log_error "배포 실패로 인한 자동 정리 완료"
    log_info "전체 정리가 필요하면 ./aws-cleanup.sh를 실행하세요"
    exit 1
}

# 배포 완료 정보 출력 (향상된 버전)
show_deployment_info() {
    if is_step_completed "show_info"; then
        log_info "⏭️  배포 정보 출력 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_success "🎉 LifeBit AWS 강화된 자동 배포 완료!"
    
    cd "$SCRIPT_DIR/infrastructure"
    
    local PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null)
    
    echo
    log_info "📋 배포 정보:"
    echo "서버 IP: $PUBLIC_IP"
    echo "SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
    
    echo
    log_info "🌐 애플리케이션 URLs:"
    echo "🔥 핵심 서비스 (우선 사용):"
    echo "  FastAPI (AI):  http://$PUBLIC_IP:8001"
    echo "  Spring API:    http://$PUBLIC_IP:8080"
    echo "  PostgreSQL:    $PUBLIC_IP:5432"
    echo "  Redis:         $PUBLIC_IP:6379"
    echo ""
    echo "🚀 전체 서비스 (차후 확인):"
    echo "  Frontend:      http://$PUBLIC_IP:3000"
    echo "  Nginx Proxy:   http://$PUBLIC_IP:8082"
    echo "  Airflow:       http://$PUBLIC_IP:8081"
    echo "  Grafana:       http://$PUBLIC_IP:3001"
    echo "  Prometheus:    http://$PUBLIC_IP:9090"
    
    echo
    log_info "💰 예상 비용: 월 2-3만원 (t3.small 2GB RAM)"
    
    echo
    log_info "🔧 관리 명령어:"
    echo "서비스 상태 확인: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'sudo docker ps'"
    echo "로그 확인: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'cd /opt/lifebit/app && sudo /usr/local/bin/docker-compose logs'"
    echo "서비스 재시작: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'cd /opt/lifebit/app && sudo /usr/local/bin/docker-compose restart'"
    
    echo
    log_info "🔄 재배포 명령어:"
    echo "전체 재배포: ./aws-deploy.sh --force"
    echo "특정 단계부터: ./aws-deploy.sh --from-step ansible_deploy"
    echo "체크포인트 리셋: ./aws-deploy.sh --reset"
    
    echo
    log_info "🔍 서비스 상태 실시간 확인:"
    PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null)
    
    # 핵심 서비스 상태 확인
    log_info "핵심 서비스 응답 확인 중..."
    
    # 서비스별 상태 확인 (타임아웃 적용)
    local services=(
        "PostgreSQL:5432"
        "Redis:6379" 
        "FastAPI:8001"
        "Spring-API:8080"
        "Frontend:3000"
        "Nginx-Proxy:8082"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if timeout 5 bash -c "</dev/tcp/$PUBLIC_IP/$port" 2>/dev/null; then
            echo "✅ $name: 포트 $port 응답"
        else
            echo "⏳ $name: 포트 $port 시작 중 또는 비활성화"
        fi
    done
    
    echo
    log_success "강화된 자동화 배포가 성공적으로 완료되었습니다!"
    log_info "서비스가 완전히 시작되기까지 2-3분 정도 소요될 수 있습니다."
    log_info "문제 발생 시 로그 파일을 확인하세요: $LOG_FILE"
    
    cd "$SCRIPT_DIR"
    create_checkpoint "show_info"
}

# 배포 전 AWS 리소스 정리 (개선된 버전)
cleanup_previous_deployment() {
    if is_step_completed "cleanup"; then
        log_info "⏭️  리소스 정리 단계 건너뛰기 (이미 완료됨)"
        return 0
    fi
    
    log_info "이전 배포 리소스 정리 중..."
    
    # 선택적 정리 (사용자 확인)
    if [[ -x "./aws-cleanup.sh" ]] && [[ "${FORCE_CLEANUP:-}" == "true" ]]; then
        log_info "전체 리소스 정리를 자동 모드로 실행합니다..."
        if echo "yes" | timeout 600 ./aws-cleanup.sh 2>/dev/null || log_warning "리소스 정리 중 일부 오류 발생 (계속 진행)"; then
            log_success "전체 리소스 정리 완료"
        fi
    else
        # 기본적인 정리만 수행
        log_info "기본 정리 작업 수행 중..."
        
        # Terraform 상태 정리
        if [[ -d "$SCRIPT_DIR/infrastructure" ]]; then
            cd "$SCRIPT_DIR/infrastructure"
            if [[ -f "terraform.tfstate" ]] && terraform show > /dev/null 2>&1; then
                log_info "기존 Terraform 상태 발견 - 정리 중..."
                terraform destroy \
                    -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
                    -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
                    -var="aws_region=$AWS_DEFAULT_REGION" \
                    -auto-approve 2>/dev/null || log_warning "Terraform 정리 중 일부 오류 발생"
            fi
            cd "$SCRIPT_DIR"
        fi
        
        # 체크포인트 정리
        if [[ -d "$CHECKPOINT_DIR" ]]; then
            rm -rf "$CHECKPOINT_DIR"
            log_info "이전 체크포인트 정리 완료"
        fi
    fi
    
    # SSH known_hosts 정리
    if [[ -f ~/.ssh/known_hosts ]]; then
        log_info "SSH known_hosts 정리 중..."
        sed -i.bak '/13\.124\./d; /3\.34\./d; /52\.78\./d; /54\.180\./d; /15\.164\./d; /52\.79\./d; /3\.35\./d' ~/.ssh/known_hosts 2>/dev/null || true
    fi
    
    create_checkpoint "cleanup"
}

# 명령행 인수 처리
handle_command_line_args() {
    case "${1:-}" in
        --force)
            log_warning "강제 모드: 모든 체크포인트를 무시하고 처음부터 시작합니다"
            clear_checkpoints
            ;;
        --force-cleanup)
            log_warning "강제 정리 모드: 배포 전 모든 리소스를 정리합니다"
            export FORCE_CLEANUP=true
            clear_checkpoints
            ;;
        --reset)
            log_info "체크포인트를 리셋합니다"
            clear_checkpoints
            exit 0
            ;;
        --cleanup-and-exit)
            log_info "전체 정리를 실행하고 종료합니다"
            if [[ -x "./aws-cleanup.sh" ]]; then
                ./aws-cleanup.sh
            else
                log_error "aws-cleanup.sh를 찾을 수 없습니다"
                exit 1
            fi
            exit 0
            ;;
        --from-step)
            if [[ -n "${2:-}" ]]; then
                log_info "지정된 단계부터 시작: $2"
                # 지정된 단계 이후의 체크포인트만 삭제
                if [[ -d "$CHECKPOINT_DIR" ]]; then
                    local steps_to_remove=()
                    case "$2" in
                        "terraform_init") steps_to_remove+=("terraform_init" "terraform_apply" "ssh_key_save" "inventory_update" "ssh_ready" "docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "terraform_apply") steps_to_remove+=("terraform_apply" "ssh_key_save" "inventory_update" "ssh_ready" "docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "ssh_key_save") steps_to_remove+=("ssh_key_save" "inventory_update" "ssh_ready" "docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "inventory_update") steps_to_remove+=("inventory_update" "ssh_ready" "docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "ssh_ready") steps_to_remove+=("ssh_ready" "docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "docker_compose_update") steps_to_remove+=("docker_compose_update" "ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "ansible_deploy") steps_to_remove+=("ansible_deploy" "manual_docker_deploy" "show_info") ;;
                        "manual_docker_deploy") steps_to_remove+=("manual_docker_deploy" "show_info") ;;
                        "show_info") steps_to_remove+=("show_info") ;;
                    esac
                    
                    for step in "${steps_to_remove[@]}"; do
                        [[ -f "$CHECKPOINT_DIR/$step.done" ]] && rm -f "$CHECKPOINT_DIR/$step.done"
                    done
                fi
            else
                log_error "--from-step 옵션에는 단계 이름이 필요합니다"
                exit 1
            fi
            ;;
        --help|-h)
            echo "사용법: $0 [옵션]"
            echo ""
            echo "옵션:"
            echo "  --force                모든 체크포인트를 무시하고 처음부터 시작"
            echo "  --force-cleanup        배포 전 모든 AWS 리소스를 강제로 정리"
            echo "  --reset                체크포인트만 리셋하고 종료"
            echo "  --cleanup-and-exit     전체 리소스 정리 후 종료"
            echo "  --from-step STEP       지정된 단계부터 시작"
            echo "  --help, -h             이 도움말 표시"
            echo ""
            echo "사용 가능한 단계:"
            echo "  - terraform_init"
            echo "  - terraform_apply"
            echo "  - ssh_key_save"
            echo "  - inventory_update"
            echo "  - ssh_ready"
            echo "  - docker_compose_update"
            echo "  - ansible_deploy"
            echo "  - manual_docker_deploy"
            echo "  - show_info"
            echo ""
            echo "예시:"
            echo "  $0                     정상 배포"
            echo "  $0 --force             처음부터 강제 재배포"
            echo "  $0 --force-cleanup     모든 리소스 정리 후 배포"
            echo "  $0 --cleanup-and-exit  리소스만 정리하고 종료"
            exit 0
            ;;
    esac
}

# 메인 함수
main() {
    # 로깅 초기화 (가장 먼저)
    initialize_logging
    
    # 인수 처리
    handle_command_line_args "$@"
    
    # .env 자동 로드
    load_env_file

    # 단계별 실행
    check_environment
    cleanup_previous_deployment
    initialize_terraform
    deploy_infrastructure
    save_ssh_key
    update_inventory
    wait_for_ssh_ready
    
    log_info "서버 초기화 안정화를 위해 30초 대기합니다..."
    sleep 30
    
    # 애플리케이션 배포 (Ansible 실패 시 단계별 배포로 대체)
    if ! deploy_application; then
        log_warning "Ansible 배포 실패 - 용량 부족으로 인한 단계별 Docker 배포로 전환"
        log_info "이는 20GB 디스크에서 모든 서비스를 동시 빌드할 때 발생할 수 있습니다."
        manual_docker_deploy
    fi
    
    show_deployment_info
    
    log_success "🎯 모든 단계가 성공적으로 완료되었습니다!"
    log_info "배포 로그: $LOG_FILE"
    log_info "체크포인트: $CHECKPOINT_DIR"
}

main "$@" 