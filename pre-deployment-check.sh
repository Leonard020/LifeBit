#!/bin/bash

# 배포 전 사전 점검 스크립트

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
                               
배포 전 사전 점검...
EOF
echo -e "${NC}"

# 체크 결과 저장
checks_passed=0
total_checks=0

# 체크 함수
check_item() {
    local description="$1"
    local command="$2"
    local is_critical="${3:-false}"
    
    total_checks=$((total_checks + 1))
    log_info "점검 중: $description"
    
    if eval "$command" >/dev/null 2>&1; then
        log_success "$description"
        checks_passed=$((checks_passed + 1))
        return 0
    else
        if [ "$is_critical" = "true" ]; then
            log_error "$description (중요)"
        else
            log_warning "$description (경고)"
            checks_passed=$((checks_passed + 1))  # 경고는 통과로 처리
        fi
        return 1
    fi
}

log_info "=== 필수 도구 확인 ==="

# 필수 도구들 확인
check_item "Terraform 설치 확인" "command -v terraform" true
check_item "Ansible 설치 확인" "command -v ansible" true
check_item "AWS CLI 설치 확인" "command -v aws" true
check_item "Docker 설치 확인" "command -v docker" false
check_item "SSH 키 존재 확인" "test -f ~/.ssh/lifebit_key" true

log_info "=== AWS 설정 확인 ==="

# AWS 설정 확인
check_item "AWS 자격 증명 확인" "aws sts get-caller-identity" true

log_info "=== 프로젝트 파일 확인 ==="

# 필수 파일들 확인
check_item "Docker Compose 프로덕션 파일" "test -f docker-compose.prod.yml" true
check_item "Ansible 플레이북 파일" "test -f infrastructure/ansible/playbook.yml" true
check_item "Ansible 환경 템플릿" "test -f infrastructure/ansible/templates/prod.env.j2" true
check_item "Terraform 메인 파일" "test -f infrastructure/terraform/main.tf" true
check_item "Terraform user_data 스크립트" "test -f infrastructure/terraform/user_data.sh" true
check_item "Nginx 설정 파일" "test -f infrastructure/nginx/nginx.conf" true
check_item "데이터베이스 스키마 파일" "test -f LifeBit.sql" true

log_info "=== Docker 설정 확인 ==="

# Docker 관련 파일 확인
check_item "Core API Dockerfile" "test -f apps/core-api-spring/Dockerfile" true
check_item "AI API Dockerfile" "test -f apps/ai-api-fastapi/Dockerfile" true
check_item "Frontend Dockerfile" "test -f apps/frontend-vite/Dockerfile" true

log_info "=== 로컬 환경 확인 ==="

# 로컬 환경 확인
check_item "현재 디렉토리가 프로젝트 루트인지 확인" "test -f package.json && test -d apps" true
check_item "Git 상태 확인 (커밋되지 않은 변경사항)" "git diff --quiet" false

# 디스크 공간 확인 (로컬)
if [ "$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//' | cut -d. -f1)" -lt 5 ]; then
    log_warning "로컬 디스크 공간이 부족할 수 있습니다"
else
    log_success "로컬 디스크 공간 충분"
    checks_passed=$((checks_passed + 1))
fi
total_checks=$((total_checks + 1))

log_info "=== Terraform 상태 확인 ==="

# Terraform 상태 확인
if [ -f "infrastructure/terraform/terraform.tfstate" ]; then
    check_item "기존 Terraform 상태 확인" "cd infrastructure/terraform && terraform show" false
else
    log_info "새로운 배포 (기존 상태 없음)"
fi

log_info "=== 네트워크 연결 확인 ==="

# 네트워크 연결 확인
check_item "Docker Hub 연결 확인" "curl -s --connect-timeout 5 https://hub.docker.com" false
check_item "GitHub 연결 확인" "curl -s --connect-timeout 5 https://github.com" false
check_item "AWS 서비스 연결 확인" "aws ec2 describe-regions --region us-east-1" false

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         사전 점검 결과${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}통과한 점검:${NC} $checks_passed/$total_checks"

if [ $checks_passed -eq $total_checks ]; then
    echo -e "${GREEN}🎉 모든 사전 점검을 통과했습니다!${NC}"
    echo -e "${GREEN}배포를 진행할 수 있습니다.${NC}"
    echo ""
    echo -e "${BLUE}다음 명령으로 배포를 시작하세요:${NC}"
    echo -e "   ./aws-deploy.sh"
    exit 0
elif [ $checks_passed -ge $((total_checks * 8 / 10)) ]; then
    echo -e "${YELLOW}⚠️  일부 경고가 있지만 배포 가능합니다.${NC}"
    echo -e "${YELLOW}위의 경고사항을 확인하고 필요시 수정하세요.${NC}"
    echo ""
    echo -e "${BLUE}배포를 계속 진행하려면:${NC}"
    echo -e "   ./aws-deploy.sh"
    exit 0
else
    echo -e "${RED}❌ 중요한 점검 항목에서 실패했습니다.${NC}"
    echo -e "${RED}위의 오류들을 수정한 후 다시 시도하세요.${NC}"
    echo ""
    echo -e "${BLUE}문제 해결 후 다시 실행:${NC}"
    echo -e "   ./pre-deployment-check.sh"
    exit 1
fi 