# check=skip=SecretsUsedInArgOrEnv
# ^ Parser directive (must be the first line). The VITE_* build args below are
# public front-end config baked into the client bundle by design, not secrets.
# Vite mandates the VITE_ prefix, and BuildKit's SecretsUsedInArgOrEnv lint
# false-positives on names containing AUTH/API, so we skip that one check.

# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Vite build-time config. Vite inlines import.meta.env.VITE_* into the static
# bundle during `npm run build`, so these must be set BEFORE the build and
# cannot be changed at container runtime. Defaults mirror src/config.ts (dev);
# override per-environment via --build-arg (see .github/workflows). The SIWE
# domain/uri must match the origin the UI is actually served from and the auth
# service's SIWE_DOMAIN, otherwise web3 (SIWE) signature verification fails.
ARG VITE_AUTH_API=/auth-api
ARG VITE_SHOP_API=/shop-api
ARG VITE_SIWE_DOMAIN=localhost:3000
ARG VITE_SIWE_URI=http://localhost:3000
ENV VITE_AUTH_API=$VITE_AUTH_API \
    VITE_SHOP_API=$VITE_SHOP_API \
    VITE_SIWE_DOMAIN=$VITE_SIWE_DOMAIN \
    VITE_SIWE_URI=$VITE_SIWE_URI

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginxinc/nginx-unprivileged:alpine AS runtime
# Patch base-image OS packages so we don't ship CVEs that already have fixes
# upstream (e.g. expat HIGH advisories). Runs as root, then drops back to the
# unprivileged nginx user the base image ships with.
USER root
RUN apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
