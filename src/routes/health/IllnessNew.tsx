import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldLabel, FieldRow, TextArea, TextInput } from '../../components/FormBits';
import { logIllness } from '../../lib/health';
import { useBook } from '../../lib/book';

function todayDate(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function IllnessNew() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [name, setName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [startedAt, setStartedAt] = useState(todayDate());
  const [resolvedAt, setResolvedAt] = useState('');
  const [highTemp, setHighTemp] = useState('');
  const [notes, setNotes] = useState('');
  const [doctor, setDoctor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!baby) return;
    if (!name.trim()) {
      setErr('Give it a name — even just \u201ca cold\u201d.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await logIllness(baby.id, {
        name: name.trim(),
        symptoms: symptoms.trim() || null,
        started_at: startedAt,
        resolved_at: resolvedAt || null,
        highest_temp_f: highTemp ? Number(highTemp) : null,
        notes: notes.trim() || null,
        doctor_notified: doctor,
      });
      nav('/health');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a new entry</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>An illness, <span className="accent">kept.</span></h1>
        <div className="gold-rule" />
      </div>

      <FieldRow><FieldLabel>What is it</FieldLabel>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="A cold, an ear infection, hand-foot-and-mouth…" />
      </FieldRow>
      <FieldRow><FieldLabel>Symptoms</FieldLabel>
        <TextArea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="how he is showing it" rows={3} />
      </FieldRow>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FieldRow><FieldLabel>Began</FieldLabel>
          <TextInput type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </FieldRow>
        <FieldRow><FieldLabel>Resolved</FieldLabel>
          <TextInput type="date" value={resolvedAt} onChange={(e) => setResolvedAt(e.target.value)} />
        </FieldRow>
      </div>
      <FieldRow><FieldLabel>Highest temp (°F)</FieldLabel>
        <TextInput inputMode="decimal" value={highTemp} onChange={(e) => setHighTemp(e.target.value)} placeholder="101.2" />
      </FieldRow>
      <FieldRow><FieldLabel>Notes</FieldLabel>
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="medications given, what helped, what didn\u2019t" rows={3} />
      </FieldRow>
      <FieldRow>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={doctor} onChange={(e) => setDoctor(e.target.checked)} />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-soft)', fontSize: 16 }}>
            The pediatrician was told.
          </span>
        </label>
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">{busy ? 'Saving…' : 'Keep this entry'}</Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
