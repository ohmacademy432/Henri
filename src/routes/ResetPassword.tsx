import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

// Supabase sends a recovery email whose link lands here. detectSessionInUrl
// is enabled on the client, so by the time this route renders a recovery
// session is already established — updateUser({ password }) just works.
export function ResetPassword() {
  const nav = useNavigate();
  const { session, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for the auth listener to pick up the recovery token from the URL.
    // If it doesn't arrive after loading settles, the link is stale.
    if (!loading) {
      if (session) setReady(true);
      else setError('This reset link is invalid or has expired. Request a new one.');
    }
  }, [loading, session]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      // Sign out so the user logs in with the new password deliberately —
      // otherwise the recovery session would log them in silently.
      await supabase.auth.signOut();
      nav('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
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
          <Wordmark size={56} />
        </div>
        <div style={{ height: 1, width: 56, background: 'var(--gold)', margin: '0 auto 22px' }} />

        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 22,
            lineHeight: 1.35,
            color: 'var(--ink)',
            marginBottom: 28,
          }}
        >
          Choose a new password.
        </div>

        {!ready && loading && (
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--ink-mute)',
            }}
          >
            a moment…
          </div>
        )}

        {!ready && !loading && error && (
          <>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'var(--gold-deep)',
                marginBottom: 22,
                fontSize: 16,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
            <Button variant="secondary" size="lg" block onClick={() => nav('/login')}>
              Back to sign in
            </Button>
          </>
        )}

        {ready && (
          <form onSubmit={onSubmit}>
            <label
              className="eyebrow"
              style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
            >
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              style={inputStyle}
            />

            <label
              className="eyebrow"
              style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
            >
              Confirm password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
            />

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
              {busy ? 'Saving…' : 'Set new password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
