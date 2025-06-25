# ================================================
# LifeBit 학원용 단일 서버 Terraform 구성
# ================================================
# 모든 서비스를 하나의 VM에서 Docker Compose로 실행

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

# 현재 리전 정보 조회 (ncloud_user 대신 사용)
data "ncloud_regions" "available" {}

# 데이터 소스 - 사용 가능한 존 조회
data "ncloud_zones" "available" {
  filter {
    name   = "zone_code"
    values = ["KR-1", "KR-2"]
  }
}

# VPC 생성
resource "ncloud_vpc" "main" {
  name            = "${var.project_name}-${var.environment}-vpc-v2"
  ipv4_cidr_block = var.vpc_cidr
  
  # NCP VPC는 tags를 지원하지 않음
}

# 퍼블릭 서브넷 생성 (단일 서브넷)
resource "ncloud_subnet" "public" {
  name           = "${var.project_name}-${var.environment}-public-subnet"
  vpc_no         = ncloud_vpc.main.id
  subnet         = var.public_subnet_cidrs[0]
  zone           = data.ncloud_zones.available.zones[0].zone_code
  network_acl_no = ncloud_vpc.main.default_network_acl_no
  subnet_type    = "PUBLIC"
  usage_type     = "GEN"
  
  # NCP Subnet은 tags를 지원하지 않음
}

# ACG (Access Control Group) - 웹 서버용
resource "ncloud_access_control_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-acg"
  description = "ACG for LifeBit web server (Academy Project)"
  vpc_no      = ncloud_vpc.main.id
  
  # NCP ACG는 tags를 지원하지 않음
}

# ACG 규칙 - 모든 포트를 하나의 리소스로 통합 (NCP Provider 호환성)
resource "ncloud_access_control_group_rule" "all_ports" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  # SSH 접근
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "22"
    description = "SSH access"
  }
  
  # HTTP 접근
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "HTTP access"
  }
  
  # HTTPS 접근
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS access"
  }
  
  # Frontend (React)
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "3000"
    description = "Frontend (React)"
  }
  
  # Spring Boot API
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8080"
    description = "Spring Boot API"
  }
  
  # FastAPI
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8001"
    description = "FastAPI"
  }
  
  # Airflow
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8081"
    description = "Airflow"
  }
  
  # Grafana
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "3001"
    description = "Grafana"
  }
  
  # Prometheus
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "9090"
    description = "Prometheus"
  }
  
  # Nginx Proxy
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8082"
    description = "Nginx Proxy"
  }
  
  # Node Exporter
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "9100"
    description = "Node Exporter"
  }
}

# 로그인 키 생성
resource "ncloud_login_key" "main" {
  key_name = "${var.project_name}-${var.environment}-key-v2"
}

# 최소 초기화 스크립트 (SSH 키 직접 설정)
resource "ncloud_init_script" "minimal_init" {
  name    = "${var.project_name}-${var.environment}-minimal-init"
  content = base64encode(templatefile("${path.module}/scripts/minimal-init.sh", {
    environment = var.environment
    project_name = var.project_name
    ssh_public_key = ncloud_login_key.main.public_key
  }))
}

# 네트워크 인터페이스 생성
resource "ncloud_network_interface" "web" {
  name                  = "${var.project_name}-${var.environment}-web-nic"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.web.id]
  
  # NCP Network Interface는 tags를 지원하지 않음
}

# 웹 서버 인스턴스 생성 (단일 서버)
resource "ncloud_server" "web" {
  name                      = "${var.project_name}-${var.environment}-web-server"
  server_image_product_code = var.server_image_product_code
  server_product_code       = var.server_instance_type
  login_key_name           = ncloud_login_key.main.key_name
  init_script_no           = ncloud_init_script.minimal_init.id
  subnet_no                = ncloud_subnet.public.id
  
  network_interface {
    network_interface_no = ncloud_network_interface.web.id
    order               = 0
  }
  
  # NCP Server는 tags를 지원하지 않음
}

# 공인 IP 할당
resource "ncloud_public_ip" "web" {
  server_instance_no = ncloud_server.web.id
  description        = "Public IP for ${var.project_name} web server"
  
  # NCP Public IP는 tags를 지원하지 않음
}

# 블록 스토리지 추가 (선택적)
resource "ncloud_block_storage" "web_data" {
  count = var.enable_additional_storage ? 1 : 0
  
  name                  = "${var.project_name}-${var.environment}-data-storage"
  size                  = var.additional_storage_size
  description          = "Additional storage for LifeBit data"
  server_instance_no   = ncloud_server.web.id
  
  # NCP Block Storage는 tags를 지원하지 않음
} 