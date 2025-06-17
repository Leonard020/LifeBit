from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from database import get_db
import models
import requests, os
from dotenv import load_dotenv
from auth_utils import create_access_token
from models import UserRole  # 상단에 추가
from fastapi.responses import JSONResponse
from pathlib import Path

# Load .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

router = APIRouter(tags=["auth"])

# 환경 변수 로드 확인
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# 환경 변수 검증
if not all([KAKAO_CLIENT_ID, KAKAO_REDIRECT_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI]):
    print("[WARN] Some environment variables are not set:")
    print(f"[WARN] KAKAO_CLIENT_ID: {KAKAO_CLIENT_ID}")
    print(f"[WARN] KAKAO_REDIRECT_URI: {KAKAO_REDIRECT_URI}")
    print(f"[WARN] GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID}")
    print(f"[WARN] GOOGLE_CLIENT_SECRET: {GOOGLE_CLIENT_SECRET}")
    print(f"[WARN] GOOGLE_REDIRECT_URI: {GOOGLE_REDIRECT_URI}")


# ✅ 1. 카카오 로그인 콜백
@router.get("/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    try:
        if not code:
            raise HTTPException(
                status_code=400,
                detail="Authorization code is required"
            )

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

        print("[DEBUG] Kakao token request data:", token_data)
        token_res = requests.post(token_url, data=token_data, headers=token_headers)
        print("[DEBUG] Kakao token response status:", token_res.status_code)
        print("[DEBUG] Kakao token response body:", token_res.text)

        if token_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail=f"카카오 토큰 발급 실패: {token_res.text}"
            )

        token_json = token_res.json()
        access_token = token_json.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="카카오 access_token 없음"
            )

        # 2️⃣ 사용자 정보 요청
        user_res = requests.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        print("🔍 카카오 사용자 정보 응답:", user_res.text)

        if user_res.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="카카오 사용자 정보 조회 실패"
            )

        user_json = user_res.json()
        kakao_id = user_json.get("id")
        email = user_json.get("kakao_account", {}).get("email")
        nickname = user_json.get("properties", {}).get("nickname")

        if not email:
            raise HTTPException(
                status_code=400,
                detail="카카오 이메일 동의 필요"
            )

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
            try:
                db.commit()
                db.refresh(user)
            except Exception as e:
                db.rollback()
                print("🔥 DB 저장 오류:", str(e))
                raise HTTPException(
                    status_code=500,
                    detail="사용자 정보 저장 실패"
                )

        # 5️⃣ JWT 발급
        jwt_token = create_access_token(
            email=email,
            user_id=user.user_id,
            role=user.role.value
        )

        return {
            "access_token": jwt_token,
            "provider": "kakao",
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role.value
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print("🔥 카카오 로그인 오류:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"카카오 로그인 실패: {str(e)}"
        )



# ✅ 2. 구글 로그인 콜백
@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    try:
        print("[DEBUG] Google callback received with code:", code)
        
        if not code:
            print("[ERROR] No authorization code provided")
            raise HTTPException(
                status_code=400,
                detail="Authorization code is required"
            )

        # Google OAuth 토큰 요청
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        print("[DEBUG] Google token request data:", token_data)
        
        token_res = requests.post(token_url, data=token_data)
        print("[DEBUG] Google token response status:", token_res.status_code)
        print("[DEBUG] Google token response body:", token_res.text)

        if token_res.status_code != 200:
            print("[ERROR] Failed to get Google token:", token_res.text)
            raise HTTPException(
                status_code=400,
                detail=f"구글 토큰 발급 실패: {token_res.text}"
            )

        token_json = token_res.json()
        access_token = token_json.get("access_token")
        
        if not access_token:
            print("[ERROR] No access token in Google response")
            raise HTTPException(
                status_code=400,
                detail="구글 access_token 없음"
            )

        # 사용자 정보 요청
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        userinfo_res = requests.get(
            userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        print("[DEBUG] Google user info response:", userinfo_res.text)
        
        if userinfo_res.status_code != 200:
            print("[ERROR] Failed to get Google user info:", userinfo_res.text)
            raise HTTPException(
                status_code=400,
                detail="구글 사용자 정보 조회 실패"
            )

        userinfo = userinfo_res.json()
        email = userinfo.get("email")
        name = userinfo.get("name")

        if not email:
            print("[ERROR] No email in Google user info")
            raise HTTPException(
                status_code=400,
                detail="구글 이메일 정보 없음"
            )

        print("[DEBUG] Google user info:", {"email": email, "name": name})

        # 사용자 생성 또는 조회
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print("[DEBUG] Creating new user for Google login")
            user = models.User(
                email=email,
                nickname=name or email.split("@")[0],
                role=UserRole.USER,
                provider="google"
            )
            db.add(user)
            try:
                db.commit()
                db.refresh(user)
                print("[DEBUG] New user created successfully")
            except Exception as e:
                db.rollback()
                print("[ERROR] Failed to create user:", str(e))
                raise HTTPException(
                    status_code=500,
                    detail="사용자 정보 저장 실패"
                )

        # JWT 토큰 생성
        jwt_token = create_access_token(
            email=email,
            user_id=user.user_id,
            role=user.role.value
        )

        print("[DEBUG] Login successful for user:", user.email)
        return {
            "access_token": jwt_token,
            "provider": "google",
            "user_id": user.user_id,
            "email": user.email,
            "nickname": user.nickname,
            "role": user.role.value
        }

    except HTTPException as he:
        print("[ERROR] HTTP Exception:", str(he))
        raise he
    except Exception as e:
        print("[ERROR] Unexpected error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"구글 로그인 실패: {str(e)}"
        )
    

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