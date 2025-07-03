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
                               
Nginx 설정 수정 스크립트
EOF
echo -e "${NC}"

# 설정
REMOTE_IP="15.165.30.201"
SSH_KEY_PATH="$HOME/.ssh/lifebit_key"
REMOTE_USER="ubuntu"
REMOTE_APP_DIR="/home/ubuntu/lifebit"
LOCAL_NGINX_CONF="infrastructure/nginx/nginx.conf"

log_info "Nginx 설정 수정을 시작합니다..."
log_info "  - 원격 서버: $REMOTE_IP"
log_info "  - SSH 키: $SSH_KEY_PATH"
log_info "  - 로컬 nginx.conf: $LOCAL_NGINX_CONF"

# 1. 로컬 nginx.conf 파일 존재 확인
if [ ! -f "$LOCAL_NGINX_CONF" ]; then
    log_error "로컬 nginx.conf 파일을 찾을 수 없습니다: $LOCAL_NGINX_CONF"
    exit 1
fi

log_success "로컬 nginx.conf 파일 확인 완료"

# 2. SSH 연결 테스트
log_info "SSH 연결 테스트 중..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "echo 'SSH 연결 성공'" 2>/dev/null; then
    log_error "SSH 연결에 실패했습니다."
    exit 1
fi

log_success "SSH 연결 성공"

# 3. 원격지 백업 생성
log_info "원격지 nginx.conf 백업 생성 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
    cd $REMOTE_APP_DIR
    if [ -f 'infrastructure/nginx/nginx.conf' ]; then
        cp infrastructure/nginx/nginx.conf infrastructure/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
        echo '백업 생성 완료'
    else
        echo '기존 nginx.conf 파일이 없습니다'
    fi
"

# 4. 수정된 nginx.conf 파일 복사
log_info "수정된 nginx.conf 파일을 원격지로 복사 중..."
scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$LOCAL_NGINX_CONF" "$REMOTE_USER@$REMOTE_IP:$REMOTE_APP_DIR/infrastructure/nginx/nginx.conf"

if [ $? -eq 0 ]; then
    log_success "nginx.conf 파일 복사 완료"
else
    log_error "nginx.conf 파일 복사에 실패했습니다."
    exit 1
fi

# 5. 원격지 파일 권한 설정
log_info "원격지 파일 권한 설정 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
    cd $REMOTE_APP_DIR
    chown ubuntu:ubuntu infrastructure/nginx/nginx.conf
    chmod 644 infrastructure/nginx/nginx.conf
    echo '파일 권한 설정 완료'
"

# 6. Nginx 설정 테스트
log_info "Nginx 설정 테스트 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
    cd $REMOTE_APP_DIR
    docker exec lifebit_nginx_prod nginx -t
"

if [ $? -eq 0 ]; then
    log_success "Nginx 설정 테스트 통과"
else
    log_error "Nginx 설정 테스트에 실패했습니다."
    log_warning "백업 파일에서 복원하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "백업 파일에서 복원 중..."
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
            cd $REMOTE_APP_DIR
            cp infrastructure/nginx/nginx.conf.backup.* infrastructure/nginx/nginx.conf
            echo '백업에서 복원 완료'
        "
    fi
    exit 1
fi

# 7. Nginx 컨테이너 재시작
log_info "Nginx 컨테이너 재시작 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
    cd $REMOTE_APP_DIR
    docker compose -f docker-compose.prod.yml restart nginx
    echo 'Nginx 컨테이너 재시작 완료'
"

# 8. 컨테이너 상태 확인
log_info "컨테이너 상태 확인 중..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$REMOTE_USER@$REMOTE_IP" "
    cd $REMOTE_APP_DIR
    echo '=== 컨테이너 상태 ==='
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    echo ''
    echo '=== Nginx 로그 (최근 10줄) ==='
    docker logs --tail 10 lifebit_nginx_prod
"

# 9. 테스트
log_info "설정 변경 테스트 중..."
log_info "다음 URL들을 테스트해보세요:"
echo -e "${GREEN}  - https://lifebit.store/healthlog (새로고침 테스트)${NC}"
echo -e "${GREEN}  - https://lifebit.store/profile (새로고침 테스트)${NC}"
echo -e "${GREEN}  - https://lifebit.store/admin (새로고침 테스트)${NC}"

# 10. 완료 메시지
echo ""
log_success "🎉 Nginx 설정 수정이 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         수정 완료 정보${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}✅ nginx.conf 파일 업데이트 완료${NC}"
echo -e "${BLUE}✅ Nginx 설정 테스트 통과${NC}"
echo -e "${BLUE}✅ Nginx 컨테이너 재시작 완료${NC}"
echo ""
echo -e "${YELLOW}📋 확인사항:${NC}"
echo -e "   - /healthlog 페이지 새로고침 시 txt 다운로드 문제 해결"
echo -e "   - 모든 SPA 라우팅이 정상 작동"
echo -e "   - 기존 API 기능은 그대로 유지"
echo ""
echo -e "${BLUE}🔧 문제 발생 시:${NC}"
echo -e "   ssh -i $SSH_KEY_PATH ubuntu@$REMOTE_IP"
echo -e "   cd $REMOTE_APP_DIR"
echo -e "   docker logs lifebit_nginx_prod"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "Nginx 설정 수정 스크립트 실행이 완료되었습니다!" 