#!/bin/bash

# LifeBit EC2 인스턴스 종료 스크립트
# 인스턴스만 종료하고 다른 리소스는 유지합니다.

set -e

echo "🔄 LifeBit EC2 인스턴스 종료를 시작합니다..."

# Terraform 디렉토리로 이동
cd infrastructure/terraform

# 현재 인스턴스 상태 확인
echo "📊 현재 인스턴스 상태 확인 중..."
terraform show | grep -A 5 "aws_instance.lifebit_server" || echo "인스턴스 정보를 찾을 수 없습니다."

# 인스턴스만 종료 (destroy 대신 stop 사용)
echo "⏹️  EC2 인스턴스를 종료합니다..."

# AWS CLI를 사용하여 인스턴스 ID 가져오기
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")

if [ -n "$INSTANCE_ID" ]; then
    echo "🔍 발견된 인스턴스 ID: $INSTANCE_ID"
    
    # 인스턴스 상태 확인
    INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "unknown")
    echo "📊 현재 인스턴스 상태: $INSTANCE_STATE"
    
    if [ "$INSTANCE_STATE" = "running" ]; then
        echo "⏹️  인스턴스를 중지합니다..."
        aws ec2 stop-instances --instance-ids $INSTANCE_ID
        echo "⏳ 인스턴스 중지 완료를 기다립니다..."
        aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID
        echo "✅ 인스턴스가 성공적으로 중지되었습니다."
    elif [ "$INSTANCE_STATE" = "stopped" ]; then
        echo "ℹ️  인스턴스가 이미 중지되어 있습니다."
    else
        echo "⚠️  인스턴스 상태가 '$INSTANCE_STATE'입니다."
    fi
else
    echo "❌ 인스턴스 ID를 찾을 수 없습니다. Terraform 상태를 확인해주세요."
    exit 1
fi

echo ""
echo "🎉 인스턴스 종료 작업이 완료되었습니다!"
echo ""
echo "📝 다음 단계:"
echo "   1. 인스턴스를 다시 시작하려면: aws ec2 start-instances --instance-ids $INSTANCE_ID"
echo "   2. 완전히 삭제하려면: ./scripts/aws-destroy.sh"
echo "   3. 새로운 인프라를 배포하려면: ./scripts/aws-deploy.sh"
echo "" 