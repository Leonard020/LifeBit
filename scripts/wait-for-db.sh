#!/bin/bash

# 데이터베이스 연결 대기 스크립트
# 서비스 시작 전 데이터베이스가 완전히 준비될 때까지 대기

set -e

# 환경 변수 기본값 설정
DB_HOST=${DB_HOST:-postgres-db}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-lifebit_db}
DB_USER=${DB_USER:-lifebit_user}
DB_PASSWORD=${DB_PASSWORD:-lifebit_password}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-60}
WAIT_INTERVAL=${WAIT_INTERVAL:-5}

echo "[Wait-for-DB] 데이터베이스 연결 대기 시작..."
echo "[Wait-for-DB] 대상: $DB_HOST:$DB_PORT/$DB_NAME"
echo "[Wait-for-DB] 최대 대기 시간: $((MAX_ATTEMPTS * WAIT_INTERVAL))초"

# PostgreSQL 클라이언트 도구 확인
if ! command -v psql &> /dev/null; then
    echo "[Wait-for-DB] ❌ psql 명령어를 찾을 수 없습니다."
    echo "[Wait-for-DB] PostgreSQL 클라이언트가 설치되어 있는지 확인하세요."
    exit 1
fi

# 데이터베이스 연결 대기
attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo "[Wait-for-DB] 시도 $attempt/$MAX_ATTEMPTS: 데이터베이스 연결 확인 중..."
    
    # 1단계: 포트 연결 확인
    if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "[Wait-for-DB] ⏳ 포트 $DB_PORT 연결 대기 중..."
        sleep $WAIT_INTERVAL
        ((attempt++))
        continue
    fi
    
    # 2단계: PostgreSQL 서버 응답 확인
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q; then
        echo "[Wait-for-DB] ⏳ PostgreSQL 서버 응답 대기 중..."
        sleep $WAIT_INTERVAL
        ((attempt++))
        continue
    fi
    
    # 3단계: 데이터베이스 접근 확인
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        echo "[Wait-for-DB] ⏳ 데이터베이스 접근 권한 대기 중..."
        sleep $WAIT_INTERVAL
        ((attempt++))
        continue
    fi
    
    # 4단계: 필수 테이블 존재 확인
    REQUIRED_TABLES=("users" "exercise_sessions" "meal_logs" "health_records")
    ALL_TABLES_EXIST=true
    
    for table in "${REQUIRED_TABLES[@]}"; do
        if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            echo "[Wait-for-DB] ⏳ 테이블 '$table' 생성 대기 중..."
            ALL_TABLES_EXIST=false
            break
        fi
    done
    
    if [ "$ALL_TABLES_EXIST" = false ]; then
        sleep $WAIT_INTERVAL
        ((attempt++))
        continue
    fi
    
    # 5단계: 확장(Extension) 확인
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto';" | grep -q "1"; then
        echo "[Wait-for-DB] ⏳ pgcrypto 확장 설치 대기 중..."
        sleep $WAIT_INTERVAL
        ((attempt++))
        continue
    fi
    
    # 모든 확인 완료
    echo "[Wait-for-DB] ✅ 데이터베이스 준비 완료!"
    echo "[Wait-for-DB] 📊 연결 정보:"
    
    # 데이터베이스 통계 출력
    STATS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT 
        'Tables: ' || COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    " | tr -d ' ')
    
    USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    
    echo "[Wait-for-DB] 📊 $STATS"
    echo "[Wait-for-DB] 👥 Users: $USER_COUNT"
    echo "[Wait-for-DB] ⏰ 총 대기 시간: $((attempt * WAIT_INTERVAL))초"
    
    exit 0
done

# 최대 시도 횟수 초과
echo "[Wait-for-DB] ❌ 데이터베이스 연결 실패"
echo "[Wait-for-DB] 최대 대기 시간($((MAX_ATTEMPTS * WAIT_INTERVAL))초)을 초과했습니다."
echo "[Wait-for-DB] 다음을 확인해주세요:"
echo "  1. PostgreSQL 서버가 실행 중인지 확인"
echo "  2. 네트워크 연결 상태 확인"
echo "  3. 데이터베이스 자격 증명 확인"
echo "  4. LifeBit.sql 스크립트가 올바르게 실행되었는지 확인"

exit 1 