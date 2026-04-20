import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithPassword, signUp } = useAuth();
  const { state } = useLocation();
  const nav = useNavigate();

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirm('');
  }

  function humanError(raw: unknown): string {
    const msg = raw instanceof Error ? raw.message : String(raw);
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'That email and password don’t match. Try again, or create an account below.';
    }
    if (lower.includes('user already registered') || lower.includes('already been registered')) {
      return 'An account with that email already exists. Sign in instead.';
    }
    if (lower.includes('password') && lower.includes('6')) {
      return 'Password must be at least 6 characters.';
    }
    if (lower.includes('email') && lower.includes('valid')) {
      return 'That doesn’t look like a valid email.';
    }
    return msg || 'Something went wrong.';
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Create .env.local in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
      );
      return;
    }

    const e1 = email.trim();
    if (!e1 || !password) return;

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithPassword(e1, password);
      } else {
        await signUp(e1, password);
      }
      const raw = (state as { from?: string } | null)?.from;
      const from = typeof raw === 'string' ? raw : '/today';
      // RequireBook will bounce to /welcome if this user has no baby yet.
      nav(from, { replace: true });
    } catch (err) {
      setError(humanError(err));
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 2px',
    border: 'none',
    borderBottom: '1px solid var(--gold-light)',
    background: 'transparent',
    fontFamily: 'var(--font-serif)',
    fontSize: 20,
    color: 'var(--ink)',
    outline: 'none',
    marginBottom: 22,
  } as const;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 28px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ marginBottom: 26 }}>
          <Wordmark size={60} />
        </div>
        <div style={{ height: 1, width: 56, background: 'var(--gold)', margin: '0 auto 22px' }} />
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--ink-soft)',
            marginBottom: 40,
          }}
        >
          A book for a life.
        </div>

        <form onSubmit={onSubmit}>
          <label
            htmlFor="email"
            className="eyebrow"
            style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
          >
            Your email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />

          <label
            htmlFor="password"
            className="eyebrow"
            style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'at least 6 characters' : ''}
            style={inputStyle}
          />

          {mode === 'signup' && (
            <>
              <label
                htmlFor="confirm"
                className="eyebrow"
                style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
              >
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
              />
            </>
          )}

          {error && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'var(--gold-deep)',
                marginBottom: 16,
                fontSize: 15,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </Button>

          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            style={{
              marginTop: 22,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ink-mute)',
              cursor: 'pointer',
            }}
          >
            {mode === 'signin' ? 'Create an account' : 'I already have an account'}
          </button>
        </form>
      </div>
    </div>
  );
}
