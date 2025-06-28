#!/bin/bash

# 도메인 설정 테스트 스크립트
# 사용법: ./scripts/test-domain-setup.sh your-domain.com

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

# 도메인 파라미터 확인
if [ -z "$1" ]; then
    log_error "도메인을 입력해주세요."
    echo "사용법: $0 your-domain.com"
    exit 1
fi

DOMAIN="$1"
log_info "도메인 설정 테스트 시작: $DOMAIN"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}         도메인 설정 테스트${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# 1. DNS 확인
log_info "1. DNS 설정 확인 중..."
if command -v nslookup >/dev/null 2>&1; then
    DNS_RESULT=$(nslookup "$DOMAIN" 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
    if [ -n "$DNS_RESULT" ]; then
        log_success "DNS 해석 성공: $DOMAIN → $DNS_RESULT"
    else
        log_warning "DNS 해석 실패: $DOMAIN"
        echo "  도메인 등록업체에서 A 레코드를 설정했는지 확인하세요."
    fi
else
    log_warning "nslookup 명령어를 찾을 수 없습니다."
fi

# 2. HTTP 연결 테스트
log_info "2. HTTP 연결 테스트 중..."
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200\|301\|302"; then
    log_success "HTTP 연결 성공"
else
    log_warning "HTTP 연결 실패"
    echo "  서버가 실행 중인지 확인하세요."
fi

# 3. HTTPS 연결 테스트
log_info "3. HTTPS 연결 테스트 중..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null | grep -q "200\|301\|302"; then
    log_success "HTTPS 연결 성공"
    
    # SSL 인증서 정보 확인
    log_info "SSL 인증서 정보 확인 중..."
    if command -v openssl >/dev/null 2>&1; then
        CERT_INFO=$(echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        if [ $? -eq 0 ]; then
            echo "  $CERT_INFO"
        fi
    fi
else
    log_warning "HTTPS 연결 실패"
    echo "  SSL 인증서가 설정되지 않았을 수 있습니다."
    echo "  다음 명령어로 SSL 인증서를 발급하세요:"
    echo "    sudo certbot --nginx -d $DOMAIN"
fi

# 4. 포트별 서비스 테스트
log_info "4. 서비스별 접속 테스트 중..."

# 프론트엔드 (포트 3000)
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN:3000" | grep -q "200"; then
    log_success "프론트엔드 (포트 3000) 접속 성공"
else
    log_warning "프론트엔드 (포트 3000) 접속 실패"
fi

# Core API (포트 8080)
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN:8080/actuator/health" | grep -q "200"; then
    log_success "Core API (포트 8080) 접속 성공"
else
    log_warning "Core API (포트 8080) 접속 실패"
fi

# AI API (포트 8001)
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN:8001/health" | grep -q "200"; then
    log_success "AI API (포트 8001) 접속 성공"
else
    log_warning "AI API (포트 8001) 접속 실패"
fi

# Nginx 통합 (포트 80)
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200"; then
    log_success "Nginx 통합 (포트 80) 접속 성공"
else
    log_warning "Nginx 통합 (포트 80) 접속 실패"
fi

# 5. CORS 테스트
log_info "5. CORS 설정 테스트 중..."
CORS_HEADERS=$(curl -s -H "Origin: https://$DOMAIN" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS "http://$DOMAIN/api/test" -I 2>/dev/null | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
    log_success "CORS 헤더 확인됨"
    echo "  $CORS_HEADERS"
else
    log_warning "CORS 헤더를 찾을 수 없습니다"
fi

# 6. 환경변수 확인 (서버에 접속 가능한 경우)
log_info "6. 환경변수 확인 (선택사항)"
SSH_KEY="$HOME/.ssh/lifebit_key"
if [ -f "$SSH_KEY" ] && [ -n "$DNS_RESULT" ]; then
    log_info "SSH를 통해 서버 환경변수 확인 중..."
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY" "ubuntu@$DNS_RESULT" "grep DOMAIN_NAME /opt/lifebit/.env" 2>/dev/null; then
        log_success "서버 환경변수 확인 완료"
    else
        log_warning "서버 환경변수 확인 실패 (SSH 접속 불가)"
    fi
else
    log_warning "SSH 키가 없거나 DNS 해석 실패로 서버 확인 불가"
fi

# 7. 보안 헤더 확인
log_info "7. 보안 헤더 확인 중..."
SECURITY_HEADERS=$(curl -s -I "https://$DOMAIN" 2>/dev/null | grep -i -E "(strict-transport-security|x-frame-options|x-content-type-options|content-security-policy)")
if [ -n "$SECURITY_HEADERS" ]; then
    log_success "보안 헤더 확인됨"
    echo "$SECURITY_HEADERS" | while read line; do
        echo "  $line"
    done
else
    log_warning "보안 헤더가 설정되지 않았습니다"
    echo "  보안 강화를 위해 보안 헤더 설정을 권장합니다."
fi

# 결과 요약
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}         테스트 결과 요약${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

echo -e "${GREEN}✅ 성공한 항목:${NC}"
echo "   - DNS 해석, HTTP/HTTPS 연결, 서비스 접속 등"

echo -e "${YELLOW}⚠️  확인이 필요한 항목:${NC}"
echo "   - 실패한 테스트가 있다면 해당 서비스 상태를 확인하세요"
echo "   - SSL 인증서가 없다면 certbot으로 발급하세요"
echo "   - 보안 헤더가 없다면 Nginx 설정을 업데이트하세요"

echo ""
echo -e "${BLUE}🔧 다음 단계 권장사항:${NC}"
echo "1. SSL 인증서 발급 (필요시):"
echo "   ssh -i ~/.ssh/lifebit_key ubuntu@$DNS_RESULT"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "2. 보안 헤더 추가 (필요시):"
echo "   Nginx 설정에 보안 헤더 추가"
echo ""
echo "3. 정기적인 모니터링:"
echo "   SSL 인증서 만료일 확인"
echo "   서비스 상태 모니터링"

echo ""
log_success "도메인 설정 테스트 완료!" 