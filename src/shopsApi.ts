import { refresh, tokenStore } from './authApi';
import { SHOP_BASE } from './config';

export type Availability = 'standard' | 'high';
export type DatabaseType = 'standard' | 'light';

export interface Shop {
  name: string;
  displayName: string;
  availability: Availability;
  databaseType: DatabaseType;
  walletAddress: string;
  ready: boolean;
  replicas: number;
  url: string;
  createdAt?: string;
}

export interface CreateShopInput {
  name: string;
  availability: Availability;
  databaseType: DatabaseType;
  walletAddress: string;
  discordChannelName: string;
  discordServerId: string;
}

export interface UpdateShopInput {
  name?: string;
  availability?: Availability;
  walletAddress?: string;
}

/**
 * Authenticated fetch against the shop API. Attaches the stored access token and,
 * on a 401, transparently refreshes once and retries before giving up.
 */
async function authedRequest<T>(
  path: string,
  init?: RequestInit,
  allowRetry = true,
): Promise<T> {
  const access = tokenStore.access;
  const res = await fetch(`${SHOP_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 401 && allowRetry) {
    const rt = tokenStore.refresh;
    if (rt) {
      try {
        const tokens = await refresh(rt);
        tokenStore.save(tokens);
        return authedRequest<T>(path, init, false);
      } catch {
        tokenStore.clear();
      }
    }
  }

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // NestJS validation errors arrive as { message: string | string[] }.
    const msg = body?.message ?? res.statusText;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
  }
  return body as T;
}

export function listShops(): Promise<Shop[]> {
  return authedRequest<Shop[]>('/shops');
}

export function createShop(input: CreateShopInput): Promise<Shop> {
  return authedRequest<Shop>('/shops', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateShop(
  name: string,
  input: UpdateShopInput,
): Promise<Shop> {
  return authedRequest<Shop>(`/shops/${encodeURIComponent(name)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteShop(name: string): Promise<void> {
  return authedRequest<void>(`/shops/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}
