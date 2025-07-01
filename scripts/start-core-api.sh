#!/bin/bash

# 스크립트 디렉토리 설정
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# 환경변수 로드 (.env 파일이 있는 경우)
if [ -f "$ROOT_DIR/.env" ]; then
    echo "Loading environment variables from .env file..."
    export $(cat "$ROOT_DIR/.env" | grep -v '^#' | grep -v '^$' | xargs)
fi

# 개발환경 설정
export SPRING_PROFILES_ACTIVE=development

echo "Starting Spring Boot Core API in development mode..."
echo "Active profile: $SPRING_PROFILES_ACTIVE"

# Spring Boot 애플리케이션 시작
cd "$ROOT_DIR/apps/core-api-spring"
./mvnw spring-boot:run -Dspring-boot.run.profiles=development 