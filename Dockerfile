# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
