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

# 인터넷 게이트웨이 생성
resource "ncloud_internet_gateway" "main" {
  vpc_no = ncloud_vpc.main.id
  name   = "${var.project_name}-${var.environment}-igw"
}

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
    protocol    = "tcp"
    ip_block    = "0.0.0.0/0"
    port_range  = "22"
    description = "SSH access"
  }
}

# ACG 규칙 - HTTP
resource "ncloud_access_control_group_rule" "http" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "tcp"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "HTTP access"
  }
}

# ACG 규칙 - HTTPS
resource "ncloud_access_control_group_rule" "https" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "tcp"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS access"
  }
}

# 로그인 키 생성
resource "ncloud_login_key" "key" {
  key_name = "${var.project_name}-${var.environment}-key"
}

# 웹 서버 인스턴스 생성
resource "ncloud_server" "web" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "${var.project_name}-${var.environment}-web"
  server_image_product_code = var.server_image_product_code
  server_product_code       = var.server_instance_type
  login_key_name           = ncloud_login_key.key.key_name
  
  access_control_group_configuration_no_list = [
    ncloud_access_control_group.web.id
  ]
}

# 퍼블릭 IP 생성
resource "ncloud_public_ip" "web" {
  server_instance_no = ncloud_server.web.id
  description        = "Public IP for ${var.project_name}-${var.environment}-web"
} 