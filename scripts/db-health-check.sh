#!/bin/bash

# PostgreSQL 헬스체크 스크립트
# Docker 컨테이너 내부에서 실행되는 간단한 체크

set -e

# pg_isready 명령어 실행
pg_isready -U ${PGUSER:-lifebit_user} -d ${PGDATABASE:-lifebit_db}

# 추가로 간단한 쿼리 실행
psql -U ${PGUSER:-lifebit_user} -d ${PGDATABASE:-lifebit_db} -c "SELECT 1" > /dev/null

exit 0 