# Terraform 및 Provider 설정
terraform {
  required_version = ">= 1.0"
  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = "~> 3.1.1"
    }
  }
}

# NCP Provider 설정
provider "ncloud" {
  access_key  = var.ncp_access_key
  secret_key  = var.ncp_secret_key
  region      = var.ncp_region
  site        = var.ncp_site
  support_vpc = true
}

# 데이터 소스 - 사용 가능한 존 조회
data "ncloud_zones" "available" {
  filter {
    name   = "zone_code"
    values = ["KR-1", "KR-2"]
  }
}

# VPC 생성
resource "ncloud_vpc" "main" {
  name            = "${var.project_name}-${var.environment}-vpc"
  ipv4_cidr_block = var.vpc_cidr
}

# 퍼블릭 서브넷 생성
resource "ncloud_subnet" "public" {
  name           = "${var.project_name}-${var.environment}-public-subnet"
  vpc_no         = ncloud_vpc.main.id
  subnet         = var.public_subnet_cidrs[0]
  zone           = data.ncloud_zones.available.zones[0].zone_code
  network_acl_no = ncloud_vpc.main.default_network_acl_no
  subnet_type    = "PUBLIC"
  usage_type     = "GEN"
}

# 인터넷 게이트웨이는 VPC 생성 시 자동으로 생성됨

# ACG (Access Control Group) - 웹 서버용
resource "ncloud_access_control_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-acg"
  description = "ACG for web servers"
  vpc_no      = ncloud_vpc.main.id
}

# ACG 규칙 - SSH
resource "ncloud_access_control_group_rule" "ssh" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "22"
    description = "SSH access"
  }
}

# ACG 규칙 - HTTP
resource "ncloud_access_control_group_rule" "http" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "HTTP access"
  }
}

# ACG 규칙 - HTTPS
resource "ncloud_access_control_group_rule" "https" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS access"
  }
}

# ACG 규칙 - Spring Boot API
resource "ncloud_access_control_group_rule" "spring_api" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8080"
    description = "Spring Boot API"
  }
}

# ACG 규칙 - FastAPI
resource "ncloud_access_control_group_rule" "fastapi" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8001"
    description = "FastAPI"
  }
}

# ACG 규칙 - Airflow
resource "ncloud_access_control_group_rule" "airflow" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8081"
    description = "Airflow"
  }
}

# 로그인 키 생성
resource "ncloud_login_key" "key" {
  key_name = "${var.project_name}-${var.environment}-key"
}

# 초기화 스크립트 생성
resource "ncloud_init_script" "web_init" {
  name    = "${var.project_name}-${var.environment}-init"
  content = base64encode(<<-EOF
    #!/bin/bash
    
    # 시스템 업데이트
    apt-get update
    
    # SSH 키 설정
    mkdir -p /root/.ssh
    chmod 700 /root/.ssh
    
    # SSH 설정 개선
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/#AuthorizedKeysFile/AuthorizedKeysFile/' /etc/ssh/sshd_config
    
    # SSH 서비스 재시작
    systemctl restart ssh
    
    # Docker 설치
    apt-get install -y docker.io docker-compose
    systemctl start docker
    systemctl enable docker
    
    # 초기화 완료 표시
    echo "Server initialization completed at $(date)" > /var/log/init-complete.log
    
    EOF
  )
}

# 네트워크 인터페이스 생성
resource "ncloud_network_interface" "web" {
  name                  = "${var.project_name}-${var.environment}-web-nic"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.web.id]
}

# 웹 서버 인스턴스 생성
resource "ncloud_server" "web" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "${var.project_name}-${var.environment}-web"
  server_image_product_code = var.server_image_product_code
  server_product_code       = var.server_instance_type
  login_key_name           = ncloud_login_key.key.key_name
  init_script_no           = ncloud_init_script.web_init.id
  
  network_interface {
    network_interface_no = ncloud_network_interface.web.id
    order               = 0
  }
}

# 퍼블릭 IP 생성
resource "ncloud_public_ip" "web" {
  server_instance_no = ncloud_server.web.id
  description        = "Public IP for ${var.project_name}-${var.environment}-web"
} 