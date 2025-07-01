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
    echo -e "${BLUE}[CHECK]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# 체크 결과 저장
ERRORS=0
WARNINGS=0

echo -e "${BLUE}=== LifeBit 배포 전 체크 시작 ===${NC}"
echo ""

# 1. 로컬 개발 환경 실행 여부 확인
log_info "로컬 개발 환경 실행 상태 확인 중..."

# Docker 컨테이너 확인
if command -v docker >/dev/null 2>&1; then
    LOCAL_CONTAINERS=$(docker ps --format "table {{.Names}}" | grep -E "lifebit_.*" | grep -v "prod" || true)
    if [ -n "$LOCAL_CONTAINERS" ]; then
        log_warning "로컬 개발 환경 컨테이너가 실행 중입니다:"
        echo "$LOCAL_CONTAINERS"
        log_warning "배포 시 포트 충돌을 방지하려면 'docker-compose -f docker-compose.local.yml down' 실행을 권장합니다."
        WARNINGS=$((WARNINGS + 1))
    else
        log_success "로컬 개발 환경 컨테이너가 실행되지 않고 있습니다."
    fi
else
    log_warning "Docker가 설치되지 않았습니다. 체크를 건너뜁니다."
fi

# 2. 로컬 포트 사용 확인
log_info "포트 사용 상태 확인 중..."

PORTS_TO_CHECK=(5432 8080 8001 3000 80 443)
PORTS_IN_USE=()

for port in "${PORTS_TO_CHECK[@]}"; do
    if lsof -i :$port >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        PORTS_IN_USE+=($port)
    fi
done

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    log_warning "다음 포트가 사용 중입니다: ${PORTS_IN_USE[*]}"
    log_warning "AWS EC2에서는 문제없지만, 로컬 테스트 시 충돌할 수 있습니다."
    WARNINGS=$((WARNINGS + 1))
else
    log_success "모든 필수 포트가 사용 가능합니다."
fi

# 3. 필수 파일 존재 확인
log_info "필수 파일 존재 여부 확인 중..."

REQUIRED_FILES=(
    "LifeBit.sql"
    "docker-compose.prod.yml"
    "infrastructure/ansible/playbook.yml"
    "infrastructure/terraform/main.tf"
    "infrastructure/nginx/nginx.conf"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "$file 파일이 없습니다!"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    log_success "모든 필수 파일이 존재합니다."
fi

# 4. .env 파일 확인
log_info "환경 변수 파일 확인 중..."

if [ -f ".env" ]; then
    log_warning ".env 파일이 존재합니다. 배포 스크립트가 새로운 환경 변수를 생성합니다."
    log_warning "기존 .env 파일은 백업을 권장합니다."
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Git 상태 확인
log_info "Git 저장소 상태 확인 중..."

if command -v git >/dev/null 2>&1; then
    if [ -d ".git" ]; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        if [ $UNCOMMITTED -gt 0 ]; then
            log_warning "커밋되지 않은 변경사항이 $UNCOMMITTED개 있습니다."
            log_warning "배포 전 모든 변경사항을 커밋하는 것을 권장합니다."
            WARNINGS=$((WARNINGS + 1))
        else
            log_success "모든 변경사항이 커밋되었습니다."
        fi
    fi
fi

# 6. 디스크 공간 확인
log_info "디스크 공간 확인 중..."

AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    log_error "디스크 공간이 부족합니다 (${AVAILABLE_SPACE}GB 사용 가능)"
    log_error "최소 5GB 이상의 여유 공간이 필요합니다."
    ERRORS=$((ERRORS + 1))
else
    log_success "충분한 디스크 공간이 있습니다 (${AVAILABLE_SPACE}GB 사용 가능)"
fi

# 7. AWS CLI 설치 확인
log_info "AWS CLI 설치 확인 중..."

if ! command -v aws >/dev/null 2>&1; then
    log_error "AWS CLI가 설치되지 않았습니다."
    log_error "https://aws.amazon.com/cli/ 에서 설치해주세요."
    ERRORS=$((ERRORS + 1))
else
    log_success "AWS CLI가 설치되어 있습니다."
fi

# 8. AWS 자격 증명 확인
log_info "AWS 자격 증명 확인 중..."

if command -v aws >/dev/null 2>&1; then
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS 자격 증명이 설정되지 않았습니다."
        log_error "'aws configure'를 실행하여 자격 증명을 설정해주세요."
        ERRORS=$((ERRORS + 1))
    else
        AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
        log_success "AWS 계정 확인됨: $AWS_ACCOUNT"
    fi
fi

# 9. Terraform 설치 확인
log_info "Terraform 설치 확인 중..."

if ! command -v terraform >/dev/null 2>&1; then
    log_error "Terraform이 설치되지 않았습니다."
    log_error "https://terraform.io/downloads 에서 설치해주세요."
    ERRORS=$((ERRORS + 1))
else
    TERRAFORM_VERSION=$(terraform version | head -n1)
    log_success "Terraform 설치됨: $TERRAFORM_VERSION"
fi

# 10. Ansible 설치 확인
log_info "Ansible 설치 확인 중..."

if ! command -v ansible >/dev/null 2>&1; then
    log_error "Ansible이 설치되지 않았습니다."
    log_error "'pip install ansible' 또는 패키지 매니저로 설치해주세요."
    ERRORS=$((ERRORS + 1))
else
    ANSIBLE_VERSION=$(ansible --version | head -n1)
    log_success "Ansible 설치됨: $ANSIBLE_VERSION"
fi

# 결과 출력
echo ""
echo -e "${BLUE}=== 체크 결과 ===${NC}"

if [ $ERRORS -gt 0 ]; then
    log_error "총 $ERRORS개의 오류가 발견되었습니다."
    log_error "배포를 진행하기 전에 위의 오류를 해결해주세요."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    log_warning "총 $WARNINGS개의 경고가 발견되었습니다."
    log_info "경고 사항을 확인하고 필요시 조치 후 배포를 진행해주세요."
    exit 0
else
    log_success "모든 체크를 통과했습니다!"
    log_success "배포를 진행할 준비가 되었습니다."
    exit 0
fi 