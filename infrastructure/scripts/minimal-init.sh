#!/bin/bash
# LifeBit 최소 초기화 스크립트 (Terraform용)
# 목적: SSH 키 충돌 방지를 위한 최소한의 설정만

set -e

# 로그 설정
LOG_FILE="/var/log/minimal-init.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "======================================"
echo "LifeBit 최소 초기화 시작"
echo "Environment: ${environment}"
echo "시작 시간: $(date)"
echo "======================================"

log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo "[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 시스템 업데이트
log_info "시스템 패키지 업데이트 중..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

# 필수 패키지만 설치 (SSH 설정은 건드리지 않음)
log_info "필수 패키지 설치 중..."
apt-get install -y \
    curl \
    wget \
    python3 \
    python3-pip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Python3를 python으로 링크
log_info "Python 설정 중..."
if [ ! -f /usr/bin/python ]; then
    ln -s /usr/bin/python3 /usr/bin/python
fi

# 기본 디렉토리 생성
log_info "프로젝트 디렉토리 생성 중..."
mkdir -p /opt/${project_name}
mkdir -p /opt/${project_name}/logs
chmod 755 /opt/${project_name}

# 초기화 완료 표시
log_success "최소 초기화 완료!"
echo "$(date): Minimal initialization completed" > /var/log/minimal-init-complete

log_info "Ansible이 나머지 설정을 담당합니다..." 