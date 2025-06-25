# ================================================
# LifeBit 학원용 Terraform 변수 설정
# ================================================

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
  description = "Environment (demo, dev, prod)"
  type        = string
  default     = "demo"

  validation {
    condition     = contains(["demo", "dev", "prod"], var.environment)
    error_message = "Environment must be one of: demo, dev, prod."
  }
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
  default     = ["10.0.1.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (not used in single server setup)"
  type        = list(string)
  default     = ["10.0.101.0/24"]
}

# 서버 설정
variable "server_instance_type" {
  description = "Server instance type (학원용 적당한 성능)"
  type        = string
  default     = "SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002" # 2vCPU, 4GB RAM

  validation {
    condition     = can(regex("^SVR\\.VSVR\\.", var.server_instance_type))
    error_message = "Server instance type must be a valid NCP server product code."
  }
}

variable "server_image_product_code" {
  description = "Server image product code (Ubuntu 22.04 LTS - 더 안정적인 SSH 키 주입)"
  type        = string
  default     = "SW.VSVR.OS.LNX64.UBNTU.SVR2204.B050"  # Ubuntu 22.04 LTS

  validation {
    condition     = can(regex("^SW\\.VSVR\\.OS\\.LNX64\\.UBNTU\\.", var.server_image_product_code))
    error_message = "Server image must be a valid Ubuntu server image product code."
  }
}

variable "login_key_name" {
  description = "Name of the login key to use (created by deploy script)"
  type        = string
  
  validation {
    condition     = length(var.login_key_name) > 0
    error_message = "Login key name cannot be empty."
  }
}

# 보안 설정 (학원용으로 완화)
variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # 학원용 - 전체 허용
}

# 추가 스토리지 설정 (선택적)
variable "enable_additional_storage" {
  description = "Enable additional block storage"
  type        = bool
  default     = false
}

variable "additional_storage_size" {
  description = "Additional storage size (GB)"
  type        = number
  default     = 50

  validation {
    condition     = var.additional_storage_size >= 10 && var.additional_storage_size <= 2000
    error_message = "Additional storage size must be between 10 and 2000 GB."
  }
}

# 태그 설정
variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment   = "demo"
    Project       = "LifeBit"
    Owner         = "Student"
    Purpose       = "Academy Project"
    ManagedBy     = "Terraform"
    CostOptimized = "true"
  }
}

# 알림 설정 (선택적)
variable "notification_email" {
  description = "Email for notifications"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "name_suffix" {
  description = "Unique suffix to avoid duplicate resource names"
  type        = string
  default     = ""
} 