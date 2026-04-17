import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SectionLabel } from '../components/SectionLabel';
import { useAuth } from '../lib/auth';
import { useBook } from '../lib/book';
import { supabase } from '../lib/supabase';
import { isStandalone, pushSupport, subscribeToPush, unsubscribeFromPush } from '../lib/push';

export function Settings() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const { baby, caregiver, refresh } = useBook();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleNotifyMeds() {
    if (!caregiver) return;
    setBusy(true);
    setError(null);
    try {
      if (caregiver.notify_meds) {
        await unsubscribeFromPush(caregiver.id);
      } else {
        await subscribeToPush(caregiver.id);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change notifications.');
    } finally {
      setBusy(false);
    }
  }

  const sup = pushSupport();
  const standalone = isStandalone();
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const pushHint =
    sup.state === 'unsupported'
      ? "This browser doesn\u2019t support web notifications."
      : isIos && !standalone
      ? 'On iPhone, install Henri to your Home Screen first (Share \u2192 Add to Home Screen) so notifications can arrive when the app is closed.'
      : null;

  async function toggleSaveGallery() {
    if (!caregiver) return;
    setBusy(true);
    const { error: e } = await supabase
      .from('caregivers')
      .update({ save_to_device_gallery: !caregiver.save_to_device_gallery })
      .eq('id', caregiver.id);
    if (e) setError(e.message);
    await refresh();
    setBusy(false);
  }

  async function handleSignOut() {
    await signOut();
    nav('/login');
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>settings</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>Your account</h1>
        <div className="gold-rule" />
      </div>

      <SectionLabel>you</SectionLabel>
      <Card tone="parchment">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 22,
                lineHeight: 1.1,
                color: 'var(--ink)',
              }}
            >
              {caregiver?.display_name ?? '—'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--ink-soft)',
                marginTop: 2,
              }}
            >
              {caregiver?.relationship ?? 'Reader'}
            </div>
          </div>
          <div className="caption" style={{ textAlign: 'right' }}>
            {user?.email}
          </div>
        </div>
      </Card>

      {baby && (
        <>
          <SectionLabel>his book</SectionLabel>
          <Card tone="parchment">
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>{baby.name}</div>
            {baby.birth_time ? (
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--ink-soft)',
                  marginTop: 2,
                }}
              >
                born {new Date(baby.birth_time).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </div>
            ) : (
              <BirthInlineForm babyId={baby.id} onSaved={refresh} />
            )}
          </Card>
        </>
      )}

      <SectionLabel>reminders</SectionLabel>
      <Toggle
        label="Notify me for medication doses"
        on={!!caregiver?.notify_meds}
        onToggle={toggleNotifyMeds}
        disabled={busy || !caregiver || sup.state === 'unsupported'}
      />
      {pushHint && (
        <div
          className="caption"
          style={{
            marginTop: 8,
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {pushHint}
        </div>
      )}

      <SectionLabel>photos</SectionLabel>
      <Toggle
        label="Save photos to my device gallery"
        on={!!caregiver?.save_to_device_gallery}
        onToggle={toggleSaveGallery}
        disabled={busy || !caregiver}
      />

      {error && (
        <div className="caption" style={{ color: 'var(--gold-deep)', marginTop: 16 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 40 }}>
        <Button variant="secondary" block size="md" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

function BirthInlineForm({ babyId, onSaved }: { babyId: string; onSaved: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [weightOz, setWeightOz] = useState('');
  const [lengthIn, setLengthIn] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!date) {
      setErr('His birth date is needed.');
      return;
    }
    setBusy(true);
    setErr(null);
    const iso = time
      ? new Date(`${date}T${time}`).toISOString()
      : new Date(`${date}T12:00`).toISOString();
    const { error: e } = await supabase
      .from('babies')
      .update({
        birth_time: iso,
        birth_weight_oz: weightOz ? Number(weightOz) : null,
        birth_length_in: lengthIn ? Number(lengthIn) : null,
        birth_location: location.trim() || null,
      })
      .eq('id', babyId);
    if (e) {
      setErr(e.message);
      setBusy(false);
      return;
    }
    await onSaved();
    setOpen(false);
    setBusy(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--gold-deep)',
          fontSize: 16,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Has he arrived? — add his birth details
      </button>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Date" value={date} onChange={setDate} type="date" />
        <Field label="Time" value={time} onChange={setTime} type="time" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Weight (oz)" value={weightOz} onChange={setWeightOz} inputMode="decimal" placeholder="120" />
        <Field label="Length (in)" value={lengthIn} onChange={setLengthIn} inputMode="decimal" placeholder="19.5" />
      </div>
      <Field label="Where" value={location} onChange={setLocation} placeholder="St. Mary's" />
      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save his arrival'}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = 'text', inputMode, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 2px',
          border: 'none',
          borderBottom: '1px solid var(--gold-light)',
          background: 'transparent',
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          color: 'var(--ink)',
          outline: 'none',
        }}
      />
    </label>
  );
}

function Toggle({
  label,
  on,
  onToggle,
  disabled,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        background: 'var(--parchment-warm)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'left',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          color: 'var(--ink)',
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          background: on ? 'var(--ink)' : 'var(--rule)',
          position: 'relative',
          transition: 'background 150ms ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: on ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--cream)',
            transition: 'left 150ms ease',
            boxShadow: '0 1px 2px rgba(42, 31, 24, 0.2)',
          }}
        />
      </span>
    </button>
  );
}
