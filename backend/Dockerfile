# ==============================================================================
# QuikLedgr — Backend Dockerfile
# Node.js 20 Alpine Linux Runtime
# ==============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose API Port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server (which automatically checks & applies MariaDB migrations)
CMD ["npm", "start"]
