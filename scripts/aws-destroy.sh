#!/bin/bash

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

# 배너 출력
echo -e "${RED}"
cat << "EOF"
 _      _  __      ____  _ _   
| |    (_)/ _|    |  _ \(_) |  
| |     _| |_ ___ | |_) |_| |_ 
| |    | |  _/ _ \|  _ <| | __|
| |____| | ||  __/| |_) | | |_ 
|______|_|_| \___||____/|_|\__|
                               
AWS 리소스 정리 시작...
EOF
echo -e "${NC}"

# 배포 정보 확인
if [ -f .deployment_info ]; then
    log_info "기존 배포 정보를 발견했습니다."
    source .deployment_info
    log_info "배포 일시: $DEPLOYMENT_DATE"
    log_info "EC2 인스턴스: $EC2_PUBLIC_IP ($INSTANCE_ID)"
    log_info "AWS 리전: $AWS_REGION"
else
    log_warning "배포 정보 파일(.deployment_info)을 찾을 수 없습니다."
    log_warning "수동으로 AWS 콘솔에서 리소스를 확인해주세요."
fi

# Terraform 상태 확인
if [ ! -d "infrastructure/terraform" ]; then
    log_error "Terraform 디렉토리를 찾을 수 없습니다."
    exit 1
fi

cd infrastructure/terraform

if [ ! -f "terraform.tfstate" ]; then
    log_warning "Terraform 상태 파일을 찾을 수 없습니다."
    log_warning "리소스가 이미 삭제되었거나 수동으로 정리해야 할 수 있습니다."
else
    log_info "Terraform 상태 파일을 발견했습니다."
fi

# 현재 리소스 상태 확인
log_info "현재 AWS 리소스 상태 확인 중..."
if terraform show >/dev/null 2>&1; then
    echo ""
    log_info "=== 삭제될 리소스 목록 ==="
    terraform show | grep -E "(resource|id)" | head -20
    echo ""
else
    log_warning "Terraform 상태를 읽을 수 없습니다."
fi

# 사용자 확인
echo -e "${RED}⚠️  경고: 이 작업은 다음 리소스들을 완전히 삭제합니다:${NC}"
echo -e "${RED}  - EC2 인스턴스 및 모든 데이터${NC}"
echo -e "${RED}  - Elastic IP${NC}"
echo -e "${RED}  - VPC 및 관련 네트워킹 리소스${NC}"
echo -e "${RED}  - 보안 그룹${NC}"
echo -e "${RED}  - 키 페어${NC}"
echo -e "${RED}  - 모든 애플리케이션 데이터${NC}"
echo ""
echo -e "${YELLOW}이 작업은 되돌릴 수 없습니다!${NC}"
echo ""

read -p "정말로 모든 AWS 리소스를 삭제하시겠습니까? (DELETE를 입력하세요): " -r
if [[ $REPLY != "DELETE" ]]; then
    log_info "리소스 정리가 취소되었습니다."
    exit 0
fi

# 추가 확인
read -p "마지막 확인: 정말로 삭제하시겠습니까? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log_info "리소스 정리가 취소되었습니다."
    exit 0
fi

# Terraform으로 인프라 삭제
log_info "Terraform으로 AWS 리소스 삭제 중... (약 2-3분 소요)"

# 삭제 계획 확인
log_info "삭제 계획 확인 중..."
terraform plan -destroy

# 리소스 삭제 실행
terraform destroy -auto-approve

log_success "AWS 인프라가 성공적으로 삭제되었습니다!"

# 프로젝트 루트로 돌아가기
cd ../..

# 로컬 파일 정리
log_info "로컬 설정 파일 정리 중..."

# Ansible 인벤토리 파일 삭제
if [ -f "infrastructure/ansible/inventory" ]; then
    rm -f infrastructure/ansible/inventory
    log_info "Ansible 인벤토리 파일이 삭제되었습니다."
fi

# Terraform 상태 파일 정리 (백업 보관)
if [ -f "infrastructure/terraform/terraform.tfstate" ]; then
    mv infrastructure/terraform/terraform.tfstate infrastructure/terraform/terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)
    log_info "Terraform 상태 파일이 백업되었습니다."
fi

if [ -f "infrastructure/terraform/terraform.tfstate.backup" ]; then
    mv infrastructure/terraform/terraform.tfstate.backup infrastructure/terraform/terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)
fi

# .terraform 디렉토리 정리
if [ -d "infrastructure/terraform/.terraform" ]; then
    rm -rf infrastructure/terraform/.terraform
    log_info "Terraform 캐시가 정리되었습니다."
fi

# 배포 정보 파일 백업 후 삭제
if [ -f ".deployment_info" ]; then
    mv .deployment_info .deployment_info.backup.$(date +%Y%m%d_%H%M%S)
    log_info "배포 정보 파일이 백업되었습니다."
fi

# SSH 키 삭제 여부 확인
SSH_KEY_PATH="$HOME/.ssh/lifebit_key"
if [ -f "$SSH_KEY_PATH" ]; then
    echo ""
    read -p "SSH 키도 삭제하시겠습니까? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$SSH_KEY_PATH"
        rm -f "${SSH_KEY_PATH}.pub"
        log_success "SSH 키가 삭제되었습니다."
    else
        log_info "SSH 키는 보존됩니다: $SSH_KEY_PATH"
    fi
fi

# AWS 리소스 정리 확인
log_info "AWS 리소스 정리 확인 중..."
if command -v aws >/dev/null 2>&1; then
    # EC2 인스턴스 확인
    if [ ! -z "${INSTANCE_ID:-}" ]; then
        INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "not-found")
        if [ "$INSTANCE_STATE" == "not-found" ] || [ "$INSTANCE_STATE" == "terminated" ]; then
            log_success "EC2 인스턴스가 성공적으로 종료되었습니다."
        else
            log_warning "EC2 인스턴스 상태: $INSTANCE_STATE"
        fi
    fi
    
    # 남은 리소스 확인
    log_info "프로젝트 관련 남은 리소스 확인 중..."
    REMAINING_INSTANCES=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=lifebit" "Name=instance-state-name,Values=running,pending,stopping,stopped" --query 'Reservations[].Instances[].InstanceId' --output text 2>/dev/null || echo "")
    
    if [ ! -z "$REMAINING_INSTANCES" ]; then
        log_warning "다음 인스턴스들이 아직 남아있습니다: $REMAINING_INSTANCES"
        log_warning "AWS 콘솔에서 수동으로 확인해주세요."
    else
        log_success "모든 EC2 인스턴스가 정리되었습니다."
    fi
fi

# 완료 메시지
echo ""
log_success "🎉 AWS 리소스 정리가 완료되었습니다!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}         정리 완료 정보${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${BLUE}✅ 삭제된 리소스:${NC}"
echo -e "   - EC2 인스턴스"
echo -e "   - Elastic IP"
echo -e "   - VPC 및 네트워킹 리소스"
echo -e "   - 보안 그룹"
echo -e "   - 키 페어"
echo ""
echo -e "${BLUE}📁 정리된 로컬 파일:${NC}"
echo -e "   - Ansible 인벤토리"
echo -e "   - Terraform 상태 (백업됨)"
echo -e "   - 배포 정보 (백업됨)"
echo ""
echo -e "${BLUE}💰 비용 절약:${NC}"
echo -e "   - 모든 과금 리소스가 삭제되었습니다."
echo -e "   - 더 이상 AWS 요금이 발생하지 않습니다."
echo ""
echo -e "${YELLOW}📝 참고사항:${NC}"
echo -e "   - 백업 파일들은 수동으로 삭제할 수 있습니다."
echo -e "   - 재배포시 './scripts/aws-deploy.sh'를 실행하세요."
echo -e "   - AWS 콘솔에서 리소스 정리를 확인해주세요."
echo -e "${GREEN}═══════════════════════════════════════${NC}"

log_success "리소스 정리 스크립트 실행이 완료되었습니다!" 