# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# 빌드 시점에 외부에서 주입될 환경변수 선언
ARG VITE_KAKAO_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_ID

# shared-types 전체 복사
COPY packages/shared-types/ ./packages/shared-types/

# 프론트엔드 소스 복사 (.dockerignore로 node_modules 제외됨)
COPY apps/frontend-vite/ ./apps/frontend-vite/

# 프론트엔드 디렉토리로 이동
WORKDIR /app/apps/frontend-vite

# 주입된 환경변수를 사용하여 .env 파일 생성
RUN echo "VITE_KAKAO_CLIENT_ID=${VITE_KAKAO_CLIENT_ID}" > .env
RUN echo "VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}" >> .env

# workspace 참조를 로컬 경로로 변경
RUN sed -i 's/"shared-types": "workspace:\*"/"shared-types": "file:..\/..\/packages\/shared-types"/g' package.json

# 의존성 설치 및 빌드
RUN npm install && npm run build

# Runtime stage with Nginx
FROM nginx:alpine

# curl 설치 (healthcheck용)
RUN apk add --no-cache curl

# Nginx 설정 파일 복사
COPY apps/frontend-vite/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=build /app/apps/frontend-vite/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"] 