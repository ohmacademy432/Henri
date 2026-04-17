import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail } = useAuth();
  const { state } = useLocation();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setBusy(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase is not configured. Create .env.local in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
        );
      }
      const from =
        typeof (state as { from?: string } | null)?.from === 'string'
          ? (state as { from?: string }).from
          : undefined;
      const redirectTo = from
        ? `${window.location.origin}${from}`
        : `${window.location.origin}/today`;
      await signInWithEmail(email.trim(), redirectTo);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

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
            marginBottom: 48,
          }}
        >
          A book for a life.
        </div>

        {sent ? (
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 22,
              lineHeight: 1.4,
              color: 'var(--ink)',
            }}
          >
            Check your email —
            <br />
            we've sent a link to open the book.
          </div>
        ) : (
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
              style={{
                width: '100%',
                padding: '12px 2px',
                border: 'none',
                borderBottom: '1px solid var(--gold-light)',
                background: 'transparent',
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                color: 'var(--ink)',
                outline: 'none',
                marginBottom: 28,
              }}
            />
            {error && (
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  color: 'var(--gold-deep)',
                  marginBottom: 16,
                  fontSize: 15,
                }}
              >
                {error}
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" block disabled={busy}>
              {busy ? 'Sending…' : 'Send me a link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
