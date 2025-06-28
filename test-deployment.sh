#!/bin/bash

# 배포 테스트 스크립트
# 이 스크립트는 배포된 애플리케이션의 상태를 확인합니다.

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

# 배포 정보 읽기
if [ ! -f ".deployment_info" ]; then
    log_error "배포 정보 파일(.deployment_info)을 찾을 수 없습니다."
    log_error "먼저 './aws-deploy.sh'를 실행하여 배포를 완료하세요."
    exit 1
fi

source .deployment_info

log_info "LifeBit 배포 상태 확인 시작..."
log_info "서버 IP: $EC2_PUBLIC_IP"

# SSH 연결 테스트
log_info "SSH 연결 테스트 중..."
SSH_KEY_PATH="$HOME/.ssh/lifebit_key"

if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "echo 'SSH 연결 성공'" 2>/dev/null; then
    log_success "SSH 연결 성공"
else
    log_error "SSH 연결 실패"
    exit 1
fi

# 서비스 상태 확인 함수
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    log_info "$service_name 상태 확인 중..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log_success "$service_name: 정상 (HTTP $response)"
        return 0
    else
        log_error "$service_name: 비정상 (HTTP $response)"
        return 1
    fi
}

# Docker 컨테이너 상태 확인
log_info "Docker 컨테이너 상태 확인 중..."
container_status=$(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null)

if [ $? -eq 0 ]; then
    log_success "Docker 컨테이너 상태:"
    echo "$container_status"
else
    log_error "Docker 컨테이너 상태 확인 실패"
fi

echo ""
log_info "서비스 헬스체크 시작..."

# 각 서비스 상태 확인
services_ok=0
total_services=4

# Core API 확인
if check_service "Core API" "http://$EC2_PUBLIC_IP:8080/actuator/health"; then
    ((services_ok++))
fi

# AI API 확인  
if check_service "AI API" "http://$EC2_PUBLIC_IP:8001/health"; then
    ((services_ok++))
fi

# Frontend 확인
if check_service "Frontend" "http://$EC2_PUBLIC_IP:3000" "200"; then
    ((services_ok++))
fi

# Nginx 확인
if check_service "Nginx" "http://$EC2_PUBLIC_IP" "200"; then
    ((services_ok++))
fi

# 데이터베이스 연결 확인 (Core API를 통해)
log_info "데이터베이스 연결 확인 중..."
db_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "http://$EC2_PUBLIC_IP:8080/actuator/health/db" 2>/dev/null || echo "000")

if [ "$db_response" = "200" ]; then
    log_success "데이터베이스 연결: 정상 (HTTP $db_response)"
    ((services_ok++))
    total_services=$((total_services + 1))
else
    log_error "데이터베이스 연결: 비정상 (HTTP $db_response)"
    total_services=$((total_services + 1))
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         배포 상태 요약${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}정상 서비스:${NC} $services_ok/$total_services"

if [ $services_ok -eq $total_services ]; then
    log_success "🎉 모든 서비스가 정상적으로 작동 중입니다!"
    echo ""
    echo -e "${BLUE}📱 서비스 URL:${NC}"
    echo -e "   Frontend:     http://$EC2_PUBLIC_IP:3000"
    echo -e "   Core API:     http://$EC2_PUBLIC_IP:8080"
    echo -e "   AI API:       http://$EC2_PUBLIC_IP:8001"
    echo -e "   Nginx (통합): http://$EC2_PUBLIC_IP"
else
    log_warning "일부 서비스에 문제가 있습니다."
    echo ""
    log_info "문제 해결을 위한 명령어:"
    echo -e "   SSH 접속:      ssh -i $SSH_KEY_PATH ubuntu@$EC2_PUBLIC_IP"
    echo -e "   로그 확인:     docker logs <container_name>"
    echo -e "   컨테이너 재시작: docker-compose -f docker-compose.prod.yml restart"
    echo -e "   전체 재배포:   cd infrastructure/ansible && ansible-playbook playbook.yml"
fi

echo -e "${GREEN}═══════════════════════════════════════${NC}"

# 상세 진단 옵션
echo ""
read -p "상세 진단을 실행하시겠습니까? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "상세 진단 실행 중..."
    
    # 시스템 리소스 확인
    log_info "시스템 리소스 확인 중..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
        echo '=== CPU 및 메모리 사용률 ==='
        top -bn1 | head -10
        echo ''
        echo '=== 디스크 사용률 ==='
        df -h
        echo ''
        echo '=== Docker 시스템 정보 ==='
        docker system df
        echo ''
        echo '=== 최근 Docker 로그 (Core API) ==='
        docker logs --tail=20 lifebit-core-api 2>/dev/null || echo 'Core API 컨테이너 로그 없음'
        echo ''
        echo '=== 최근 Docker 로그 (AI API) ==='
        docker logs --tail=20 lifebit-ai-api 2>/dev/null || echo 'AI API 컨테이너 로그 없음'
        echo ''
        echo '=== 최근 Docker 로그 (Frontend) ==='
        docker logs --tail=20 lifebit-frontend 2>/dev/null || echo 'Frontend 컨테이너 로그 없음'
        echo ''
        echo '=== 데이터베이스 상태 확인 ==='
        docker exec lifebit_postgres_prod pg_isready -U lifebit_user -d lifebit_db 2>/dev/null && echo 'PostgreSQL: 정상' || echo 'PostgreSQL: 비정상'
        echo ''
        echo '=== 데이터베이스 테이블 개수 ==='
        docker exec lifebit_postgres_prod psql -U lifebit_user -d lifebit_db -c \"SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';\" 2>/dev/null || echo '테이블 조회 실패'
        echo ''
        echo '=== 사용자 데이터 확인 ==='
        docker exec lifebit_postgres_prod psql -U lifebit_user -d lifebit_db -c \"SELECT COUNT(*) as user_count FROM users;\" 2>/dev/null || echo '사용자 데이터 조회 실패'
    "
fi

exit 0 