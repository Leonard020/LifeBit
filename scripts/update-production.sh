#!/bin/bash

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== LifeBit 프로덕션 업데이트 ===${NC}"

# 현재 위치 확인
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}docker-compose.prod.yml을 찾을 수 없습니다. 올바른 디렉토리에서 실행해주세요.${NC}"
    exit 1
fi

# 1. Git 최신 코드 가져오기
echo -e "\n${YELLOW}1. 최신 코드 가져오기${NC}"
git fetch origin main
git reset --hard origin/main

# 2. 프론트엔드만 다시 빌드 및 재시작 (빠른 업데이트)
echo -e "\n${YELLOW}2. 프론트엔드 재빌드 및 재시작${NC}"
sudo docker-compose -f docker-compose.prod.yml stop lifebit_frontend_prod
sudo docker-compose -f docker-compose.prod.yml build lifebit_frontend_prod
sudo docker-compose -f docker-compose.prod.yml up -d lifebit_frontend_prod

# 3. Core API 재시작 (Java 코드 변경사항 반영)
echo -e "\n${YELLOW}3. Core API 재빌드 및 재시작${NC}"
sudo docker-compose -f docker-compose.prod.yml stop lifebit_core_api_prod
sudo docker-compose -f docker-compose.prod.yml build lifebit_core_api_prod
sudo docker-compose -f docker-compose.prod.yml up -d lifebit_core_api_prod

# 4. 서비스 상태 확인
echo -e "\n${YELLOW}4. 서비스 상태 확인${NC}"
sleep 10
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep lifebit

# 5. 헬스 체크
echo -e "\n${YELLOW}5. 헬스 체크${NC}"
echo -n "Core API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health || echo "연결 실패"
echo -n -e "\nFrontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "연결 실패"
echo -n -e "\nAI API: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health || echo "연결 실패"

echo -e "\n\n${GREEN}✅ 업데이트 완료!${NC}"
echo -e "${BLUE}변경사항:${NC}"
echo "- Note.tsx에서 axios 인스턴스 사용으로 변경"
echo "- AI API 인터셉터 추가로 자동 인증 헤더 설정"
echo "- JWT 토큰 검증 로깅 개선"

echo -e "\n${YELLOW}💡 브라우저에서 새로고침(Ctrl+F5)을 해주세요!${NC}" 