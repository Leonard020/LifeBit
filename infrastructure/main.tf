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

# 현재 사용자 정보 조회
data "ncloud_user" "current" {}

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
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
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
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-public-subnet"
    Type = "Public"
  })
}

# ACG (Access Control Group) - 웹 서버용
resource "ncloud_access_control_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-acg"
  description = "ACG for LifeBit web server (Academy Project)"
  vpc_no      = ncloud_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-web-acg"
    Purpose = "WebServer"
  })
}

# ACG 규칙 - SSH 접근
resource "ncloud_access_control_group_rule" "ssh" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  dynamic "inbound" {
    for_each = var.allowed_ssh_cidrs
    content {
      protocol    = "TCP"
      ip_block    = inbound.value
      port_range  = "22"
      description = "SSH access from ${inbound.value}"
    }
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

# ACG 규칙 - HTTPS (향후 SSL 적용용)
resource "ncloud_access_control_group_rule" "https" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS access"
  }
}

# ACG 규칙 - 애플리케이션 포트들 (개발/데모용)
resource "ncloud_access_control_group_rule" "app_ports" {
  access_control_group_no = ncloud_access_control_group.web.id
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "3000"
    description = "Frontend (React)"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8080"
    description = "Spring Boot API"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8001"
    description = "FastAPI"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8081"
    description = "Airflow"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "3001"
    description = "Grafana"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "9090"
    description = "Prometheus"
  }
  
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "8082"
    description = "Nginx Proxy"
  }
}

# 로그인 키 생성
resource "ncloud_login_key" "main" {
  key_name = "${var.project_name}-${var.environment}-key"
}

# 초기화 스크립트
resource "ncloud_init_script" "web_init" {
  name    = "${var.project_name}-${var.environment}-init"
  content = base64encode(templatefile("${path.module}/scripts/web-init.sh", {
    environment = var.environment
    project_name = var.project_name
  }))
}

# 네트워크 인터페이스 생성
resource "ncloud_network_interface" "web" {
  name                  = "${var.project_name}-${var.environment}-web-nic"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.web.id]
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-web-nic"
  })
}

# 웹 서버 인스턴스 생성 (단일 서버)
resource "ncloud_server" "web" {
  name                      = "${var.project_name}-${var.environment}-web-server"
  server_image_product_code = var.server_image_product_code
  server_product_code       = var.server_instance_type
  login_key_name           = ncloud_login_key.main.key_name
  init_script_no           = ncloud_init_script.web_init.id
  
  network_interface {
    network_interface_no = ncloud_network_interface.web.id
    order               = 0
  }
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-web-server"
    Role = "WebServer"
  })
}

# 공인 IP 할당
resource "ncloud_public_ip" "web" {
  server_instance_no = ncloud_server.web.id
  description        = "Public IP for ${var.project_name} web server"
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-public-ip"
  })
}

# 블록 스토리지 추가 (선택적)
resource "ncloud_block_storage" "web_data" {
  count = var.enable_additional_storage ? 1 : 0
  
  name                  = "${var.project_name}-${var.environment}-data-storage"
  size                  = var.additional_storage_size
  description          = "Additional storage for LifeBit data"
  server_instance_no   = ncloud_server.web.id
  
  tags = merge(var.tags, {
    Name = "${var.project_name}-${var.environment}-data-storage"
  })
} 