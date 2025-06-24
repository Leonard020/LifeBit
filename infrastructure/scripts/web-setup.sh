#!/bin/bash

# 로그 설정
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "========== 서버 초기 설정 시작 =========="
date

# 시스템 업데이트
echo "========== 시스템 업데이트 =========="
apt-get update -y
apt-get upgrade -y

# 필수 패키지 설치
echo "========== 필수 패키지 설치 =========="
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Docker 설치
echo "========== Docker 설치 =========="
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker 서비스 시작 및 자동 시작 설정
systemctl start docker
systemctl enable docker

# Docker Compose 설치
echo "========== Docker Compose 설치 =========="
DOCKER_COMPOSE_VERSION="2.21.0"
curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Docker 명령어를 sudo 없이 사용할 수 있도록 설정
usermod -aG docker ubuntu

# Node.js 설치 (필요시)
echo "========== Node.js 설치 =========="
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Python3 pip 설치
echo "========== Python 개발 도구 설치 =========="
apt-get install -y python3-pip python3-dev python3-venv

# Java 설치 (Spring Boot를 위해)
echo "========== Java 설치 =========="
apt-get install -y openjdk-21-jdk

# 방화벽 설정 (UFW)
echo "========== 방화벽 설정 =========="
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8001/tcp  # FastAPI
ufw allow 8080/tcp  # Spring Boot
ufw allow 8081/tcp  # Airflow
ufw allow 3000/tcp  # Frontend (개발용)

# 스왑 파일 생성 (메모리 부족 방지)
echo "========== 스왑 파일 생성 =========="
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 프로젝트 디렉토리 생성
echo "========== 프로젝트 디렉토리 설정 =========="
mkdir -p /opt/lifebit
chown -R ubuntu:ubuntu /opt/lifebit

# Git 설정 (전역)
echo "========== Git 설정 =========="
git config --global init.defaultBranch main

# Docker 로그 로테이션 설정
echo "========== Docker 로그 설정 =========="
cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

# Docker 서비스 재시작
systemctl restart docker

# 시스템 최적화
echo "========== 시스템 최적화 =========="
# 파일 디스크립터 제한 증가
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 네트워크 최적화
cat >> /etc/sysctl.conf << EOF
# 네트워크 최적화
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 65536 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.core.netdev_max_backlog = 5000
EOF

sysctl -p

# 자동 재시작 시 Docker 컨테이너 실행을 위한 스크립트 생성
cat > /opt/lifebit/start-services.sh << 'EOF'
#!/bin/bash
cd /opt/lifebit
if [ -f docker-compose.yml ]; then
    echo "Docker Compose 파일을 찾았습니다. 서비스를 시작합니다..."
    docker-compose up -d
else
    echo "Docker Compose 파일을 찾을 수 없습니다."
fi
EOF

chmod +x /opt/lifebit/start-services.sh

# Systemd 서비스 파일 생성 (부팅 시 자동 시작)
cat > /etc/systemd/system/lifebit.service << 'EOF'
[Unit]
Description=LifeBit Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=true
ExecStart=/opt/lifebit/start-services.sh
WorkingDirectory=/opt/lifebit
User=ubuntu
Group=ubuntu

[Install]
WantedBy=multi-user.target
EOF

systemctl enable lifebit.service

# 상태 확인
echo "========== 설치 상태 확인 =========="
echo "Docker 버전:"
docker --version

echo "Docker Compose 버전:"
docker-compose --version

echo "Node.js 버전:"
node --version

echo "Python 버전:"
python3 --version

echo "Java 버전:"
java --version

# 완료 메시지
echo "========== 서버 초기 설정 완료 =========="
echo "서버 설정이 완료되었습니다."
echo "재부팅 후 프로젝트 배포를 진행하세요."
date

# 재부팅 (선택사항)
# reboot 