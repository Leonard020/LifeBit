# 📁 apps/ai-api-fastapi/auth_utils.py

import jwt
from datetime import datetime, timedelta
import os
from typing import Optional, Dict

# ✅ 환경변수 불러오기 (.env 사용 시)
JWT_SECRET = os.getenv("JWT_SECRET", "defaultSecretKey12345678901234567890")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

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
