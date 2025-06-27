#!/bin/bash

# 남은 VPC 수동 정리 스크립트
VPC_ID="vpc-0b67533e94ef7a613"

echo "🧹 VPC $VPC_ID 수동 정리 시작..."

# 1. 기본 라우팅 테이블 확인
echo "📋 기본 라우팅 테이블 확인 중..."
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].[RouteTableId,Associations[0].Main]'

# 2. 보안 그룹 확인
echo "🔒 보안 그룹 확인 중..."
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[*].[GroupId,GroupName]'

# 3. Network Interface 확인
echo "🔌 Network Interface 확인 중..."
aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[*].[NetworkInterfaceId,Status]'

# 4. VPC 엔드포인트 확인
echo "🔗 VPC 엔드포인트 확인 중..."
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$VPC_ID" --query 'VpcEndpoints[*].[VpcEndpointId,State]'

echo "✅ VPC 의존성 확인 완료"
echo "💡 AWS 콘솔에서 VPC -> $VPC_ID -> Actions -> Delete VPC로 삭제하세요" 