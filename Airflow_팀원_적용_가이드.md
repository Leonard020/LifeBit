# 🚀 LifeBit Airflow 팀원 적용 가이드

> **목적**: Git에서 최신 코드를 받아 Airflow를 빠르게 실행하는 방법

## ⚡ 빠른 시작 (5분 완료)

### 1️⃣ 사전 준비 확인
```bash
# Docker Desktop 실행 상태 확인
docker --version
# 출력 예: Docker version 24.0.x

# LifeBit 메인 PostgreSQL 실행 확인
docker ps | grep lifebit_postgres
# 출력: lifebit_postgres 컨테이너가 실행 중이어야 함
```

### 2️⃣ 최신 코드 받기
```bash
# 프로젝트 디렉토리로 이동
cd D:\pro2\LifeBit  # 본인의 프로젝트 경로

# 최신 코드 가져오기
git pull origin main

# Airflow 디렉토리로 이동
cd apps\airflow-pipeline
```

### 3️⃣ Airflow 실행 (원클릭)
```powershell
# 자동 설치 및 실행 (권장)
.\start-airflow.ps1
```

**또는 수동 실행:**
```bash
docker-compose up -d
```

### 4️⃣ 접속 확인
- **웹 UI**: http://localhost:8081
- **ID**: `admin`
- **PW**: `admin123!`

---

## 🔍 상태 확인 명령어

### 컨테이너 상태 확인
```bash
docker-compose ps
# 모든 서비스가 "healthy" 상태여야 함
```

### DAG 실행 테스트
```bash
# DAG 목록 확인
docker exec airflow-pipeline-airflow-scheduler-1 airflow dags list

# 수동 실행
docker exec airflow-pipeline-airflow-scheduler-1 airflow dags trigger lifebit_health_analytics_pipeline

# 실행 결과 확인 (약 10초 후)
docker exec airflow-pipeline-airflow-scheduler-1 airflow dags state lifebit_health_analytics_pipeline 2025-06-21
# 출력: "success" 나와야 함
```

---

## 🛠️ 문제 해결

### ❌ 문제: 컨테이너가 시작되지 않음
```bash
# 해결 방법
docker-compose down -v
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### ❌ 문제: "포트가 이미 사용 중" 오류
```bash
# 다른 Airflow 인스턴스 종료
docker ps | grep airflow
docker stop [컨테이너_ID]

# 다시 시도
docker-compose up -d
```

### ❌ 문제: 데이터베이스 연결 실패
```bash
# LifeBit PostgreSQL 상태 확인
cd ..\..\  # 메인 프로젝트 디렉토리로
docker-compose ps

# PostgreSQL이 중지된 경우
docker-compose up -d
```

### ❌ 문제: DAG가 실패함
```bash
# 로그 확인
docker-compose logs airflow-scheduler

# 최신 코드로 재시작
git pull origin main
docker-compose down
docker-compose up -d
```

---

## 📊 정상 동작 확인 체크리스트

### ✅ 컨테이너 상태
- [ ] `airflow-webserver` - healthy
- [ ] `airflow-scheduler` - healthy  
- [ ] `airflow-postgres` - healthy
- [ ] `lifebit_postgres` - running

### ✅ 웹 UI 접속
- [ ] http://localhost:8081 접속 가능
- [ ] admin/admin123! 로그인 성공
- [ ] `lifebit_health_analytics_pipeline` DAG 표시됨

### ✅ DAG 실행
- [ ] DAG 수동 실행 성공
- [ ] 실행 시간 10초 이내
- [ ] 모든 태스크 성공 (초록색)

---

## 🔧 개발 작업 시

### 새로운 DAG 추가
1. `apps/airflow-pipeline/dags/` 에 Python 파일 생성
2. 기존 DAG 참조하여 작성
3. 문법 검사: `python -m py_compile 파일명.py`
4. Git 커밋 및 푸시

### 설정 변경
1. `.env` 파일 수정
2. `docker-compose down && docker-compose up -d`
3. 변경사항 테스트 후 커밋

### 의존성 추가
1. `requirements.txt`에 패키지 추가
2. `docker-compose build --no-cache`
3. `docker-compose up -d`

---

## 📞 도움이 필요할 때

### 1차: 자동 해결 시도
```bash
# 전체 재시작
cd apps\airflow-pipeline
docker-compose down -v
docker-compose up -d
```

### 2차: 로그 확인
```bash
# 오류 로그 확인
docker-compose logs airflow-scheduler | findstr -i error
docker-compose logs airflow-webserver | findstr -i error
```

### 3차: 개발팀 문의
- **GitHub Issues** 등록
- **오류 메시지** 전체 복사
- **실행 환경** 정보 첨부

---

## 💡 팁 & 트릭

### 성능 최적화
```bash
# 불필요한 Docker 이미지 정리
docker system prune -f

# 메모리 사용량 확인
docker stats
```

### 빠른 재시작
```bash
# 스케줄러만 재시작 (빠름)
docker-compose restart airflow-scheduler

# 전체 재시작 (안전함)
docker-compose restart
```

### 로그 모니터링
```bash
# 실시간 로그 확인
docker-compose logs -f airflow-scheduler

# 특정 시간대 로그
docker-compose logs --since="2025-06-21T10:00:00"
```

---

**📝 참고**: 더 자세한 내용은 `LifeBit_Airflow_개발_완료_보고서.md` 참조

**🕐 예상 소요 시간**: 
- 첫 실행: 5-10분
- 재실행: 1-2분
- 문제 해결: 5-15분

**✅ 성공 지표**: DAG 실행 시 "success" 상태, 8-10초 내 완료 