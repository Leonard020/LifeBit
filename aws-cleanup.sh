#!/bin/bash
set -e

# 스크립트 정보
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로깅 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_cleanup() { echo -e "${PURPLE}[CLEANUP]${NC} $1"; }

# .env 파일 로드
load_env() {
    local env_file="$SCRIPT_DIR/.env"
    if [[ -f "$env_file" ]]; then
        log_info ".env 파일 로드 중..."
        source "$env_file"
        log_success ".env 파일 로드 완료"
    else
        log_warning ".env 파일을 찾을 수 없습니다: $env_file"
    fi
}

# AWS CLI 설치 확인
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되지 않았습니다. 설치 후 다시 실행해주세요."
        exit 1
    fi
    
    # AWS 자격 증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 자격 증명이 설정되지 않았습니다. 'aws configure' 명령어로 설정해주세요."
        exit 1
    fi
    
    log_success "AWS CLI 및 자격 증명 확인 완료"
}

# 확인 프롬프트
confirm_deletion() {
    log_warning "⚠️  이 스크립트는 LifeBit 프로젝트 관련 모든 AWS 리소스를 삭제합니다."
    log_warning "⚠️  삭제된 리소스는 복구할 수 없습니다."
    echo -e "\n${RED}정말로 모든 AWS 리소스를 삭제하시겠습니까? (yes/no):${NC}"
    read -r response
    if [[ "$response" != "yes" ]]; then
        log_info "삭제가 취소되었습니다."
        exit 0
    fi
}

# CloudFormation 스택 삭제
cleanup_cloudformation() {
    log_cleanup "CloudFormation 스택 삭제 중..."
    local stacks=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'LifeBit') || contains(StackName, 'lifebit')].StackName" --output text)
    
    if [[ -n "$stacks" ]]; then
        for stack in $stacks; do
            log_info "CloudFormation 스택 삭제: $stack"
            aws cloudformation delete-stack --stack-name "$stack" || true
        done
        
        # 스택 삭제 완료 대기
        for stack in $stacks; do
            log_info "스택 삭제 완료 대기: $stack"
            aws cloudformation wait stack-delete-complete --stack-name "$stack" || true
        done
        log_success "CloudFormation 스택 삭제 완료"
    else
        log_info "삭제할 CloudFormation 스택이 없습니다"
    fi
}

# ECS 클러스터 정리
cleanup_ecs() {
    log_cleanup "ECS 리소스 정리 중..."
    
    # ECS 서비스 삭제
    local clusters=$(aws ecs list-clusters --query "clusterArns[?contains(@, 'LifeBit') || contains(@, 'lifebit')]" --output text)
    for cluster in $clusters; do
        local services=$(aws ecs list-services --cluster "$cluster" --query "serviceArns" --output text)
        for service in $services; do
            log_info "ECS 서비스 삭제: $service"
            aws ecs update-service --cluster "$cluster" --service "$service" --desired-count 0 || true
            aws ecs delete-service --cluster "$cluster" --service "$service" || true
        done
        
        # ECS 클러스터 삭제
        log_info "ECS 클러스터 삭제: $cluster"
        aws ecs delete-cluster --cluster "$cluster" || true
    done
    
    log_success "ECS 리소스 정리 완료"
}

# ECR 리포지토리 정리
cleanup_ecr() {
    log_cleanup "ECR 리포지토리 정리 중..."
    local repos=$(aws ecr describe-repositories --query "repositories[?contains(repositoryName, 'lifebit')].repositoryName" --output text)
    
    for repo in $repos; do
        log_info "ECR 리포지토리 삭제: $repo"
        aws ecr delete-repository --repository-name "$repo" --force || true
    done
    
    if [[ -n "$repos" ]]; then
        log_success "ECR 리포지토리 정리 완료"
    else
        log_info "삭제할 ECR 리포지토리가 없습니다"
    fi
}

# Lambda 함수 정리
cleanup_lambda() {
    log_cleanup "Lambda 함수 정리 중..."
    local functions=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'LifeBit') || contains(FunctionName, 'lifebit')].FunctionName" --output text)
    
    for func in $functions; do
        log_info "Lambda 함수 삭제: $func"
        aws lambda delete-function --function-name "$func" || true
    done
    
    if [[ -n "$functions" ]]; then
        log_success "Lambda 함수 정리 완료"
    else
        log_info "삭제할 Lambda 함수가 없습니다"
    fi
}

# API Gateway 정리
cleanup_api_gateway() {
    log_cleanup "API Gateway 정리 중..."
    
    # REST API 삭제
    local rest_apis=$(aws apigateway get-rest-apis --query "items[?contains(name, 'LifeBit') || contains(name, 'lifebit')].id" --output text)
    for api in $rest_apis; do
        log_info "REST API 삭제: $api"
        aws apigateway delete-rest-api --rest-api-id "$api" || true
    done
    
    # HTTP API 삭제 (API Gateway v2)
    local http_apis=$(aws apigatewayv2 get-apis --query "Items[?contains(Name, 'LifeBit') || contains(Name, 'lifebit')].ApiId" --output text)
    for api in $http_apis; do
        log_info "HTTP API 삭제: $api"
        aws apigatewayv2 delete-api --api-id "$api" || true
    done
    
    if [[ -n "$rest_apis" || -n "$http_apis" ]]; then
        log_success "API Gateway 정리 완료"
    else
        log_info "삭제할 API Gateway가 없습니다"
    fi
}

# RDS 인스턴스 및 관련 리소스 정리
cleanup_rds() {
    log_cleanup "RDS 리소스 정리 중..."
    
    # RDS 인스턴스 삭제
    local db_instances=$(aws rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier, 'lifebit')].DBInstanceIdentifier" --output text)
    for instance in $db_instances; do
        log_info "RDS 인스턴스 삭제: $instance"
        aws rds delete-db-instance --db-instance-identifier "$instance" --skip-final-snapshot --delete-automated-backups || true
    done
    
    # RDS 스냅샷 삭제
    local snapshots=$(aws rds describe-db-snapshots --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'lifebit')].DBSnapshotIdentifier" --output text)
    for snapshot in $snapshots; do
        log_info "RDS 스냅샷 삭제: $snapshot"
        aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot" || true
    done
    
    # RDS 클러스터 삭제
    local clusters=$(aws rds describe-db-clusters --query "DBClusters[?contains(DBClusterIdentifier, 'lifebit')].DBClusterIdentifier" --output text)
    for cluster in $clusters; do
        log_info "RDS 클러스터 삭제: $cluster"
        aws rds delete-db-cluster --db-cluster-identifier "$cluster" --skip-final-snapshot || true
    done
    
    # DB 서브넷 그룹 삭제
    local subnet_groups=$(aws rds describe-db-subnet-groups --query "DBSubnetGroups[?contains(DBSubnetGroupName, 'lifebit')].DBSubnetGroupName" --output text)
    for group in $subnet_groups; do
        log_info "DB 서브넷 그룹 삭제: $group"
        aws rds delete-db-subnet-group --db-subnet-group-name "$group" || true
    done
    
    if [[ -n "$db_instances" || -n "$snapshots" || -n "$clusters" || -n "$subnet_groups" ]]; then
        log_success "RDS 리소스 정리 완료"
    else
        log_info "삭제할 RDS 리소스가 없습니다"
    fi
}

# Load Balancer 정리
cleanup_load_balancers() {
    log_cleanup "Load Balancer 정리 중..."
    
    # ALB/NLB 삭제
    local albs=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, 'LifeBit') || contains(LoadBalancerName, 'lifebit')].LoadBalancerArn" --output text)
    for alb in $albs; do
        log_info "ALB/NLB 삭제: $alb"
        aws elbv2 delete-load-balancer --load-balancer-arn "$alb" || true
    done
    
    # Classic Load Balancer 삭제
    local clbs=$(aws elb describe-load-balancers --query "LoadBalancerDescriptions[?contains(LoadBalancerName, 'LifeBit') || contains(LoadBalancerName, 'lifebit')].LoadBalancerName" --output text)
    for clb in $clbs; do
        log_info "Classic Load Balancer 삭제: $clb"
        aws elb delete-load-balancer --load-balancer-name "$clb" || true
    done
    
    if [[ -n "$albs" || -n "$clbs" ]]; then
        log_success "Load Balancer 정리 완료"
    else
        log_info "삭제할 Load Balancer가 없습니다"
    fi
}

# S3 버킷 정리
cleanup_s3() {
    log_cleanup "S3 버킷 정리 중..."
    local buckets=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'lifebit')].Name" --output text)
    
    for bucket in $buckets; do
        log_info "S3 버킷 정리: $bucket"
        
        # 버전이 있는 객체 삭제
        aws s3api list-object-versions --bucket "$bucket" --query "Versions[].{Key:Key,VersionId:VersionId}" --output text | while read key version; do
            if [[ -n "$key" && -n "$version" ]]; then
                aws s3api delete-object --bucket "$bucket" --key "$key" --version-id "$version" || true
            fi
        done
        
        # 삭제 마커 제거
        aws s3api list-object-versions --bucket "$bucket" --query "DeleteMarkers[].{Key:Key,VersionId:VersionId}" --output text | while read key version; do
            if [[ -n "$key" && -n "$version" ]]; then
                aws s3api delete-object --bucket "$bucket" --key "$key" --version-id "$version" || true
            fi
        done
        
        # 모든 객체 삭제
        aws s3 rm "s3://$bucket" --recursive || true
        
        # 버킷 삭제
        aws s3api delete-bucket --bucket "$bucket" || true
    done
    
    if [[ -n "$buckets" ]]; then
        log_success "S3 버킷 정리 완료"
    else
        log_info "삭제할 S3 버킷이 없습니다"
    fi
}

# Auto Scaling Groups 정리
cleanup_autoscaling() {
    log_cleanup "Auto Scaling Groups 정리 중..."
    local asgs=$(aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[?contains(AutoScalingGroupName, 'LifeBit') || contains(AutoScalingGroupName, 'lifebit')].AutoScalingGroupName" --output text)
    
    for asg in $asgs; do
        log_info "Auto Scaling Group 삭제: $asg"
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name "$asg" --min-size 0 --desired-capacity 0 || true
        aws autoscaling delete-auto-scaling-group --auto-scaling-group-name "$asg" --force-delete || true
    done
    
    # Launch Templates 삭제
    local templates=$(aws ec2 describe-launch-templates --query "LaunchTemplates[?contains(LaunchTemplateName, 'LifeBit') || contains(LaunchTemplateName, 'lifebit')].LaunchTemplateId" --output text)
    for template in $templates; do
        log_info "Launch Template 삭제: $template"
        aws ec2 delete-launch-template --launch-template-id "$template" || true
    done
    
    if [[ -n "$asgs" || -n "$templates" ]]; then
        log_success "Auto Scaling Groups 정리 완료"
    else
        log_info "삭제할 Auto Scaling Groups가 없습니다"
    fi
}

# EC2 인스턴스 및 관련 리소스 정리
cleanup_ec2() {
    log_cleanup "EC2 리소스 정리 중..."
    
    # EC2 인스턴스 종료
    local instance_ids=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,stopped,stopping" --query 'Reservations[*].Instances[*].InstanceId' --output text)
    if [[ -n "$instance_ids" ]]; then
        log_info "EC2 인스턴스 종료 중..."
        aws ec2 terminate-instances --instance-ids $instance_ids || true
        
        # 인스턴스 종료 대기
        for instance in $instance_ids; do
            log_info "인스턴스 종료 대기: $instance"
            aws ec2 wait instance-terminated --instance-ids "$instance" || true
        done
        log_success "EC2 인스턴스 종료 완료"
    else
        log_info "종료할 EC2 인스턴스가 없습니다"
    fi
    
    # EBS 볼륨 삭제 (detached 상태)
    local volumes=$(aws ec2 describe-volumes --filters "Name=status,Values=available" "Name=tag:Project,Values=LifeBit" --query 'Volumes[*].VolumeId' --output text)
    for volume in $volumes; do
        log_info "EBS 볼륨 삭제: $volume"
        aws ec2 delete-volume --volume-id "$volume" || true
    done
    
    # EBS 스냅샷 삭제
    local snapshots=$(aws ec2 describe-snapshots --owner-ids self --filters "Name=tag:Project,Values=LifeBit" --query 'Snapshots[*].SnapshotId' --output text)
    for snapshot in $snapshots; do
        log_info "EBS 스냅샷 삭제: $snapshot"
        aws ec2 delete-snapshot --snapshot-id "$snapshot" || true
    done
    
    # AMI 삭제
    local amis=$(aws ec2 describe-images --owners self --filters "Name=tag:Project,Values=LifeBit" --query 'Images[*].ImageId' --output text)
    for ami in $amis; do
        log_info "AMI 삭제: $ami"
        aws ec2 deregister-image --image-id "$ami" || true
    done
    
    # Elastic IP 해제
    local eips=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=LifeBit" --query 'Addresses[*].AllocationId' --output text)
    for eip in $eips; do
        log_info "Elastic IP 해제: $eip"
        aws ec2 release-address --allocation-id "$eip" || true
    done
    
    # Key Pairs 삭제
    local keypairs=$(aws ec2 describe-key-pairs --filters "Name=tag:Project,Values=LifeBit" --query 'KeyPairs[*].KeyName' --output text)
    for keypair in $keypairs; do
        log_info "Key Pair 삭제: $keypair"
        aws ec2 delete-key-pair --key-name "$keypair" || true
    done
    
    log_success "EC2 리소스 정리 완료"
}

# VPC 및 네트워킹 리소스 정리
cleanup_networking() {
    log_cleanup "네트워킹 리소스 정리 중..."
    
    # LifeBit 관련 VPC 찾기
    local vpcs=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=LifeBit" --query 'Vpcs[*].VpcId' --output text)
    
    for vpc in $vpcs; do
        log_info "VPC 관련 리소스 정리: $vpc"
        
        # NAT Gateway 삭제
        local nat_gateways=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpc" --query 'NatGateways[*].NatGatewayId' --output text)
        for nat in $nat_gateways; do
            log_info "NAT Gateway 삭제: $nat"
            aws ec2 delete-nat-gateway --nat-gateway-id "$nat" || true
        done
        
        # 인터넷 게이트웨이 분리 및 삭제
        local igws=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpc" --query 'InternetGateways[*].InternetGatewayId' --output text)
        for igw in $igws; do
            log_info "인터넷 게이트웨이 분리 및 삭제: $igw"
            aws ec2 detach-internet-gateway --internet-gateway-id "$igw" --vpc-id "$vpc" || true
            aws ec2 delete-internet-gateway --internet-gateway-id "$igw" || true
        done
        
        # 라우트 테이블 삭제 (메인 테이블 제외)
        local route_tables=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --query 'RouteTables[?Associations[0].Main != `true`].RouteTableId' --output text)
        for rt in $route_tables; do
            log_info "라우트 테이블 삭제: $rt"
            aws ec2 delete-route-table --route-table-id "$rt" || true
        done
        
        # 보안 그룹 삭제 (default 제외)
        local security_groups=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc" --query 'SecurityGroups[?GroupName != `default`].GroupId' --output text)
        for sg in $security_groups; do
            log_info "보안 그룹 삭제: $sg"
            aws ec2 delete-security-group --group-id "$sg" || true
        done
        
        # 서브넷 삭제
        local subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc" --query 'Subnets[*].SubnetId' --output text)
        for subnet in $subnets; do
            log_info "서브넷 삭제: $subnet"
            aws ec2 delete-subnet --subnet-id "$subnet" || true
        done
        
        # VPC 삭제
        log_info "VPC 삭제: $vpc"
        aws ec2 delete-vpc --vpc-id "$vpc" || true
    done
    
    if [[ -n "$vpcs" ]]; then
        log_success "네트워킹 리소스 정리 완료"
    else
        log_info "삭제할 VPC가 없습니다"
    fi
}

# CloudWatch 리소스 정리
cleanup_cloudwatch() {
    log_cleanup "CloudWatch 리소스 정리 중..."
    
    # 로그 그룹 삭제
    local log_groups=$(aws logs describe-log-groups --log-group-name-prefix "/aws/lifebit" --query 'logGroups[*].logGroupName' --output text)
    for log_group in $log_groups; do
        log_info "CloudWatch 로그 그룹 삭제: $log_group"
        aws logs delete-log-group --log-group-name "$log_group" || true
    done
    
    # 알람 삭제
    local alarms=$(aws cloudwatch describe-alarms --query "MetricAlarms[?contains(AlarmName, 'LifeBit') || contains(AlarmName, 'lifebit')].AlarmName" --output text)
    for alarm in $alarms; do
        log_info "CloudWatch 알람 삭제: $alarm"
        aws cloudwatch delete-alarms --alarm-names "$alarm" || true
    done
    
    if [[ -n "$log_groups" || -n "$alarms" ]]; then
        log_success "CloudWatch 리소스 정리 완료"
    else
        log_info "삭제할 CloudWatch 리소스가 없습니다"
    fi
}

# Route53 리소스 정리
cleanup_route53() {
    log_cleanup "Route53 리소스 정리 중..."
    
    local hosted_zones=$(aws route53 list-hosted-zones --query "HostedZones[?contains(Name, 'lifebit')].Id" --output text)
    for zone in $hosted_zones; do
        log_info "Route53 호스팅 존 정리: $zone"
        
        # A, AAAA, CNAME 레코드 삭제
        local records=$(aws route53 list-resource-record-sets --hosted-zone-id "$zone" --query "ResourceRecordSets[?Type != \`NS\` && Type != \`SOA\`]" --output json)
        if [[ -n "$records" && "$records" != "[]" ]]; then
            echo "$records" | jq -c '.[]' | while read -r record; do
                aws route53 change-resource-record-sets --hosted-zone-id "$zone" --change-batch "{\"Changes\":[{\"Action\":\"DELETE\",\"ResourceRecordSet\":$record}]}" || true
            done
        fi
        
        # 호스팅 존 삭제
        aws route53 delete-hosted-zone --id "$zone" || true
    done
    
    if [[ -n "$hosted_zones" ]]; then
        log_success "Route53 리소스 정리 완료"
    else
        log_info "삭제할 Route53 호스팅 존이 없습니다"
    fi
}

# IAM 리소스 정리
cleanup_iam() {
    log_cleanup "IAM 리소스 정리 중..."
    
    # IAM 역할 삭제
    local roles=$(aws iam list-roles --query "Roles[?contains(RoleName, 'LifeBit') || contains(RoleName, 'lifebit')].RoleName" --output text)
    for role in $roles; do
        log_info "IAM 역할 정리: $role"
        
        # 역할에서 정책 분리
        local attached_policies=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[*].PolicyArn' --output text)
        for policy in $attached_policies; do
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" || true
        done
        
        # 인라인 정책 삭제
        local inline_policies=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[*]' --output text)
        for policy in $inline_policies; do
            aws iam delete-role-policy --role-name "$role" --policy-name "$policy" || true
        done
        
        # 인스턴스 프로필에서 역할 제거
        local instance_profiles=$(aws iam list-instance-profiles-for-role --role-name "$role" --query 'InstanceProfiles[*].InstanceProfileName' --output text)
        for profile in $instance_profiles; do
            aws iam remove-role-from-instance-profile --instance-profile-name "$profile" --role-name "$role" || true
        done
        
        # 역할 삭제
        aws iam delete-role --role-name "$role" || true
    done
    
    # IAM 사용자 삭제
    local users=$(aws iam list-users --query "Users[?contains(UserName, 'lifebit')].UserName" --output text)
    for user in $users; do
        log_info "IAM 사용자 정리: $user"
        
        # 사용자 정책 분리
        local attached_policies=$(aws iam list-attached-user-policies --user-name "$user" --query 'AttachedPolicies[*].PolicyArn' --output text)
        for policy in $attached_policies; do
            aws iam detach-user-policy --user-name "$user" --policy-arn "$policy" || true
        done
        
        # 인라인 정책 삭제
        local inline_policies=$(aws iam list-user-policies --user-name "$user" --query 'PolicyNames[*]' --output text)
        for policy in $inline_policies; do
            aws iam delete-user-policy --user-name "$user" --policy-name "$policy" || true
        done
        
        # 액세스 키 삭제
        local access_keys=$(aws iam list-access-keys --user-name "$user" --query 'AccessKeyMetadata[*].AccessKeyId' --output text)
        for key in $access_keys; do
            aws iam delete-access-key --user-name "$user" --access-key-id "$key" || true
        done
        
        # 사용자 삭제
        aws iam delete-user --user-name "$user" || true
    done
    
    # IAM 정책 삭제 (AWS 관리형 정책 제외)
    local policies=$(aws iam list-policies --scope Local --query "Policies[?contains(PolicyName, 'LifeBit') || contains(PolicyName, 'lifebit')].Arn" --output text)
    for policy in $policies; do
        log_info "IAM 정책 삭제: $policy"
        
        # 정책 버전 삭제 (기본 버전 제외)
        local versions=$(aws iam list-policy-versions --policy-arn "$policy" --query 'Versions[?IsDefaultVersion != `true`].VersionId' --output text)
        for version in $versions; do
            aws iam delete-policy-version --policy-arn "$policy" --version-id "$version" || true
        done
        
        # 정책 삭제
        aws iam delete-policy --policy-arn "$policy" || true
    done
    
    if [[ -n "$roles" || -n "$users" || -n "$policies" ]]; then
        log_success "IAM 리소스 정리 완료"
    else
        log_info "삭제할 IAM 리소스가 없습니다"
    fi
}

# Docker 리소스 정리
cleanup_docker_compose() {
    log_cleanup "Docker Compose 리소스 정리 중..."
    if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
        cd "$SCRIPT_DIR"
        docker-compose down --volumes --remove-orphans || true
        log_success "Docker Compose 리소스 정리 완료"
    else
        log_info "docker-compose.yml 파일이 없습니다"
    fi
}

# LifeBit 관련 Docker 리소스 정리
cleanup_lifebit_docker() {
    log_cleanup "LifeBit Docker 리소스 정리 중..."
    
    # LifeBit 관련 컨테이너 정지 및 삭제
    local containers=$(docker ps -a --filter "name=lifebit" --format "{{.ID}}" 2>/dev/null || true)
    if [[ -n "$containers" ]]; then
        log_info "LifeBit 컨테이너 정리..."
        docker stop $containers 2>/dev/null || true
        docker rm $containers 2>/dev/null || true
    fi
    
    # LifeBit 관련 이미지 삭제
    local images=$(docker images --filter "reference=*lifebit*" --format "{{.ID}}" 2>/dev/null || true)
    if [[ -n "$images" ]]; then
        log_info "LifeBit 이미지 정리..."
        docker rmi -f $images 2>/dev/null || true
    fi
    
    # LifeBit 관련 볼륨 삭제
    local volumes=$(docker volume ls --filter "name=lifebit" --format "{{.Name}}" 2>/dev/null || true)
    if [[ -n "$volumes" ]]; then
        log_info "LifeBit 볼륨 정리..."
        docker volume rm $volumes 2>/dev/null || true
    fi
    
    # LifeBit 관련 네트워크 삭제
    local networks=$(docker network ls --filter "name=lifebit" --format "{{.ID}}" 2>/dev/null || true)
    if [[ -n "$networks" ]]; then
        log_info "LifeBit 네트워크 정리..."
        docker network rm $networks 2>/dev/null || true
    fi
    
    log_success "LifeBit Docker 리소스 정리 완료"
}

# Terraform 상태 및 캐시 정리
cleanup_terraform() {
    log_cleanup "Terraform 상태 및 캐시 정리 중..."
    local terraform_dir="$SCRIPT_DIR/infrastructure"
    if [[ -d "$terraform_dir" ]]; then
        cd "$terraform_dir"
        rm -rf .terraform* terraform.tfstate* tfplan* 2>/dev/null || true
        log_success "Terraform 상태 및 캐시 정리 완료"
        cd "$SCRIPT_DIR"
    else
        log_info "infrastructure 디렉토리가 없습니다"
    fi
}

# Terraform destroy (AWS provider)
terraform_destroy() {
    log_cleanup "Terraform 인프라 삭제 중..."
    local terraform_dir="$SCRIPT_DIR/infrastructure"
    if [[ ! -d "$terraform_dir" ]]; then
        log_warning "infrastructure 디렉토리를 찾을 수 없습니다"
        return 0
    fi
    
    cd "$terraform_dir"
    if [[ ! -f "terraform.tfstate" ]]; then
        log_warning "Terraform 상태 파일이 없습니다. 삭제할 인프라가 없을 수 있습니다."
        cd "$SCRIPT_DIR"
        return 0
    fi
    
    log_info "Terraform 인프라 삭제 시작..."
    if terraform destroy \
        -var="aws_access_key_id=${AWS_ACCESS_KEY_ID:-}" \
        -var="aws_secret_access_key=${AWS_SECRET_ACCESS_KEY:-}" \
        -var="aws_region=${AWS_DEFAULT_REGION:-ap-northeast-2}" \
        -auto-approve 2>/dev/null; then
        log_success "Terraform 인프라 삭제 완료"
    else
        log_warning "Terraform 인프라 삭제 중 일부 오류가 발생했습니다. 수동 정리를 진행합니다."
    fi
    cd "$SCRIPT_DIR"
}

# 로컬 파일 정리
cleanup_local_files() {
    log_cleanup "로컬 파일 정리 중..."
    
    # 로그 파일 정리
    if [[ -d "$SCRIPT_DIR/logs" ]]; then
        rm -rf "$SCRIPT_DIR/logs"/* 2>/dev/null || true
        log_info "로그 파일 정리 완료"
    fi
    
    # 임시 파일 정리
    rm -f "$SCRIPT_DIR"/*.log "$SCRIPT_DIR"/*.tmp 2>/dev/null || true
    
    log_success "로컬 파일 정리 완료"
}

# 최종 검증
verify_cleanup() {
    log_info "🔍 정리 상태 검증 중..."
    
    # EC2 인스턴스 확인
    local running_instances=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,pending" --query 'Reservations[*].Instances[*].InstanceId' --output text)
    if [[ -n "$running_instances" ]]; then
        log_warning "아직 실행 중인 EC2 인스턴스가 있습니다: $running_instances"
    fi
    
    # EBS 볼륨 확인
    local volumes=$(aws ec2 describe-volumes --filters "Name=tag:Project,Values=LifeBit" --query 'Volumes[*].VolumeId' --output text)
    if [[ -n "$volumes" ]]; then
        log_warning "아직 남아있는 EBS 볼륨이 있습니다: $volumes"
    fi
    
    # S3 버킷 확인
    local s3_buckets=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'lifebit')].Name" --output text)
    if [[ -n "$s3_buckets" ]]; then
        log_warning "아직 남아있는 S3 버킷이 있습니다: $s3_buckets"
    fi
    
    log_success "정리 상태 검증 완료"
}

# 메인 실행
main() {
    log_info "🍃 LifeBit AWS 완전 삭제 스크립트 시작..."
    
    # 사전 검사
    check_aws_cli
    load_env
    confirm_deletion
    
    # 리소스 정리 순서 (의존성 고려)
    cleanup_cloudformation
    cleanup_ecs
    cleanup_lambda
    cleanup_api_gateway
    cleanup_load_balancers
    cleanup_rds
    cleanup_autoscaling
    cleanup_ec2
    cleanup_networking
    cleanup_s3
    cleanup_ecr
    cleanup_cloudwatch
    cleanup_route53
    cleanup_iam
    
    # Terraform 정리
    terraform_destroy
    cleanup_terraform
    
    # Docker 정리
    cleanup_docker_compose
    cleanup_lifebit_docker
    
    # 로컬 파일 정리
    cleanup_local_files
    
    # 최종 검증
    verify_cleanup
    
    log_success "🎉 LifeBit AWS 완전 삭제 완료!"
    log_info "💡 AWS 콘솔에서 추가로 확인하시기 바랍니다."
    log_info "💡 요금 청구를 완전히 중단하려면 AWS 계정 자체를 닫는 것을 고려해보세요."
}

# 스크립트 실행
main "$@" 