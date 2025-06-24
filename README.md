# 🎓 LifeBit - 학원 프로젝트용 건강 관리 플랫폼

**💰 비용 최적화된 단일 서버 올인원 배포 방식 (월 3-5만원)**

## 🚀 빠른 시작 (5분 배포)

### 1. 저장소 클론
```bash
git clone https://github.com/Hyeon6492/LifeBit.git
cd LifeBit
```

### 2. 환경 설정
```bash
cp .env.example .env
nano .env  # 필요한 값들 수정
```

### 3. **🎯 학원용 올인원 배포 실행**
```bash
./scripts/deploy-single-server.sh
```

**끝! 🎉 모든 서비스가 하나의 서버에서 실행됩니다!**

---

## 🏗 아키텍처

### 단일 서버 구성 (학원용)
```
┌─────────────────────────────────────────┐
│           NCP 서버 1대                   │ ← 월 3-5만원
│         (4vCPU, 8GB RAM)                │
│                                         │
│  🌐 Frontend (React)     :3000         │
│  🔧 Spring Boot API      :8080         │
│  🤖 FastAPI (AI)         :8001         │
│  💾 PostgreSQL DB        :5432         │
│  ⚡ Redis Cache          :6379         │
│  📊 Airflow              :8081         │
│  📈 Grafana              :3001         │
│  🔍 Prometheus           :9090         │
└─────────────────────────────────────────┘
```

---

## 🌐 접속 정보

| 서비스 | URL | 계정 |
|--------|-----|------|
| **웹사이트** | http://localhost:3000 | - |
| **API 문서** | http://localhost:8080/swagger-ui | - |
| **AI API** | http://localhost:8001/docs | - |
| **데이터 파이프라인** | http://localhost:8081 | admin/admin |
| **모니터링** | http://localhost:3001 | admin/admin |

---

## 📋 유용한 명령어

### 서비스 관리
```bash
# 서비스 상태 확인
docker-compose -f docker-compose.single-server.yml ps

# 로그 확인
docker-compose -f docker-compose.single-server.yml logs -f

# 서비스 재시작
docker-compose -f docker-compose.single-server.yml restart

# 서비스 중지
docker-compose -f docker-compose.single-server.yml down
```

### 개발 모드 (로컬)
```bash
# 개별 서비스 시작
./scripts/start-frontend.sh    # Frontend 개발 서버
./scripts/start-core-api.sh    # Spring Boot API
./scripts/start-ai-api.sh      # FastAPI AI 서비스
```

---

## 🛠 기술 스택

### 백엔드
- **Spring Boot** (Java) - 핵심 API
- **FastAPI** (Python) - AI 서비스
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐시

### 프론트엔드
- **React + TypeScript** - 웹 애플리케이션
- **Vite** - 빌드 도구

### 데이터 파이프라인
- **Apache Airflow** - 데이터 워크플로우

### DevOps
- **Docker + Docker Compose** - 컨테이너화
- **Nginx** - 리버스 프록시
- **Prometheus + Grafana** - 모니터링

---

## 📊 비용 비교

| 구성 | 서버 수 | 월 비용 | 용도 |
|------|---------|---------|------|
| **🎓 학원용 (현재)** | 1대 | **3-5만원** | 프로젝트 발표용 |
| 스타트업용 | 3-5대 | 15-25만원 | 실제 서비스 |
| 엔터프라이즈 | 10대+ | 50만원+ | 대기업 서비스 |

---

## 📖 추가 가이드

- **[학원용 배포 가이드](ACADEMY_DEPLOY_GUIDE.md)** - 상세한 배포 방법
- **[Airflow 가이드](Airflow_팀원_적용_가이드.md)** - 데이터 파이프라인 설정
- **[데이터베이스 연결](데이터%20베이스%20연결%20방법.md)** - DB 접속 방법

---

## 🎯 학원 프로젝트 발표 포인트

1. **💰 비용 최적화** - 월 50만원 → 5만원으로 90% 절약
2. **🚀 완전 자동화** - 코드 푸시부터 배포까지 자동화
3. **📊 실시간 모니터링** - Grafana 대시보드로 시스템 상태 확인
4. **🔧 마이크로서비스 아키텍처** - 실제 기업 환경과 동일한 구성
5. **📈 확장 가능성** - 졸업 후 실제 서비스로 발전 가능

---

## 🤝 팀원

- **Backend (Spring)**: Core API 개발
- **AI (FastAPI)**: AI 서비스 개발  
- **Frontend (React)**: 웹 UI 개발
- **Data (Airflow)**: 데이터 파이프라인 개발
- **DevOps**: 인프라 및 배포 자동화

---

## 📞 문제 해결

문제가 발생하면:
1. `docker-compose logs` 로그 확인
2. [ACADEMY_DEPLOY_GUIDE.md](ACADEMY_DEPLOY_GUIDE.md) 문제해결 섹션 참고
3. GitHub Issues에 문제 보고

---

**🎉 축하합니다! 프로덕션급 인프라를 월 5만원으로 구축했습니다! 🎉**

---

## �� 라이선스

MIT License
