# NCP 인증 정보
variable "ncp_access_key" {
  description = "NCP Access Key"
  type        = string
  sensitive   = true
}

variable "ncp_secret_key" {
  description = "NCP Secret Key"
  type        = string
  sensitive   = true
}

variable "ncp_region" {
  description = "NCP Region"
  type        = string
  default     = "KR"
}

variable "ncp_site" {
  description = "NCP Site"
  type        = string
  default     = "public"
}

# 프로젝트 설정
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "lifebit"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# VPC 설정
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# 서버 설정
variable "server_instance_type" {
  description = "Server instance type"
  type        = string
  default     = "SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002"  # 2vCPU, 4GB RAM
}

variable "server_image_product_code" {
  description = "Server image product code (Ubuntu 20.04)"
  type        = string
  default     = "SW.VSVR.OS.LNX64.UBNTU.SVR2004.B050"
}

# 보안 설정
variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # 프로덕션에서는 제한적으로 설정
}

variable "allowed_http_cidrs" {
  description = "CIDR blocks allowed for HTTP access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# 데이터베이스 설정
variable "db_instance_type" {
  description = "Database instance type"
  type        = string
  default     = "DB.t3.micro"
}

variable "db_storage_size" {
  description = "Database storage size (GB)"
  type        = number
  default     = 20
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "lifebit_user"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# 도메인 설정
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# 태그 설정
variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Project     = "LifeBit"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
} 