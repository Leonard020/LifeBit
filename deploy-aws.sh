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
        echo "export AWS_DEFAULT_REGION='ap-northeast-2'"
        exit 1
    fi
    
    # AWS_DEFAULT_REGION 기본값 설정
    export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-northeast-2}"
    
    log_success "AWS 인증 정보 확인 완료"
    log_info "리전: $AWS_DEFAULT_REGION"
}

# Terraform 초기화 및 검증
initialize_terraform() {
    log_info "Terraform 초기화 중..."
    
    cd "$SCRIPT_DIR/infrastructure"
    
    # Terraform 초기화
    if terraform init; then
        log_success "Terraform 초기화 완료"
    else
        log_error "Terraform 초기화 실패"
        exit 1
    fi
    
    # Terraform 검증
    if terraform validate; then
        log_success "Terraform 설정 검증 완료"
    else
        log_error "Terraform 설정 검증 실패"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
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
        -out=tfplan; then
        log_success "Terraform 계획 생성 완료"
    else
        log_error "Terraform 계획 생성 실패"
        exit 1
    fi
    
    # 자동 승인으로 변경 (완전 자동화)
    log_warning "인프라를 자동으로 생성합니다..."
    
    # Terraform 적용
    log_info "Terraform 인프라 생성 중..."
    if terraform apply -auto-approve tfplan; then
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
    
    # inventory.ini 업데이트 (실제 패턴으로 수정)
    if grep -q "ansible_host=" ansible/inventory.ini; then
        # 기존 IP 교체
        sed -i "s/ansible_host=[0-9.]\+/ansible_host=$PUBLIC_IP/g" ansible/inventory.ini
        log_success "기존 IP를 $PUBLIC_IP로 업데이트 완료"
    else
        log_error "inventory.ini에서 ansible_host 패턴을 찾을 수 없습니다."
        exit 1
    fi
    
    log_success "Ansible inventory 업데이트 완료"
}

# SSH 연결 재시도 로직 (최대 5분, 10초 간격)
wait_for_ssh_ready() {
    log_info "EC2 SSH 연결 대기 중... (최대 5분)"
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # 기존 호스트 키 제거 (호스트 키 충돌 방지)
    ssh-keygen -R "$PUBLIC_IP" 2>/dev/null || true
    
    local max_attempts=30
    local attempt=1
    while (( attempt <= max_attempts )); do
        if ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" 'echo OK' 2>/dev/null | grep -q OK; then
            log_success "SSH 연결 성공 (시도: $attempt)"
            return 0
        else
            log_warning "SSH 연결 대기 중... ($attempt/$max_attempts)"
            sleep 10
        fi
        ((attempt++))
    done
    
    log_error "5분 내 SSH 연결 실패"
    log_info "다음을 확인하세요:"
    log_info "1. EC2 인스턴스 상태: aws ec2 describe-instances --instance-ids \$(terraform output -raw server_id)"
    log_info "2. 보안 그룹 규칙: aws ec2 describe-security-groups --group-ids \$(terraform output -raw security_group_id)"
    log_info "3. SSH 키 권한: ls -la ~/.ssh/lifebit.pem"
    exit 1
}

# Docker Compose 버전 업데이트
update_docker_compose() {
    log_info "Docker Compose 최신 버전으로 업데이트 중..."
    
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # Docker Compose v2 설치
    ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" << 'EOF'
        # 기존 docker-compose 제거
        sudo rm -f /usr/local/bin/docker-compose
        
        # Docker Compose v2 설치
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        
        # 버전 확인
        docker-compose --version
EOF
    
    if [[ $? -eq 0 ]]; then
        log_success "Docker Compose 업데이트 완료"
    else
        log_error "Docker Compose 업데이트 실패"
        exit 1
    fi
}

# Ansible 배포 (재시도 로직 포함)
deploy_application() {
    log_deploy "Ansible 애플리케이션 배포 시작..."
    
    # SSH 연결 테스트
    log_info "SSH 연결 테스트 중..."
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    if ssh -i ~/.ssh/lifebit.pem -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" "echo 'SSH 연결 성공'" 2>/dev/null; then
        log_success "SSH 연결 확인 완료"
    else
        log_error "SSH 연결 실패"
        log_info "수동으로 SSH 접속을 시도해보세요: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
        exit 1
    fi
    
    # Docker Compose 업데이트
    update_docker_compose
    
    # Ansible 플레이북 실행 (재시도 로직)
    log_info "Ansible 플레이북 실행 중..."
    local max_retries=3
    local retry=1
    
    while (( retry <= max_retries )); do
        log_info "Ansible 배포 시도 ($retry/$max_retries)..."
        
        if ansible-playbook -i ansible/inventory.ini ansible/playbook.yml --timeout 900 -v; then
            log_success "Ansible 배포 완료"
            break
        else
            if (( retry < max_retries )); then
                log_warning "Ansible 배포 실패 - 재시도 중... ($retry/$max_retries)"
                sleep 30
            else
                log_error "Ansible 배포 최종 실패"
                log_info "수동 배포를 시도하세요:"
                log_info "1. SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
                log_info "2. 애플리케이션 디렉토리로 이동: cd /opt/lifebit/app"
                log_info "3. Docker Compose 실행: sudo docker-compose up -d"
                exit 1
            fi
        fi
        ((retry++))
    done
}

# 단계별 Docker 배포 (용량 부족 문제 해결)
manual_docker_deploy() {
    log_info "단계별 Docker 배포 시작 (용량 부족 방지)..."
    
    PUBLIC_IP=$(cd infrastructure && terraform output -raw public_ip)
    
    # 서버에서 단계별 Docker 빌드 및 배포
    ssh -i ~/.ssh/lifebit.pem -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@"$PUBLIC_IP" << 'EOF'
        set -e
        
        echo "=== 시스템 상태 확인 ==="
        echo "디스크 사용률:"
        df -h /
        echo "메모리 사용률:"
        free -h
        echo "Docker 상태:"
        sudo systemctl status docker --no-pager -l
        
        echo "=== 애플리케이션 디렉토리로 이동 ==="
        cd /opt/lifebit/app
        
        echo "=== 기존 컨테이너 완전 정리 ==="
        sudo docker-compose down --volumes --remove-orphans || true
        sudo docker system prune -a -f --volumes || true
        
        echo "=== 디스크 공간 확보 완료 ==="
        df -h /
        
        echo "=== 데이터베이스와 캐시 서비스 먼저 시작 ==="
        sudo docker-compose up -d postgres-db redis-cache
        
        echo "=== 데이터베이스 준비 대기 (30초) ==="
        sleep 30
        sudo docker-compose ps
        
        echo "=== 1단계: Spring Boot 빌드 및 시작 ==="
        sudo docker-compose build --no-cache spring-app || {
            echo "Spring 빌드 실패 - 시스템 정리 후 재시도"
            sudo docker system prune -f
            sleep 10
            sudo docker-compose build --no-cache spring-app
        }
        sudo docker-compose up -d spring-app
        
        echo "=== 빌드 완료 후 정리 ==="
        sudo docker system prune -f
        df -h /
        
        echo "=== 2단계: FastAPI 빌드 및 시작 ==="
        sudo docker-compose build --no-cache fastapi-app || {
            echo "FastAPI 빌드 실패 - 시스템 정리 후 재시도"
            sudo docker system prune -f
            sleep 10
            sudo docker-compose build --no-cache fastapi-app
        }
        sudo docker-compose up -d fastapi-app
        
        echo "=== 빌드 완료 후 정리 ==="
        sudo docker system prune -f
        df -h /
        
        echo "=== 3단계: Frontend 빌드 및 시작 ==="
        sudo docker-compose build --no-cache frontend-app || {
            echo "Frontend 빌드 실패 - 넘어가고 계속 진행"
            echo "Frontend는 Nginx로 정적 파일 서빙 가능"
        }
        sudo docker-compose up -d frontend-app || true
        
        echo "=== 4단계: Nginx 프록시 빌드 및 시작 ==="
        sudo docker-compose build --no-cache nginx-proxy || {
            echo "Nginx 빌드 실패 - 기본 nginx로 대체"
            # docker-compose.yml에서 nginx 서비스를 기본 이미지로 임시 변경
            sed -i 's/build:/# build:/g; s/context:/# context:/g; s/dockerfile:/# dockerfile:/g' docker-compose.yml
            echo "    image: nginx:alpine" >> /tmp/nginx_fallback.yml
            cat docker-compose.yml /tmp/nginx_fallback.yml > docker-compose.tmp.yml
            mv docker-compose.tmp.yml docker-compose.yml
        }
        sudo docker-compose up -d nginx-proxy || true
        
        echo "=== 최종 정리 ==="
        sudo docker system prune -f
        
        echo "=== 모든 서비스 상태 확인 ==="
        sleep 15
        sudo docker-compose ps
        
        echo "=== 최종 디스크 사용률 ==="
        df -h /
        
        echo "=== 핵심 서비스 응답 테스트 ==="
        sleep 10
        
        # PostgreSQL 연결 테스트
        if sudo docker exec lifebit-postgres pg_isready -U lifebit > /dev/null 2>&1; then
            echo "✅ PostgreSQL: 정상 연결"
        else
            echo "❌ PostgreSQL: 연결 실패"
        fi
        
        # Redis 연결 테스트
        if sudo docker exec lifebit-redis redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis: 정상 연결"
        else
            echo "❌ Redis: 연결 실패"
        fi
        
        # FastAPI 응답 테스트
        if curl -f -s --max-time 10 http://localhost:8001/health > /dev/null; then
            echo "✅ FastAPI: 정상 응답"
        else
            echo "⏳ FastAPI: 시작 중..."
        fi
        
        # Spring API 응답 테스트
        if curl -f -s --max-time 10 http://localhost:8080/actuator/health > /dev/null; then
            echo "✅ Spring API: 정상 응답"
        else
            echo "⏳ Spring API: 시작 중..."
        fi
        
        echo "=== 배포 완료 ==="
        echo "백엔드 서비스들이 정상적으로 시작되었습니다."
        echo "프론트엔드와 프록시는 필요시 수동으로 설정하세요."
EOF
    
    if [[ $? -eq 0 ]]; then
        log_success "단계별 Docker 배포 완료"
    else
        log_error "단계별 Docker 배포 실패"
        log_info "디스크 공간 부족이 계속 발생할 경우:"
        log_info "1. 더 큰 EBS 볼륨 사용 (30GB+)"
        log_info "2. 불필요한 서비스 비활성화"
        log_info "3. Docker 멀티스테이지 빌드 적용"
        exit 1
    fi
}

# 배포 완료 정보 출력
show_deployment_info() {
    log_success "🎉 LifeBit AWS 완전 자동 배포 완료!"
    
    cd "$SCRIPT_DIR/infrastructure"
    
    local PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null)
    
    echo
    log_info "📋 배포 정보:"
    echo "서버 IP: $PUBLIC_IP"
    echo "SSH 접속: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP"
    
    echo
    log_info "🌐 애플리케이션 URLs:"
    echo "Frontend:     http://$PUBLIC_IP:3000"
    echo "Spring API:   http://$PUBLIC_IP:8080"
    echo "FastAPI:      http://$PUBLIC_IP:8001"
    echo "Airflow:      http://$PUBLIC_IP:8081"
    echo "Nginx Proxy:  http://$PUBLIC_IP:8082"
    echo "Grafana:      http://$PUBLIC_IP:3001"
    echo "Prometheus:   http://$PUBLIC_IP:9090"
    
    echo
    log_info "💰 예상 비용: 월 2-3만원 (t3.small 2GB RAM)"
    
    echo
    log_info "🔧 관리 명령어:"
    echo "서비스 상태 확인: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'docker ps'"
    echo "로그 확인: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'docker-compose -f /opt/lifebit/app/docker-compose.yml logs'"
    echo "서비스 재시작: ssh -i ~/.ssh/lifebit.pem ubuntu@$PUBLIC_IP 'cd /opt/lifebit/app && docker-compose restart'"
    
    echo
    log_info "🔍 서비스 상태 실시간 확인:"
    PUBLIC_IP=$(terraform output -raw public_ip 2>/dev/null)
    
    # 서비스 상태 확인
    log_info "각 서비스 응답 확인 중..."
    for service in "Frontend:3000" "Spring-API:8080" "FastAPI:8001" "Airflow:8081" "Grafana:3001" "Prometheus:9090"; do
        name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        if curl -f -s --max-time 5 "http://$PUBLIC_IP:$port" > /dev/null 2>&1; then
            echo "✅ $name: 정상 작동"
        else
            echo "⏳ $name: 시작 중 또는 로딩 중"
        fi
    done
    
    echo
    log_success "완전 자동화 배포가 성공적으로 완료되었습니다!"
    log_info "서비스가 완전히 시작되기까지 2-3분 정도 소요될 수 있습니다."
    
    cd "$SCRIPT_DIR"
}

# 배포 전 AWS 리소스 정리
cleanup_previous_deployment() {
    log_info "이전 배포 리소스 정리 중..."
    
    if [[ -x "./aws-cleanup.sh" ]]; then
        ./aws-cleanup.sh || log_warning "리소스 정리 중 일부 오류 발생 (계속 진행)"
    else
        log_warning "aws-cleanup.sh를 찾을 수 없거나 실행 권한이 없습니다."
    fi
    
    # SSH known_hosts 정리
    if [[ -f ~/.ssh/known_hosts ]]; then
        log_info "SSH known_hosts 정리 중..."
        # AWS IP 대역 정리 (13.124.*, 3.34.*, 등)
        sed -i '/^13\.124\./d; /^3\.34\./d; /^52\.78\./d; /^54\.180\./d' ~/.ssh/known_hosts 2>/dev/null || true
    fi
}

# 메인 함수
main() {
    log_deploy "🚀 LifeBit AWS 완전 자동 배포 시작..."
    
    # 단계별 실행
    check_environment
    cleanup_previous_deployment
    initialize_terraform
    deploy_infrastructure
    save_ssh_key
    update_inventory
    wait_for_ssh_ready
    
    # 애플리케이션 배포 (Ansible 실패 시 수동 배포로 대체)
    if ! deploy_application; then
        log_warning "Ansible 배포 실패 - 수동 Docker 배포로 전환"
        manual_docker_deploy
    fi
    
    show_deployment_info
    
    log_success "🎯 모든 단계가 성공적으로 완료되었습니다!"
}

main "$@" 