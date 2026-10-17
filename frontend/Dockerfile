# Stage 1: Build Angular 19 Production Application
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:1.27-alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist/quikledgr-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
