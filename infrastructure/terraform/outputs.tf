output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.lifebit_eip.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.lifebit_server.private_ip
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.lifebit_server.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.lifebit_vpc.id
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.lifebit_sg.id
}

output "key_pair_name" {
  description = "Name of the key pair"
  value       = aws_key_pair.lifebit_key.key_name
}

output "application_urls" {
  description = "Application URLs"
  value = {
    frontend = "http://${aws_eip.lifebit_eip.public_ip}:3000"
    core_api = "http://${aws_eip.lifebit_eip.public_ip}:8080"
    ai_api   = "http://${aws_eip.lifebit_eip.public_ip}:8001"
  }
} 