# 도메인 및 SSL 설정 가이드

## 개요
LifeBit 애플리케이션을 사용자 정의 도메인으로 배포하고 SSL 인증서를 설정하는 방법을 안내합니다.

## 1. 도메인 설정 방식

### 1.1 환경변수 기반 도메인 설정
LifeBit은 하드코딩 없이 환경변수를 통해 도메인을 유동적으로 설정할 수 있습니다.

**주요 환경변수:**
- `DOMAIN_NAME`: 메인 도메인 (예: `lifebit.example.com`)
- `CORS_ORIGINS`: CORS 허용 도메인 목록
- `KAKAO_REDIRECT_URI`: 카카오 로그인 리다이렉트 URI
- `GOOGLE_REDIRECT_URI`: 구글 로그인 리다이렉트 URI

### 1.2 배포 시 도메인 설정
배포 스크립트 실행 시 도메인을 입력할 수 있습니다:

```bash
./aws-deploy.sh
# 실행 중 도메인 입력 프롬프트가 나타남
# 예: my.lifebit.com
```

## 2. SSL 인증서 설정

### 2.1 Let's Encrypt를 사용한 무료 SSL 인증서

#### 2.1.1 Certbot 설치 및 설정
```bash
# EC2 인스턴스에 SSH 접속
ssh -i ~/.ssh/lifebit_key ubuntu@YOUR_EC2_IP

# Certbot 설치
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com
```

#### 2.1.2 자동 갱신 설정
```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 크론탭 설정 (자동 갱신)
sudo crontab -e
# 다음 라인 추가:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2.2 AWS Certificate Manager (ACM) 사용

#### 2.2.1 로드밸런서와 함께 사용
```bash
# Application Load Balancer 생성 후 ACM 인증서 연결
# 이 방법은 추가 비용이 발생할 수 있습니다
```

## 3. Nginx 설정 업데이트

### 3.1 SSL 설정이 포함된 Nginx 설정
SSL 인증서 발급 후 Nginx 설정이 자동으로 업데이트됩니다.

### 3.2 수동 Nginx 설정 (필요시)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    
    # 나머지 설정은 기존과 동일...
}
```

## 4. DNS 설정

### 4.1 도메인 DNS 레코드 설정
도메인 등록업체에서 다음 DNS 레코드를 설정하세요:

```
Type: A
Name: @ (또는 서브도메인명)
Value: EC2_PUBLIC_IP
TTL: 300
```

### 4.2 서브도메인 설정 (선택사항)
```
Type: A
Name: api
Value: EC2_PUBLIC_IP
TTL: 300

Type: A  
Name: www
Value: EC2_PUBLIC_IP
TTL: 300
```

## 5. 소셜 로그인 설정 업데이트

### 5.1 카카오 개발자 콘솔
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 선택
3. 플랫폼 > Web 플랫폼 설정
4. 사이트 도메인: `https://your-domain.com`
5. Redirect URI: `https://your-domain.com/auth/kakao/callback`

### 5.2 구글 클라우드 콘솔
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. API 및 서비스 > 사용자 인증 정보
3. OAuth 2.0 클라이언트 ID 수정
4. 승인된 JavaScript 원본: `https://your-domain.com`
5. 승인된 리디렉션 URI: `https://your-domain.com/auth/google/callback`

## 6. 환경변수 업데이트

### 6.1 프로덕션 환경변수 수동 업데이트 (필요시)
```bash
# EC2 인스턴스에 접속
ssh -i ~/.ssh/lifebit_key ubuntu@YOUR_EC2_IP

# .env 파일 수정
sudo nano /opt/lifebit/.env

# 다음 변수들 확인/수정:
DOMAIN_NAME=your-domain.com
CORS_ORIGINS=https://your-domain.com
KAKAO_REDIRECT_URI=https://your-domain.com/auth/kakao/callback
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

### 6.2 Docker 컨테이너 재시작
```bash
cd /opt/lifebit
sudo docker-compose -f docker-compose.prod.yml down
sudo docker-compose -f docker-compose.prod.yml up -d
```

## 7. 완전 자동화된 배포 (권장)

### 7.1 Terraform에 SSL 설정 추가
```hcl
# infrastructure/terraform/main.tf에 추가할 수 있는 설정
resource "aws_acm_certificate" "lifebit_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
}
```

### 7.2 Ansible에 Certbot 자동화 추가
```yaml
# infrastructure/ansible/playbook.yml에 추가할 수 있는 태스크
- name: Install and configure SSL certificate
  block:
    - name: Install certbot
      apt:
        name: 
          - certbot
          - python3-certbot-nginx
        state: present
    
    - name: Generate SSL certificate
      command: >
        certbot --nginx --non-interactive --agree-tos 
        --email admin@{{ domain_name }} -d {{ domain_name }}
      when: domain_name is defined and domain_name != ansible_host
```

## 8. 트러블슈팅

### 8.1 일반적인 문제들

**DNS 전파 지연**
```bash
# DNS 전파 확인
nslookup your-domain.com
dig your-domain.com
```

**SSL 인증서 발급 실패**
```bash
# Nginx 설정 테스트
sudo nginx -t

# 80번 포트 확인
sudo netstat -tlnp | grep :80

# 방화벽 확인
sudo ufw status
```

**CORS 오류**
```bash
# 브라우저 개발자 도구에서 네트워크 탭 확인
# Access-Control-Allow-Origin 헤더 확인
```

### 8.2 로그 확인
```bash
# Nginx 로그
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Docker 컨테이너 로그
sudo docker-compose -f docker-compose.prod.yml logs -f

# Certbot 로그
sudo cat /var/log/letsencrypt/letsencrypt.log
```

## 9. 보안 고려사항

### 9.1 HTTP에서 HTTPS로 강제 리다이렉트
```nginx
# 이미 Nginx 설정에 포함되어 있음
return 301 https://$server_name$request_uri;
```

### 9.2 보안 헤더 추가
```nginx
# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Content Type Options
add_header X-Content-Type-Options "nosniff" always;

# Frame Options
add_header X-Frame-Options "SAMEORIGIN" always;
```

## 10. 모니터링 및 유지보수

### 10.1 SSL 인증서 만료 모니터링
```bash
# 인증서 만료일 확인
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout | grep "Not After"
```

### 10.2 자동화된 모니터링 스크립트
```bash
#!/bin/bash
# ssl-check.sh
DOMAIN="your-domain.com"
DAYS_UNTIL_EXPIRY=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2 | xargs -I {} date -d "{}" +%s)
CURRENT_TIME=$(date +%s)
DAYS_LEFT=$(( ($DAYS_UNTIL_EXPIRY - $CURRENT_TIME) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS_LEFT days"
    # 알림 전송 로직 추가 가능
fi
```

---

## 요약

1. **도메인 설정**: 배포 시 사용자 정의 도메인 입력
2. **DNS 설정**: A 레코드로 EC2 IP 연결
3. **SSL 인증서**: Let's Encrypt Certbot 사용
4. **소셜 로그인**: 각 플랫폼에서 도메인 업데이트
5. **자동 갱신**: 크론탭으로 SSL 인증서 자동 갱신

이 가이드를 따라하면 LifeBit 애플리케이션을 안전하고 전문적인 도메인으로 배포할 수 있습니다. 