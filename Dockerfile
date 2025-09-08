# ---- Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --configuration production

# ---- Runtime
FROM nginx:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/blog-site/ /usr/share/nginx/html
HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1
