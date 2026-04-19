import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useBook } from '../lib/book';

type Invite = {
  id: string;
  baby_id: string;
  display_name: string | null;
  relationship: string | null;
  accepted: boolean;
  expires_at: string;
};

export function Accept() {
  const { token } = useParams<{ token: string }>();
  const nav = useNavigate();
  const { user, session, sendEmailOtp, verifyEmailOtp } = useAuth();
  const { refresh } = useBook();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<
    'loading' | 'need_signin' | 'expired' | 'ready' | 'accepted' | 'not_found'
  >('loading');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [signInStep, setSignInStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('not_found');
      return;
    }
    (async () => {
      // RPC goes through a SECURITY DEFINER function so the invitee can
      // read their own invitation even before they're a caregiver.
      const { data, error } = await supabase.rpc('invitation_by_token', { _token: token });
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) {
        setState('not_found');
        return;
      }
      setInvite(row as Invite);
      if (row.accepted) {
        setState('accepted');
        return;
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        setState('expired');
        return;
      }
      if (!session) {
        setState('need_signin');
        return;
      }
      // Token alone is the capability — any signed-in email can accept.
      setState('ready');
    })();
  }, [token, session, user]);

  async function acceptInvite() {
    if (!invite || !user) return;
    setBusy(true);
    setError(null);
    const { error: careErr } = await supabase.from('caregivers').insert({
      baby_id: invite.baby_id,
      user_id: user.id,
      display_name: invite.display_name ?? user.email?.split('@')[0] ?? 'Reader',
      relationship: invite.relationship,
    });
    if (careErr && !careErr.message.includes('duplicate')) {
      setError(careErr.message);
      setBusy(false);
      return;
    }
    await supabase
      .from('invitations')
      .update({ accepted: true, accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    await refresh();
    setBusy(false);
    nav('/today');
  }

  async function onRequestCode(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setBusy(true);
    try {
      await sendEmailOtp(email.trim());
      setSignInStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    const t = code.trim();
    if (t.length < 6) return;
    setError(null);
    setBusy(true);
    try {
      await verifyEmailOtp(email.trim(), t);
      // onAuthStateChange will update session, which flips state to 'ready'.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That code didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {state === 'loading' && <Quiet>opening the invitation…</Quiet>}

      {state === 'not_found' && (
        <Message
          title="This invitation could not be found."
          body="Ask the book's owner to send you a new one."
        />
      )}

      {state === 'expired' && (
        <Message
          title="This invitation has expired."
          body="Ask the owner to send you a fresh one — invitations are good for three days."
        />
      )}

      {state === 'accepted' && (
        <Message
          title="You've already opened this invitation."
          body="Sign in and the book will be waiting."
          cta={{ label: 'Go to the book', onClick: () => nav('/today') }}
        />
      )}

      {state === 'need_signin' && signInStep === 'email' && (
        <form onSubmit={onRequestCode}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 24,
              lineHeight: 1.3,
              color: 'var(--ink)',
              marginBottom: 18,
            }}
          >
            You've been invited to read
            <br />
            <span style={{ fontStyle: 'italic' }}>a book kept for a child.</span>
          </div>
          <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>
            Your email
          </label>
          <input
            type="email"
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
              outline: 'none',
              marginBottom: 24,
            }}
          />
          {error && (
            <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 14 }}>
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? 'Sending…' : 'Send me a code'}
          </Button>
        </form>
      )}

      {state === 'need_signin' && signInStep === 'code' && (
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
            <span style={{ color: 'var(--ink)', fontStyle: 'normal' }}>{email}</span>.
          </div>
          <label className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>
            Your code
          </label>
          <input
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
              outline: 'none',
              marginBottom: 24,
            }}
          />
          {error && (
            <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 14 }}>
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? 'Opening…' : 'Continue'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setSignInStep('email');
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

      {state === 'ready' && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 26,
              lineHeight: 1.3,
              color: 'var(--ink)',
              marginBottom: 24,
            }}
          >
            {invite?.display_name ? `${invite.display_name}, welcome` : 'Welcome'} —
            <br />a book has been opened for you.
          </div>
          {error && (
            <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 14 }}>
              {error}
            </div>
          )}
          <Button onClick={acceptInvite} disabled={busy} size="lg" block>
            {busy ? 'Opening…' : 'Open the book'}
          </Button>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ marginBottom: 22 }}>
          <Wordmark size={48} />
        </div>
        <div style={{ height: 1, width: 56, background: 'var(--gold)', margin: '0 auto 28px' }} />
        {children}
      </div>
    </div>
  );
}

function Message({
  title,
  body,
  cta,
}: {
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1.4,
          color: 'var(--ink)',
          marginBottom: body ? 10 : 24,
        }}
      >
        {title}
      </div>
      {body && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 16,
            color: 'var(--ink-soft)',
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {body}
        </div>
      )}
      {cta && (
        <Button onClick={cta.onClick} size="lg" block variant="secondary">
          {cta.label}
        </Button>
      )}
    </div>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        color: 'var(--ink-mute)',
        fontSize: 18,
      }}
    >
      {children}
    </div>
  );
}
