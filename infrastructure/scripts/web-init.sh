#!/bin/bash
# LifeBit Web Server 초기화 스크립트
# Environment: ${environment}
# Project: ${project_name}

set -e

# 로그 설정
LOG_FILE="/var/log/lifebit-init.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "======================================"
echo "LifeBit Web Server 초기화 시작"
echo "Environment: ${environment}"
echo "Project: ${project_name}"
echo "시작 시간: $(date)"
echo "======================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# 시스템 업데이트
log_info "시스템 패키지 업데이트 중..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 필수 패키지 설치
log_info "필수 패키지 설치 중..."
apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    unzip \
    zip \
    jq \
    tree \
    net-tools \
    ufw \
    fail2ban \
    logrotate \
    cron \
    python3 \
    python3-pip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Docker 설치
log_info "Docker 설치 중..."
# Docker GPG 키 추가
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker 저장소 추가
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker 서비스 시작 및 활성화
systemctl start docker
systemctl enable docker

# Docker Compose 설치
log_info "Docker Compose 설치 중..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Docker 사용자 설정
usermod -aG docker root
usermod -aG docker ubuntu || true

# SSH 보안 설정
log_info "SSH 보안 설정 중..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH 설정 개선
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#AuthorizedKeysFile/AuthorizedKeysFile/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config

# SSH 서비스 재시작
systemctl restart ssh

# 방화벽 설정 (UFW)
log_info "방화벽 설정 중..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# 허용할 포트 설정
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

%{ if environment != "prod" }
# 개발/스테이징 환경에서만 백엔드 포트 허용
ufw allow 8000:8999/tcp
%{ endif }

# UFW 활성화
ufw --force enable

# Fail2Ban 설정
log_info "Fail2Ban 설정 중..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

systemctl enable fail2ban
systemctl start fail2ban

# 시스템 모니터링 설정
log_info "시스템 모니터링 도구 설치 중..."
apt-get install -y \
    sysstat \
    iotop \
    nethogs \
    nmon \
    glances

# Node Exporter 설치 (Prometheus 모니터링용)
log_info "Node Exporter 설치 중..."
NODE_EXPORTER_VERSION="1.7.0"
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v$NODE_EXPORTER_VERSION/node_exporter-$NODE_EXPORTER_VERSION.linux-amd64.tar.gz
tar xzf node_exporter-$NODE_EXPORTER_VERSION.linux-amd64.tar.gz
cp node_exporter-$NODE_EXPORTER_VERSION.linux-amd64/node_exporter /usr/local/bin/
rm -rf node_exporter-$NODE_EXPORTER_VERSION.linux-amd64*

# Node Exporter 서비스 생성
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=nobody
Group=nogroup
Type=simple
ExecStart=/usr/local/bin/node_exporter --web.listen-address=:9100
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter

# 로그 로테이션 설정
log_info "로그 로테이션 설정 중..."
cat > /etc/logrotate.d/lifebit << 'EOF'
/var/log/lifebit-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        systemctl reload docker || true
    endscript
}
EOF

# 환경별 설정
%{ if environment == "prod" }
log_info "프로덕션 환경 설정 적용 중..."
# 프로덕션 환경 전용 설정
echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65535" >> /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf
echo "net.ipv4.tcp_fin_timeout = 30" >> /etc/sysctl.conf
echo "net.ipv4.tcp_keepalive_time = 1800" >> /etc/sysctl.conf
sysctl -p
%{ endif }

# 프로젝트 디렉토리 생성
log_info "프로젝트 디렉토리 생성 중..."
mkdir -p /opt/${project_name}
mkdir -p /opt/${project_name}/logs
mkdir -p /opt/${project_name}/backups
mkdir -p /opt/${project_name}/scripts
mkdir -p /opt/${project_name}/ssl

# 디렉토리 권한 설정
chown -R root:root /opt/${project_name}
chmod -R 755 /opt/${project_name}

# 헬스 체크 스크립트 생성
log_info "헬스 체크 스크립트 생성 중..."
cat > /opt/${project_name}/scripts/health-check.sh << 'EOF'
#!/bin/bash
# LifeBit 헬스 체크 스크립트

# 서비스 상태 확인
SERVICES=("docker" "nginx" "fail2ban" "node_exporter")
FAILED_SERVICES=()

for service in "$${SERVICES[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        FAILED_SERVICES+=("$service")
    fi
done

# Docker 컨테이너 상태 확인
CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v NAMES)
if [ -z "$CONTAINERS" ]; then
    echo "WARNING: No running containers found"
fi

# 디스크 사용량 확인
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "WARNING: Disk usage is $DISK_USAGE%"
fi

# 메모리 사용량 확인
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "WARNING: Memory usage is $MEMORY_USAGE%"
fi

if [ $${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo "OK: All services are running"
    exit 0
else
    echo "CRITICAL: Failed services: $${FAILED_SERVICES[*]}"
    exit 2
fi
EOF

chmod +x /opt/${project_name}/scripts/health-check.sh

# 자동 업데이트 스크립트 생성
log_info "자동 업데이트 스크립트 생성 중..."
cat > /opt/${project_name}/scripts/auto-update.sh << 'EOF'
#!/bin/bash
# LifeBit 자동 업데이트 스크립트

LOG_FILE="/var/log/lifebit-update.log"
echo "$(date): Starting auto-update process" >> "$LOG_FILE"

# Docker 이미지 업데이트
cd /opt/${project_name}
docker-compose pull >> "$LOG_FILE" 2>&1

# 컨테이너 재시작 (무중단 배포)
docker-compose up -d --no-deps --build >> "$LOG_FILE" 2>&1

# 사용하지 않는 이미지 정리
docker image prune -f >> "$LOG_FILE" 2>&1

echo "$(date): Auto-update process completed" >> "$LOG_FILE"
EOF

chmod +x /opt/${project_name}/scripts/auto-update.sh

# Cron 작업 설정
log_info "Cron 작업 설정 중..."
cat > /tmp/crontab_lifebit << 'EOF'
# LifeBit 자동화 작업

# 헬스 체크 (5분마다)
*/5 * * * * /opt/${project_name}/scripts/health-check.sh > /dev/null 2>&1

# 시스템 리소스 로깅 (30분마다)
*/30 * * * * echo "$(date): $(free -m | grep Mem | awk '{print "Memory: " $3"/"$2" MB"}') $(df -h / | awk 'NR==2 {print "Disk: " $5}')" >> /var/log/lifebit-resources.log

# 로그 정리 (매일 자정)
0 0 * * * find /opt/${project_name}/logs -name "*.log" -mtime +7 -delete

# Docker 정리 (매주 일요일 2시)
0 2 * * 0 docker system prune -f > /dev/null 2>&1
EOF

crontab -u root /tmp/crontab_lifebit
rm /tmp/crontab_lifebit

# 시스템 정보 수집
log_info "시스템 정보 수집 중..."
cat > /opt/${project_name}/system-info.txt << EOF
=== LifeBit 서버 정보 ===
초기화 완료 시간: $(date)
환경: ${environment}
프로젝트: ${project_name}

=== 시스템 정보 ===
OS: $(lsb_release -d | cut -f2)
Kernel: $(uname -r)
CPU: $(nproc) cores
Memory: $(free -h | grep Mem | awk '{print $2}')
Disk: $(df -h / | awk 'NR==2 {print $2}')

=== 설치된 소프트웨어 ===
Docker: $(docker --version)
Docker Compose: $(docker-compose --version)
Python: $(python3 --version)
Git: $(git --version)

=== 네트워크 정보 ===
Public IP: $(curl -s ipinfo.io/ip)
Private IP: $(hostname -I | awk '{print $1}')

=== 서비스 상태 ===
$(systemctl status docker --no-pager -l)
EOF

# 초기화 완료 표시
log_success "서버 초기화가 완료되었습니다!"
log_info "시스템 정보: /opt/${project_name}/system-info.txt"
log_info "로그 파일: $LOG_FILE"
log_info "헬스 체크: /opt/${project_name}/scripts/health-check.sh"

# 재부팅 알림
echo "======================================"
echo "초기화 완료!"
echo "서버를 재부팅하여 모든 설정을 적용하세요."
echo "======================================"

# 초기화 완료 플래그 생성
touch /var/log/lifebit-init-complete
echo "$(date): Server initialization completed successfully" > /var/log/lifebit-init-complete 