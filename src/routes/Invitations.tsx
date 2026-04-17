import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { FieldLabel, FieldRow, TextInput } from '../components/FormBits';
import { SectionLabel } from '../components/SectionLabel';
import {
  cancelInvitation,
  createInvitation,
  invitationLink,
  listCaregivers,
  listInvitations,
  revokeCaregiver,
} from '../lib/invitations';
import { supabase } from '../lib/supabase';
import { useBook } from '../lib/book';
import { useAuth } from '../lib/auth';
import type { Caregiver, Invitation } from '../lib/types';

const RELATIONSHIPS = ['Parent', 'Grandparent', 'YahYah', 'Auntie', 'Uncle', 'Godparent', 'Other'];

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Toast = { id: number; name: string };

export function Invitations() {
  const { baby, caregiver } = useBook();
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    const [c, i] = await Promise.all([listCaregivers(baby.id), listInvitations(baby.id)]);
    setCaregivers(c);
    setInvites(i);
    setLoading(false);
  }, [baby]);

  useEffect(() => { void load(); }, [load]);

  // Real-time: celebrate when an invitation flips from pending → accepted.
  useEffect(() => {
    if (!baby) return;
    const channel = supabase
      .channel(`invitations:${baby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invitations',
          filter: `baby_id=eq.${baby.id}`,
        },
        (payload) => {
          const next = payload.new as Invitation;
          const prev = payload.old as Partial<Invitation>;
          if (next.accepted && !prev.accepted) {
            const name = next.display_name ?? 'Someone';
            setToast({ id: Date.now(), name });
            if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = window.setTimeout(() => setToast(null), 5000);
          }
          void load();
        }
      )
      // New caregiver rows (the other half of acceptance) — also refresh.
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'caregivers',
          filter: `baby_id=eq.${baby.id}`,
        },
        () => { void load(); }
      )
      .subscribe();
    return () => {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [baby, load]);

  const isOwner = baby?.owner_user_id === user?.id;
  const pending = invites.filter((i) => !i.accepted);

  // Caregivers who joined via accepted invitations (everyone except the owner).
  // Sort by join date, newest first.
  const joined = useMemo(
    () => [...caregivers]
      .filter((c) => c.user_id !== baby?.owner_user_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [caregivers, baby?.owner_user_id]
  );

  return (
    <div className="page">
      {toast && <JoinedToast name={toast.name} onClose={() => setToast(null)} />}

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a private book</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>Who may <span className="accent">read</span></h1>
        <div className="editorial-sub">This book is read only by the people you invite.</div>
        <div className="gold-rule" />
      </div>

      {/* Family who has joined ---------------------------------------- */}
      {joined.length > 0 && (
        <>
          <SectionLabel right={`${joined.length} joined`}>family who has joined</SectionLabel>
          <div
            style={{
              background: 'var(--sage-soft)',
              border: '1px solid var(--sage-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '6px 18px',
            }}
          >
            {joined.map((c, i) => (
              <JoinedRow
                key={c.id}
                caregiver={c}
                isOwner={isOwner}
                isSelf={c.user_id === user?.id}
                isLast={i === joined.length - 1}
                onRevoked={load}
              />
            ))}
          </div>
        </>
      )}

      {/* You (owner) --------------------------------------------------- */}
      {isOwner && caregiver && (
        <>
          <SectionLabel>you</SectionLabel>
          <Card tone="parchment">
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{caregiver.display_name}</div>
                <div className="caption" style={{ marginTop: 2 }}>
                  {caregiver.relationship ?? '—'} · the book's keeper
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Invite form --------------------------------------------------- */}
      {isOwner && (
        <>
          <SectionLabel>invite someone</SectionLabel>
          <InviteForm babyId={baby!.id} inviterCaregiverId={caregiver!.id} onCreated={load} />
        </>
      )}

      {/* Pending ------------------------------------------------------- */}
      {pending.length > 0 && (
        <>
          <SectionLabel right={`${pending.length} pending`}>not yet opened</SectionLabel>
          <Card tone="parchment" padded={false}>
            <div style={{ padding: '6px 18px' }}>
              {pending.map((inv, i) => (
                <PendingInviteRow
                  key={inv.id}
                  invite={inv}
                  isLast={i === pending.length - 1}
                  onCancelled={load}
                />
              ))}
            </div>
          </Card>
        </>
      )}

      {loading && (
        <div style={{ marginTop: 16, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          checking the guest list…
        </div>
      )}
    </div>
  );
}

// ---------- Joined (accepted) row -----------------------------------

function JoinedRow({
  caregiver,
  isOwner,
  isSelf,
  isLast,
  onRevoked,
}: {
  caregiver: Caregiver;
  isOwner: boolean;
  isSelf: boolean;
  isLast: boolean;
  onRevoked: () => Promise<void> | void;
}) {
  async function revoke() {
    if (!confirm(`Remove ${caregiver.display_name} from Henri's book?`)) return;
    await revokeCaregiver(caregiver.id);
    await onRevoked();
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--sage-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--sage)',
            color: 'var(--cream)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          ✓
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              color: 'var(--ink)',
            }}
          >
            {caregiver.display_name}
          </div>
          <div className="caption" style={{ marginTop: 2, color: 'var(--ink-soft)' }}>
            {caregiver.relationship ?? 'reader'} · joined {formatJoined(caregiver.created_at)}
          </div>
        </div>
      </div>
      {isOwner && !isSelf && (
        <button
          type="button"
          onClick={revoke}
          style={{
            flexShrink: 0,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            fontSize: 13,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Revoke access
        </button>
      )}
    </div>
  );
}

// ---------- Pending row ---------------------------------------------

function PendingInviteRow({
  invite,
  isLast,
  onCancelled,
}: {
  invite: Invitation;
  isLast: boolean;
  onCancelled: () => Promise<void> | void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const ok = await copyToClipboard(invitationLink(invite.token));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      window.prompt('Copy this invitation link:', invitationLink(invite.token));
    }
  }

  const label = invite.display_name ?? invite.relationship ?? 'Reader';

  return (
    <div
      style={{
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>{label}</div>
          <div className="caption" style={{ marginTop: 2 }}>
            {invite.relationship ?? 'Reader'} · created {new Date(invite.created_at).toLocaleDateString()}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (confirm(`Cancel the invitation for ${label}?`)) {
              await cancelInvitation(invite.id);
              await onCancelled();
            }
          }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--gold-deep)',
          }}
        >
          Cancel
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={copy}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            borderBottom: '1px solid var(--gold)',
            paddingBottom: 2,
          }}
        >
          {copied ? 'Copied ✓' : 'Copy invitation link'}
        </button>
      </div>
    </div>
  );
}

// ---------- Invite form ---------------------------------------------

function InviteForm({
  babyId,
  inviterCaregiverId,
  onCreated,
}: {
  babyId: string;
  inviterCaregiverId: string;
  onCreated: () => Promise<void> | void;
}) {
  const [relationship, setRelationship] = useState(RELATIONSHIPS[1]);
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<Invitation | null>(null);

  async function generate() {
    if (!displayName.trim()) {
      setErr('A name, please.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const inv = await createInvitation(babyId, inviterCaregiverId, {
        relationship,
        display_name: displayName.trim() || null,
      });
      await copyToClipboard(invitationLink(inv.token));
      setJustCreated(inv);
      setDisplayName('');
      await onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create invitation.');
    } finally {
      setBusy(false);
    }
  }

  async function copyAgain() {
    if (!justCreated) return;
    const ok = await copyToClipboard(invitationLink(justCreated.token));
    if (!ok) window.prompt('Copy this invitation link:', invitationLink(justCreated.token));
  }

  if (justCreated) {
    const toName = justCreated.display_name ?? justCreated.relationship ?? 'them';
    return (
      <Card tone="parchment">
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 22,
            lineHeight: 1.4,
            color: 'var(--ink)',
            marginBottom: 10,
          }}
        >
          Link copied.
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            marginBottom: 18,
          }}
        >
          Text it to <strong style={{ color: 'var(--ink)' }}>{toName}</strong> — the link works for 3 days.
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.04em',
            color: 'var(--ink-mute)',
            background: 'var(--cream)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius)',
            padding: '10px 12px',
            marginBottom: 14,
            wordBreak: 'break-all',
          }}
        >
          {invitationLink(justCreated.token)}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={copyAgain}>
            Copy again
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setJustCreated(null)}>
            Invite someone else
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card tone="parchment">
      <FieldRow>
        <FieldLabel>What he calls them</FieldLabel>
        <TextInput
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="YahYah"
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Relationship</FieldLabel>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 2px',
            border: 'none',
            borderBottom: '1px solid var(--gold-light)',
            background: 'transparent',
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            outline: 'none',
            appearance: 'none',
          }}
        >
          {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>{err}</div>}

      <Button onClick={generate} disabled={busy}>
        {busy ? 'Generating…' : 'Create invitation link'}
      </Button>
      <div className="caption" style={{ marginTop: 8 }}>
        We create a private link you can text them. Anyone with the link can open the book for 3 days.
      </div>
    </Card>
  );
}

// ---------- Joined toast --------------------------------------------

function JoinedToast({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: `calc(var(--topbar-h) + var(--safe-top) + 12px)`,
        left: 16,
        right: 16,
        zIndex: 70,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'auto',
        animation: 'henri-toast-in 240ms ease',
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          background: 'var(--blush)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          boxShadow: 'var(--shadow-lift)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--sage)',
            color: 'var(--cream)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ✓
        </span>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 17,
            lineHeight: 1.4,
            color: 'var(--ink)',
          }}
        >
          {name} has joined Henri's book.
        </div>
      </div>
      <style>{`
        @keyframes henri-toast-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ---------- helpers --------------------------------------------------

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
