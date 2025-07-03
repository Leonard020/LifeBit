import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# PostgreSQL 연결 정보 (환경 변수에서 가져오기)
POSTGRES_USER = os.getenv("POSTGRES_USER", "lifebit_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "lifebit_password")
POSTGRES_DB = os.getenv("POSTGRES_DB", "lifebit_db")
POSTGRES_HOST = os.getenv("DB_HOST", "postgres-db")  # Docker 환경에서는 컨테이너 이름 사용
POSTGRES_PORT = os.getenv("DB_PORT", "5432")

# 환경 변수에서 DATABASE_URL을 우선적으로 사용
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

print(f"[DATABASE] 연결 URL: {DATABASE_URL}")

# SQLAlchemy 설정
engine = create_engine(
    DATABASE_URL,
    connect_args={"options": "-c timezone=Asia/Seoul"}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPI 의존성으로 사용할 DB 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
