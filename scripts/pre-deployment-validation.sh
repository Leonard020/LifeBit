#!/bin/bash

# 배포 전 검증 스크립트
# 배포 시 발생할 수 있는 문제들을 사전에 검증

# set -e  # 에러 발생 시 중단하지 않고 계속 검증

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 검증 결과 추적
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}         배포 전 시스템 검증${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 1. 필수 파일 존재 확인
log_info "1. 필수 파일 존재 확인..."

REQUIRED_FILES=(
    "LifeBit.sql"
    "docker-compose.prod.yml"
    "infrastructure/ansible/playbook.yml"
    "infrastructure/ansible/templates/prod.env.j2"
    "infrastructure/terraform/main.tf"
    "infrastructure/nginx/nginx.conf"
    "apps/core-api-spring/Dockerfile"
    "apps/ai-api-fastapi/Dockerfile"
    "apps/frontend-vite/Dockerfile"
    "scripts/db-health-check.sh"
    "scripts/wait-for-db.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "필수 파일 누락: $file"
        ((VALIDATION_ERRORS++))
    fi
done

if [ $VALIDATION_ERRORS -eq 0 ]; then
    log_success "모든 필수 파일 존재 확인"
fi

# 2. Docker Compose 파일 검증
log_info "2. Docker Compose 설정 검증..."

if command -v docker-compose >/dev/null 2>&1; then
    # .env 파일이 없어도 기본 구문 검증
    if [ -f ".env" ]; then
        # .env 파일이 있으면 완전 검증
        if docker-compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
            log_success "Docker Compose 설정 유효성 확인"
        else
            log_error "Docker Compose 설정 오류"
            ((VALIDATION_ERRORS++))
        fi
    else
        # .env 파일이 없으면 기본 검증만 수행
        log_success "Docker Compose 파일 존재 확인 (.env 파일은 배포 시 생성됨)"
        
        # 기본적인 YAML 구조 확인
        if grep -q "version:" docker-compose.prod.yml && grep -q "services:" docker-compose.prod.yml; then
            log_success "Docker Compose 기본 구조 확인"
        else
            log_error "Docker Compose 기본 구조 오류"
            ((VALIDATION_ERRORS++))
        fi
    fi
else
    log_warning "docker-compose 명령어를 찾을 수 없음"
    ((VALIDATION_WARNINGS++))
fi

# 3. Dockerfile 검증
log_info "3. Dockerfile 검증..."

DOCKERFILES=(
    "apps/core-api-spring/Dockerfile"
    "apps/ai-api-fastapi/Dockerfile"
    "apps/frontend-vite/Dockerfile"
)

for dockerfile in "${DOCKERFILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        # HEALTHCHECK 존재 확인
        if grep -q "HEALTHCHECK" "$dockerfile"; then
            log_success "헬스체크 설정 확인: $dockerfile"
        else
            log_warning "헬스체크 설정 없음: $dockerfile"
            ((VALIDATION_WARNINGS++))
        fi
        
        # EXPOSE 포트 확인
        if grep -q "EXPOSE" "$dockerfile"; then
            log_success "포트 노출 설정 확인: $dockerfile"
        else
            log_warning "포트 노출 설정 없음: $dockerfile"
            ((VALIDATION_WARNINGS++))
        fi
    fi
done

# 4. 환경변수 템플릿 검증
log_info "4. 환경변수 템플릿 검증..."

ENV_TEMPLATE="infrastructure/ansible/templates/prod.env.j2"
if [ -f "$ENV_TEMPLATE" ]; then
    # 필수 환경변수 확인
    REQUIRED_VARS=(
        "POSTGRES_DB"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "DOMAIN_NAME"
        "JWT_SECRET"
        "CORS_ORIGINS"
        "SPRING_DATASOURCE_URL"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var" "$ENV_TEMPLATE"; then
            log_success "환경변수 확인: $var"
        else
            log_error "필수 환경변수 누락: $var"
            ((VALIDATION_ERRORS++))
        fi
    done
fi

# 5. 네트워크 포트 충돌 확인
log_info "5. 포트 설정 검증..."

# Docker Compose에서 사용하는 포트 추출
USED_PORTS=$(grep -E "^\s*-\s*\"[0-9]+:" docker-compose.prod.yml | sed 's/.*"\([0-9]*\):.*/\1/' | sort -n)

# 중복 포트 확인
DUPLICATE_PORTS=$(echo "$USED_PORTS" | uniq -d)
if [ -n "$DUPLICATE_PORTS" ]; then
    log_error "중복 포트 발견: $DUPLICATE_PORTS"
    ((VALIDATION_ERRORS++))
else
    log_success "포트 충돌 없음"
fi

# 6. 데이터베이스 스키마 파일 검증
log_info "6. 데이터베이스 스키마 검증..."

if [ -f "LifeBit.sql" ]; then
    # 파일 크기 확인
    FILE_SIZE=$(stat -c%s "LifeBit.sql")
    if [ "$FILE_SIZE" -gt 10240 ]; then  # 10KB 이상
        log_success "데이터베이스 스키마 파일 크기 적절 (${FILE_SIZE} bytes)"
    else
        log_warning "데이터베이스 스키마 파일이 작음 (${FILE_SIZE} bytes)"
        ((VALIDATION_WARNINGS++))
    fi
    
    # 필수 테이블 확인
    REQUIRED_TABLES=(
        "users"
        "user_goals"
        "health_records"
        "exercise_sessions"
        "meal_logs"
    )
    
    for table in "${REQUIRED_TABLES[@]}"; do
        if grep -qi "CREATE TABLE.*$table" "LifeBit.sql"; then
            log_success "테이블 정의 확인: $table"
        else
            log_warning "테이블 정의 누락: $table"
            ((VALIDATION_WARNINGS++))
        fi
    done
fi

# 7. Nginx 설정 검증
log_info "7. Nginx 설정 검증..."

NGINX_CONF="infrastructure/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    # 필수 location 블록 확인
    REQUIRED_LOCATIONS=(
        "location /"
        "location /api/"
        "location /ai-api/"
    )
    
    for location in "${REQUIRED_LOCATIONS[@]}"; do
        if grep -q "$location" "$NGINX_CONF"; then
            log_success "Nginx 라우팅 확인: $location"
        else
            log_error "Nginx 라우팅 누락: $location"
            ((VALIDATION_ERRORS++))
        fi
    done
    
    # proxy_pass 설정 확인
    if grep -q "proxy_pass" "$NGINX_CONF"; then
        log_success "Nginx 프록시 설정 확인"
    else
        log_error "Nginx 프록시 설정 누락"
        ((VALIDATION_ERRORS++))
    fi
fi

# 8. Terraform 설정 검증
log_info "8. Terraform 설정 검증..."

if command -v terraform >/dev/null 2>&1; then
    cd infrastructure/terraform
    
    # 기본 구문 검증 (provider 초기화 없이)
    if terraform fmt -check=true -diff=false >/dev/null 2>&1; then
        log_success "Terraform 코드 포맷 확인"
    else
        log_warning "Terraform 코드 포맷 문제"
        ((VALIDATION_WARNINGS++))
    fi
    
    # 기본 파일 구조 확인
    if [ -f "main.tf" ] && [ -f "variables.tf" ]; then
        log_success "Terraform 파일 구조 확인"
    else
        log_error "필수 Terraform 파일 누락"
        ((VALIDATION_ERRORS++))
    fi
    
    cd ../..
else
    log_warning "Terraform이 설치되지 않음"
    ((VALIDATION_WARNINGS++))
fi

# 9. 스크립트 실행 권한 확인
log_info "9. 스크립트 실행 권한 확인..."

SCRIPTS=(
    "aws-deploy.sh"
    "aws-destroy.sh"
    "scripts/db-health-check.sh"
    "scripts/wait-for-db.sh"
    "scripts/test-domain-setup.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            log_success "실행 권한 확인: $script"
        else
            log_warning "실행 권한 없음: $script"
            ((VALIDATION_WARNINGS++))
        fi
    fi
done

# 10. 메모리 및 리소스 요구사항 확인
log_info "10. 리소스 요구사항 검증..."

# Docker Compose에서 메모리 제한 확인
if grep -q "memory:" docker-compose.prod.yml; then
    log_success "메모리 제한 설정 확인"
    
    # 총 메모리 요구사항 계산 (대략적)
    TOTAL_MEMORY_MB=0
    MEMORY_LIMITS=$(grep -A1 "limits:" docker-compose.prod.yml | grep "memory:" | sed "s/.*memory: \\([0-9]*\\)M.*/\\1/")
    for mem in $MEMORY_LIMITS; do
        TOTAL_MEMORY_MB=$((TOTAL_MEMORY_MB + mem))
    done
    
    if [ $TOTAL_MEMORY_MB -gt 0 ]; then
        log_info "예상 메모리 사용량: ${TOTAL_MEMORY_MB}MB"
        if [ $TOTAL_MEMORY_MB -gt 1500 ]; then
            log_warning "높은 메모리 사용량 예상. t3.medium 이상 권장"
            ((VALIDATION_WARNINGS++))
        fi
    fi
else
    log_warning "메모리 제한 설정 없음"
    ((VALIDATION_WARNINGS++))
fi

# 결과 요약
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}         검증 결과 요약${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    log_success "✅ 심각한 오류 없음"
else
    log_error "❌ 심각한 오류 $VALIDATION_ERRORS개 발견"
fi

if [ $VALIDATION_WARNINGS -eq 0 ]; then
    log_success "✅ 경고 사항 없음"
else
    log_warning "⚠️  경고 사항 $VALIDATION_WARNINGS개 발견"
fi

echo ""
echo -e "${BLUE}🚀 배포 권장사항:${NC}"

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ 배포 가능${NC}"
    echo "   발견된 오류가 없어 배포를 진행할 수 있습니다."
    
    if [ $VALIDATION_WARNINGS -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  주의사항:${NC}"
        echo "   경고 사항들을 검토하고 필요시 수정 후 배포하세요."
    fi
else
    echo -e "${RED}❌ 배포 불가${NC}"
    echo "   심각한 오류들을 수정한 후 다시 검증하세요."
fi

echo ""
echo -e "${BLUE}📋 다음 단계:${NC}"
echo "1. 오류 수정 (있는 경우)"
echo "2. 경고 사항 검토"
echo "3. ./aws-deploy.sh 실행"
echo "4. 배포 후 ./scripts/test-domain-setup.sh [도메인] 실행"

# 종료 코드 설정
if [ $VALIDATION_ERRORS -gt 0 ]; then
    exit 1
else
    exit 0
fi 