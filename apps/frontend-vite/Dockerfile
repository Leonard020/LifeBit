# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# shared-types 패키지를 먼저 복사
COPY packages/shared-types ./packages/shared-types

# 프론트엔드 package.json 복사 (package-lock.json은 제외)
COPY apps/frontend-vite/package.json ./

# workspace 의존성을 로컬 경로로 수정
RUN sed -i 's/"shared-types": "workspace:\*"/"shared-types": "file:\.\/packages\/shared-types"/g' package.json

# 의존성 설치 (lock 파일 재생성)
RUN npm install

# 프론트엔드 소스 코드 복사 (node_modules 제외)
COPY apps/frontend-vite/src ./src
COPY apps/frontend-vite/public ./public
COPY apps/frontend-vite/index.html ./
COPY apps/frontend-vite/vite.config.ts ./
COPY apps/frontend-vite/tsconfig*.json ./
COPY apps/frontend-vite/tailwind.config.ts ./
COPY apps/frontend-vite/postcss.config.js ./
COPY apps/frontend-vite/components.json ./
COPY apps/frontend-vite/eslint.config.js ./
COPY apps/frontend-vite/.env* ./

# 프로덕션 빌드
RUN npm run build

# Runtime stage with Nginx
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY apps/frontend-vite/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"] 