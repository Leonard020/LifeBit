#!/bin/bash

# ================================================
# LifeBit 단일 서버 배포 스크립트 (학원 프로젝트용)
# ================================================
# 하나의 서버에 모든 서비스를 Docker Compose로 배포

set -e

# ================================================
# 설정 및 변수
# ================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$PROJECT_ROOT/logs/deploy-single-$TIMESTAMP.log"

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

 🚀 LifeBit 단일 서버 배포 시스템 🚀
 학원 프로젝트용 올인원 솔루션
EOF
    
    echo ""
    echo "================================================"
    echo "배포 타입: 단일 서버 (All-in-One)"
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
    
    # Docker 확인
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        log_info "Docker 설치: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    
    # Docker Compose 확인
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        log_info "Docker Compose 설치 가이드를 확인하세요."
        exit 1
    fi
    
    # Docker 서비스 확인
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker 서비스가 실행되지 않고 있습니다."
        log_info "Docker 시작: sudo systemctl start docker"
        exit 1
    fi
    
    # .env 파일 확인
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_error ".env 파일이 존재하지 않습니다."
        log_info ".env.example을 복사하여 .env를 생성하세요."
        exit 1
    fi
    
    log_success "모든 사전 요구사항이 충족되었습니다."
}

# ================================================
# 환경 설정 로드
# ================================================
load_environment() {
    log_step "환경 설정 로드"
    
    # .env 파일 로드
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
        log_info "환경 설정 파일 로드 완료"
    fi
    
    # 필수 환경 변수 확인
    local required_vars=(
        "POSTGRES_PASSWORD"
        "POSTGRES_USER"
        "POSTGRES_DB"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "필수 환경 변수가 설정되지 않았습니다: $var"
            exit 1
        fi
    done
    
    log_success "환경 설정 검증 완료"
}

# ================================================
# 기존 서비스 정리
# ================================================
cleanup_existing_services() {
    log_step "기존 서비스 정리"
    
    cd "$PROJECT_ROOT"
    
    # 기존 컨테이너 중지 및 제거
    if [ -f "docker-compose.single-server.yml" ]; then
        docker-compose -f docker-compose.single-server.yml down --remove-orphans
        log_info "기존 컨테이너 정리 완료"
    fi
    
    # 미사용 Docker 리소스 정리
    docker system prune -f
    
    log_success "서비스 정리 완료"
}

# ================================================
# Docker 이미지 빌드
# ================================================
build_docker_images() {
    log_step "Docker 이미지 빌드"
    
    cd "$PROJECT_ROOT"
    
    # 애플리케이션 이미지 빌드
    log_info "애플리케이션 이미지 빌드 중..."
    docker-compose -f docker-compose.single-server.yml build --no-cache
    
    log_success "Docker 이미지 빌드 완료"
}

# ================================================
# 서비스 배포
# ================================================
deploy_services() {
    log_step "서비스 배포"
    
    cd "$PROJECT_ROOT"
    
    # Docker Compose로 서비스 시작
    log_info "서비스 시작 중..."
    docker-compose -f docker-compose.single-server.yml up -d
    
    # 서비스 상태 확인
    log_info "서비스 상태 확인 중..."
    sleep 30
    
    docker-compose -f docker-compose.single-server.yml ps
    
    log_success "서비스 배포 완료"
}

# ================================================
# 헬스체크 (수정된 버전)
# ================================================
health_check() {
    log_step "서비스 헬스체크"
    
    local services=(
        "http://localhost:8082:Nginx Proxy"
        "http://localhost:8080/actuator/health:Spring Boot API"
        "http://localhost:8001/api/py/health:FastAPI"
        "http://localhost:3000:Frontend"
        "http://localhost:9090:Prometheus"
        "http://localhost:3001:Grafana"
    )
    
    for service_info in "${services[@]}"; do
        local url="${service_info%:*}"
        local name="${service_info#*:}"
        
        log_info "헬스체크: $name"
        
        # 최대 5번 시도
        for i in {1..5}; do
            if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
                log_success "✓ $name 정상"
                break
            else
                log_warning "헬스체크 재시도 ($i/5): $name"
                sleep 10
            fi
            
            if [ $i -eq 5 ]; then
                log_error "✗ $name 헬스체크 실패"
            fi
        done
    done
}

# ================================================
# 리소스 사용량 확인
# ================================================
check_resource_usage() {
    log_step "리소스 사용량 확인"
    
    echo "=== 컨테이너 리소스 사용량 ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo
    
    echo "=== 시스템 리소스 ==="
    echo "CPU 사용량: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
    echo "메모리 사용량: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
    echo "디스크 사용량: $(df -h / | awk 'NR==2{print $5}')"
    echo
    
    log_success "리소스 사용량 확인 완료"
}

# ================================================
# 접속 정보 출력 (수정된 버전)
# ================================================
show_access_info() {
    cat << 'EOF'

🎉 로컬 배포 완료! 다음 URL로 접속하세요:

🌐 통합 접속 (권장):
   - Nginx Proxy:        http://localhost:8082

📱 개별 서비스:
   - Frontend (React):   http://localhost:3000
   - Spring Boot API:    http://localhost:8080
   - FastAPI (AI):       http://localhost:8001
   - Airflow:            http://localhost:8081 (admin/admin123)
   - Grafana:            http://localhost:3001 (admin/grafana_secure_password)
   - Prometheus:         http://localhost:9090

💾 데이터베이스:
   - PostgreSQL:         localhost:5432
   - Redis:              localhost:6379

📋 유용한 명령어:
   - 서비스 상태:        docker-compose -f docker-compose.single-server.yml ps
   - 로그 보기:          docker-compose -f docker-compose.single-server.yml logs -f [service]
   - 서비스 재시작:      docker-compose -f docker-compose.single-server.yml restart [service]
   - 전체 중지:          docker-compose -f docker-compose.single-server.yml down

🚀 클라우드 배포 준비:
   로컬 테스트가 완료되면 다음 명령어로 클라우드 배포:
   ./scripts/deploy-cloud-automation.sh full demo

EOF
}

# ================================================
# 메인 실행 함수
# ================================================
main() {
    setup_logging
    show_banner
    
    check_prerequisites
    load_environment
    cleanup_existing_services
    build_docker_images
    deploy_services
    health_check
    check_resource_usage
    show_access_info
    
    echo
    echo "==============================================="
    echo "✅ 단일 서버 배포 완료!"
    echo "==============================================="
    echo "📋 배포 로그: $LOG_FILE"
    echo "💰 예상 비용: NCP 서버 1대만 (월 약 3-5만원)"
    echo
    echo "⚠️  주의사항:"
    echo "- 모든 서비스가 Docker 컨테이너로 실행됩니다"
    echo "- 데이터는 Docker 볼륨에 저장됩니다"
    echo "- 백업은 로컬에만 저장됩니다"
    echo "- SSL/HTTPS는 비활성화되어 있습니다"
    echo
}

# 스크립트 실행
main "$@" 