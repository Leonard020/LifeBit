#!/bin/bash

# AWS 완전 정리 스크립트
# 모든 비용 발생 가능한 리소스를 안전하게 삭제합니다

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로깅 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# 진행률 표시 함수
show_progress() {
    local current=$1
    local total=$2
    local desc=$3
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r${PURPLE}[$(printf "%*s" $filled | tr ' ' '=')$(printf "%*s" $empty | tr ' ' '-')] %d%% %s${NC}" $percent "$desc"
    if [ $current -eq $total ]; then
        echo
    fi
}

# AWS CLI 설치 확인
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        error "AWS CLI가 설치되어 있지 않습니다."
        error "설치 방법: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # AWS 자격 증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS 자격 증명이 설정되어 있지 않습니다."
        error "설정 방법: aws configure"
        exit 1
    fi
}

# 사용자 확인
confirm_cleanup() {
    echo
    echo -e "${RED}⚠️  경고: 이 스크립트는 AWS 계정의 모든 LifeBit 관련 리소스를 삭제합니다!${NC}"
    echo -e "${RED}⚠️  다음 리소스들이 삭제될 수 있습니다:${NC}"
    echo "   • EC2 인스턴스 (lifebit-*)"
    echo "   • VPC 및 네트워킹 리소스"
    echo "   • 보안 그룹"
    echo "   • 키 페어"
    echo "   • Elastic IP"
    echo "   • 로드 밸런서"
    echo "   • Auto Scaling 그룹"
    echo "   • CloudFormation 스택"
    echo "   • S3 버킷 (lifebit-*)"
    echo "   • RDS 인스턴스 (lifebit-*)"
    echo "   • Lambda 함수 (lifebit-*)"
    echo "   • CloudWatch 로그 그룹"
    echo "   • IAM 역할 및 정책 (lifebit-*)"
    echo
    
    read -p "정말로 모든 리소스를 삭제하시겠습니까? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        info "정리 작업이 취소되었습니다."
        exit 0
    fi
    
    echo
    warning "5초 후 정리를 시작합니다... (Ctrl+C로 취소 가능)"
    for i in {5..1}; do
        echo -n "$i... "
        sleep 1
    done
    echo
}

# 리전 목록 가져오기
get_regions() {
    aws ec2 describe-regions --query 'Regions[].RegionName' --output text
}

# Terraform 상태 정리
cleanup_terraform() {
    log "Terraform 상태 정리 중..."
    
    if [ -d "infrastructure/terraform" ]; then
        cd infrastructure/terraform
        
        # Terraform 상태 확인
        if [ -f "terraform.tfstate" ] || [ -f ".terraform/terraform.tfstate" ]; then
            info "Terraform 리소스 삭제 중..."
            if terraform destroy -auto-approve; then
                success "Terraform 리소스가 성공적으로 삭제되었습니다"
            else
                warning "일부 Terraform 리소스 삭제에 실패했습니다. 수동 정리를 진행합니다."
            fi
        fi
        
        # Terraform 상태 파일 정리
        rm -f terraform.tfstate*
        rm -f .terraform.lock.hcl
        rm -rf .terraform/
        
        cd ../..
    fi
}

# EC2 인스턴스 정리
cleanup_ec2_instances() {
    log "EC2 인스턴스 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "EC2 인스턴스 정리 ($region)"
        
        # LifeBit 관련 인스턴스 찾기
        local instances=$(aws ec2 describe-instances \
            --region $region \
            --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,stopped,stopping" \
            --query 'Reservations[].Instances[].InstanceId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$instances" ] && [ "$instances" != "None" ]; then
            info "리전 $region에서 인스턴스 삭제: $instances"
            aws ec2 terminate-instances --region $region --instance-ids $instances >/dev/null 2>&1 || true
        fi
        
        # lifebit으로 시작하는 인스턴스들도 찾기
        local lifebit_instances=$(aws ec2 describe-instances \
            --region $region \
            --filters "Name=tag:Name,Values=lifebit*" "Name=instance-state-name,Values=running,stopped,stopping" \
            --query 'Reservations[].Instances[].InstanceId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$lifebit_instances" ] && [ "$lifebit_instances" != "None" ]; then
            info "리전 $region에서 LifeBit 인스턴스 삭제: $lifebit_instances"
            aws ec2 terminate-instances --region $region --instance-ids $lifebit_instances >/dev/null 2>&1 || true
        fi
    done
}

# 키 페어 정리
cleanup_key_pairs() {
    log "키 페어 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "키 페어 정리 ($region)"
        
        # lifebit 관련 키 페어 찾기
        local keypairs=$(aws ec2 describe-key-pairs \
            --region $region \
            --filters "Name=key-name,Values=lifebit*" \
            --query 'KeyPairs[].KeyName' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$keypairs" ] && [ "$keypairs" != "None" ]; then
            for keypair in $keypairs; do
                info "리전 $region에서 키 페어 삭제: $keypair"
                aws ec2 delete-key-pair --region $region --key-name $keypair >/dev/null 2>&1 || true
            done
        fi
    done
}

# 보안 그룹 정리
cleanup_security_groups() {
    log "보안 그룹 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "보안 그룹 정리 ($region)"
        
        # lifebit 관련 보안 그룹 찾기
        local security_groups=$(aws ec2 describe-security-groups \
            --region $region \
            --filters "Name=group-name,Values=lifebit*" \
            --query 'SecurityGroups[?GroupName!=`default`].GroupId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$security_groups" ] && [ "$security_groups" != "None" ]; then
            for sg in $security_groups; do
                info "리전 $region에서 보안 그룹 삭제: $sg"
                aws ec2 delete-security-group --region $region --group-id $sg >/dev/null 2>&1 || true
            done
        fi
    done
}

# VPC 정리
cleanup_vpcs() {
    log "VPC 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "VPC 정리 ($region)"
        
        # lifebit 관련 VPC 찾기
        local vpcs=$(aws ec2 describe-vpcs \
            --region $region \
            --filters "Name=tag:Name,Values=lifebit*" \
            --query 'Vpcs[].VpcId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$vpcs" ] && [ "$vpcs" != "None" ]; then
            for vpc in $vpcs; do
                info "리전 $region에서 VPC 종속 리소스 정리: $vpc"
                
                # 서브넷 삭제
                local subnets=$(aws ec2 describe-subnets --region $region --filters "Name=vpc-id,Values=$vpc" --query 'Subnets[].SubnetId' --output text 2>/dev/null || echo "")
                if [ -n "$subnets" ] && [ "$subnets" != "None" ]; then
                    for subnet in $subnets; do
                        aws ec2 delete-subnet --region $region --subnet-id $subnet >/dev/null 2>&1 || true
                    done
                fi
                
                # 인터넷 게이트웨이 분리 및 삭제
                local igws=$(aws ec2 describe-internet-gateways --region $region --filters "Name=attachment.vpc-id,Values=$vpc" --query 'InternetGateways[].InternetGatewayId' --output text 2>/dev/null || echo "")
                if [ -n "$igws" ] && [ "$igws" != "None" ]; then
                    for igw in $igws; do
                        aws ec2 detach-internet-gateway --region $region --internet-gateway-id $igw --vpc-id $vpc >/dev/null 2>&1 || true
                        aws ec2 delete-internet-gateway --region $region --internet-gateway-id $igw >/dev/null 2>&1 || true
                    done
                fi
                
                # 라우트 테이블 삭제
                local route_tables=$(aws ec2 describe-route-tables --region $region --filters "Name=vpc-id,Values=$vpc" "Name=association.main,Values=false" --query 'RouteTables[].RouteTableId' --output text 2>/dev/null || echo "")
                if [ -n "$route_tables" ] && [ "$route_tables" != "None" ]; then
                    for rt in $route_tables; do
                        aws ec2 delete-route-table --region $region --route-table-id $rt >/dev/null 2>&1 || true
                    done
                fi
                
                # VPC 삭제
                info "리전 $region에서 VPC 삭제: $vpc"
                aws ec2 delete-vpc --region $region --vpc-id $vpc >/dev/null 2>&1 || true
            done
        fi
    done
}

# Elastic IP 정리
cleanup_elastic_ips() {
    log "Elastic IP 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "Elastic IP 정리 ($region)"
        
        # 모든 Elastic IP 찾기 (연결되지 않은 것들)
        local eips=$(aws ec2 describe-addresses \
            --region $region \
            --query 'Addresses[?AssociationId==null].AllocationId' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$eips" ] && [ "$eips" != "None" ]; then
            for eip in $eips; do
                info "리전 $region에서 Elastic IP 해제: $eip"
                aws ec2 release-address --region $region --allocation-id $eip >/dev/null 2>&1 || true
            done
        fi
    done
}

# S3 버킷 정리
cleanup_s3_buckets() {
    log "S3 버킷 정리 중..."
    
    # lifebit 관련 버킷 찾기
    local buckets=$(aws s3api list-buckets --query 'Buckets[?starts_with(Name, `lifebit`)].Name' --output text 2>/dev/null || echo "")
    
    if [ -n "$buckets" ] && [ "$buckets" != "None" ]; then
        for bucket in $buckets; do
            info "S3 버킷 정리: $bucket"
            
            # 버킷 버전 관리 확인
            local versioning=$(aws s3api get-bucket-versioning --bucket $bucket --query 'Status' --output text 2>/dev/null || echo "")
            
            if [ "$versioning" = "Enabled" ]; then
                # 모든 버전 삭제
                aws s3api delete-objects --bucket $bucket --delete "$(aws s3api list-object-versions --bucket $bucket --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json)" >/dev/null 2>&1 || true
                aws s3api delete-objects --bucket $bucket --delete "$(aws s3api list-object-versions --bucket $bucket --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json)" >/dev/null 2>&1 || true
            else
                # 모든 객체 삭제
                aws s3 rm s3://$bucket --recursive >/dev/null 2>&1 || true
            fi
            
            # 버킷 삭제
            aws s3api delete-bucket --bucket $bucket >/dev/null 2>&1 || true
        done
    fi
}

# RDS 인스턴스 정리
cleanup_rds() {
    log "RDS 인스턴스 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "RDS 정리 ($region)"
        
        # lifebit 관련 RDS 인스턴스 찾기
        local rds_instances=$(aws rds describe-db-instances \
            --region $region \
            --query 'DBInstances[?starts_with(DBInstanceIdentifier, `lifebit`)].DBInstanceIdentifier' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$rds_instances" ] && [ "$rds_instances" != "None" ]; then
            for rds in $rds_instances; do
                info "리전 $region에서 RDS 인스턴스 삭제: $rds"
                aws rds delete-db-instance \
                    --region $region \
                    --db-instance-identifier $rds \
                    --skip-final-snapshot \
                    --delete-automated-backups >/dev/null 2>&1 || true
            done
        fi
    done
}

# Lambda 함수 정리
cleanup_lambda() {
    log "Lambda 함수 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "Lambda 정리 ($region)"
        
        # lifebit 관련 Lambda 함수 찾기
        local functions=$(aws lambda list-functions \
            --region $region \
            --query 'Functions[?starts_with(FunctionName, `lifebit`)].FunctionName' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$functions" ] && [ "$functions" != "None" ]; then
            for func in $functions; do
                info "리전 $region에서 Lambda 함수 삭제: $func"
                aws lambda delete-function --region $region --function-name $func >/dev/null 2>&1 || true
            done
        fi
    done
}

# CloudWatch 로그 그룹 정리
cleanup_cloudwatch_logs() {
    log "CloudWatch 로그 그룹 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "CloudWatch 로그 정리 ($region)"
        
        # lifebit 관련 로그 그룹 찾기
        local log_groups=$(aws logs describe-log-groups \
            --region $region \
            --log-group-name-prefix "/aws/lambda/lifebit" \
            --query 'logGroups[].logGroupName' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$log_groups" ] && [ "$log_groups" != "None" ]; then
            for log_group in $log_groups; do
                info "리전 $region에서 로그 그룹 삭제: $log_group"
                aws logs delete-log-group --region $region --log-group-name $log_group >/dev/null 2>&1 || true
            done
        fi
    done
}

# IAM 리소스 정리
cleanup_iam() {
    log "IAM 리소스 정리 중..."
    
    # lifebit 관련 역할 찾기
    local roles=$(aws iam list-roles --query 'Roles[?starts_with(RoleName, `lifebit`)].RoleName' --output text 2>/dev/null || echo "")
    
    if [ -n "$roles" ] && [ "$roles" != "None" ]; then
        for role in $roles; do
            info "IAM 역할 삭제: $role"
            
            # 연결된 정책 분리
            local attached_policies=$(aws iam list-attached-role-policies --role-name $role --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
            if [ -n "$attached_policies" ] && [ "$attached_policies" != "None" ]; then
                for policy in $attached_policies; do
                    aws iam detach-role-policy --role-name $role --policy-arn $policy >/dev/null 2>&1 || true
                done
            fi
            
            # 인라인 정책 삭제
            local inline_policies=$(aws iam list-role-policies --role-name $role --query 'PolicyNames[]' --output text 2>/dev/null || echo "")
            if [ -n "$inline_policies" ] && [ "$inline_policies" != "None" ]; then
                for policy in $inline_policies; do
                    aws iam delete-role-policy --role-name $role --policy-name $policy >/dev/null 2>&1 || true
                done
            fi
            
            # 역할 삭제
            aws iam delete-role --role-name $role >/dev/null 2>&1 || true
        done
    fi
    
    # lifebit 관련 정책 찾기
    local policies=$(aws iam list-policies --scope Local --query 'Policies[?starts_with(PolicyName, `lifebit`)].Arn' --output text 2>/dev/null || echo "")
    
    if [ -n "$policies" ] && [ "$policies" != "None" ]; then
        for policy in $policies; do
            info "IAM 정책 삭제: $policy"
            aws iam delete-policy --policy-arn $policy >/dev/null 2>&1 || true
        done
    fi
}

# CloudFormation 스택 정리
cleanup_cloudformation() {
    log "CloudFormation 스택 정리 중..."
    
    local regions=($(get_regions))
    local total_regions=${#regions[@]}
    local current=0
    
    for region in "${regions[@]}"; do
        current=$((current + 1))
        show_progress $current $total_regions "CloudFormation 정리 ($region)"
        
        # lifebit 관련 스택 찾기
        local stacks=$(aws cloudformation list-stacks \
            --region $region \
            --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
            --query 'StackSummaries[?starts_with(StackName, `lifebit`)].StackName' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$stacks" ] && [ "$stacks" != "None" ]; then
            for stack in $stacks; do
                info "리전 $region에서 CloudFormation 스택 삭제: $stack"
                aws cloudformation delete-stack --region $region --stack-name $stack >/dev/null 2>&1 || true
            done
        fi
    done
}

# 로컬 파일 정리
cleanup_local_files() {
    log "로컬 파일 정리 중..."
    
    # SSH 키 파일 삭제
    if [ -f ~/.ssh/lifebit-key.pem ]; then
        rm -f ~/.ssh/lifebit-key.pem
        info "SSH 키 파일 삭제: ~/.ssh/lifebit-key.pem"
    fi
    
    if [ -f ~/.ssh/lifebit-key-*.pem ]; then
        rm -f ~/.ssh/lifebit-key-*.pem
        info "SSH 키 파일 삭제: ~/.ssh/lifebit-key-*.pem"
    fi
    
    # Terraform 파일 정리
    if [ -d "infrastructure/terraform" ]; then
        cd infrastructure/terraform
        rm -f terraform.tfstate*
        rm -f .terraform.lock.hcl
        rm -rf .terraform/
        cd ../..
        info "Terraform 상태 파일 정리 완료"
    fi
    
    # Ansible inventory 파일 정리
    if [ -f "infrastructure/ansible/inventory" ]; then
        rm -f infrastructure/ansible/inventory
        info "Ansible inventory 파일 삭제"
    fi
}

# 정리 완료 대기
wait_for_cleanup() {
    log "리소스 삭제 완료 대기 중..."
    
    info "EC2 인스턴스 종료 대기 중... (최대 5분)"
    sleep 60
    
    info "정리 작업이 백그라운드에서 계속 진행됩니다."
    info "완전한 정리까지 최대 10-15분이 소요될 수 있습니다."
}

# 메인 실행 함수
main() {
    echo
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    🧹 AWS 완전 정리 도구                     ║${NC}"
    echo -e "${PURPLE}║                  LifeBit 프로젝트 리소스 정리                ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 사전 검사
    check_aws_cli
    confirm_cleanup
    
    echo
    log "AWS 리소스 완전 정리를 시작합니다..."
    echo
    
    # 정리 작업 실행
    cleanup_terraform
    cleanup_ec2_instances
    cleanup_key_pairs
    cleanup_security_groups
    cleanup_elastic_ips
    cleanup_vpcs
    cleanup_s3_buckets
    cleanup_rds
    cleanup_lambda
    cleanup_cloudwatch_logs
    cleanup_iam
    cleanup_cloudformation
    cleanup_local_files
    
    wait_for_cleanup
    
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                     🎉 정리 완료!                           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    success "모든 AWS 리소스 정리가 완료되었습니다!"
    info "AWS 콘솔에서 리소스가 완전히 삭제되었는지 확인해주세요."
    info "일부 리소스는 완전 삭제까지 추가 시간이 필요할 수 있습니다."
    echo
    warning "다음 명령어로 남은 리소스를 확인할 수 있습니다:"
    echo "  aws ec2 describe-instances --query 'Reservations[].Instances[?State.Name!=\`terminated\`].[InstanceId,State.Name,Tags[?Key==\`Name\`].Value|[0]]' --output table"
    echo "  aws s3 ls"
    echo "  aws rds describe-db-instances --query 'DBInstances[].DBInstanceIdentifier'"
    echo
}

# 스크립트 실행
main "$@" 