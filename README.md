# ShopHub Frontend

Web panel for **ShopHub** — the platform where a user manages their shop *sites*
(spec **1.1 Prijava i registracija** + **1.2 Upravljanje sajtovima prodavnica**).

This is a separate application from the **Shop** storefront (`shop-frontend`): ShopHub
is the single control plane that dynamically deploys Shop instances via the Kubernetes
operator, so the two are distinct apps with their own repos (DevOps req 5.1).

## Features

- **1.1 — Authentication** against [`shophub-auth-service`](../shophub-auth-service):
  - Email + password (register / login, JWT access & refresh)
  - Web3 **Sign-In With Ethereum** (SIWE / EIP-4361) via MetaMask
- **1.2 — Shop-site management** — _placeholder dashboard_; CRUD of shop sites
  (name, availability `standard`/`high`, wallet address, database `standard`/`light`)
  that creates Kubernetes `Shop` CRs is the next step.

## Tech stack

React 19 + TypeScript + Vite · `ethers` + `siwe` for Web3 auth.

## Local development

Requirements: Node.js 22+, the `shophub-auth-service` running on `http://localhost:3000`.

```bash
npm install
cp .env.example .env      # adjust if the auth service runs elsewhere
npm run dev               # http://localhost:5173
```

Vite proxies `/auth-api` → the auth service (see `vite.config.ts`), so the browser
stays same-origin (no CORS). Use `npm run dev` (not `preview`) — the proxy only
runs on the dev server.

### SIWE note

`VITE_SIWE_DOMAIN` must match `SIWE_DOMAIN` in the auth service (`localhost:3000`),
otherwise signature verification fails. Use MetaMask on the **Sepolia** network.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with HMR + auth proxy |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
