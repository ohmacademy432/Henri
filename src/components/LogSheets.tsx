import { useState } from 'react';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Chips, FieldLabel, FieldRow, TextArea, TextInput } from './FormBits';
import { logDiaper, logFeed, logSleep } from '../lib/repo';
import type { Feed } from '../lib/types';

type Props = {
  babyId: string;
  caregiverId: string | null;
  kind: 'feed' | 'sleep' | 'diaper' | null;
  onClose: () => void;
  onSaved: () => void;
};

function nowLocalInputValue() {
  // yyyy-MM-ddTHH:mm in local time for <input type="datetime-local">
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LogSheets({ babyId, caregiverId, kind, onClose, onSaved }: Props) {
  return (
    <>
      <FeedSheet open={kind === 'feed'} babyId={babyId} caregiverId={caregiverId} onClose={onClose} onSaved={onSaved} />
      <SleepSheet open={kind === 'sleep'} babyId={babyId} caregiverId={caregiverId} onClose={onClose} onSaved={onSaved} />
      <DiaperSheet open={kind === 'diaper'} babyId={babyId} caregiverId={caregiverId} onClose={onClose} onSaved={onSaved} />
    </>
  );
}

function FeedSheet({
  open, babyId, caregiverId, onClose, onSaved,
}: {
  open: boolean;
  babyId: string;
  caregiverId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<Feed['type']>('bottle');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('');
  const [startedAt, setStartedAt] = useState(nowLocalInputValue());
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      const oz = amount ? Number(amount) : null;
      await logFeed(babyId, caregiverId, {
        type,
        amount_ml: oz && type === 'bottle' ? oz * 29.5735 : null,
        duration_min: duration ? Number(duration) : null,
        started_at: new Date(startedAt).toISOString(),
        ended_at: null,
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
      setAmount(''); setDuration(''); setNotes('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="A feeding" eyebrow="log a feed">
      <FieldRow>
        <FieldLabel>Kind</FieldLabel>
        <Chips
          value={type}
          onChange={setType}
          options={[
            { value: 'bottle',       label: 'Bottle' },
            { value: 'breast_left',  label: 'Breast · L' },
            { value: 'breast_right', label: 'Breast · R' },
            { value: 'solid',        label: 'Solid' },
          ]}
        />
      </FieldRow>

      {type === 'bottle' && (
        <FieldRow>
          <FieldLabel>Ounces</FieldLabel>
          <TextInput
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="4"
          />
        </FieldRow>
      )}

      {(type === 'breast_left' || type === 'breast_right') && (
        <FieldRow>
          <FieldLabel>Minutes</FieldLabel>
          <TextInput
            inputMode="decimal"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="18"
          />
        </FieldRow>
      )}

      <FieldRow>
        <FieldLabel>When</FieldLabel>
        <TextInput
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
      </FieldRow>

      <FieldRow>
        <FieldLabel>Notes</FieldLabel>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="whatever you want to remember"
        />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}

      <Button block size="lg" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save to the book'}
      </Button>
    </Sheet>
  );
}

function SleepSheet({
  open, babyId, caregiverId, onClose, onSaved,
}: {
  open: boolean;
  babyId: string;
  caregiverId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [startedAt, setStartedAt] = useState(nowLocalInputValue());
  const [endedAt, setEndedAt] = useState('');
  const [location, setLocation] = useState('');
  const [quality, setQuality] = useState<'peaceful' | 'restless' | 'short' | 'long' | ''>('peaceful');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      await logSleep(babyId, caregiverId, {
        started_at: new Date(startedAt).toISOString(),
        ended_at: endedAt ? new Date(endedAt).toISOString() : null,
        quality: quality || null,
        location: location.trim() || null,
      });
      onSaved();
      onClose();
      setEndedAt(''); setLocation('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="A sleep" eyebrow="log sleep">
      <FieldRow>
        <FieldLabel>Began</FieldLabel>
        <TextInput
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Woke</FieldLabel>
        <TextInput
          type="datetime-local"
          value={endedAt}
          onChange={(e) => setEndedAt(e.target.value)}
          placeholder="optional — leave blank if still asleep"
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Where</FieldLabel>
        <TextInput
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="bassinet, on mama, in the car"
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Quality</FieldLabel>
        <Chips
          value={quality}
          onChange={setQuality}
          options={[
            { value: 'peaceful', label: 'Peaceful' },
            { value: 'restless', label: 'Restless' },
            { value: 'short',    label: 'Short' },
            { value: 'long',     label: 'Long' },
          ]}
        />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}

      <Button block size="lg" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save to the book'}
      </Button>
    </Sheet>
  );
}

function DiaperSheet({
  open, babyId, caregiverId, onClose, onSaved,
}: {
  open: boolean;
  babyId: string;
  caregiverId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<'wet' | 'dirty' | 'both' | 'dry'>('wet');
  const [occurredAt, setOccurredAt] = useState(nowLocalInputValue());
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setErr(null);
    setBusy(true);
    try {
      await logDiaper(babyId, caregiverId, {
        type,
        occurred_at: new Date(occurredAt).toISOString(),
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
      setNotes('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="A diaper" eyebrow="log diaper">
      <FieldRow>
        <FieldLabel>Kind</FieldLabel>
        <Chips
          value={type}
          onChange={setType}
          options={[
            { value: 'wet',   label: 'Wet' },
            { value: 'dirty', label: 'Dirty' },
            { value: 'both',  label: 'Both' },
            { value: 'dry',   label: 'Dry' },
          ]}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>When</FieldLabel>
        <TextInput
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </FieldRow>
      <FieldRow>
        <FieldLabel>Notes</FieldLabel>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="anything to note"
        />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}

      <Button block size="lg" onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save to the book'}
      </Button>
    </Sheet>
  );
}
