import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# PostgreSQL 연결 정보 - 로컬 개발과 Docker 환경 모두 지원
POSTGRES_USER = os.getenv("DB_USER", "lifebit_user")
POSTGRES_PASSWORD = os.getenv("DB_PASSWORD", "lifebit_password")
POSTGRES_DB = os.getenv("DB_NAME", "lifebit_db")

# 🔧 DB_HOST 우선순위: 환경변수 → localhost (로컬 개발용)
POSTGRES_HOST = os.getenv("DB_HOST", "localhost")  # 로컬 개발 기본값
POSTGRES_PORT = os.getenv("DB_PORT", "5432")

# 환경 감지: Docker 컨테이너 내부에서 실행 중인지 확인
def is_running_in_docker():
    """Docker 컨테이너 내부에서 실행 중인지 확인"""
    try:
        with open('/proc/1/cgroup', 'r') as f:
            return 'docker' in f.read()
    except:
        return False

# Docker 환경에서는 서비스명 사용, 로컬에서는 localhost 사용
if is_running_in_docker() and POSTGRES_HOST == "localhost":
    POSTGRES_HOST = "postgres-db"
    print(f"[INFO] Docker 환경 감지 - DB 호스트를 postgres-db로 변경")

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

print(f"[INFO] 데이터베이스 연결 정보:")
print(f"  호스트: {POSTGRES_HOST}")
print(f"  포트: {POSTGRES_PORT}")
print(f"  데이터베이스: {POSTGRES_DB}")
print(f"  사용자: {POSTGRES_USER}")
print(f"  연결 URL: postgresql://{POSTGRES_USER}:***@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

# SQLAlchemy 설정
engine = create_engine(
    DATABASE_URL,
    connect_args={"options": "-c timezone=Asia/Seoul"},
    pool_pre_ping=True,  # 연결 유효성 검사
    pool_recycle=3600    # 1시간마다 연결 갱신
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI 의존성으로 사용할 DB 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
