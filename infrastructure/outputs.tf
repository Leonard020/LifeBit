# ================================================
# LifeBit 학원용 Terraform Outputs
# ================================================

# 기본 인프라 정보
output "vpc_id" {
  description = "VPC ID"
  value       = ncloud_vpc.main.id
}

output "public_subnet_id" {
  description = "Public subnet ID"
  value       = ncloud_subnet.public.id
}

# 서버 정보
output "server_id" {
  description = "Web server instance ID"
  value       = ncloud_server.web.id
}

output "server_name" {
  description = "Web server instance name"
  value       = ncloud_server.web.name
}

output "public_ip" {
  description = "Public IP address"
  value       = ncloud_public_ip.web.public_ip
}

output "private_ip" {
  description = "Private IP address"
  value       = ncloud_server.web.private_ip
}

# 접속 정보
output "ssh_connection" {
  description = "SSH connection command"
  value       = "ssh -i ${ncloud_login_key.main.key_name}.pem ubuntu@${ncloud_public_ip.web.public_ip}"
}

# 애플리케이션 접속 URLs
output "application_urls" {
  description = "Application access URLs"
  value = {
    frontend    = "http://${ncloud_public_ip.web.public_ip}:3000"
    spring_api  = "http://${ncloud_public_ip.web.public_ip}:8080"
    fastapi     = "http://${ncloud_public_ip.web.public_ip}:8001"
    airflow     = "http://${ncloud_public_ip.web.public_ip}:8081"
    grafana     = "http://${ncloud_public_ip.web.public_ip}:3001"
    prometheus  = "http://${ncloud_public_ip.web.public_ip}:9090"
    nginx_proxy = "http://${ncloud_public_ip.web.public_ip}:8082"
  }
}

# 보안 정보
output "login_key_name" {
  description = "Login key name for SSH access"
  value       = ncloud_login_key.main.key_name
}

output "private_key" {
  description = "Private key for SSH access (empty if existing key reused)"
  value       = ncloud_login_key.main.private_key
  sensitive   = true
}

output "access_control_group_id" {
  description = "Access Control Group ID"
  value       = ncloud_access_control_group.web.id
}

# 스토리지 정보 (있는 경우)
output "additional_storage_id" {
  description = "Additional block storage ID (if enabled)"
  value       = var.enable_additional_storage ? ncloud_block_storage.web_data[0].id : null
}

# 배포 가이드
output "deployment_guide" {
  description = "Quick deployment guide"
  value       = <<-EOT
🚀 LifeBit 학원용 배포 완료!

📋 접속 정보:
- 서버 IP: ${ncloud_public_ip.web.public_ip}
- SSH 접속: ssh -i ${ncloud_login_key.main.key_name}.pem ubuntu@${ncloud_public_ip.web.public_ip}

🌐 애플리케이션 URLs:
- Frontend:     http://${ncloud_public_ip.web.public_ip}:3000
- Spring API:   http://${ncloud_public_ip.web.public_ip}:8080
- FastAPI:      http://${ncloud_public_ip.web.public_ip}:8001
- Nginx Proxy:  http://${ncloud_public_ip.web.public_ip}:8082
- Grafana:      http://${ncloud_public_ip.web.public_ip}:3001
- Prometheus:   http://${ncloud_public_ip.web.public_ip}:9090
- Airflow:      http://${ncloud_public_ip.web.public_ip}:8081

🔧 다음 단계:
1. SSH로 서버 접속
2. Ansible 플레이북 실행: ansible-playbook -i inventory.ini playbook.yml
3. 애플리케이션 접속 확인

💰 예상 비용: 월 3-5만원 (단일 서버)
EOT
}

# 리소스 요약
output "resource_summary" {
  description = "Created resources summary"
  value = {
    vpc_name           = ncloud_vpc.main.name
    subnet_name        = ncloud_subnet.public.name
    server_name        = ncloud_server.web.name
    server_type        = var.server_instance_type
    public_ip          = ncloud_public_ip.web.public_ip
    environment        = var.environment
    project_name       = var.project_name
    additional_storage = var.enable_additional_storage
  }
} 