#!/bin/bash

# LifeBit EC2 인스턴스 시작 스크립트
# 중지된 인스턴스를 다시 시작합니다.

set -e

echo "🚀 LifeBit EC2 인스턴스 시작을 시작합니다..."

# Terraform 디렉토리로 이동
cd infrastructure/terraform

# 현재 인스턴스 상태 확인
echo "📊 현재 인스턴스 상태 확인 중..."
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")

if [ -z "$INSTANCE_ID" ]; then
    echo "❌ 인스턴스 ID를 찾을 수 없습니다. Terraform 상태를 확인해주세요."
    exit 1
fi

echo "🔍 발견된 인스턴스 ID: $INSTANCE_ID"

# 인스턴스 상태 확인
INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "unknown")
echo "📊 현재 인스턴스 상태: $INSTANCE_STATE"

if [ "$INSTANCE_STATE" = "stopped" ]; then
    echo "🚀 인스턴스를 시작합니다..."
    aws ec2 start-instances --instance-ids $INSTANCE_ID
    echo "⏳ 인스턴스 시작 완료를 기다립니다..."
    aws ec2 wait instance-running --instance-ids $INSTANCE_ID
    echo "✅ 인스턴스가 성공적으로 시작되었습니다."
elif [ "$INSTANCE_STATE" = "running" ]; then
    echo "ℹ️  인스턴스가 이미 실행 중입니다."
else
    echo "⚠️  인스턴스 상태가 '$INSTANCE_STATE'입니다. 시작할 수 없습니다."
    exit 1
fi

# 공인 IP 주소 가져오기
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "🌐 서버 IP: $PUBLIC_IP"

echo ""
echo "🎉 인스턴스 시작 작업이 완료되었습니다!"
echo ""
echo "📝 접속 정보:"
echo "   - 웹사이트: http://$PUBLIC_IP"
echo "   - SSH 접속: ssh -i your-key.pem ubuntu@$PUBLIC_IP"
echo ""
echo "📊 서비스 상태 확인:"
echo "   - Core API: http://$PUBLIC_IP/actuator/health"
echo "   - AI API: http://$PUBLIC_IP:8001/api/py/health"
echo ""
echo "🔧 다음 단계:"
echo "   1. 서비스가 완전히 시작될 때까지 2-3분 대기"
echo "   2. 웹사이트 접속하여 정상 동작 확인"
echo "   3. 문제가 있다면: docker-compose -f docker-compose.prod.yml logs -f"
echo "" 