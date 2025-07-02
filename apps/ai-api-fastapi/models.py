from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DECIMAL, TIMESTAMP, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import DateTime
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid
import enum
from sqlalchemy import UniqueConstraint, Index
from sqlalchemy.orm import validates, object_session
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import event
from sqlalchemy import inspect

# KST 시간대 함수
def get_kst_now():
    return datetime.now(ZoneInfo("Asia/Seoul"))

Base = declarative_base()

# 🎖️ ENUM 정의 (SQL 기준 모두 추가)
class UserRole(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class BadgeType(enum.Enum):
    FIRST_LOGIN = "FIRST_LOGIN"
    STREAK_7 = "STREAK_7"
    STREAK_30 = "STREAK_30"
    STREAK_100 = "STREAK_100"
    WEIGHT_GOAL = "WEIGHT_GOAL"
    WORKOUT_GOAL = "WORKOUT_GOAL"
    NUTRITION_GOAL = "NUTRITION_GOAL"
    SOCIAL_SHARE = "SOCIAL_SHARE"
    PERFECT_WEEK = "PERFECT_WEEK"
    MONTHLY_CHAMPION = "MONTHLY_CHAMPION"

class BodyPartType(enum.Enum):
    chest = "chest"
    back = "back"
    legs = "legs"
    shoulders = "shoulders"
    arms = "arms"
    abs = "abs"
    cardio = "cardio"

class InputSourceType(enum.Enum):
    VOICE = "VOICE"
    TYPING = "TYPING"

class ValidationStatusType(enum.Enum):
    PENDING = "PENDING"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class MealTimeType(enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"
    midnight = "midnight"
    아침 = "아침"
    점심 = "점심"
    저녁 = "저녁"
    야식 = "야식"
    간식 = "간식"

# 🏋️ 운동 기록
class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"
    __table_args__ = (
        Index("idx_exercise_sessions_user_date", "user_id", "exercise_date"),
        Index("idx_exercise_sessions_catalog", "exercise_catalog_id"),
        Index("idx_exercise_sessions_validation", "validation_status"),
    )

    exercise_session_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    exercise_catalog_id = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    calories_burned = Column(Integer, nullable=True)
    weight = Column(DECIMAL(5, 2), nullable=True)
    reps = Column(Integer, nullable=True)
    sets = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    exercise_date = Column(Date, nullable=True)
    time_period = Column(String(20), nullable=True)
    input_source = Column(SqlEnum(InputSourceType, name="input_source_type", create_type=True), nullable=True)
    confidence_score = Column(DECIMAL(4, 2), nullable=True)
    validation_status = Column(SqlEnum(ValidationStatusType, name="validation_status_type", create_type=True), default=ValidationStatusType.PENDING, nullable=True)
    validation_notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

    @validates('confidence_score')
    def validate_confidence_score(self, key, value):
        if value is not None and (value < 0 or value > 1):
            raise ValueError('confidence_score must be between 0 and 1')
        return value

# 🍽️ 식단 기록
class MealLog(Base):
    __tablename__ = "meal_logs"
    __table_args__ = (
        Index("idx_meal_logs_user_date", "user_id", "log_date"),
        Index("idx_meal_logs_food", "food_item_id"),
        Index("idx_meal_logs_validation", "validation_status"),
    )

    meal_log_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    food_item_id = Column(Integer, nullable=True)
    meal_time = Column(SqlEnum(MealTimeType, name="meal_time_type", create_type=True), nullable=False)
    quantity = Column(DECIMAL(6, 2), nullable=True)
    log_date = Column(Date, nullable=False)
    input_source = Column(SqlEnum(InputSourceType, name="input_source_type", create_type=True), nullable=True)
    confidence_score = Column(DECIMAL(4, 2), nullable=True)
    original_audio_path = Column(String(255), nullable=True)
    validation_status = Column(SqlEnum(ValidationStatusType, name="validation_status_type", create_type=True), default=ValidationStatusType.PENDING, nullable=True)
    validation_notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

    @validates('confidence_score')
    def validate_confidence_score(self, key, value):
        if value is not None and (value < 0 or value > 1):
            raise ValueError('confidence_score must be between 0 and 1')
        return value

# 👤 사용자 테이블
class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email"),
        UniqueConstraint("nickname"),
        Index("idx_users_email", "email"),
        Index("idx_users_nickname", "nickname"),
        Index("idx_users_provider", "provider"),
    )

    user_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    provider = Column(String(50), nullable=True)  # SQL: 50자
    nickname = Column(String(100), unique=True, nullable=False)
    profile_image_url = Column(String(255), nullable=True)
    height = Column(DECIMAL(5, 2), nullable=True)
    weight = Column(DECIMAL(5, 2), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    role = Column(SqlEnum(UserRole, name="user_role", create_type=True), default=UserRole.USER, nullable=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    updated_at = Column(TIMESTAMP, default=get_kst_now, onupdate=get_kst_now)
    last_visited = Column(DateTime, nullable=True)

    # gender 값 검증
    @validates('gender')
    def validate_gender(self, key, value):
        if value not in (None, 'male', 'female'):
            raise ValueError("gender must be 'male' or 'female'")
        return value

# 음식 아이템
class FoodItem(Base):
    __tablename__ = "food_items"

    food_item_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    food_code = Column(String(50), unique=True, nullable=True)
    name = Column(String(255), nullable=False)
    serving_size = Column(DECIMAL(6, 2), nullable=True)
    calories = Column(DECIMAL(6, 2), nullable=True)
    carbs = Column(DECIMAL(6, 2), nullable=True)
    protein = Column(DECIMAL(6, 2), nullable=True)
    fat = Column(DECIMAL(6, 2), nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

class HealthRecord(Base):
    __tablename__ = "health_records"
    health_record_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    weight = Column(DECIMAL(5, 2), nullable=True)
    height = Column(DECIMAL(5, 2), nullable=True)
    record_date = Column(Date, nullable=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)

    @hybrid_property
    def bmi(self):
        # 실제 인스턴스 값일 때만 계산
        if not hasattr(self, '_sa_instance_state'):
            return None
        w = getattr(self, 'weight', None)
        h = getattr(self, 'height', None)
        if w is not None and h is not None and h != 0:
            return round(float(w) / ((float(h) / 100) ** 2), 2)
        return None

class UserGoal(Base):
    __tablename__ = "user_goals"
    __table_args__ = (
        UniqueConstraint("uuid"),
        Index("idx_user_goals_user_id", "user_id"),
    )
    user_goal_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    weekly_workout_target = Column(Integer, default=3)
    weekly_chest = Column(Integer, default=0)
    weekly_back = Column(Integer, default=0)
    weekly_legs = Column(Integer, default=0)
    weekly_shoulders = Column(Integer, default=0)
    weekly_arms = Column(Integer, default=0)
    weekly_abs = Column(Integer, default=0)
    weekly_cardio = Column(Integer, default=0)
    daily_carbs_target = Column(Integer, default=200)
    daily_protein_target = Column(Integer, default=120)
    daily_fat_target = Column(Integer, default=60)
    daily_calory_target = Column(Integer, default=1500)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    updated_at = Column(TIMESTAMP, default=get_kst_now, onupdate=get_kst_now)

class UserRanking(Base):
    __tablename__ = "user_ranking"
    __table_args__ = (
        Index("idx_user_ranking_user_id", "user_id"),
        Index("idx_user_ranking_total_score", "total_score"),
        Index("idx_user_ranking_rank_position", "rank_position"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    total_score = Column(Integer, default=0, nullable=False)
    streak_days = Column(Integer, default=0, nullable=False)
    rank_position = Column(Integer, default=0, nullable=False)
    previous_rank = Column(Integer, default=0, nullable=False)
    season = Column(Integer, default=1, nullable=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    last_updated_at = Column(TIMESTAMP, default=get_kst_now, onupdate=get_kst_now)
    is_active = Column(Boolean, default=True, nullable=False)
    tier = Column(String(32), default='UNRANK')

class Achievement(Base):
    __tablename__ = "achievements"
    achievement_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    badge_type = Column(SqlEnum(BadgeType, name="badge_type", create_type=True), nullable=False)
    target_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    user_achievement_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.achievement_id", ondelete="CASCADE"), nullable=False)
    is_achieved = Column(Boolean, default=False)
    progress = Column(Integer, default=0)
    achieved_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (UniqueConstraint("user_id", "achievement_id"),)

class Recommendation(Base):
    __tablename__ = "recommendation"
    recommendation_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, nullable=True)
    recommendation_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (Index("idx_recommendation_user", "user_id"),)

class Feedback(Base):
    __tablename__ = "feedback"
    feedback_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    recommendation_id = Column(Integer, ForeignKey("recommendation.recommendation_id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    feedback_type = Column(String(100), nullable=True)
    feedback_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (Index("idx_feedback_recommendation", "recommendation_id"), Index("idx_feedback_user", "user_id"),)

class Policy(Base):
    __tablename__ = "policy"
    policy_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    policy_name = Column(String(255), nullable=False)
    policy_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    updated_at = Column(TIMESTAMP, default=get_kst_now, onupdate=get_kst_now)

class VoiceRecognitionLog(Base):
    __tablename__ = "voice_recognition_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    audio_file_path = Column(String(255), nullable=True)
    transcription_text = Column(Text, nullable=True)
    confidence_score = Column(DECIMAL(4, 2), nullable=True)
    recognition_type = Column(String(20), nullable=False)
    status = Column(SqlEnum(ValidationStatusType, name="validation_status_type", create_type=True), default=ValidationStatusType.PENDING)
    error_message = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    processed_at = Column(TIMESTAMP, nullable=True)
    __table_args__ = (Index("idx_voice_recognition_logs_user", "user_id"), Index("idx_voice_recognition_logs_status", "status"), Index("idx_voice_recognition_logs_created", "created_at"),)

    @validates('confidence_score')
    def validate_confidence_score(self, key, value):
        if value is not None and (value < 0 or value > 1):
            raise ValueError('confidence_score must be between 0 and 1')
        return value

class ValidationHistory(Base):
    __tablename__ = "validation_history"
    history_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    record_type = Column(String(20), nullable=False)
    record_id = Column(Integer, nullable=False)
    validation_status = Column(SqlEnum(ValidationStatusType, name="validation_status_type", create_type=True), nullable=False)
    validation_notes = Column(Text, nullable=True)
    validated_by = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (Index("idx_validation_history_record", "record_type", "record_id"), Index("idx_validation_history_user", "user_id"), Index("idx_validation_history_created", "created_at"),)

class Notification(Base):
    __tablename__ = "notification"
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False)
    ref_id = Column(Integer, nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (Index("idx_notification_user_id", "user_id"), Index("idx_notification_type", "type"), Index("idx_notification_created_at", "created_at"), Index("idx_notification_is_read", "is_read"),)

class NotificationRead(Base):
    __tablename__ = "notification_read"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    notification_id = Column(Integer, ForeignKey("notification.id", ondelete="CASCADE"), nullable=False)
    read_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (UniqueConstraint("user_id", "notification_id"), Index("idx_notification_read_user_notification", "user_id", "notification_id"),)

class Log(Base):
    __tablename__ = "log"
    log_id = Column(Integer, primary_key=True, index=True)
    uuid = Column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    event_type = Column(String(100), nullable=True)
    event_data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)
    __table_args__ = (Index("idx_log_created_at", "created_at", "event_type"),)

# 🏋️ 운동 카탈로그
class ExerciseCatalog(Base):
    __tablename__ = "exercise_catalog"
    exercise_catalog_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    body_part = Column(SqlEnum(BodyPartType, name="body_part_type", create_type=True), nullable=False)
    exercise_type = Column(String(50), nullable=True)  # 예: strength/cardio 등
    description = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, default=get_kst_now)

# 트리거 기반 자동 기록: validation_status 변경 시 validation_history 자동 기록
def log_validation_change(mapper, connection, target):
    session = object_session(target)
    if session is None:
        return
    # validation_status 변경 감지
    if hasattr(target, 'validation_status'):
        state = inspect(target)
        hist = state.attrs['validation_status'].history
        if hist.has_changes():
            from datetime import datetime
            from .models import ValidationHistory
            session.add(ValidationHistory(
                uuid=uuid.uuid4(),
                user_id=target.user_id,
                record_type='EXERCISE' if hasattr(target, 'exercise_session_id') else 'MEAL',
                record_id=getattr(target, 'exercise_session_id', getattr(target, 'meal_log_id', None)),
                validation_status=target.validation_status,
                validated_by='SYSTEM',
                created_at=datetime.now()
            ))

# 이벤트 리스너 등록
try:
    event.listen(ExerciseSession, 'after_update', log_validation_change)
except Exception:
    pass
try:
    event.listen(MealLog, 'after_update', log_validation_change)
except Exception:
    pass

# log 테이블 파티셔닝 주석
# NOTE: log 테이블은 월별 파티셔닝이 SQL에 정의되어 있으나, SQLAlchemy에서 직접 지원하지 않으므로 DB에서 직접 관리 필요
