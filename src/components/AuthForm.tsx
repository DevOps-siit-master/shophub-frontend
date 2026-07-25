import { useState } from 'react';
import { login, register, me, tokenStore, type AuthUser } from '../authApi';
import { siweSignIn } from '../siweLogin';

interface Props {
  onAuthenticated: (user: AuthUser) => void;
}

type Mode = 'login' | 'register';

export function AuthForm({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const tokens =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password);
      tokenStore.save(tokens);
      onAuthenticated(await me(tokens.accessToken));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSiwe = async () => {
    setError('');
    setBusy(true);
    try {
      const tokens = await siweSignIn();
      tokenStore.save(tokens);
      onAuthenticated(await me(tokens.accessToken));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>ShopHub</h1>
          <p>{mode === 'login' ? 'Sign in to manage your shops' : 'Create your ShopHub account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'login' ? 'Enter your password' : 'Min 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
              disabled={busy}
            />
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={busy}>
            {busy ? (
              <span className="spinner"></span>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="siwe-button"
          onClick={handleSiwe}
          disabled={busy}
        >
          <span aria-hidden="true">🦊</span> Sign in with Ethereum
        </button>

        <div className="auth-footer">
          <p>
            {mode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="mode-toggle"
          >
            {mode === 'login' ? 'Create one now' : 'Sign in instead'}
          </button>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        .auth-card {
          background: white;
          padding: 48px 40px;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 400px;
          transition: all 0.2s ease;
        }

        .auth-header {
          margin-bottom: 32px;
          text-align: center;
        }

        .auth-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.5px;
          color: #1a1a2e;
        }

        .auth-header p {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
          font-weight: 400;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          letter-spacing: 0.3px;
        }

        .form-group input {
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.15s ease;
          background: #fafafa;
          color: #1a1a2e;
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }

        .form-group input:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #fecaca;
        }

        .error-message span {
          font-size: 16px;
        }

        .auth-button {
          padding: 12px;
          background: #1a1a2e;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          margin-top: 4px;
        }

        .auth-button:hover:not(:disabled) {
          background: #2d2d44;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(26, 26, 46, 0.2);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #9ca3af;
          font-size: 13px;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e5e7eb;
        }

        .auth-divider span {
          padding: 0 12px;
        }

        .siwe-button {
          width: 100%;
          padding: 12px;
          background: white;
          color: #1a1a2e;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }

        .siwe-button:hover:not(:disabled) {
          border-color: #4f46e5;
          background: #fafaff;
        }

        .siwe-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer {
          margin-top: 24px;
          text-align: center;
          border-top: 1px solid #f3f4f6;
          padding-top: 24px;
        }

        .auth-footer p {
          margin: 0 0 4px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .mode-toggle {
          background: none;
          border: none;
          color: #4f46e5;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 0;
          transition: color 0.15s ease;
          text-decoration: none;
        }

        .mode-toggle:hover {
          color: #4338ca;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 32px 24px;
          }

          .auth-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
