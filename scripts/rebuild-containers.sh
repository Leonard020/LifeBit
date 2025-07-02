#!/bin/bash

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

# 배너 출력
echo -e "${BLUE}"
cat << "EOF"
 _      _  __      ____  _ _   
| |    (_)/ _|    |  _ \(_) |  
| |     _| |_ ___ | |_) |_| |_ 
| |    | |  _/ _ \|  _ <| | __|
| |____| | ||  __/| |_) | | |_ 
|______|_|_| \___||____/|_|\__|
                               
도커 컨테이너 재빌드
EOF
echo -e "${NC}"

# 스크립트 디렉토리에서 프로젝트 루트로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
cd "$PROJECT_ROOT"

# 배포 정보 파일 확인
if [ ! -f ".deployment_info" ]; then
    log_error ".deployment_info 파일을 찾을 수 없습니다."
    log_error "먼저 aws-deploy.sh를 실행하여 배포를 완료해주세요."
    exit 1
fi

# 배포 정보 읽기
source .deployment_info

# SSH 키 경로 확인
SSH_KEY_PATH="$HOME/.ssh/lifebit_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    log_error "SSH 키를 찾을 수 없습니다: $SSH_KEY_PATH"
    exit 1
fi

log_info "배포 정보:"
log_info "  - 서버 IP: $EC2_PUBLIC_IP"
log_info "  - SSH 키: $SSH_KEY_PATH"

# 사용자 확인
echo ""
log_warning "⚠️  주의사항:"
log_warning "  - 모든 도커 컨테이너가 중지되고 재빌드됩니다."
log_warning "  - 서비스가 일시적으로 중단됩니다."
log_warning "  - 기존 데이터는 유지됩니다 (볼륨 마운트)."
echo ""
read -p "계속 진행하시겠습니까? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "작업이 취소되었습니다."
    exit 0
fi

# 서버 연결 테스트
log_info "서버 연결 테스트 중..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "echo '연결 성공'" 2>/dev/null; then
    log_error "서버에 연결할 수 없습니다."
    exit 1
fi

# 현재 컨테이너 상태 확인
log_info "현재 컨테이너 상태 확인 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo '=== 현재 실행 중인 컨테이너 ==='
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    echo ''
    echo '=== 모든 컨테이너 (중지된 것 포함) ==='
    sudo docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"

# 컨테이너 중지
log_info "기존 컨테이너 중지 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'Docker Compose로 컨테이너 중지 중...'
    cd /home/ubuntu/lifebit
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f docker-compose.prod.yml down
    else
        docker compose -f docker-compose.prod.yml down
    fi
    echo '컨테이너 중지 완료'
"

# 이미지 정리 (선택사항)
echo ""
read -p "사용하지 않는 도커 이미지도 정리하시겠습니까? (yes/no, 기본값: no): " -r
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "사용하지 않는 이미지 정리 중..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
        echo '사용하지 않는 이미지 정리 중...'
        sudo docker image prune -f
        echo '이미지 정리 완료'
    "
fi

# 최신 코드로 재빌드
log_info "최신 코드로 컨테이너 재빌드 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'Docker Compose로 컨테이너 재빌드 중...'
    cd /home/ubuntu/lifebit
    
    # 환경 변수 확인
    echo '=== 환경 변수 확인 ==='
    if [ -f '.env' ]; then
        echo '✅ .env 파일 존재'
        echo 'DOMAIN_NAME: ' \$(grep DOMAIN_NAME .env | cut -d'=' -f2 || echo 'Not set')
    else
        echo '❌ .env 파일 없음'
        exit 1
    fi
    
    # Docker Compose 재빌드
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose -f docker-compose.prod.yml up -d --build
    else
        docker compose -f docker-compose.prod.yml up -d --build
    fi
    
    echo '컨테이너 재빌드 완료'
"

# PostgreSQL 준비 대기
log_info "PostgreSQL 준비 대기 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    timeout=300
    elapsed=0
    while [ \$elapsed -lt \$timeout ]; do
        if docker exec lifebit_postgres_prod pg_isready -U lifebit_user -d lifebit_db >/dev/null 2>&1; then
            echo 'PostgreSQL is ready'
            exit 0
        fi
        echo 'Waiting for PostgreSQL... ('\$elapsed'/'\$timeout' seconds)'
        sleep 5
        elapsed=\$((elapsed + 5))
    done
    echo 'PostgreSQL readiness timeout'
    exit 1
"

# 서비스 안정화 대기
log_info "서비스 안정화 대기 중... (45초)"
sleep 45

# 헬스 체크
log_info "서비스 헬스 체크 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo '=== Core API 헬스 체크 ==='
    if curl -f http://localhost:8080/actuator/health 2>/dev/null; then
        echo '✅ Core API 정상'
    else
        echo '❌ Core API 오류'
    fi
    
    echo ''
    echo '=== AI API 헬스 체크 ==='
    if curl -f http://localhost:8001/health 2>/dev/null; then
        echo '✅ AI API 정상'
    else
        echo '❌ AI API 오류'
    fi
    
    echo ''
    echo '=== Frontend 헬스 체크 ==='
    if curl -f http://localhost:3000 2>/dev/null; then
        echo '✅ Frontend 정상'
    else
        echo '❌ Frontend 오류'
    fi
"

# 최종 컨테이너 상태 확인
log_info "최종 컨테이너 상태 확인 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo '=== 재빌드 후 컨테이너 상태 ==='
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    
    echo ''
    echo '=== 컨테이너 로그 (최근 5줄) ==='
    sudo docker-compose -f /home/ubuntu/lifebit/docker-compose.prod.yml logs --tail=5
"

# 완료 메시지
echo ""
log_success "🎉 도커 컨테이너 재빌드가 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         재빌드 완료 정보${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📱 프론트엔드:${NC}     http://$FINAL_DOMAIN:3000"
echo -e "${BLUE}🔧 Core API:${NC}      http://$FINAL_DOMAIN:8080"
echo -e "${BLUE}🤖 AI API:${NC}        http://$FINAL_DOMAIN:8001"
echo -e "${BLUE}🌐 Nginx (통합):${NC}  http://$FINAL_DOMAIN"
echo ""
echo -e "${BLUE}🔑 SSH 접속:${NC}"
echo -e "   ssh -i $SSH_KEY_PATH ubuntu@$EC2_PUBLIC_IP"
echo ""
echo -e "${BLUE}📊 모니터링:${NC}"
echo -e "   Health Check: http://$FINAL_DOMAIN:8080/actuator/health"
echo -e "   Container Status: docker ps"
echo ""
echo -e "${YELLOW}⚠️  주의사항:${NC}"
echo -e "   - 서비스가 완전히 시작되기까지 1-2분 정도 더 소요될 수 있습니다."
echo -e "   - 문제가 발생하면 서버에 접속하여 로그를 확인해주세요."
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "도커 컨테이너 재빌드 스크립트 실행이 완료되었습니다!" 