// Auth service base. Defaults to '/auth-api', which Vite proxies to the
// shophub-auth-service (see vite.config.ts) so the browser stays same-origin
// and there are no CORS issues in development.
export const AUTH_BASE = import.meta.env.VITE_AUTH_API ?? '/auth-api';

// ShopHub platform API base (shop-site CRUD). Defaults to '/shop-api', which
// Vite proxies to the shophub-api service (see vite.config.ts).
export const SHOP_BASE = import.meta.env.VITE_SHOP_API ?? '/shop-api';

// SIWE (Sign-In With Ethereum). The domain must match SIWE_DOMAIN in the auth
// service, otherwise signature verification fails.
export const SIWE_DOMAIN = import.meta.env.VITE_SIWE_DOMAIN ?? 'localhost:3000';
export const SIWE_URI = import.meta.env.VITE_SIWE_URI ?? 'http://localhost:3000';
