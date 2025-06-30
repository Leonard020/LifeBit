#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== LifeBit 배포 환경 디버깅 ===${NC}"

# 1. 컨테이너 상태 확인
echo -e "\n${YELLOW}1. Docker 컨테이너 상태${NC}"
sudo docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. AI API 로그 확인
echo -e "\n${YELLOW}2. AI API 최근 로그 (마지막 50줄)${NC}"
sudo docker logs --tail 50 ai-api 2>&1 | grep -E "(ERROR|WARNING|CRITICAL|500|Failed)"

# 3. Core API 로그 확인
echo -e "\n${YELLOW}3. Core API 최근 로그 (마지막 50줄)${NC}"
sudo docker logs --tail 50 core-api 2>&1 | grep -E "(ERROR|WARN|403|401|JWT)"

# 4. 환경 변수 확인
echo -e "\n${YELLOW}4. 환경 변수 확인${NC}"
if [ -f /home/ubuntu/lifebit/.env ]; then
    echo "JWT_SECRET 존재: $(grep -c "JWT_SECRET=" /home/ubuntu/lifebit/.env)"
    echo "DATABASE_URL 존재: $(grep -c "DATABASE_URL=" /home/ubuntu/lifebit/.env)"
    echo "AI API 관련 변수 존재: $(grep -c "OPENAI\|ANTHROPIC" /home/ubuntu/lifebit/.env)"
else
    echo -e "${RED}.env 파일을 찾을 수 없습니다!${NC}"
fi

# 5. 네트워크 연결 테스트
echo -e "\n${YELLOW}5. 서비스 연결 테스트${NC}"
echo -n "Core API (8080): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health || echo "연결 실패"
echo -n -e "\nAI API (8001): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health || echo "연결 실패"
echo -n -e "\nFrontend (3000): "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "연결 실패"

# 6. 디스크 공간 확인
echo -e "\n\n${YELLOW}6. 디스크 공간${NC}"
df -h | grep -E "^/dev|Filesystem"

# 7. 메모리 사용량 확인
echo -e "\n${YELLOW}7. 메모리 사용량${NC}"
free -h

# 8. AI API 상세 로그
echo -e "\n${YELLOW}8. AI API 전체 로그 (문제 진단용)${NC}"
echo "최근 오류만 표시:"
sudo docker logs ai-api 2>&1 | tail -100 | grep -B5 -A5 "500\|ERROR\|Exception"

echo -e "\n${GREEN}디버깅 완료!${NC}"
echo -e "${BLUE}문제 해결 제안:${NC}"
echo "1. AI API가 다운된 경우: sudo docker restart ai-api"
echo "2. 모든 서비스 재시작: cd /home/ubuntu/lifebit && sudo docker-compose -f docker-compose.prod.yml restart"
echo "3. JWT 문제인 경우: .env 파일의 JWT_SECRET 확인" 