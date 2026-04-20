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

type FormMode = 'signup' | 'signin';

export function Accept() {
  const { token } = useParams<{ token: string }>();
  const nav = useNavigate();
  const { user, session, signInWithPassword, signUp } = useAuth();
  const { refresh } = useBook();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [state, setState] = useState<
    'loading' | 'need_signin' | 'expired' | 'ready' | 'accepted' | 'not_found'
  >('loading');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FormMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

  function switchMode(next: FormMode) {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirm('');
  }

  function humanError(raw: unknown): string {
    const msg = raw instanceof Error ? raw.message : String(raw);
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'That email and password don’t match.';
    }
    if (lower.includes('user already registered') || lower.includes('already been registered')) {
      return 'An account with that email already exists — sign in instead.';
    }
    if (lower.includes('password') && lower.includes('6')) {
      return 'Password must be at least 6 characters.';
    }
    if (lower.includes('email') && lower.includes('valid')) {
      return 'That doesn’t look like a valid email.';
    }
    return msg || 'Something went wrong.';
  }

  async function linkCaregiverAndGo(userId: string, userEmail: string | null) {
    if (!invite) return;
    const { error: careErr } = await supabase.from('caregivers').insert({
      baby_id: invite.baby_id,
      user_id: userId,
      display_name: invite.display_name ?? userEmail?.split('@')[0] ?? 'Reader',
      relationship: invite.relationship,
    });
    if (careErr && !careErr.message.toLowerCase().includes('duplicate')) {
      throw careErr;
    }
    await supabase
      .from('invitations')
      .update({ accepted: true, accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
    await refresh();
    nav('/today');
  }

  async function acceptInvite() {
    if (!invite || !user) return;
    setBusy(true);
    setError(null);
    try {
      await linkCaregiverAndGo(user.id, user.email ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the book.');
      setBusy(false);
    }
  }

  async function onSubmitAuth(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const e1 = email.trim();
    if (!e1 || !password) return;
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(e1, password);
      } else {
        await signInWithPassword(e1, password);
      }
      // Grab the fresh session directly so we don't race React state updates
      // from onAuthStateChange before linking the caregiver row.
      const { data: sessData } = await supabase.auth.getSession();
      const u = sessData.session?.user;
      if (!u) throw new Error('Signed in, but no session was returned.');
      await linkCaregiverAndGo(u.id, u.email ?? null);
    } catch (err) {
      setError(humanError(err));
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
    outline: 'none',
    marginBottom: 22,
  } as const;

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

      {state === 'need_signin' && (
        <form onSubmit={onSubmitAuth}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 22,
              lineHeight: 1.35,
              color: 'var(--ink)',
              marginBottom: 22,
              textAlign: 'left',
            }}
          >
            You've been invited to read
            <br />
            <span style={{ fontStyle: 'italic' }}>a book kept for a child.</span>
          </div>

          <label
            className="eyebrow"
            style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
          >
            Your email
          </label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />

          <label
            className="eyebrow"
            style={{ display: 'block', textAlign: 'left', marginBottom: 8 }}
          >
            {mode === 'signup' ? 'Choose a password' : 'Password'}
          </label>
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
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
            </>
          )}

          {error && (
            <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy
              ? 'Opening…'
              : mode === 'signup'
                ? `Join ${invite?.display_name ? invite.display_name + '’s' : 'Henri’s'} book`
                : 'Sign in and accept'}
          </Button>

          <button
            type="button"
            onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
            style={{
              marginTop: 20,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--ink-mute)',
              cursor: 'pointer',
            }}
          >
            {mode === 'signup'
              ? 'I already have an account — sign in instead'
              : 'Create a new account instead'}
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
