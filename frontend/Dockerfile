# =====================================================================
# REACT VITE FRONTEND PRODUCTION DOCKERFILE (MULTI-STAGE)
# =====================================================================

# Stage 1: Build static assets
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default static files
RUN rm -rf ./*

# Copy built artifacts from Stage 1
COPY --from=build /app/dist .

# Copy custom Nginx configuration
COPY ../docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
