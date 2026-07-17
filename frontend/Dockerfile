# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
# REACT_APP_GATEWAY_URL is baked in at build time by CRA
ARG REACT_APP_GATEWAY_URL=http://localhost:8080
ENV REACT_APP_GATEWAY_URL=$REACT_APP_GATEWAY_URL
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# nginx config: redirect all routes to index.html (SPA)
RUN printf 'server {\n  listen 3000;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' \
    > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
