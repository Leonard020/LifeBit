# LifeBit 클라우드 자동화 배포 가이드

## 🚀 배포 순서

### 1단계: 로컬 테스트 ✅
```bash
# 로컬에서 전체 시스템 테스트
./scripts/deploy-single-server.sh

# 테스트 URL 확인
http://localhost:8082  # 통합 접속 (권장)
```

### 2단계: 클라우드 배포 ☁️
```bash
# NCP 인증 정보 설정
export NCP_ACCESS_KEY="your_access_key"
export NCP_SECRET_KEY="your_secret_key"

# 완전 자동화 배포 (인프라 + 애플리케이션)
./scripts/deploy-cloud-automation.sh full demo

# 또는 단계별 배포
./scripts/deploy-cloud-automation.sh infra-only demo    # 인프라만
./scripts/deploy-cloud-automation.sh app-only demo     # 애플리케이션만
```

---

## 📋 스크립트 비교

| 항목 | `deploy-single-server.sh` | `deploy-cloud-automation.sh` |
|------|---------------------------|-------------------------------|
| **용도** | 로컬 개발/테스트 | 클라우드 운영 배포 |
| **인프라** | Docker Compose | Terraform + NCP |
| **배포 도구** | Docker | Terraform + Ansible |
| **접속** | localhost | 실제 서버 IP |
| **비용** | 무료 | 월 3-5만원 |

---

## 🔧 주요 개선사항

### 로컬 배포 스크립트 개선:
- ✅ Nginx 프록시 헬스체크 추가
- ✅ 통합 접속 URL 안내
- ✅ 클라우드 배포 가이드 추가
- ✅ 타임아웃 설정으로 안정성 향상

### 클라우드 배포 스크립트 신규 생성:
- ✅ Terraform 인프라 자동 배포
- ✅ Ansible 애플리케이션 자동 배포
- ✅ SSH 키 자동 설정
- ✅ 서버 연결 대기 로직
- ✅ 배포 검증 및 헬스체크
- ✅ DRY RUN 모드 지원

---

## 🎯 배포 시나리오

### 시나리오 1: 처음 배포
```bash
# 1. 로컬 테스트
./scripts/deploy-single-server.sh

# 2. 클라우드 배포 (완전 자동화)
export NCP_ACCESS_KEY="your_key"
export NCP_SECRET_KEY="your_secret"
./scripts/deploy-cloud-automation.sh full demo
```

### 시나리오 2: 코드 업데이트 배포
```bash
# 애플리케이션만 재배포
./scripts/deploy-cloud-automation.sh app-only demo
```

### 시나리오 3: 인프라 변경
```bash
# 인프라 변경 후 전체 재배포
./scripts/deploy-cloud-automation.sh full demo
```

### 시나리오 4: 배포 전 검증
```bash
# DRY RUN으로 계획만 확인
./scripts/deploy-cloud-automation.sh full demo true
```

---

## 🛡️ 보안 설정

### NCP 인증 정보 관리:
```bash
# 환경변수 설정 (권장)
export NCP_ACCESS_KEY="your_access_key"
export NCP_SECRET_KEY="your_secret_key"

# 또는 .bashrc에 추가
echo 'export NCP_ACCESS_KEY="your_key"' >> ~/.bashrc
echo 'export NCP_SECRET_KEY="your_secret"' >> ~/.bashrc
source ~/.bashrc
```

### SSH 키 관리:
- 자동 생성: `~/.ssh/lifebit-demo-key.pem`
- 권한 설정: `chmod 600`
- 백업 권장

---

## 📊 리소스 사양

### NCP 서버 스펙:
- **CPU**: 4vCPU
- **메모리**: 8GB RAM
- **스토리지**: 50GB SSD
- **네트워크**: 퍼블릭 IP
- **예상 비용**: 월 3-5만원

### 포트 구성:
| 포트 | 서비스 | 접근 |
|------|--------|------|
| 22 | SSH | 제한적 |
| 80 | HTTP | 전체 |
| 443 | HTTPS | 전체 |
| 3000 | Frontend | 전체 |
| 8080 | Spring API | 전체 |
| 8001 | FastAPI | 전체 |
| 8082 | Nginx Proxy | 전체 |
| 3001 | Grafana | 전체 |
| 9090 | Prometheus | 전체 |

---

## 🔍 트러블슈팅

### 일반적인 문제:

#### 1. Terraform 인증 실패
```bash
# 인증 정보 확인
echo $NCP_ACCESS_KEY
echo $NCP_SECRET_KEY

# 재설정
export NCP_ACCESS_KEY="correct_key"
export NCP_SECRET_KEY="correct_secret"
```

#### 2. SSH 연결 실패
```bash
# SSH 키 권한 확인
chmod 600 ~/.ssh/lifebit-demo-key.pem

# 수동 연결 테스트
ssh -i ~/.ssh/lifebit-demo-key.pem root@SERVER_IP
```

#### 3. 서비스 헬스체크 실패
```bash
# 서버에 직접 접속해서 확인
ssh -i ~/.ssh/lifebit-demo-key.pem root@SERVER_IP
docker ps
docker-compose -f /opt/lifebit/docker-compose.single-server.yml logs
```

#### 4. 포트 접근 불가
```bash
# 방화벽 상태 확인
sudo ufw status

# 포트 개방
sudo ufw allow 8082
```

---

## 🎓 학원 프로젝트 시연 팁

### 1. 로컬 시연:
```bash
./scripts/deploy-single-server.sh
# → http://localhost:8082 접속
```

### 2. 클라우드 시연:
```bash
./scripts/deploy-cloud-automation.sh full demo
# → http://SERVER_IP:8082 접속
```

### 3. 모니터링 시연:
- Grafana: `http://SERVER_IP:3001`
- Prometheus: `http://SERVER_IP:9090`

### 4. 자동화 강조 포인트:
- ✅ 원클릭 배포
- ✅ 인프라 코드화 (IaC)
- ✅ 구성 관리 자동화
- ✅ 모니터링 자동 설정
- ✅ 보안 설정 자동화

---

## 📈 향후 개선 계획

### Phase 1: CI/CD 파이프라인
- GitHub Actions 연동
- 자동 테스트 및 배포
- 롤백 기능

### Phase 2: 고가용성
- 로드 밸런서 추가
- 다중 서버 구성
- 데이터베이스 클러스터링

### Phase 3: 보안 강화
- SSL/TLS 자동 인증서
- VPN 연결
- 보안 스캔 자동화

---

## 🎯 성공 기준

### 로컬 배포 성공:
- [ ] 모든 서비스 정상 실행
- [ ] Nginx 프록시 정상 동작
- [ ] 헬스체크 통과
- [ ] 프론트엔드 접속 가능

### 클라우드 배포 성공:
- [ ] Terraform 인프라 생성 완료
- [ ] Ansible 애플리케이션 배포 완료
- [ ] 외부에서 서비스 접속 가능
- [ ] 모니터링 대시보드 정상 동작

**🏆 목표: 학원 프로젝트 수준을 뛰어넘는 운영급 자동화 시스템 구축!** 