from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DECIMAL, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

Base = declarative_base()

# 🏋️ 운동 기록
class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    exercise_session_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    exercise_catalog_id = Column(Integer, nullable=True)  # 추후 이름 → ID 매핑용
    duration_minutes = Column(Integer)
    calories_burned = Column(Integer)
    notes = Column(Text)
    exercise_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

# 🍽️ 식단 기록
class MealLog(Base):
    __tablename__ = "meal_logs"

    meal_log_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(Integer, nullable=True)  # 추후 음식명 → ID 매핑용
    quantity = Column(DECIMAL(6, 2))
    log_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
