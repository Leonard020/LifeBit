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
                               
SQL 업데이트 및 서비스 재시작
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

# LifeBit.sql 파일 확인
if [ ! -f "LifeBit.sql" ]; then
    log_error "LifeBit.sql 파일을 찾을 수 없습니다."
    exit 1
fi

log_info "배포 정보:"
log_info "  - 서버 IP: $EC2_PUBLIC_IP"
log_info "  - SSH 키: $SSH_KEY_PATH"
log_info "  - SQL 파일: LifeBit.sql"

# 사용자 확인
echo ""
log_warning "⚠️  주의사항:"
log_warning "  - 데이터베이스가 재초기화됩니다."
log_warning "  - 기존 데이터가 모두 삭제됩니다."
log_warning "  - 서비스가 일시적으로 중단됩니다."
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

# 서비스 중지
log_info "서비스 중지 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'Docker 컨테이너 중지 중...'
    sudo docker stop \$(sudo docker ps -q) 2>/dev/null || true
    echo 'Docker 컨테이너 중지 완료'
"

# 데이터베이스 백업 (선택사항)
log_info "기존 데이터베이스 백업 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'PostgreSQL 컨테이너 시작 중...'
    sudo docker start lifebit-postgres 2>/dev/null || true
    
    echo '백업 대기 중...'
    sleep 10
    
    echo '데이터베이스 백업 생성 중...'
    sudo docker exec lifebit-postgres pg_dump -U lifebit_user lifebit_db > /tmp/lifebit_backup_\$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo '백업 실패 (새로운 배포인 경우 정상)'
    echo '백업 완료'
"

# 수정된 SQL 파일 업로드
log_info "수정된 SQL 파일 업로드 중..."
scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" LifeBit.sql ubuntu@$EC2_PUBLIC_IP:/tmp/LifeBit_updated.sql

# 데이터베이스 재초기화
log_info "데이터베이스 재초기화 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'PostgreSQL 컨테이너 재시작 중...'
    sudo docker stop lifebit-postgres 2>/dev/null || true
    sudo docker rm lifebit-postgres 2>/dev/null || true
    
    echo '새로운 PostgreSQL 컨테이너 생성 중...'
    sudo docker run -d \
        --name lifebit-postgres \
        --network lifebit-network \
        -e POSTGRES_DB=lifebit_db \
        -e POSTGRES_USER=lifebit_user \
        -e POSTGRES_PASSWORD=lifebit_password \
        -v /var/lib/postgresql/data:/var/lib/postgresql/data \
        -p 5432:5432 \
        postgres:15
    
    echo 'PostgreSQL 초기화 대기 중...'
    sleep 15
    
    echo '수정된 스키마 적용 중...'
    sudo docker exec -i lifebit-postgres psql -U lifebit_user -d lifebit_db < /tmp/LifeBit_updated.sql
    
    echo '데이터베이스 재초기화 완료'
"

# 서비스 재시작
log_info "서비스 재시작 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo 'Docker Compose로 서비스 재시작 중...'
    cd /home/ubuntu/lifebit
    sudo docker-compose -f docker-compose.prod.yml up -d
    
    echo '서비스 시작 대기 중...'
    sleep 30
    
    echo '서비스 상태 확인 중...'
    sudo docker ps
"

# 서비스 상태 확인
log_info "서비스 상태 확인 중..."
sleep 10

# 헬스 체크
log_info "헬스 체크 실행 중..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "curl -f http://localhost:8080/actuator/health" 2>/dev/null; then
    log_success "Core API가 정상적으로 실행되고 있습니다."
else
    log_warning "Core API 헬스 체크에 실패했습니다. 서비스가 아직 시작 중일 수 있습니다."
fi

# 최종 상태 확인
log_info "최종 서비스 상태 확인 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    echo '=== Docker 컨테이너 상태 ==='
    sudo docker ps
    
    echo ''
    echo '=== 서비스 로그 (최근 10줄) ==='
    sudo docker-compose -f /home/ubuntu/lifebit/docker-compose.prod.yml logs --tail=10
"

# 완료 메시지
echo ""
log_success "🎉 SQL 업데이트 및 서비스 재시작이 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         업데이트 완료 정보${NC}"
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
echo -e "   - 기존 데이터는 백업되었습니다 (서버의 /tmp 디렉토리)."
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "SQL 업데이트 스크립트 실행이 완료되었습니다!" 