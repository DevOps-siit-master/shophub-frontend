import { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { ShopsPanel } from './components/ShopsPanel';
import { me, refresh, tokenStore, type AuthUser } from './authApi';

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // On load, restore the session from stored tokens (refreshing if the access
  // token has expired).
  useEffect(() => {
    const restore = async () => {
      const access = tokenStore.access;
      if (!access) {
        setAuthChecked(true);
        return;
      }
      try {
        setUser(await me(access));
      } catch {
        const rt = tokenStore.refresh;
        try {
          if (!rt) throw new Error('no refresh token');
          const tokens = await refresh(rt);
          tokenStore.save(tokens);
          setUser(await me(tokens.accessToken));
        } catch {
          tokenStore.clear();
        }
      } finally {
        setAuthChecked(true);
      }
    };
    void restore();
  }, []);

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  if (!authChecked) {
    return <p style={{ textAlign: 'center', marginTop: '10vh' }}>Loading…</p>;
  }

  if (!user) {
    return <AuthForm onAuthenticated={setUser} />;
  }

  const identity =
    user.email ??
    (user.walletAddress
      ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
      : 'Account');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, textAlign: 'left' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>ShopHub</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ color: '#888' }} title={user.walletAddress ?? user.email}>
            {identity}
          </span>
          <button onClick={logout}>Log out</button>
        </div>
      </header>

      {/* 1.2 — Upravljanje sajtovima prodavnica. */}
      <ShopsPanel />
    </div>
  );
}

export default App;
