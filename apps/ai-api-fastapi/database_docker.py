import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Docker 환경 전용 PostgreSQL 연결 정보
# 환경변수에서 읽어오기
POSTGRES_USER = os.getenv("DB_USER", "lifebit_user")
POSTGRES_PASSWORD = os.getenv("DB_PASSWORD", "lifebit_password")
POSTGRES_DB = os.getenv("DB_NAME", "lifebit_db")
POSTGRES_HOST = os.getenv("DB_HOST", "postgres-db")  # Docker 컨테이너명
POSTGRES_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

print(f"[DB] Docker environment - Using database URL: {DATABASE_URL.replace(POSTGRES_PASSWORD, '***')}")

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