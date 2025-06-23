from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DECIMAL, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import DateTime
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid
import enum

# KST 시간대 함수
def get_kst_now():
    return datetime.now(ZoneInfo("Asia/Seoul"))

Base = declarative_base()

# 🎖️ 유저 권한 ENUM 정의
class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"

# 🏋️ 운동 기록
class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    exercise_session_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    exercise_catalog_id = Column(Integer, nullable=True)
    weight = Column(DECIMAL(6, 2), nullable=True)
    reps = Column(Integer, nullable=True)
    sets = Column(Integer, nullable=True)
    duration_minutes = Column(Integer)
    calories_burned = Column(Integer)
    notes = Column(Text)
    exercise_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)

# 🍽️ 식단 기록
class MealLog(Base):
    __tablename__ = "meal_logs"

    meal_log_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(Integer, nullable=True)
    quantity = Column(DECIMAL(6, 2))
    log_date = Column(Date, nullable=False)
    meal_time = Column(SqlEnum('breakfast', 'lunch', 'dinner', 'snack', name='meal_time_type'), nullable=False)
    calories = Column(DECIMAL(6, 2), nullable=True)
    carbs = Column(DECIMAL(6, 2), nullable=True)
    protein = Column(DECIMAL(6, 2), nullable=True)
    fat = Column(DECIMAL(6, 2), nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

# 👤 사용자 테이블
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)

    # 🔑 로그인 정보
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # 소셜 로그인 시 null 가능
    provider = Column(String(20), nullable=True)  # kakao, google 등

    # 🙍 프로필 정보
    nickname = Column(String(100), unique=True, nullable=False)
    height = Column(DECIMAL(5, 2), nullable=True)
    weight = Column(DECIMAL(5, 2), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)

    # 🔐 권한 (ENUM)
    role = Column(SqlEnum(UserRole, name="user_role", create_type=True), 
                  default=UserRole.USER, nullable=False)

    created_at = Column(TIMESTAMP, default=get_kst_now)
    updated_at = Column(TIMESTAMP, default=get_kst_now, onupdate=get_kst_now)
    last_visited = Column(DateTime, nullable=True)

class FoodItem(Base):
    __tablename__ = "food_items"

    food_item_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    calories = Column(DECIMAL(6, 2), nullable=True)
    carbs = Column(DECIMAL(6, 2), nullable=True)
    protein = Column(DECIMAL(6, 2), nullable=True)
    fat = Column(DECIMAL(6, 2), nullable=True)
    serving_size = Column(DECIMAL(6, 2), nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
