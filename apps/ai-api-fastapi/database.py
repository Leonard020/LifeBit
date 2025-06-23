from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# PostgreSQL 연결 정보 (실제 값으로 교체)
POSTGRES_USER = "lifebit_user"
POSTGRES_PASSWORD = "lifebit_password"
POSTGRES_DB = "lifebit_db"
POSTGRES_HOST = "127.0.0.1"
POSTGRES_PORT = "5432"

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

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
