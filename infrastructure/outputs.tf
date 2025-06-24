# VPC 정보
output "vpc_id" {
  description = "VPC ID"
  value       = ncloud_vpc.main.id
}

output "vpc_name" {
  description = "VPC Name"
  value       = ncloud_vpc.main.name
}

# 서브넷 정보
output "public_subnet_id" {
  description = "Public Subnet ID"
  value       = ncloud_subnet.public.id
}

output "public_subnet_cidr" {
  description = "Public Subnet CIDR"
  value       = ncloud_subnet.public.subnet
}

# 서버 정보
output "server_instance_no" {
  description = "Server Instance Number"
  value       = ncloud_server.web.instance_no
}

output "server_name" {
  description = "Server Name"
  value       = ncloud_server.web.name
}

output "server_private_ip" {
  description = "Server Private IP"
  value       = ncloud_server.web.private_ip
}

# 퍼블릭 IP 정보
output "public_ip" {
  description = "Public IP Address"
  value       = ncloud_public_ip.web.public_ip
}

# 로그인 키 정보
output "login_key_name" {
  description = "Login Key Name"
  value       = ncloud_login_key.key.key_name
}

output "login_key_private_key" {
  description = "Login Key Private Key"
  value       = ncloud_login_key.key.private_key
  sensitive   = true
}

# 연결 정보
output "ssh_connection_command" {
  description = "SSH Connection Command"
  value       = "ssh -i ${ncloud_login_key.key.key_name}.pem root@${ncloud_public_ip.web.public_ip}"
}

output "web_url" {
  description = "Web Application URL"
  value       = "http://${ncloud_public_ip.web.public_ip}"
}

output "api_url" {
  description = "API Base URL"
  value       = "http://${ncloud_public_ip.web.public_ip}/api"
}

output "fastapi_url" {
  description = "FastAPI URL"
  value       = "http://${ncloud_public_ip.web.public_ip}/api/py"
}

output "airflow_url" {
  description = "Airflow Web UI URL"
  value       = "http://${ncloud_public_ip.web.public_ip}/airflow"
}

# ACG 정보
output "access_control_group_id" {
  description = "Access Control Group ID"
  value       = ncloud_access_control_group.web.id
}

# 배포 정보
output "deployment_info" {
  description = "Deployment Information"
  value = {
    vpc_id         = ncloud_vpc.main.id
    subnet_id      = ncloud_subnet.public.id
    server_id      = ncloud_server.web.instance_no
    public_ip      = ncloud_public_ip.web.public_ip
    ssh_key        = ncloud_login_key.key.key_name
    web_url        = "http://${ncloud_public_ip.web.public_ip}"
    api_url        = "http://${ncloud_public_ip.web.public_ip}/api"
    fastapi_url    = "http://${ncloud_public_ip.web.public_ip}/api/py"
    airflow_url    = "http://${ncloud_public_ip.web.public_ip}/airflow"
  }
  sensitive = false
} 