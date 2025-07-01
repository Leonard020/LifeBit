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

echo -e "${BLUE}"
cat << "EOF"
 _      _  __      ____  _ _   
| |    (_)/ _|    |  _ \(_) |  
| |     _| |_ ___ | |_) |_| |_ 
| |    | |  _/ _ \|  _ <| | __|
| |____| | ||  __/| |_) | | |_ 
|______|_|_| \___||____/|_|\__|
                               
환경 변수 수정 스크립트
EOF
echo -e "${NC}"

# .deployment_info 파일에서 SSH 정보 읽기
if [ ! -f ".deployment_info" ]; then
    log_error ".deployment_info 파일을 찾을 수 없습니다. 먼저 배포를 실행해주세요."
    exit 1
fi

source .deployment_info

if [ -z "$EC2_PUBLIC_IP" ]; then
    log_error "EC2_PUBLIC_IP 정보를 찾을 수 없습니다."
    exit 1
fi

SSH_KEY_PATH="$HOME/.ssh/lifebit_key"
if [ ! -f "$SSH_KEY_PATH" ]; then
    log_error "SSH 키를 찾을 수 없습니다: $SSH_KEY_PATH"
    exit 1
fi

log_info "서버 접속 정보:"
log_info "  - EC2 Public IP: $EC2_PUBLIC_IP"
log_info "  - SSH Key: $SSH_KEY_PATH"

# SSH 연결 테스트
log_info "서버 연결 테스트 중..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "echo 'SSH 연결 성공'" 2>/dev/null; then
    log_error "서버에 연결할 수 없습니다."
    exit 1
fi
log_success "서버 연결 성공"

# 환경 변수 입력받기
echo ""
log_warning "🔧 환경 변수 수정"
echo "수정할 환경 변수를 입력해주세요. 빈 값으로 두면 기존 값을 유지합니다."

# OpenAI API Key 입력
echo ""
log_info "현재 OpenAI API Key 상태 확인 중..."
CURRENT_OPENAI_KEY=$(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "grep '^OPENAI_API_KEY=' /home/ubuntu/lifebit/.env | cut -d'=' -f2" 2>/dev/null || echo "")

if [ -z "$CURRENT_OPENAI_KEY" ] || [ "$CURRENT_OPENAI_KEY" = "''" ] || [ "$CURRENT_OPENAI_KEY" = '""' ]; then
    log_warning "현재 OpenAI API Key가 설정되지 않았습니다."
else
    log_info "현재 OpenAI API Key: ${CURRENT_OPENAI_KEY:0:10}..."
fi

read -p "새 OpenAI API Key를 입력하세요 (빈 값이면 변경하지 않음): " NEW_OPENAI_API_KEY

# JWT Secret 확인
echo ""
log_info "현재 JWT Secret 상태 확인 중..."
CURRENT_JWT_SECRET=$(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "grep '^JWT_SECRET=' /home/ubuntu/lifebit/.env | cut -d'=' -f2" 2>/dev/null || echo "")

if [ -z "$CURRENT_JWT_SECRET" ]; then
    log_warning "현재 JWT Secret이 설정되지 않았습니다."
    read -p "새 JWT Secret을 입력하세요 (빈 값이면 자동 생성): " NEW_JWT_SECRET
    if [ -z "$NEW_JWT_SECRET" ]; then
        NEW_JWT_SECRET="lifebit-production-jwt-secret-$(date +%s)-$(openssl rand -hex 8)"
        log_info "JWT Secret이 자동 생성되었습니다."
    fi
else
    log_info "현재 JWT Secret: ${CURRENT_JWT_SECRET:0:20}..."
    read -p "새 JWT Secret을 입력하세요 (빈 값이면 변경하지 않음): " NEW_JWT_SECRET
fi

# 소셜 로그인 설정
echo ""
log_info "소셜 로그인 설정 (선택 사항)"
read -p "Google Client ID (빈 값이면 변경하지 않음): " NEW_GOOGLE_CLIENT_ID
read -p "Kakao Client ID (빈 값이면 변경하지 않음): " NEW_KAKAO_CLIENT_ID

# 서버에서 .env 파일 백업
log_info "서버에서 .env 파일 백업 중..."
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    cd /home/ubuntu/lifebit
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo '.env 파일 백업 완료'
"

# 환경 변수 업데이트
log_info "환경 변수 업데이트 중..."

ENV_UPDATE_SCRIPT=""

if [ -n "$NEW_OPENAI_API_KEY" ]; then
    ENV_UPDATE_SCRIPT="$ENV_UPDATE_SCRIPT
sed -i 's/^OPENAI_API_KEY=.*/OPENAI_API_KEY=$NEW_OPENAI_API_KEY/' /home/ubuntu/lifebit/.env
sed -i 's/^USE_GPT=.*/USE_GPT=True/' /home/ubuntu/lifebit/.env"
fi

if [ -n "$NEW_JWT_SECRET" ]; then
    ENV_UPDATE_SCRIPT="$ENV_UPDATE_SCRIPT
sed -i 's/^JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/' /home/ubuntu/lifebit/.env"
fi

if [ -n "$NEW_GOOGLE_CLIENT_ID" ]; then
    ENV_UPDATE_SCRIPT="$ENV_UPDATE_SCRIPT
sed -i 's/^VITE_GOOGLE_CLIENT_ID=.*/VITE_GOOGLE_CLIENT_ID=$NEW_GOOGLE_CLIENT_ID/' /home/ubuntu/lifebit/.env"
fi

if [ -n "$NEW_KAKAO_CLIENT_ID" ]; then
    ENV_UPDATE_SCRIPT="$ENV_UPDATE_SCRIPT
sed -i 's/^VITE_KAKAO_CLIENT_ID=.*/VITE_KAKAO_CLIENT_ID=$NEW_KAKAO_CLIENT_ID/' /home/ubuntu/lifebit/.env"
fi

if [ -n "$ENV_UPDATE_SCRIPT" ]; then
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
        cd /home/ubuntu/lifebit
        $ENV_UPDATE_SCRIPT
        echo '환경 변수 업데이트 완료'
    "
    log_success "환경 변수가 업데이트되었습니다."
else
    log_info "변경할 환경 변수가 없습니다."
fi

# Docker 컨테이너 재시작
log_info "Docker 컨테이너 재시작 중..."
ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    cd /home/ubuntu/lifebit
    sudo docker-compose -f docker-compose.prod.yml restart
    echo 'Docker 컨테이너 재시작 완료'
"

# 상태 확인
log_info "서비스 상태 확인 중..."
sleep 10

ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ubuntu@$EC2_PUBLIC_IP "
    cd /home/ubuntu/lifebit
    echo '=== Docker 컨테이너 상태 ==='
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    echo ''
    echo '=== AI API 상태 확인 ==='
    curl -s http://localhost:8001/health || echo 'AI API 응답 없음'
    echo ''
    echo '=== Core API 상태 확인 ==='
    curl -s http://localhost:8080/actuator/health || echo 'Core API 응답 없음'
"

echo ""
log_success "🎉 환경 변수 수정이 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         수정 완료 정보${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 접속 URL:${NC}        http://$EC2_PUBLIC_IP"
echo -e "${BLUE}🤖 AI API 테스트:${NC}   http://$EC2_PUBLIC_IP:8001/health"
echo -e "${BLUE}🔧 Core API 테스트:${NC} http://$EC2_PUBLIC_IP:8080/actuator/health"
echo ""
echo -e "${BLUE}🔑 SSH 접속:${NC}"
echo -e "   ssh -i $SSH_KEY_PATH ubuntu@$EC2_PUBLIC_IP"
echo ""
echo -e "${YELLOW}💡 팁:${NC}"
echo -e "   - 변경된 설정이 반영되기까지 1-2분 정도 소요될 수 있습니다."
echo -e "   - .env 파일은 자동으로 백업되었습니다."
echo -e "   - 문제가 있으면 백업 파일로 복원할 수 있습니다."
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "환경 변수 수정 스크립트 실행이 완료되었습니다!" 