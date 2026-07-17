FROM node:20-alpine

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy manifests first — better layer caching (npm install only reruns on dep changes)
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Give appuser ownership of the working directory (including future log dir)
RUN mkdir -p logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3001

# Lightweight liveness probe using built-in Node HTTP client (no extra tools needed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
