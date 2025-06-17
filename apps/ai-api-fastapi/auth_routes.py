from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
import requests, os
from dotenv import load_dotenv
from auth_utils import create_access_token
from models import UserRole  # 상단에 추가

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


# ✅ 1. 카카오 로그인 콜백
@router.get("/kakao/callback")
def kakao_callback(code: str, db: Session = Depends(get_db)):
    try:
        # 1️⃣ 카카오 토큰 요청
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_CLIENT_ID,
            "redirect_uri": KAKAO_REDIRECT_URI,
            "code": code
        }
        token_headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        token_res = requests.post(token_url, data=token_data, headers=token_headers)

        # 🔥 디버그: 응답 로그 출력
        print("🔍 [카카오 토큰 응답 코드]:", token_res.status_code)
        print("🔍 [카카오 토큰 응답 본문]:", token_res.text)

        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

        access_token = token_res.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 access_token 없음")

        # 2️⃣ 사용자 정보 요청
        user_res = requests.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_json = user_res.json()
        print("📥 사용자 응답:", user_json)

        kakao_id = user_json.get("id")
        email = user_json.get("kakao_account", {}).get("email")
        nickname = user_json.get("properties", {}).get("nickname")

        if not email:
            raise HTTPException(status_code=400, detail="카카오 이메일 동의 필요")

        if not nickname:
            nickname = f"user_{kakao_id}"

        # 3️⃣ 닉네임 중복 회피
        base_nick = nickname
        suffix = 1
        while db.query(models.User).filter(models.User.nickname == nickname).first():
            nickname = f"{base_nick}_{suffix}"
            suffix += 1

        # 4️⃣ 유저 생성 or 조회
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                nickname=nickname,
                role=UserRole.USER,
                provider="kakao"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 5️⃣ JWT 발급
        jwt_token = create_access_token(email=email, user_id=user.user_id, role=user.role.value)

        return {
            "access_token": jwt_token,
            "provider": "kakao",
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role.value,
        }

    except Exception as e:
        print("🔥 카카오 로그인 오류:", e)
        raise HTTPException(status_code=500, detail=f"카카오 로그인 실패: {e}")



# ✅ 2. 구글 로그인 콜백
@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    try:
        token_res = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )

        print("🔍 구글 토큰 요청 status:", token_res.status_code)
        print("🔍 구글 토큰 요청 body:", token_res.text)

        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"구글 토큰 발급 실패: {token_res.text}")

        access_token = token_res.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="구글 access_token 없음")

        userinfo = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        email = userinfo.get("email")
        name = userinfo.get("name")
        if not email:
            raise HTTPException(status_code=400, detail="구글 이메일 정보 없음")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                nickname=name or email.split("@")[0],
                role=UserRole.USER,
                provider="google" 
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token(email=email, user_id=user.user_id, role=user.role.value)

        return {
            "access_token": jwt_token,
            "provider": "google",
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
        }

    except Exception as e:
        print("🔥 구글 로그인 오류:", e)
        raise HTTPException(status_code=500, detail="구글 로그인 실패")
    

@router.post("/login")
def login_user(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="존재하지 않는 이메일입니다.")
    
    # ⚠️ 실제 서비스에서는 비밀번호 해시 비교 필요
    if user.password != password:
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    jwt_token = create_access_token(email=user.email, user_id=user.user_id, role=user.role.value)

    return {
        "access_token": jwt_token,
        "user_id": user.user_id,
        "email": user.email,
        "nickname": user.nickname,
        "role": user.role.value,
        "provider": user.provider or "local"
    }