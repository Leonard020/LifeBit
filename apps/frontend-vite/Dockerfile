# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# shared-types 전체 복사
COPY packages/shared-types/ ./packages/shared-types/

# 프론트엔드 소스 복사 (.dockerignore로 node_modules 제외됨)
COPY apps/frontend-vite/ ./apps/frontend-vite/

# 프론트엔드 디렉토리로 이동
WORKDIR /app/apps/frontend-vite

# workspace 참조를 로컬 경로로 변경
RUN sed -i 's/"shared-types": "workspace:\*"/"shared-types": "file:..\/..\/packages\/shared-types"/g' package.json

# 의존성 설치 및 빌드
RUN npm install && npm run build

# Runtime stage with Nginx
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY apps/frontend-vite/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=build /app/apps/frontend-vite/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"] 