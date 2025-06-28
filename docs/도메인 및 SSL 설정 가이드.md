# Traefik 기반 도메인 및 SSL 자동화 가이드 (AWS EC2, Docker)

이 문서는 가비아에서 구매한 도메인을 AWS EC2 인스턴스에 연결하고, Traefik을 통해 완전 자동으로 SSL 인증서를 발급받아 여러 도메인/팀원이 쉽게 HTTPS 서비스를 운영하는 방법을 안내합니다.

---

### 목차
1. [Traefik이란? 왜 도입해야 하나요?](#traefik이란-왜-도입해야-하나요)
2. [1단계: 도메인 구매 및 DNS 연결](#1단계-도메인-구매-및-dns-연결)
3. [2단계: AWS EC2 보안 그룹 설정](#2단계-aws-ec2-보안-그룹-설정)
4. [3단계: Traefik 설정 및 도커 컴포즈 수정](#3단계-traefik-설정-및-도커-컴포즈-수정)
5. [4단계: 팀원 도메인 추가 방법](#4단계-팀원-도메인-추가-방법)
6. [5단계: 배포 및 접속 확인](#5단계-배포-및-접속-확인)

---

### Traefik이란? 왜 도입해야 하나요?

- Traefik은 현대적인 리버스 프록시/로드밸런서로, **도메인만 추가하면 자동으로 SSL 인증서(HTTPS)를 발급**해줍니다.
- 팀원이 각자 도메인을 추가해도, 설정 한 줄만 추가하면 자동으로 HTTPS가 적용됩니다.
- 인증서 갱신, 리디렉션, 프록시 등 모든 관리가 자동화되어 실수할 일이 없습니다.

---

### 1단계: 도메인 구매 및 DNS 연결

1. [가비아](https://www.gabia.com/) 등에서 도메인을 구매합니다. (예: jisub.store, team1.com 등)
2. 도메인 DNS 관리에서 **A 레코드**를 아래와 같이 추가합니다.

| 타입 | 호스트 | 값/위치          | TTL  |
| :--- | :--- | :--------------- | :--- |
| A    | @    | `52.78.16.135`   | 3600 |
| A    | www  | `52.78.16.135`   | 3600 |

- 팀원도 각자 자신의 도메인을 위와 같이 서버 IP로 연결하면 됩니다.
- DNS 전파는 수 분~수 시간 소요될 수 있습니다. (ping, nslookup 등으로 확인)

---

### 2단계: AWS EC2 보안 그룹 설정

- 80(HTTP), 443(HTTPS) 포트가 모두 열려 있어야 합니다.
- AWS 콘솔 > EC2 > 인스턴스 > 보안 그룹 > 인바운드 규칙에 아래 두 항목이 있는지 확인/추가하세요.
  - HTTP  80  0.0.0.0/0
  - HTTPS 443 0.0.0.0/0

---

### 3단계: Traefik 설정 및 도커 컴포즈 수정

1. **letsencrypt 디렉토리 생성**
   ```bash
   mkdir -p letsencrypt
   chmod 600 letsencrypt
   ```
2. **docker-compose.prod.yml** 파일에서 Traefik 서비스와 각 서비스의 라벨(label) 설정을 아래 예시처럼 추가합니다.

```yaml
traefik:
  image: traefik:v2.11
  container_name: traefik
  command:
    - --api.insecure=true
    - --providers.docker=true
    - --providers.docker.exposedbydefault=false
    - --entrypoints.web.address=:80
    - --entrypoints.websecure.address=:443
    - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
    - --certificatesresolvers.letsencrypt.acme.email=your-email@example.com
    - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
  ports:
    - "80:80"
    - "443:443"
    - "8081:8080" # Traefik 대시보드
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./letsencrypt:/letsencrypt
  networks:
    - lifebit-network
  restart: unless-stopped

frontend:
  # ... 기존 설정 ...
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.frontend.rule=Host(`jisub.store`,`www.jisub.store`)"
    - "traefik.http.routers.frontend.entrypoints=web,websecure"
    - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
    # 팀원 도메인 예시
    # - "traefik.http.routers.frontend.rule=Host(`team1.example.com`)"

core-api:
  # ... 기존 설정 ...
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.coreapi.rule=Host(`api.jisub.store`)"
    - "traefik.http.routers.coreapi.entrypoints=web,websecure"
    - "traefik.http.routers.coreapi.tls.certresolver=letsencrypt"

ai-api:
  # ... 기존 설정 ...
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.aiapi.rule=Host(`ai.jisub.store`)"
    - "traefik.http.routers.aiapi.entrypoints=web,websecure"
    - "traefik.http.routers.aiapi.tls.certresolver=letsencrypt"
```

- **your-email@example.com** 부분은 실제 이메일로 변경하세요.
- 기존 nginx 서비스는 주석 처리하거나 삭제하세요.

---

### 4단계: 팀원 도메인 추가 방법

1. 팀원이 도메인을 구매하고 DNS를 서버 IP로 연결합니다.
2. `docker-compose.prod.yml`의 프론트엔드 서비스에 아래와 같이 라벨을 추가합니다.
   ```yaml
   labels:
     - "traefik.http.routers.frontend.rule=Host(`jisub.store`,`www.jisub.store`,`team1.example.com`,`team2.example.com`)"
   ```
3. Ansible로 재배포하면, 각 도메인마다 자동으로 SSL이 적용됩니다.

---

### 5단계: 배포 및 접속 확인

1. **Ansible 플레이북 실행**
   ```bash
   ansible-playbook -i infrastructure/ansible/inventory infrastructure/ansible/playbook.yml
   ```
2. **접속 확인**
   - `https://jisub.store`, `https://team1.example.com` 등 각 도메인으로 접속
   - 자물쇠(SSL) 아이콘이 정상적으로 표시되는지 확인

---

### 참고
- Traefik 대시보드: `http://서버IP:8081` (보안상 외부 노출은 피하세요)
- 인증서 발급/갱신은 Traefik이 자동으로 처리합니다.
- 도메인 추가/삭제는 라벨만 수정하면 됩니다.

---

**이 방식은 실수 없이, 누구나 쉽게 도메인/SSL을 관리할 수 있는 최적의 방법입니다.**

궁금한 점이 있으면 언제든 문의하세요! 