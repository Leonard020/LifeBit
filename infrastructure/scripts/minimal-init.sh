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

# SSH 키 직접 설정 (NCP 자동 배치 실패 대비)
log_info "SSH 키 설정 중..."
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# SSH 공개키 추가
echo "${ssh_public_key}" > /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# SSH 설정 강화
log_info "SSH 보안 설정 중..."
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# cloud-init SSH 설정도 수정 (Ubuntu 24.04 대응)
if [ -f /etc/ssh/sshd_config.d/50-cloud-init.conf ]; then
    log_info "cloud-init SSH 설정 수정 중..."
    echo "PubkeyAuthentication yes" >> /etc/ssh/sshd_config.d/50-cloud-init.conf
    echo "PasswordAuthentication no" >> /etc/ssh/sshd_config.d/50-cloud-init.conf
fi

# SSH 서비스 재시작
log_info "SSH 서비스 재시작 중..."
systemctl restart ssh || systemctl restart sshd

# 초기화 완료 표시
log_success "최소 초기화 완료!"
echo "$(date): Minimal initialization completed" > /var/log/minimal-init-complete

log_info "Ansible이 나머지 설정을 담당합니다..." 