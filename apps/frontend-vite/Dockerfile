# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Arguments that can be passed during the build
ARG VITE_KAKAO_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_CORE_API_URL
ARG VITE_AI_API_URL

# Create a .env file from the build arguments
RUN echo "VITE_KAKAO_CLIENT_ID=${VITE_KAKAO_CLIENT_ID}" > .env
RUN echo "VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}" >> .env
RUN echo "VITE_CORE_API_URL=${VITE_CORE_API_URL}" >> .env
RUN echo "VITE_AI_API_URL=${VITE_AI_API_URL}" >> .env

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 2. Run Stage
FROM nginx:1.27.0-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 