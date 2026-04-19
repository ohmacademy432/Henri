import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendEmailOtp, verifyEmailOtp } = useAuth();
  const { state } = useLocation();
  const nav = useNavigate();

  async function onRequestCode(e: FormEvent) {
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
      await sendEmailOtp(email.trim());
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    const token = code.trim();
    if (token.length < 6) return;
    setError(null);
    setBusy(true);
    try {
      await verifyEmailOtp(email.trim(), token);
      const raw = (state as { from?: string } | null)?.from;
      const from = typeof raw === 'string' ? raw : '/today';
      nav(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work. Try again.');
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

        {step === 'email' ? (
          <form onSubmit={onRequestCode}>
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
              {busy ? 'Sending…' : 'Send me a code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerifyCode}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 18,
                lineHeight: 1.5,
                color: 'var(--ink-soft)',
                marginBottom: 24,
              }}
            >
              We sent a six-digit code to
              <br />
              <span style={{ color: 'var(--ink)' }}>{email}</span>.
            </div>
            <label
              htmlFor="code"
              className="eyebrow"
              style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
            >
              Your code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              style={{
                width: '100%',
                padding: '12px 2px',
                border: 'none',
                borderBottom: '1px solid var(--gold-light)',
                background: 'transparent',
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                letterSpacing: '0.4em',
                textAlign: 'center',
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
              {busy ? 'Opening…' : 'Open the book'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
              style={{
                marginTop: 18,
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--ink-mute)',
                cursor: 'pointer',
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
