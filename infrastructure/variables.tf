# ================================================
# LifeBit AWS Terraform 변수 설정
# ================================================

# AWS 인증 정보
variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "ap-northeast-2"
}

variable "aws_az" {
  description = "AWS Availability Zone"
  type        = string
  default     = "ap-northeast-2a"
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

# EC2 설정
variable "instance_type" {
  description = "EC2 instance type (t3.small for 2GB RAM - 비용 최적화)"
  type        = string
  default     = "t3.small"

  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Instance type should be t3 series for cost optimization."
  }
}

# EBS 볼륨 크기 (Docker 빌드 공간 확보)
variable "root_volume_size" {
  description = "Root EBS volume size in GB (Docker 빌드를 위해 증가)"
  type        = number
  default     = 30
  
  validation {
    condition     = var.root_volume_size >= 20 && var.root_volume_size <= 100
    error_message = "Root volume size must be between 20 and 100 GB."
  }
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 22.04 LTS"
  type        = string
  default     = "ami-0c9c942bd7bf113a2"  # Ubuntu 22.04 LTS in ap-northeast-2

  validation {
    condition     = length(var.ami_id) > 0
    error_message = "AMI ID cannot be empty."
  }
}

# 보안 설정 (데모용으로 완화)
variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # 데모용 - 전체 허용
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

variable "zone" {
  description = "NCP zone code (예: KR-1, KR-2)"
  type        = string
  default     = "KR-2"
}

variable "server_product_code" {
  description = "NCP 서버 상품 코드 (예: SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002)"
  type        = string
  default     = "SVR.VSVR.HICPU.C002.M004.NET.SSD.B050.G002"
} 