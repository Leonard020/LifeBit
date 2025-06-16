
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

# 환경변수
KAKAO_CLIENT_ID = os.getenv("KAKAO_CLIENT_ID")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

# 카카오 OAuth 콜백
@router.get("/kakao/callback")
def kakao_callback(code: str):
    token_url = "https://kauth.kakao.com/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "code": code
    }
    token_res = requests.post(token_url, data=token_data).json()
    access_token = token_res.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

    user_res = requests.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    kakao_id = user_res.get("id")
    email = user_res.get("kakao_account", {}).get("email")
    nickname = user_res.get("properties", {}).get("nickname")

    print("✅ 카카오 사용자 정보:", kakao_id, email, nickname)

    # TODO: DB 저장/조회 후 JWT 발급
    return {"provider": "kakao", "email": email, "nickname": nickname}

# 구글 OAuth 콜백
@router.get("/auth/google/callback")
def google_callback(code: str):
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    token_res = requests.post(token_url, data=token_data).json()
    access_token = token_res.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="구글 토큰 발급 실패")

    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    email = userinfo.get("email")
    name = userinfo.get("name")

    print("✅ 구글 사용자 정보:", email, name)

    # TODO: DB 저장/조회 후 JWT 발급
    return {"provider": "google", "email": email, "name": name}
