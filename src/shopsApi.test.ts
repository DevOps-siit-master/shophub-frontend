import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tokenStore } from './authApi';
import { createShop, deleteShop, listShops, updateShop } from './shopsApi';

const firstTokens = {
  accessToken: 'old-access',
  refreshToken: 'refresh-token',
};
const renewedTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
};

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('shopsApi', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    tokenStore.save(firstTokens);
    vi.stubGlobal('fetch', vi.fn());
  });

  it('lists shops with the stored access token', async () => {
    vi.mocked(fetch).mockResolvedValue(response([]));

    await expect(listShops()).resolves.toEqual([]);

    expect(fetch).toHaveBeenCalledWith('/shop-api/shops', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firstTokens.accessToken}`,
      },
    });
  });

  it('refreshes once after a 401 and retries with the new token', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ message: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(response(renewedTokens))
      .mockResolvedValueOnce(response([]));

    await expect(listShops()).resolves.toEqual([]);

    expect(fetch).toHaveBeenNthCalledWith(2, '/auth-api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: firstTokens.refreshToken }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(fetch).toHaveBeenNthCalledWith(3, '/shop-api/shops', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renewedTokens.accessToken}`,
      },
    });
    expect(tokenStore.access).toBe(renewedTokens.accessToken);
  });

  it('encodes shop names when updating and deleting', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ name: 'shop/a' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await updateShop('shop/a', { availability: 'high' });
    await deleteShop('shop/a');

    expect(fetch).toHaveBeenNthCalledWith(1, '/shop-api/shops/shop%2Fa', {
      method: 'PATCH',
      body: JSON.stringify({ availability: 'high' }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firstTokens.accessToken}`,
      },
    });
    expect(fetch).toHaveBeenNthCalledWith(2, '/shop-api/shops/shop%2Fa', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firstTokens.accessToken}`,
      },
    });
  });

  it('sends a new shop as JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ name: 'healthy-food', displayName: 'Healthy Food' }, { status: 201 }),
    );

    await createShop({
      name: 'Healthy Food',
      availability: 'standard',
      databaseType: 'standard',
      walletAddress: '0xabc',
      discordChannelName: 'orders',
      discordServerId: '999',
    });

    expect(fetch).toHaveBeenCalledWith('/shop-api/shops', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Healthy Food',
        availability: 'standard',
        databaseType: 'standard',
        walletAddress: '0xabc',
        discordChannelName: 'orders',
        discordServerId: '999',
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firstTokens.accessToken}`,
      },
    });
  });
});