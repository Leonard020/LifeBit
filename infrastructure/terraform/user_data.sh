#!/bin/bash

# 로그 설정
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting user-data script execution at $(date)"

# 에러 발생시 스크립트 중단
set -e

# unattended-upgrades 즉시 중지 및 비활성화 (무한 대기 방지)
echo "Disabling unattended-upgrades to prevent hanging..."
systemctl stop unattended-upgrades.service || true
systemctl disable unattended-upgrades.service || true
pkill -f unattended-upgrade || true

# APT 설정 최적화
echo "Configuring APT for non-interactive mode..."
export DEBIAN_FRONTEND=noninteractive
export APT_LISTCHANGES_FRONTEND=none

# APT 설정 파일 생성
cat > /etc/apt/apt.conf.d/99-disable-auto-updates << EOF
APT::Periodic::Update-Package-Lists "0";
APT::Periodic::Download-Upgradeable-Packages "0";
APT::Periodic::AutocleanInterval "0";
APT::Periodic::Unattended-Upgrade "0";
EOF

# apt lock 대기 함수 (타임아웃 포함)
wait_for_apt() {
    echo "Waiting for apt locks to be released..."
    
    local timeout=300  # 5분 타임아웃
    local elapsed=0
    
    while [ $elapsed -lt $timeout ]; do
        # 모든 lock 파일 확인
        if ! fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 && \
           ! fuser /var/lib/apt/lists/lock >/dev/null 2>&1 && \
           ! fuser /var/cache/apt/archives/lock >/dev/null 2>&1; then
            echo "APT locks are available"
            return 0
        fi
        
        echo "Waiting for apt locks to be released... ($elapsed/$timeout seconds)"
        sleep 5
        elapsed=$((elapsed + 5))
    done
    
    # 타임아웃 시 강제로 lock 제거
    echo "Timeout reached, forcefully removing locks..."
    rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock /var/cache/apt/archives/lock || true
    return 0
}

# 재시도 가능한 apt 명령 실행 함수
run_apt_command() {
    local max_retries=3
    local retry_count=0
    local command="$1"
    
    while [ $retry_count -lt $max_retries ]; do
        echo "Executing: $command (attempt $((retry_count + 1))/$max_retries)"
        
        if wait_for_apt && eval "DEBIAN_FRONTEND=noninteractive $command"; then
            echo "Command succeeded: $command"
            return 0
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                echo "Command failed, retrying in 15 seconds..."
                sleep 15
            else
                echo "Command failed after $max_retries attempts: $command"
                return 1
            fi
        fi
    done
}

# 시스템 업데이트
echo "Starting system update..."
run_apt_command "apt-get update -y"
run_apt_command "apt-get upgrade -y -o Dpkg::Options::=\"--force-confdef\" -o Dpkg::Options::=\"--force-confold\""

# 필수 패키지 설치
echo "Installing essential packages..."
run_apt_command "apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    unzip \
    wget \
    git \
    htop \
    vim \
    tree \
    jq \
    rsync"

# Docker 설치
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

run_apt_command "apt-get update -y"
run_apt_command "apt-get install -y docker-ce docker-ce-cli containerd.io"

# Docker 서비스 시작 및 활성화
echo "Starting Docker service..."
systemctl start docker
systemctl enable docker

# ubuntu 사용자를 docker 그룹에 추가
usermod -aG docker ubuntu

# Docker Compose 설치
echo "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.21.0"
curl -L "https://github.com/docker/compose/releases/download/v$${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 심볼릭 링크 생성
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Node.js 설치 (프론트엔드 빌드용)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
run_apt_command "apt-get install -y nodejs"

# Python 및 pip 설치
echo "Installing Python..."
run_apt_command "apt-get install -y python3 python3-pip python3-venv"

# Java 설치 (Spring Boot용)
echo "Installing Java..."
run_apt_command "apt-get install -y openjdk-17-jdk"

# 필요한 디렉토리 생성
echo "Creating directories..."
mkdir -p /home/ubuntu/lifebit
mkdir -p /home/ubuntu/lifebit/logs
mkdir -p /home/ubuntu/lifebit/data
mkdir -p /home/ubuntu/lifebit/uploads

# 디렉토리 권한 설정
chown -R ubuntu:ubuntu /home/ubuntu/lifebit
chmod -R 755 /home/ubuntu/lifebit

# 방화벽 설정 (ufw)
echo "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 8080/tcp
ufw allow 8001/tcp

# 시스템 최적화
echo "Applying system optimizations..."
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf
sysctl -p

# 로그 로테이션 설정
echo "Setting up log rotation..."
cat > /etc/logrotate.d/lifebit << EOF
/home/ubuntu/lifebit/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF

# Docker 데몬 최적화 설정
echo "Configuring Docker daemon..."
cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2"
}
EOF

# Docker 서비스 재시작
systemctl restart docker

# unattended-upgrades 완전 제거 (향후 문제 방지)
echo "Removing unattended-upgrades completely..."
run_apt_command "apt-get remove -y unattended-upgrades" || true
run_apt_command "apt-get autoremove -y" || true

# 시스템 서비스 상태 확인
echo "Verifying installations..."
systemctl status docker --no-pager
docker --version
docker-compose --version
node --version
npm --version
python3 --version
java -version

# 설치 완료 마커 파일 생성
touch /home/ubuntu/.user-data-completed
chown ubuntu:ubuntu /home/ubuntu/.user-data-completed

echo "User-data script completed successfully at $(date)" 