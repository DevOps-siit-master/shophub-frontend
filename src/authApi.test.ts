import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  login,
  me,
  register,
  tokenStore,
  type Tokens,
} from './authApi';

const tokens: Tokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('authApi', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  it('persists and clears access and refresh tokens', () => {
    tokenStore.save(tokens);

    expect(tokenStore.access).toBe(tokens.accessToken);
    expect(tokenStore.refresh).toBe(tokens.refreshToken);

    tokenStore.clear();

    expect(tokenStore.access).toBeNull();
    expect(tokenStore.refresh).toBeNull();
  });

  it('sends login credentials and parses the token pair', async () => {
    vi.mocked(fetch).mockResolvedValue(response(tokens));

    await expect(login('Alice@example.com', 'password')).resolves.toEqual(tokens);

    expect(fetch).toHaveBeenCalledWith('/auth-api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'Alice@example.com', password: 'password' }),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('joins validation error messages into one error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response(
        { message: ['email must be an email', 'password is too short'] },
        { status: 400, statusText: 'Bad Request' },
      ),
    );

    await expect(register('invalid', 'short')).rejects.toThrow(
      'email must be an email, password is too short',
    );
  });

  it('adds the bearer token when loading the current user', async () => {
    vi.mocked(fetch).mockResolvedValue(
      response({ userId: 'user-1', email: 'owner@example.com' }),
    );

    await me(tokens.accessToken);

    expect(fetch).toHaveBeenCalledWith('/auth-api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
  });
});