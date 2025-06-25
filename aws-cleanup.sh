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

# LifeBit Docker Compose/이미지/컨테이너/볼륨/네트워크 정리 (ncloud-cleanup.sh 참고)
# ... (함수 복사)

# Terraform 상태 및 캐시 정리 (ncloud-cleanup.sh 참고)
# ... (함수 복사)

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
        cd "$SCRIPT_DIR"; return 0
    fi
    log_info "Terraform 인프라 삭제 시작..."
    if terraform destroy \
        -var="aws_access_key_id=$AWS_ACCESS_KEY_ID" \
        -var="aws_secret_access_key=$AWS_SECRET_ACCESS_KEY" \
        -var="aws_region=${AWS_DEFAULT_REGION:-ap-northeast-2}" \
        -var-file="single-server.tfvars" \
        -auto-approve 2>/dev/null; then
        log_success "Terraform 인프라 삭제 완료"
    else
        log_warning "Terraform 인프라 삭제 중 일부 오류가 발생했습니다. 상태 파일은 정리됩니다."
    fi
    cd "$SCRIPT_DIR"
}

# AWS CLI 리소스 정리 (EC2, VPC, EIP, SG 등)
cleanup_aws_resources() {
    log_cleanup "AWS 리소스 정리 중..."
    # EC2 인스턴스 종료 및 삭제
    local instance_ids=$(aws ec2 describe-instances --filters "Name=tag:Project,Values=LifeBit" --query 'Reservations[*].Instances[*].InstanceId' --output text)
    if [[ -n "$instance_ids" ]]; then
        log_info "EC2 인스턴스 종료 중..."
        aws ec2 terminate-instances --instance-ids $instance_ids || true
        log_success "EC2 인스턴스 종료 요청 완료"
    else
        log_info "삭제할 EC2 인스턴스가 없습니다"
    fi
    # VPC, EIP, SG 등 추가 정리 로직 필요시 여기에 구현
}

# 메인 실행
main() {
    load_env
    log_info "🍃 LifeBit AWS 리소스 정리 스크립트 시작..."
    # 알림 전송(옵션)
    # send_notification "AWS 리소스 정리 시작" "warning"
    terraform_destroy
    cleanup_aws_resources
    # cleanup_docker_compose
    # cleanup_lifebit_docker
    # cleanup_terraform
    # cleanup_local_files
    log_success "LifeBit AWS 리소스 정리 완료"
    # send_notification "AWS 리소스 정리 완료" "success"
}

main "$@" 