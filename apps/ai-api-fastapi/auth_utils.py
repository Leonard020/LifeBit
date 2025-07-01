# 📁 apps/ai-api-fastapi/auth_utils.py

import jwt
from datetime import datetime, timedelta
import os
from typing import Dict
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import smtplib
from email.mime.text import MIMEText

# ✅ 환경변수 불러오기 (.env 사용 시)
JWT_SECRET = os.getenv("JWT_SECRET", "defaultSecretKey12345678901234567890")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

RESET_SECRET_KEY = os.getenv("RESET_SECRET_KEY", "resetSecretKey1234567890")
RESET_PASSWORD_SALT = os.getenv("RESET_PASSWORD_SALT", "resetPasswordSalt123")

# ✅ 토큰 생성 함수
def create_access_token(email: str, user_id: int, role: str = "USER") -> str:
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "userId": user_id,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": expire
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

# ✅ 토큰 검증 함수 (에러 문자열 반환 or raise 선택 가능)
def verify_access_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception("토큰이 만료되었습니다.")
    except jwt.InvalidTokenError:
        raise Exception("유효하지 않은 토큰입니다.")

def get_reset_serializer():
    return URLSafeTimedSerializer(RESET_SECRET_KEY)

def create_reset_token(email: str) -> str:
    serializer = get_reset_serializer()
    return serializer.dumps(email, salt=RESET_PASSWORD_SALT)

def verify_reset_token(token: str, expiration=3600) -> str | None:
    serializer = get_reset_serializer()
    try:
        email = serializer.loads(token, salt=RESET_PASSWORD_SALT, max_age=expiration)
        return email
    except (SignatureExpired, BadSignature):
        return None

def send_reset_email(email: str, token: str):
    SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 25))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASS = os.getenv("SMTP_PASS")
    EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@lifebit.com")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "LifeBit 비밀번호 재설정"
    body = f"비밀번호를 재설정하려면 아래 링크를 클릭하세요:\n\n{reset_link}\n\n이 링크는 1시간 동안만 유효합니다."
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(msg['From'], [msg['To']], msg.as_string())
    except Exception as e:
        raise
