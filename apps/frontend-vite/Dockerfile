# 멀티스테이지 빌드를 사용하여 이미지 크기 최적화
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사
COPY package.json ./

# 의존성 설치 (빌드를 위해 모든 의존성 필요)
RUN npm install

# 빌드 인수 설정 (소스 코드 복사 전에)
ARG VITE_CORE_API_URL
ARG VITE_AI_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_KAKAO_CLIENT_ID

# 환경 변수 설정
ENV VITE_CORE_API_URL=$VITE_CORE_API_URL
ENV VITE_AI_API_URL=$VITE_AI_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_KAKAO_CLIENT_ID=$VITE_KAKAO_CLIENT_ID

# 소스 코드 복사
COPY . .

# 프로덕션 빌드
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine

# 빌드된 파일을 nginx 서버로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 런타임 환경 변수 주입 스크립트 생성
RUN echo '#!/bin/sh' > /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "Injecting runtime environment variables..."' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "window.__VITE_CORE_API_URL__ = \"${VITE_CORE_API_URL:-http://localhost:8080}\";" > /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "window.__VITE_AI_API_URL__ = \"${VITE_AI_API_URL:-http://localhost:8001}\";" >> /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "window.__VITE_GOOGLE_CLIENT_ID__ = \"${VITE_GOOGLE_CLIENT_ID:-}\";" >> /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "window.__VITE_KAKAO_CLIENT_ID__ = \"${VITE_KAKAO_CLIENT_ID:-}\";" >> /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'echo "Generated env.js:"' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    echo 'cat /usr/share/nginx/html/env.js' >> /docker-entrypoint.d/30-inject-runtime-env.sh && \
    chmod +x /docker-entrypoint.d/30-inject-runtime-env.sh

# 포트 노출
EXPOSE 80

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1 