# frontend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .

# 開発用（Vite）
CMD ["npm", "run", "dev", "--", "--host"]


# Production build の例（コメントアウト）
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY frontend/ .
# RUN npm ci && npm run build
#
# FROM nginx:alpine AS prod
# COPY --from=build /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]