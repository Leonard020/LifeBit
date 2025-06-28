#!/bin/bash

# PostgreSQL 데이터베이스 헬스체크 스크립트
# 데이터베이스 연결 상태와 필수 테이블 존재 여부 확인

set -e

# 환경 변수 기본값 설정
POSTGRES_USER=${POSTGRES_USER:-lifebit_user}
POSTGRES_DB=${POSTGRES_DB:-lifebit_db}

# 1단계: 기본 PostgreSQL 연결 확인
echo "[DB Health] 1단계: PostgreSQL 서버 연결 확인..."
if ! pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; then
    echo "[DB Health] ❌ PostgreSQL 서버 연결 실패"
    exit 1
fi
echo "[DB Health] ✅ PostgreSQL 서버 연결 성공"

# 2단계: 데이터베이스 존재 확인
echo "[DB Health] 2단계: 데이터베이스 '$POSTGRES_DB' 존재 확인..."
if ! psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[DB Health] ❌ 데이터베이스 '$POSTGRES_DB' 접근 실패"
    exit 1
fi
echo "[DB Health] ✅ 데이터베이스 '$POSTGRES_DB' 접근 성공"

# 3단계: 필수 테이블 존재 확인
echo "[DB Health] 3단계: 필수 테이블 존재 확인..."

REQUIRED_TABLES=(
    "users"
    "user_goals"
    "health_records"
    "exercise_catalog"
    "exercise_sessions"
    "food_items"
    "meal_logs"
    "user_ranking"
    "ranking_history"
    "achievements"
    "user_achievements"
    "notification"
    "voice_recognition_logs"
    "validation_history"
)

MISSING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    if ! psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "[DB Health] ❌ 누락된 테이블 발견: ${MISSING_TABLES[*]}"
    echo "[DB Health] 데이터베이스 초기화가 필요합니다."
    exit 1
fi
echo "[DB Health] ✅ 모든 필수 테이블 존재 확인"

# 4단계: 확장(Extension) 확인
echo "[DB Health] 4단계: PostgreSQL 확장 확인..."
if ! psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto';" | grep -q "1"; then
    echo "[DB Health] ❌ pgcrypto 확장이 설치되지 않음"
    exit 1
fi
echo "[DB Health] ✅ 필수 확장 설치 확인"

# 5단계: 기본 데이터 확인 (더미 사용자 존재 여부)
echo "[DB Health] 5단계: 기본 데이터 확인..."
USER_COUNT=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
if [ "$USER_COUNT" -eq 0 ]; then
    echo "[DB Health] ⚠️  경고: 사용자 데이터가 없습니다. 초기 데이터 로드가 필요할 수 있습니다."
else
    echo "[DB Health] ✅ 사용자 데이터 존재 ($USER_COUNT명)"
fi

# 6단계: 데이터베이스 통계 정보
echo "[DB Health] 6단계: 데이터베이스 통계..."
STATS=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "
SELECT 
    'Tables: ' || COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
")
echo "[DB Health] 📊 $STATS"

echo "[DB Health] ✅ 모든 헬스체크 통과"
exit 0 