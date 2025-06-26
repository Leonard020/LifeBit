#!/bin/bash
set -e

# 스크립트 정보
SCRIPT_NAME=$(basename "$0")
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORCE_DELETE=false

# --force or -y flag check
if [[ "$1" == "--force" || "$1" == "-y" ]]; then
    FORCE_DELETE=true
fi

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
        set -a  # .env 변수 자동 export
        source "$env_file"
        log_success ".env 파일 로드 완료"
    else
        log_warning ".env 파일을 찾을 수 없습니다: $env_file"
    fi
}

# 필요한 도구들 설치 확인
check_dependencies() {
    log_info "필요한 도구들 확인 중..."
    
    # AWS CLI 확인
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되지 않았습니다. 설치 후 다시 실행해주세요."
        exit 1
    fi
    
    # jq 확인 및 자동 설치
    if ! command -v jq &> /dev/null; then
        log_warning "jq가 설치되지 않았습니다. 자동 설치를 시도합니다..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v yum &> /dev/null; then
            sudo yum install -y jq
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y jq
        elif command -v brew &> /dev/null; then
            brew install jq
        else
            log_error "jq 자동 설치에 실패했습니다. 수동으로 설치하세요: https://stedolan.github.io/jq/"
            exit 1
        fi
        
        if ! command -v jq &> /dev/null; then
            log_error "jq 설치에 실패했습니다."
            exit 1
        fi
        log_success "jq 설치 완료"
    fi
    
    # AWS 자격 증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 자격 증명이 설정되지 않았습니다. 'aws configure' 명령어로 설정해주세요."
        exit 1
    fi
    
    log_success "모든 의존성 확인 완료"
}

# 확인 프롬프트
confirm_deletion() {
    if [[ "$FORCE_DELETE" == "true" ]]; then
        log_info "강제 삭제 모드가 활성화되었습니다. 확인 프롬프트를 건너뜁니다."
        return
    fi
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
    if [[ -z "$clusters" ]]; then
        log_info "삭제할 ECS 클러스터가 없습니다."
        return
    fi

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
    if [[ -n "$db_instances" ]]; then
        for instance in $db_instances; do
            log_info "RDS 인스턴스 삭제: $instance"
            aws rds delete-db-instance --db-instance-identifier "$instance" --skip-final-snapshot --delete-automated-backups || true
        done

        # RDS 인스턴스 삭제 대기
        for instance in $db_instances; do
            log_info "RDS 인스턴스 삭제 완료 대기: $instance"
            aws rds wait db-instance-deleted --db-instance-identifier "$instance" || true
        done
    fi

    # RDS 클러스터 삭제
    local clusters=$(aws rds describe-db-clusters --query "DBClusters[?contains(DBClusterIdentifier, 'lifebit')].DBClusterIdentifier" --output text)
    if [[ -n "$clusters" ]]; then
        for cluster in $clusters; do
            log_info "RDS 클러스터 삭제: $cluster"
            aws rds delete-db-cluster --db-cluster-identifier "$cluster" --skip-final-snapshot || true
        done
        
        # RDS 클러스터 삭제 대기
        for cluster in $clusters; do
            log_info "RDS 클러스터 삭제 완료 대기: $cluster"
            aws rds wait db-cluster-deleted --db-cluster-identifier "$cluster" || true
        done
    fi

    # RDS 스냅샷 삭제
    local snapshots=$(aws rds describe-db-snapshots --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'lifebit')].DBSnapshotIdentifier" --output text)
    for snapshot in $snapshots; do
        log_info "RDS 스냅샷 삭제: $snapshot"
        aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot" || true
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
        
        # 모든 객체 삭제 (버전 포함)
        aws s3 rb "s3://$bucket" --force || true
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
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name "$asg" --min-size 0 --desired-capacity 0 --force-delete || true
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

# 강력한 EC2 인스턴스 정리 (모든 방법 시도)
cleanup_ec2_instances() {
    log_cleanup "강력한 EC2 인스턴스 정리 중..."
    
    # 1. 태그 기반 인스턴스 찾기 (LifeBit 프로젝트)
    local tagged_instances=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,pending,stopped,stopping" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    # 2. 이름 기반 인스턴스 찾기 (lifebit 포함)
    local name_instances=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=*lifebit*" "Name=instance-state-name,Values=running,pending,stopped,stopping" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    # 3. 키 페어 기반 인스턴스 찾기 (lifebit 키 사용)
    local key_instances=$(aws ec2 describe-instances --filters "Name=key-name,Values=*lifebit*" "Name=instance-state-name,Values=running,pending,stopped,stopping" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    # 4. 보안 그룹 기반 인스턴스 찾기 (lifebit 보안 그룹 사용)
    local sg_instances=$(aws ec2 describe-instances --filters "Name=instance.group-name,Values=*lifebit*" "Name=instance-state-name,Values=running,pending,stopped,stopping" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    # 모든 인스턴스 ID 합치고 중복 제거
    local all_instances=$(echo "$tagged_instances $name_instances $key_instances $sg_instances" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' ')
    
    if [[ -n "$all_instances" && "$all_instances" != "None" ]]; then
        log_info "발견된 LifeBit 관련 인스턴스: $all_instances"
        
                 # 인스턴스 상태별 처리
        for instance_id in $all_instances; do
            [[ -z "$instance_id" || "$instance_id" == "None" ]] && continue
            
            local instance_state=$(aws ec2 describe-instances --instance-ids "$instance_id" --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
            log_info "인스턴스 $instance_id 상태: $instance_state"
            
            # 종료 보호 확인 및 해제
            local termination_protection=$(aws ec2 describe-instance-attribute --instance-id "$instance_id" --attribute disableApiTermination --query 'DisableApiTermination.Value' --output text 2>/dev/null)
            if [[ "$termination_protection" == "true" ]]; then
                log_warning "인스턴스 $instance_id 종료 보호 해제 중..."
                aws ec2 modify-instance-attribute --instance-id "$instance_id" --no-disable-api-termination 2>/dev/null || true
                sleep 2
            fi
            
            case "$instance_state" in
                "running"|"pending"|"stopped"|"stopping")
                    log_info "인스턴스 종료 시도: $instance_id"
                    aws ec2 terminate-instances --instance-ids "$instance_id" 2>/dev/null || true
                    ;;
                "shutting-down"|"terminated")
                    log_info "인스턴스 $instance_id 이미 종료 중/완료"
                    ;;
                *)
                    log_warning "인스턴스 $instance_id 알 수 없는 상태: $instance_state"
                    # 종료 보호 해제 후 종료 시도
                    aws ec2 terminate-instances --instance-ids "$instance_id" 2>/dev/null || true
                    ;;
            esac
        done
        
        # 모든 인스턴스 종료 대기 (타임아웃 포함)
        log_info "모든 인스턴스 종료 완료 대기 중... (최대 10분)"
        local wait_timeout=600  # 10분
        local wait_start=$(date +%s)
        
        while [[ -n "$all_instances" ]]; do
            local current_time=$(date +%s)
            if (( current_time - wait_start > wait_timeout )); then
                log_warning "인스턴스 종료 대기 시간 초과 (10분). 강제 진행합니다."
                break
            fi
            
            local remaining_instances=""
            for instance_id in $all_instances; do
                [[ -z "$instance_id" || "$instance_id" == "None" ]] && continue
                
                local current_state=$(aws ec2 describe-instances --instance-ids "$instance_id" --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
                if [[ "$current_state" != "terminated" ]]; then
                    remaining_instances="$remaining_instances $instance_id"
                    log_info "인스턴스 $instance_id 여전히 $current_state 상태"
                else
                    log_success "인스턴스 $instance_id 종료 완료"
                fi
            done
            
            all_instances="$remaining_instances"
            [[ -z "$all_instances" ]] && break
            
            sleep 30
        done
        
        if [[ -n "$all_instances" ]]; then
            log_error "다음 인스턴스들이 종료되지 않았습니다: $all_instances"
            log_error "AWS 콘솔에서 수동으로 확인 및 종료해주세요."
        else
            log_success "모든 LifeBit 관련 인스턴스 종료 완료"
        fi
    else
        log_info "종료할 LifeBit 관련 인스턴스가 없습니다"
    fi
}

# EC2 인스턴스 및 관련 리소스 정리
cleanup_ec2() {
    log_cleanup "EC2 리소스 정리 중..."
    
    # 강력한 인스턴스 정리 실행
    cleanup_ec2_instances
    
    # Network Interfaces 정리 (VPC 삭제 전에 필요)
    local network_interfaces=$(aws ec2 describe-network-interfaces --filters "Name=tag:Project,Values=LifeBit" --query 'NetworkInterfaces[*].NetworkInterfaceId' --output text)
    if [[ -n "$network_interfaces" ]]; then
        log_info "Network Interfaces 정리 중..."
        for eni in $network_interfaces; do
            log_info "Network Interface 삭제: $eni"
            aws ec2 delete-network-interface --network-interface-id "$eni" || true
        done
        log_success "Network Interfaces 정리 완료"
    fi
    
    # Elastic IP 해제 (더 포괄적으로)
    local eips=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=LifeBit" --query 'Addresses[*].AllocationId' --output text)
    local eips2=$(aws ec2 describe-addresses --query 'Addresses[?NetworkInterfaceId==null].AllocationId' --output text)
    
    # 모든 EIP를 합치고 중복 제거
    local all_eips=$(echo "$eips $eips2" | tr ' ' '\n' | sort -u | grep -v '^$')
    
    if [[ -n "$all_eips" ]]; then
        log_info "Elastic IP 해제 중..."
        for eip in $all_eips; do
            log_info "Elastic IP 해제: $eip"
            aws ec2 release-address --allocation-id "$eip" || true
        done
        log_success "Elastic IP 해제 완료"
    else
        log_info "해제할 Elastic IP가 없습니다"
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
    
    log_success "EC2 관련 리소스(EIP, 볼륨, 스냅샷, AMI) 정리 완료"
}

# VPC 및 네트워킹 리소스 정리 (Terraform에 주로 의존)
cleanup_networking() {
    log_cleanup "네트워킹 리소스 정리 중... (Terraform 외 남은 리소스)"
    
    # LifeBit 관련 VPC 찾기 (더 포괄적인 검색)
    local vpcs=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=LifeBit" --query 'Vpcs[*].VpcId' --output text)
    local vpcs2=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*lifebit*" --query 'Vpcs[*].VpcId' --output text)
    local vpcs3=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=*LifeBit*" --query 'Vpcs[*].VpcId' --output text)
    
    # 모든 VPC ID를 합치고 중복 제거
    local all_vpcs=$(echo "$vpcs $vpcs2 $vpcs3" | tr ' ' '\n' | sort -u | grep -v '^$')
    
    for vpc in $all_vpcs; do
        [[ -z "$vpc" ]] && continue
        log_warning "Terraform으로 삭제되지 않은 VPC 발견: $vpc. 수동 정리를 시도합니다."
        
        # 0. 모든 Network Interface 강제 정리 (가장 먼저)
        log_info "Network Interface 강제 정리 중..."
        local all_enis=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc" --query 'NetworkInterfaces[*].[NetworkInterfaceId,Status,Attachment.AttachmentId]' --output text 2>/dev/null)
        
        if [[ -n "$all_enis" ]]; then
            echo "$all_enis" | while read eni_id status attachment_id; do
                [[ -z "$eni_id" || "$eni_id" == "None" ]] && continue
                
                log_info "Network Interface 처리: $eni_id (상태: $status)"
                
                # 연결 해제
                if [[ -n "$attachment_id" && "$attachment_id" != "None" && "$attachment_id" != "null" ]]; then
                    log_info "  - 연결 해제: $attachment_id"
                    aws ec2 detach-network-interface --attachment-id "$attachment_id" --force 2>/dev/null || true
                    sleep 3
                fi
                
                # 삭제 시도
                local max_eni_attempts=3
                for eni_attempt in $(seq 1 $max_eni_attempts); do
                    if aws ec2 delete-network-interface --network-interface-id "$eni_id" 2>/dev/null; then
                        log_success "  - Network Interface 삭제 성공: $eni_id"
                        break
                    else
                        if [[ $eni_attempt -eq $max_eni_attempts ]]; then
                            log_warning "  - Network Interface 삭제 실패: $eni_id"
                        else
                            log_info "  - Network Interface 삭제 재시도 ($eni_attempt/$max_eni_attempts): $eni_id"
                            sleep 5
                        fi
                    fi
                done
            done
        fi
        
        sleep 5
        
        # 1. VPC 엔드포인트 삭제
        local vpc_endpoints=$(aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$vpc" --query 'VpcEndpoints[*].VpcEndpointId' --output text 2>/dev/null)
        for endpoint in $vpc_endpoints; do
            [[ -z "$endpoint" || "$endpoint" == "None" ]] && continue
            log_info "VPC 엔드포인트 삭제: $endpoint"
            aws ec2 delete-vpc-endpoint --vpc-endpoint-id "$endpoint" 2>/dev/null || true
        done
        
        # 2. NAT Gateway 삭제
        local nat_gateways=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpc" --query 'NatGateways[*].NatGatewayId' --output text)
        for nat in $nat_gateways; do
            log_info "NAT Gateway 삭제: $nat"
            aws ec2 delete-nat-gateway --nat-gateway-id "$nat" || true
        done
        
        # 3. VPC Peering Connections 삭제
        local peering_connections=$(aws ec2 describe-vpc-peering-connections --filters "Name=requester-vpc-info.vpc-id,Values=$vpc" --query 'VpcPeeringConnections[*].VpcPeeringConnectionId' --output text)
        for peering in $peering_connections; do
            log_info "VPC Peering Connection 삭제: $peering"
            aws ec2 delete-vpc-peering-connection --vpc-peering-connection-id "$peering" || true
        done
        
        # 4. Network ACLs 삭제 (기본 ACL 제외)
        local network_acls=$(aws ec2 describe-network-acls --filters "Name=vpc-id,Values=$vpc" "Name=default,Values=false" --query 'NetworkAcls[*].NetworkAclId' --output text)
        for acl in $network_acls; do
            log_info "Network ACL 삭제: $acl"
            aws ec2 delete-network-acl --network-acl-id "$acl" || true
        done
        
        # 5. 라우팅 테이블 연결 해제 및 삭제 (기본 라우팅 테이블 제외)
        local route_tables=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --query 'RouteTables[*].RouteTableId' --output text)
        for rt in $route_tables; do
            log_info "라우팅 테이블 처리: $rt"
            
            # 라우팅 테이블 연결 해제
            local associations=$(aws ec2 describe-route-tables --route-table-ids "$rt" --query 'RouteTables[0].Associations[?Main==`false`].RouteTableAssociationId' --output text)
            for assoc in $associations; do
                log_info "라우팅 테이블 연결 해제: $assoc"
                aws ec2 disassociate-route-table --association-id "$assoc" || true
            done
            
            # 기본 라우팅 테이블이 아닌 경우 삭제
            local is_main=$(aws ec2 describe-route-tables --route-table-ids "$rt" --query 'RouteTables[0].Associations[?Main==`true`]' --output text)
            if [[ -z "$is_main" ]]; then
                log_info "라우팅 테이블 삭제: $rt"
                aws ec2 delete-route-table --route-table-id "$rt" || true
            else
                log_info "기본 라우팅 테이블이므로 삭제하지 않음: $rt"
            fi
        done
        
        # 6. 서브넷 삭제
        local subnets=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc" --query 'Subnets[*].SubnetId' --output text)
        for subnet in $subnets; do
            log_info "서브넷 삭제: $subnet"
            aws ec2 delete-subnet --subnet-id "$subnet" || true
        done
        
        # 7. 인터넷 게이트웨이 분리 및 삭제 (Elastic IP 먼저 해제)
        local igws=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpc" --query 'InternetGateways[*].InternetGatewayId' --output text 2>/dev/null)
        for igw in $igws; do
            [[ -z "$igw" || "$igw" == "None" ]] && continue
            log_info "인터넷 게이트웨이 분리 및 삭제: $igw"
            
            # VPC와 연결된 모든 Elastic IP 해제
            local vpc_eips=$(aws ec2 describe-addresses --filters "Name=domain,Values=vpc" --query "Addresses[?NetworkInterfaceId!=null].AllocationId" --output text 2>/dev/null)
            for eip in $vpc_eips; do
                [[ -z "$eip" || "$eip" == "None" ]] && continue
                log_info "Elastic IP 해제: $eip"
                aws ec2 release-address --allocation-id "$eip" 2>/dev/null || true
            done
            
            # 인터넷 게이트웨이 분리 및 삭제
            aws ec2 detach-internet-gateway --internet-gateway-id "$igw" --vpc-id "$vpc" 2>/dev/null || true
            sleep 3
            aws ec2 delete-internet-gateway --internet-gateway-id "$igw" 2>/dev/null || true
        done
        
        # 8. 보안 그룹 정리 (콘솔과 동일한 방식)
        log_info "보안 그룹 의존성 해결 중..."
        
        # 먼저 모든 보안 그룹을 가져오기 (기본 제외)
        local all_sgs=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc" --query 'SecurityGroups[?GroupName!=`default`]' --output json 2>/dev/null)
        
        if [[ "$all_sgs" != "[]" && "$all_sgs" != "null" && -n "$all_sgs" ]]; then
            # 1단계: 모든 보안 그룹 간 참조 제거 (Self-referencing rules)
            local sg_ids=$(echo "$all_sgs" | jq -r '.[].GroupId' 2>/dev/null)
            for sg in $sg_ids; do
                [[ -z "$sg" ]] && continue
                log_info "보안 그룹 자기 참조 규칙 제거: $sg"
                
                # 다른 보안 그룹을 참조하는 Ingress 규칙 제거
                local cross_ref_ingress=$(aws ec2 describe-security-groups --group-ids "$sg" --query "SecurityGroups[0].IpPermissions[?UserIdGroupPairs[0].GroupId]" --output json 2>/dev/null)
                if [[ "$cross_ref_ingress" != "[]" && "$cross_ref_ingress" != "null" ]]; then
                    log_info "  - 교차 참조 Ingress 규칙 제거: $sg"
                    aws ec2 revoke-security-group-ingress --group-id "$sg" --ip-permissions "$cross_ref_ingress" 2>/dev/null || true
                fi
                
                # 다른 보안 그룹을 참조하는 Egress 규칙 제거
                local cross_ref_egress=$(aws ec2 describe-security-groups --group-ids "$sg" --query "SecurityGroups[0].IpPermissionsEgress[?UserIdGroupPairs[0].GroupId]" --output json 2>/dev/null)
                if [[ "$cross_ref_egress" != "[]" && "$cross_ref_egress" != "null" ]]; then
                    log_info "  - 교차 참조 Egress 규칙 제거: $sg"
                    aws ec2 revoke-security-group-egress --group-id "$sg" --ip-permissions "$cross_ref_egress" 2>/dev/null || true
                fi
            done
            
            sleep 3
            
            # 2단계: 모든 IP 기반 규칙 제거
            for sg in $sg_ids; do
                [[ -z "$sg" ]] && continue
                log_info "보안 그룹 IP 규칙 제거: $sg"
                
                # 남은 모든 Ingress 규칙 제거
                local remaining_ingress=$(aws ec2 describe-security-groups --group-ids "$sg" --query 'SecurityGroups[0].IpPermissions' --output json 2>/dev/null)
                if [[ "$remaining_ingress" != "[]" && "$remaining_ingress" != "null" ]]; then
                    aws ec2 revoke-security-group-ingress --group-id "$sg" --ip-permissions "$remaining_ingress" 2>/dev/null || true
                fi
                
                # 남은 모든 Egress 규칙 제거 (기본 규칙 제외)
                local remaining_egress=$(aws ec2 describe-security-groups --group-ids "$sg" --query 'SecurityGroups[0].IpPermissionsEgress' --output json 2>/dev/null)
                if [[ "$remaining_egress" != "[]" && "$remaining_egress" != "null" ]]; then
                    aws ec2 revoke-security-group-egress --group-id "$sg" --ip-permissions "$remaining_egress" 2>/dev/null || true
                fi
            done
            
            sleep 5
            
            # 3단계: 보안 그룹 삭제 (여러 번 시도)
            local max_attempts=3
            for attempt in $(seq 1 $max_attempts); do
                log_info "보안 그룹 삭제 시도 $attempt/$max_attempts"
                local remaining_sgs=""
                
                for sg in $sg_ids; do
                    [[ -z "$sg" ]] && continue
                    
                    if aws ec2 delete-security-group --group-id "$sg" 2>/dev/null; then
                        log_success "보안 그룹 삭제 성공: $sg"
                    else
                        remaining_sgs="$remaining_sgs $sg"
                        log_warning "보안 그룹 삭제 실패: $sg (재시도 예정)"
                    fi
                done
                
                sg_ids="$remaining_sgs"
                [[ -z "$sg_ids" ]] && break
                
                if [[ $attempt -lt $max_attempts ]]; then
                    log_info "5초 대기 후 재시도..."
                    sleep 5
                fi
            done
            
            if [[ -n "$sg_ids" ]]; then
                log_error "삭제되지 않은 보안 그룹: $sg_ids"
            fi
        fi
        
        # 9. VPC 삭제 시도 (여러 번 재시도)
        log_info "VPC 삭제 시도: $vpc"
        local vpc_delete_attempts=5
        local vpc_deleted=false
        
        for attempt in $(seq 1 $vpc_delete_attempts); do
            log_info "VPC 삭제 시도 $attempt/$vpc_delete_attempts: $vpc"
            
            if aws ec2 delete-vpc --vpc-id "$vpc" 2>/dev/null; then
                log_success "VPC $vpc 삭제 완료"
                vpc_deleted=true
                break
            else
                if [[ $attempt -eq $vpc_delete_attempts ]]; then
                    log_error "VPC $vpc 삭제 최종 실패. 의존성 리소스 확인 중..."
                    
                    # 상세한 의존성 분석
                    log_info "=== VPC 의존성 분석 ==="
                    
                    # Network Interfaces 확인
                    local enis=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc" --query 'NetworkInterfaces[*].[NetworkInterfaceId,Status,Description]' --output text 2>/dev/null)
                    if [[ -n "$enis" ]]; then
                        log_warning "남은 Network Interfaces:"
                        echo "$enis" | while read eni status desc; do
                            [[ -n "$eni" ]] && log_warning "  - $eni ($status): $desc"
                        done
                    fi
                    
                    # 보안 그룹 확인
                    local remaining_sgs=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc" --query 'SecurityGroups[*].[GroupId,GroupName]' --output text 2>/dev/null)
                    if [[ -n "$remaining_sgs" ]]; then
                        log_warning "남은 보안 그룹:"
                        echo "$remaining_sgs" | while read sg_id sg_name; do
                            [[ -n "$sg_id" ]] && log_warning "  - $sg_id ($sg_name)"
                        done
                    fi
                    
                    # 라우팅 테이블 확인
                    local remaining_rts=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --query 'RouteTables[*].[RouteTableId,Associations[0].Main]' --output text 2>/dev/null)
                    if [[ -n "$remaining_rts" ]]; then
                        log_warning "남은 라우팅 테이블:"
                        echo "$remaining_rts" | while read rt_id is_main; do
                            [[ -n "$rt_id" ]] && log_warning "  - $rt_id (Main: $is_main)"
                        done
                    fi
                    
                    # VPC 엔드포인트 확인
                    local vpc_endpoints=$(aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$vpc" --query 'VpcEndpoints[*].[VpcEndpointId,State]' --output text 2>/dev/null)
                    if [[ -n "$vpc_endpoints" ]]; then
                        log_warning "남은 VPC 엔드포인트:"
                        echo "$vpc_endpoints" | while read ep_id state; do
                            [[ -n "$ep_id" ]] && log_warning "  - $ep_id ($state)"
                        done
                    fi
                    
                    log_error "💡 해결 방법: AWS 콘솔에서 VPC -> $vpc -> Actions -> Delete VPC 사용"
                else
                    log_warning "VPC 삭제 실패 (재시도 $attempt/$vpc_delete_attempts). 10초 후 재시도..."
                    sleep 10
                fi
            fi
        done
    done

    if [[ -z "$all_vpcs" ]]; then
        log_success "남아있는 VPC 네트워킹 리소스가 없습니다."
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
        
        local records_to_delete=""
        local records=$(aws route53 list-resource-record-sets --hosted-zone-id "$zone" --query "ResourceRecordSets[?Type != 'NS' && Type != 'SOA']" --output json)
        
        if [[ -n "$records" && "$records" != "[]" ]]; then
            records_to_delete=$(echo "$records" | jq '. | { "Changes": [ { "Action": "DELETE", "ResourceRecordSet": . } ] }' | jq -s '{"Changes": map(.Changes[])}')
            aws route53 change-resource-record-sets --hosted-zone-id "$zone" --change-batch "$records_to_delete" || true
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
    
    # IAM 역할 정리
    local roles=$(aws iam list-roles --query "Roles[?contains(RoleName, 'LifeBit') || contains(RoleName, 'lifebit')].RoleName" --output text)
    for role in $roles; do
        log_info "IAM 역할 정리: $role"
        
        local attached_policies=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[*].PolicyArn' --output text)
        for policy in $attached_policies; do
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" || true
        done
        
        local inline_policies=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames[*]' --output text)
        for policy in $inline_policies; do
            aws iam delete-role-policy --role-name "$role" --policy-name "$policy" || true
        done
        
        local instance_profiles=$(aws iam list-instance-profiles-for-role --role-name "$role" --query 'InstanceProfiles[*].InstanceProfileName' --output text)
        for profile in $instance_profiles; do
            aws iam remove-role-from-instance-profile --instance-profile-name "$profile" --role-name "$role" || true
            aws iam delete-instance-profile --instance-profile-name "$profile" || true
        done
        
        aws iam delete-role --role-name "$role" || true
    done
    
    # IAM 정책 삭제
    local policies=$(aws iam list-policies --scope Local --query "Policies[?contains(PolicyName, 'LifeBit') || contains(PolicyName, 'lifebit')].Arn" --output text)
    for policy in $policies; do
        log_info "IAM 정책 삭제: $policy"
        aws iam delete-policy --policy-arn "$policy" || true
    done
    
    if [[ -n "$roles" || -n "$policies" ]]; then
        log_success "IAM 리소스 정리 완료"
    else
        log_info "삭제할 IAM 리소스가 없습니다"
    fi
}

# Key Pairs 정리 (안정화 버전)
cleanup_key_pairs() {
    log_cleanup "키 페어 정리 중..."
    local keys=$(aws ec2 describe-key-pairs --query 'KeyPairs[?contains(KeyName, `lifebit`)].KeyName' --output text)
    
    if [[ -z "$keys" ]]; then
        log_info "삭제할 lifebit 관련 키 페어가 없습니다."
        return
    fi

    log_info "삭제 대상 키 페어: $keys"
    for key in $keys; do
        if [[ -n "$key" ]]; then
            log_info "키 페어 삭제 시도: $key"
            aws ec2 delete-key-pair --key-name "$key" || log_error "키 페어 '$key' 삭제 실패"
        fi
    done
    log_success "키 페어 정리 완료"
}

# 배포 관련 로컬 파일 정리
cleanup_deployment_files() {
    log_cleanup "배포 관련 로컬 파일 정리 중..."
    
    local terraform_dir="$SCRIPT_DIR/infrastructure"
    if [[ -d "$terraform_dir" ]]; then
        log_info "Terraform 상태 및 캐시 정리..."
        cd "$terraform_dir"
        rm -rf .terraform* terraform.tfstate* tfplan* 2>/dev/null || true
        cd "$SCRIPT_DIR"
    fi
    
    if [[ -d "$SCRIPT_DIR/.deploy_checkpoints" ]]; then
        log_info "배포 체크포인트 정리..."
        rm -rf "$SCRIPT_DIR/.deploy_checkpoints"
    fi
    
    if [[ -f ~/.ssh/lifebit.pem ]]; then
        log_info "SSH 키 파일 정리..."
        rm -f ~/.ssh/lifebit.pem*
    fi
    
    if [[ -d "$SCRIPT_DIR/logs" ]]; then
        log_info "로그 파일 정리..."
        rm -rf "$SCRIPT_DIR/logs"/* 2>/dev/null || true
    fi

    rm -f "$SCRIPT_DIR"/*.log "$SCRIPT_DIR"/*.tmp "$SCRIPT_DIR"/*.backup 2>/dev/null || true
    
    log_success "배포 관련 로컬 파일 정리 완료"
}

# Terraform destroy
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
    
    log_info "Terraform 인프라 삭제 시작 (terraform destroy)..."
    terraform destroy \
        -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
        -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
        -var="aws_region=$AWS_DEFAULT_REGION" \
        -auto-approve || log_warning "Terraform 인프라 삭제 중 일부 오류가 발생했습니다. 수동 정리를 계속 진행합니다."
    
    log_success "Terraform destroy 실행 완료"
    cd "$SCRIPT_DIR"
}

# 최종 검증
verify_cleanup() {
    log_info "🔍 최종 정리 상태 검증 중..."
    local issues_found=0
    
    # 1. EC2 인스턴스 (더 포괄적 검사)
    local running_instances=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=LifeBit" "Name=instance-state-name,Values=running,pending,stopping,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    local name_instances=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=*lifebit*" "Name=instance-state-name,Values=running,pending,stopping,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    local key_instances=$(aws ec2 describe-instances --filters "Name=key-name,Values=*lifebit*" "Name=instance-state-name,Values=running,pending,stopping,stopped" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    local all_remaining=$(echo "$running_instances $name_instances $key_instances" | tr ' ' '\n' | sort -u | grep -v '^$' | tr '\n' ' ')
    
    if [[ -n "$all_remaining" && "$all_remaining" != "None" ]]; then
        log_warning "남은 EC2 인스턴스: $all_remaining"
        
        # 각 인스턴스의 상태와 삭제 실패 원인 진단
        for instance_id in $all_remaining; do
            [[ -z "$instance_id" ]] && continue
            
            local instance_details=$(aws ec2 describe-instances --instance-ids "$instance_id" --query 'Reservations[0].Instances[0].[State.Name,StateTransitionReason,Tags[?Key==`Name`].Value|[0]]' --output text 2>/dev/null)
            log_warning "  - $instance_id: $instance_details"
            
            # 종료 보호 확인
            local termination_protection=$(aws ec2 describe-instance-attribute --instance-id "$instance_id" --attribute disableApiTermination --query 'DisableApiTermination.Value' --output text 2>/dev/null)
            if [[ "$termination_protection" == "true" ]]; then
                log_error "    ❌ 종료 보호가 활성화되어 있음!"
                log_info "    💡 해결 방법: aws ec2 modify-instance-attribute --instance-id $instance_id --no-disable-api-termination"
            fi
            
            # 스팟 인스턴스 확인
            local spot_request=$(aws ec2 describe-instances --instance-ids "$instance_id" --query 'Reservations[0].Instances[0].SpotInstanceRequestId' --output text 2>/dev/null)
            if [[ -n "$spot_request" && "$spot_request" != "None" ]]; then
                log_info "    ℹ️  스팟 인스턴스입니다: $spot_request"
            fi
        done
        
        ((issues_found++))
    fi
    
    # 2. VPC
    local vpcs=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=LifeBit" --query 'Vpcs[*].VpcId' --output text)
    if [[ -n "$vpcs" ]]; then
        log_warning "남은 VPC: $vpcs"
        ((issues_found++))
    fi
    
    # 3. 키 페어
    local key_pairs=$(aws ec2 describe-key-pairs --query 'KeyPairs[?contains(KeyName, `lifebit`)].KeyName' --output text)
    if [[ -n "$key_pairs" ]]; then
        log_warning "남은 키 페어: $key_pairs"
        ((issues_found++))
    fi

    # 4. S3 버킷
    local s3_buckets=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'lifebit')].Name" --output text)
    if [[ -n "$s3_buckets" ]]; then
        log_warning "남은 S3 버킷: $s3_buckets"
        ((issues_found++))
    fi

    # 5. IAM 역할
    local iam_roles=$(aws iam list-roles --query "Roles[?contains(RoleName, 'LifeBit') || contains(RoleName, 'lifebit')].RoleName" --output text)
     if [[ -n "$iam_roles" ]]; then
        log_warning "남은 IAM 역할: $iam_roles"
        ((issues_found++))
    fi
    
    # 종합 결과
    if (( issues_found > 0 )); then
        log_error "⚠️  $issues_found 종류의 리소스가 삭제되지 않았습니다. AWS 콘솔에서 수동으로 확인 및 삭제해주세요."
        exit 1
    else
        log_success "✅ 모든 주요 AWS 리소스가 깔끔하게 정리되었습니다!"
    fi
}

# 모든 인스턴스 강제 검색 및 정리
force_cleanup_all_instances() {
    log_cleanup "모든 인스턴스 강제 검색 및 정리 중..."
    
    # 1. 모든 인스턴스 나열 후 lifebit 관련 필터링
    log_info "모든 EC2 인스턴스 검색 중..."
    local all_instances=$(aws ec2 describe-instances --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    
    local lifebit_instances=""
    for instance_id in $all_instances; do
        [[ -z "$instance_id" || "$instance_id" == "None" ]] && continue
        
        # 인스턴스 세부 정보 확인
        local instance_info=$(aws ec2 describe-instances --instance-ids "$instance_id" --query 'Reservations[0].Instances[0].[Tags[?Key==`Name`].Value|[0],Tags[?Key==`Project`].Value|[0],KeyName,SecurityGroups[0].GroupName]' --output text 2>/dev/null)
        
        # lifebit 관련 인스턴스인지 확인
        if echo "$instance_info" | grep -qi "lifebit"; then
            log_info "LifeBit 관련 인스턴스 발견: $instance_id ($instance_info)"
            lifebit_instances="$lifebit_instances $instance_id"
        fi
    done
    
    if [[ -n "$lifebit_instances" ]]; then
        log_warning "강제 검색으로 발견된 LifeBit 인스턴스들: $lifebit_instances"
        for instance_id in $lifebit_instances; do
            [[ -z "$instance_id" ]] && continue
            
            # 종료 보호 해제
            local termination_protection=$(aws ec2 describe-instance-attribute --instance-id "$instance_id" --attribute disableApiTermination --query 'DisableApiTermination.Value' --output text 2>/dev/null)
            if [[ "$termination_protection" == "true" ]]; then
                log_warning "강제 종료 보호 해제: $instance_id"
                aws ec2 modify-instance-attribute --instance-id "$instance_id" --no-disable-api-termination 2>/dev/null || true
                sleep 2
            fi
            
            log_info "강제 인스턴스 종료: $instance_id"
            aws ec2 terminate-instances --instance-ids "$instance_id" 2>/dev/null || true
        done
        
        # 종료 대기
        log_info "강제 종료 인스턴스들 대기 중..."
        for instance_id in $lifebit_instances; do
            [[ -z "$instance_id" ]] && continue
            aws ec2 wait instance-terminated --instance-ids "$instance_id" 2>/dev/null || true
        done
        log_success "강제 검색 인스턴스 정리 완료"
    else
        log_info "강제 검색에서 추가 LifeBit 인스턴스를 찾지 못했습니다"
    fi
}

# 스마트 리소스 감지 및 정리
smart_cleanup_remaining() {
    log_cleanup "스마트 리소스 감지 및 정리 중..."
    
    # 1. 모든 lifebit 관련 태그를 가진 리소스 찾기
    log_info "lifebit 관련 태그를 가진 모든 리소스 검색 중..."
    
    # EC2 인스턴스 (모든 상태)
    local instances=$(aws ec2 describe-instances --filters "Name=tag:*,Values=*lifebit*" --query 'Reservations[*].Instances[*].InstanceId' --output text 2>/dev/null | tr '\n' ' ' | xargs)
    if [[ -n "$instances" && "$instances" != "None" ]]; then
        log_info "태그 기반으로 발견된 EC2 인스턴스 종료: $instances"
        aws ec2 terminate-instances --instance-ids $instances 2>/dev/null || true
        aws ec2 wait instance-terminated --instance-ids $instances 2>/dev/null || true
    fi
    
    # 2. 강제 전체 검색 실행
    force_cleanup_all_instances
    
    # 모든 Elastic IP 해제 (연결되지 않은 것들)
    local unattached_eips=$(aws ec2 describe-addresses --query 'Addresses[?InstanceId==null && NetworkInterfaceId==null].AllocationId' --output text 2>/dev/null)
    for eip in $unattached_eips; do
        [[ -z "$eip" || "$eip" == "None" ]] && continue
        log_info "연결되지 않은 Elastic IP 해제: $eip"
        aws ec2 release-address --allocation-id "$eip" 2>/dev/null || true
    done
    
    # 모든 Network Interface 정리 (available 상태)
    local available_enis=$(aws ec2 describe-network-interfaces --filters "Name=status,Values=available" --query 'NetworkInterfaces[*].NetworkInterfaceId' --output text 2>/dev/null)
    for eni in $available_enis; do
        [[ -z "$eni" || "$eni" == "None" ]] && continue
        log_info "사용 가능한 Network Interface 삭제: $eni"
        aws ec2 delete-network-interface --network-interface-id "$eni" 2>/dev/null || true
    done
}

# 강화된 VPC 정리 (마지막 수단)
force_cleanup_vpc() {
    log_cleanup "강화된 VPC 정리 중... (마지막 수단)"
    
    # 모든 VPC 찾기 (태그와 관계없이)
    local all_vpcs=$(aws ec2 describe-vpcs --query 'Vpcs[*].VpcId' --output text 2>/dev/null)
    
    for vpc in $all_vpcs; do
        [[ -z "$vpc" ]] && continue
        
        # VPC 정보 확인
        local vpc_info=$(aws ec2 describe-vpcs --vpc-ids "$vpc" --query 'Vpcs[0].[VpcId,Tags[?Key==`Project`].Value|[0],Tags[?Key==`Name`].Value|[0]]' --output text)
        local vpc_name=$(echo "$vpc_info" | cut -f3)
        
        # LifeBit 관련 VPC인지 확인
        if [[ "$vpc_name" == *"lifebit"* ]] || [[ "$vpc_name" == *"LifeBit"* ]]; then
            log_warning "강제 VPC 정리 시도: $vpc ($vpc_name)"
            
            # 모든 Network Interface 강제 삭제
            local enis=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc" --query 'NetworkInterfaces[*].NetworkInterfaceId' --output text)
            for eni in $enis; do
                log_info "Network Interface 강제 삭제: $eni"
                # 먼저 연결 해제 시도
                local attachment_id=$(aws ec2 describe-network-interfaces --network-interface-ids "$eni" --query 'NetworkInterfaces[0].Attachment.AttachmentId' --output text 2>/dev/null)
                if [[ "$attachment_id" != "None" && "$attachment_id" != "null" && -n "$attachment_id" ]]; then
                    log_info "Network Interface 연결 해제: $eni ($attachment_id)"
                    aws ec2 detach-network-interface --attachment-id "$attachment_id" --force || true
                    sleep 5
                fi
                # 삭제 시도
                aws ec2 delete-network-interface --network-interface-id "$eni" || true
            done
            
            # 모든 라우팅 테이블 연결 해제 (메인 라우팅 테이블 제외)
            local route_tables=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc" --query 'RouteTables[*].RouteTableId' --output text)
            for rt in $route_tables; do
                local associations=$(aws ec2 describe-route-tables --route-table-ids "$rt" --query 'RouteTables[0].Associations[?Main==`false`].RouteTableAssociationId' --output text)
                for assoc in $associations; do
                    log_info "라우팅 테이블 연결 강제 해제: $assoc"
                    aws ec2 disassociate-route-table --association-id "$assoc" || true
                done
            done
            
            # VPC 삭제 재시도
            log_info "VPC 강제 삭제 재시도: $vpc"
            if aws ec2 delete-vpc --vpc-id "$vpc"; then
                log_success "VPC $vpc 강제 삭제 완료"
            else
                log_error "VPC $vpc 강제 삭제도 실패. AWS 콘솔에서 수동 삭제가 필요합니다."
            fi
        fi
    done
}

# 메인 실행
main() {
    log_info "🍃 LifeBit AWS 완전 삭제 스크립트 시작 (v2.2)"
    
    load_env
    check_dependencies
    confirm_deletion
    
    # 리소스 정리 순서 (의존성 높은 순서 -> 낮은 순서)
    
    # 1. 애플리케이션 및 컴퓨팅 리소스 (VPC 내부에서 실행)
    log_info "--- 1단계: 애플리케이션 및 컴퓨팅 리소스 정리 ---"
    cleanup_autoscaling
    cleanup_ecs
    cleanup_lambda
    cleanup_api_gateway
    cleanup_load_balancers
    cleanup_rds # DB 삭제 및 대기
    
    # 2. EC2 리소스 정리 (Network Interface, EIP 포함)
    log_info "--- 2단계: EC2 리소스 정리 ---"
    cleanup_ec2 # 인스턴스 종료, Network Interface, EIP 해제
    
    # 3. Terraform으로 생성된 핵심 인프라 삭제 (VPC, Subnet, IGW, SG, KeyPair 등)
    log_info "--- 3단계: Terraform으로 인프라 삭제 ---"
    terraform_destroy
    
    # 4. 스마트 리소스 감지 및 정리
    log_info "--- 4단계: 스마트 리소스 감지 및 정리 ---"
    smart_cleanup_remaining
    
    # 5. Terraform으로 삭제되지 않았을 수 있는 리소스들 정리 (Fallback)
    log_info "--- 5단계: 남은 리소스 정리 (Fallback) ---"
    cleanup_networking    # 남은 VPC 관련 리소스 (개선된 순서)
    cleanup_key_pairs     # 남은 키 페어 (Terraform 실패 대비)
    cleanup_s3
    cleanup_ecr
    cleanup_cloudwatch
    cleanup_route53
    cleanup_iam           # 다른 리소스가 모두 삭제된 후 마지막에 정리
    
    # 6. 로컬 배포 파일 정리
    log_info "--- 6단계: 로컬 배포 파일 정리 ---"
    cleanup_deployment_files
    
    # 7. 강제 VPC 정리 (마지막 수단)
    log_info "--- 7단계: 강제 VPC 정리 (마지막 수단) ---"
    force_cleanup_vpc
    
    # 8. 최종 검증
    log_info "--- 8단계: 최종 검증 ---"
    verify_cleanup
    
    log_success "🎉 LifeBit AWS 완전 삭제 완료!"
    log_info "💡 AWS 콘솔에서 최종 확인하는 것을 권장합니다."
}

# 스크립트 실행
main "$@" 