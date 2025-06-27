variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "ap-northeast-2"
}

variable "instance_type" {
  description = "The EC2 instance type."
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "The name of the EC2 key pair to use for the instance."
  type        = string
  default     = "lifebit-key"
}

variable "ami_id" {
  description = "The AMI ID for the EC2 instance."
  type        = string
  default     = "ami-0c9c942bd7bf113a2" # Ubuntu 22.04 LTS for ap-northeast-2
} 