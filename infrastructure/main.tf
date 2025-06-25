# ================================================
# LifeBit AWS 단일 서버 Terraform 구성
# ================================================
# 모든 서비스를 하나의 EC2에서 Docker Compose로 실행

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  access_key = var.aws_access_key_id
  secret_key = var.aws_secret_access_key
}

# SSH 키 페어 생성 (랜덤 이름)
resource "tls_private_key" "lifebit" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "lifebit" {
  key_name   = "lifebit-${substr(uuid(),0,8)}"
  public_key = tls_private_key.lifebit.public_key_openssh
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Project     = var.project_name
    Environment = var.environment
  }
}

# 퍼블릭 서브넷
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[0]
  map_public_ip_on_launch = true
  availability_zone       = var.aws_az
  tags = {
    Name        = "${var.project_name}-${var.environment}-public-subnet"
    Project     = var.project_name
    Environment = var.environment
  }
}

# 인터넷 게이트웨이
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Project     = var.project_name
    Environment = var.environment
  }
}

# 라우트 테이블
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# 보안 그룹 (모든 포트 오픈, 데모용)
resource "aws_security_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-sg"
  description = "Allow all for LifeBit demo"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All TCP"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All"
  }
  tags = {
    Name        = "${var.project_name}-${var.environment}-web-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

# EC2 인스턴스 (t3.small, Ubuntu 22.04)
resource "aws_instance" "web" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.lifebit.key_name
  associate_public_ip_address = true
  
  # EBS 루트 볼륨 크기 증가 (8GB -> 20GB)
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    tags = {
      Name        = "${var.project_name}-${var.environment}-root-volume"
      Project     = var.project_name
      Environment = var.environment
    }
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-web-server"
    Project     = var.project_name
    Environment = var.environment
  }
  user_data = <<-EOF
#!/bin/bash
# 로그 파일 설정
exec > >(tee /var/log/user-data.log) 2>&1
echo "User Data 스크립트 시작: $(date)"

# 시스템 업데이트
apt-get update -y

# SSH 키 디렉토리 생성 및 권한 설정
mkdir -p /home/ubuntu/.ssh
chown ubuntu:ubuntu /home/ubuntu/.ssh
chmod 700 /home/ubuntu/.ssh

# SSH 공개키 추가 (기존 키 덮어쓰기 방지)
echo "${tls_private_key.lifebit.public_key_openssh}" > /home/ubuntu/.ssh/authorized_keys
chown ubuntu:ubuntu /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys

# SSH 서비스 재시작
systemctl restart ssh

# 완료 로그
echo "SSH 키 설정 완료: $(date)" >> /var/log/ssh-key-setup.log
echo "User Data 스크립트 완료: $(date)"
EOF
}

# EIP 할당
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  tags = {
    Name        = "${var.project_name}-${var.environment}-eip"
    Project     = var.project_name
    Environment = var.environment
  }
}

 