# note_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from schemas import ExerciseChatInput, ExerciseChatOutput

router = APIRouter(tags=["note"])  # 태그 설정 중요
