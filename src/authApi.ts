import { AUTH_BASE } from './config';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  email?: string;
  walletAddress?: string;
}

const ACCESS_KEY = 'shophub.accessToken';
const REFRESH_KEY = 'shophub.refreshToken';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  save(tokens: Tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // NestJS validation errors arrive as { message: string | string[] }.
    const msg = body?.message ?? res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return body as T;
}

export function register(email: string, password: string): Promise<Tokens> {
  return request<Tokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string): Promise<Tokens> {
  return request<Tokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(refreshToken: string): Promise<Tokens> {
  return request<Tokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

export function me(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function siweNonce(): Promise<{ nonce: string }> {
  return request<{ nonce: string }>('/auth/siwe/nonce');
}

export function siweVerify(message: string, signature: string): Promise<Tokens> {
  return request<Tokens>('/auth/siwe/verify', {
    method: 'POST',
    body: JSON.stringify({ message, signature }),
  });
}
