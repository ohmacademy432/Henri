import { useCallback, useEffect, useState } from 'react';
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
import { useBook } from '../lib/book';
import { useAuth } from '../lib/auth';
import type { Caregiver, Invitation } from '../lib/types';

const RELATIONSHIPS = ['Parent', 'Grandparent', 'YahYah', 'Auntie', 'Uncle', 'Godparent', 'Other'];

export function Invitations() {
  const { baby, caregiver } = useBook();
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    const [c, i] = await Promise.all([listCaregivers(baby.id), listInvitations(baby.id)]);
    setCaregivers(c);
    setInvites(i);
    setLoading(false);
  }, [baby]);

  useEffect(() => { void load(); }, [load]);

  const isOwner = baby?.owner_user_id === user?.id;
  const pending = invites.filter((i) => !i.accepted);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a private book</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>Who may <span className="accent">read</span></h1>
        <div className="editorial-sub">This book is read only by the people you invite.</div>
        <div className="gold-rule" />
      </div>

      <SectionLabel right={`${caregivers.length} reader${caregivers.length === 1 ? '' : 's'}`}>
        currently reading
      </SectionLabel>

      <Card tone="parchment" padded={false}>
        <div style={{ padding: '6px 18px' }}>
          {caregivers.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 0',
                borderBottom: i === caregivers.length - 1 ? 'none' : '1px solid var(--rule)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{c.display_name}</div>
                <div className="caption" style={{ marginTop: 2 }}>
                  {c.relationship ?? '—'}
                  {c.user_id === user?.id ? ' · you' : ''}
                  {' · joined '}{new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
              {isOwner && c.user_id !== user?.id && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Revoke ${c.display_name}'s access?`)) {
                      await revokeCaregiver(c.id);
                      await load();
                    }
                  }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-deep)',
                    border: '1px solid var(--gold-light)',
                    borderRadius: 999,
                    padding: '6px 12px',
                  }}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {isOwner && (
        <>
          <SectionLabel>invite someone</SectionLabel>
          <InviteForm babyId={baby!.id} inviterCaregiverId={caregiver!.id} onCreated={load} />
        </>
      )}

      {pending.length > 0 && (
        <>
          <SectionLabel right={`${pending.length} pending`}>not yet opened</SectionLabel>
          <Card tone="parchment" padded={false}>
            <div style={{ padding: '6px 18px' }}>
              {pending.map((inv, i) => (
                <div
                  key={inv.id}
                  style={{
                    padding: '14px 0',
                    borderBottom: i === pending.length - 1 ? 'none' : '1px solid var(--rule)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>
                        {inv.display_name ?? inv.email}
                      </div>
                      <div className="caption" style={{ marginTop: 2 }}>
                        {inv.email} · {inv.relationship ?? 'Reader'} · sent {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Cancel the invitation to ${inv.email}?`)) {
                          await cancelInvitation(inv.id);
                          await load();
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
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(invitationLink(inv.token));
                          alert('Invitation link copied to clipboard.');
                        } catch {
                          window.prompt('Copy this invitation link:', invitationLink(inv.token));
                        }
                      }}
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
                      Copy invitation link
                    </button>
                  </div>
                </div>
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

function InviteForm({
  babyId,
  inviterCaregiverId,
  onCreated,
}: {
  babyId: string;
  inviterCaregiverId: string;
  onCreated: () => Promise<void> | void;
}) {
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState(RELATIONSHIPS[1]);
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    if (!email.trim()) {
      setErr('An email, please.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createInvitation(babyId, inviterCaregiverId, {
        email,
        relationship,
        display_name: displayName.trim() || null,
      });
      setEmail('');
      setDisplayName('');
      await onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not send invitation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card tone="parchment">
      <FieldRow><FieldLabel>Their email</FieldLabel>
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yahyah@example.com" />
      </FieldRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldRow><FieldLabel>What he calls them</FieldLabel>
          <TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="YahYah" />
        </FieldRow>
        <FieldRow><FieldLabel>Relationship</FieldLabel>
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
      </div>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>{err}</div>}

      <Button onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send the invitation'}</Button>
      <div className="caption" style={{ marginTop: 8 }}>
        We email them a link. If email isn't set up yet, you can copy the link from the pending list below and send it yourself.
      </div>
    </Card>
  );
}
