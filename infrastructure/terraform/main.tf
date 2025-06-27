# ------------------------------------------------------------------------------
# Terraform 및 AWS Provider 설정
# ------------------------------------------------------------------------------
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "3.4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# 현재 사용자의 IP 주소 가져오기 (SSH 접속 허용을 위함)
# ------------------------------------------------------------------------------
data "http" "myip" {
  url = "http://ipv4.icanhazip.com"
}

locals {
  my_ip = chomp(data.http.myip.response_body)
}

# ------------------------------------------------------------------------------
# 네트워크 리소스 (VPC, Subnet, IGW, Route Table)
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "lifebit-vpc"
  }
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone = "ap-northeast-2a"

  tags = {
    Name = "lifebit-subnet"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "lifebit-igw"
  }
}

resource "aws_route_table" "main" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "lifebit-route-table"
  }
}

resource "aws_route_table_association" "main" {
  subnet_id      = aws_subnet.main.id
  route_table_id = aws_route_table.main.id
}

# ------------------------------------------------------------------------------
# 보안 그룹 (방화벽)
# ------------------------------------------------------------------------------
resource "aws_security_group" "main" {
  name        = "lifebit-sg"
  description = "Allow HTTP, HTTPS, SSH traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${local.my_ip}/32"]
  }

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "lifebit-sg"
  }
}

# ------------------------------------------------------------------------------
# EC2 인스턴스
# ------------------------------------------------------------------------------
resource "aws_instance" "main" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = aws_subnet.main.id
  vpc_security_group_ids = [aws_security_group.main.id]
  associate_public_ip_address = true

  tags = {
    Name = "lifebit-server"
  }
}

# ------------------------------------------------------------------------------
# Elastic IP (고정 IP)
# ------------------------------------------------------------------------------
resource "aws_eip" "main" {
  instance = aws_instance.main.id
  domain   = "vpc"

  tags = {
    Name = "lifebit-eip"
  }
} 