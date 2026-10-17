# ==============================================================================
# QuikLedgr — Frontend Dockerfile (Multi-stage Build)
# Stage 1: Build React 18 + Vite Production Bundle
# Stage 2: Serve via Nginx Alpine Web Server & Reverse Proxy
# ==============================================================================

# Stage 1: Build Application Bundle
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps


COPY . .
RUN npm run build

# Stage 2: Serve with High-Performance Nginx Alpine
FROM nginx:1.27-alpine AS production

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
