import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldLabel, FieldRow, TextInput } from '../../components/FormBits';
import { logGrowth } from '../../lib/health';
import { useBook } from '../../lib/book';

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GrowthNew() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [head, setHead] = useState('');
  const [when, setWhen] = useState(todayLocal());
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!baby) return;
    if (!weight && !length && !head) {
      setErr('Add at least one measurement.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await logGrowth(baby.id, {
        weight_lb: weight ? Number(weight) : null,
        length_in: length ? Number(length) : null,
        head_circ_in: head ? Number(head) : null,
        measured_at: new Date(when).toISOString(),
        source: source.trim() || null,
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
        <div className="eyebrow" style={{ marginBottom: 10 }}>a new measurement</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>How he is <span className="accent">growing.</span></h1>
        <div className="gold-rule" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FieldRow><FieldLabel>Weight (lb)</FieldLabel>
          <TextInput inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="11.4" />
        </FieldRow>
        <FieldRow><FieldLabel>Length (in)</FieldLabel>
          <TextInput inputMode="decimal" value={length} onChange={(e) => setLength(e.target.value)} placeholder="22.0" />
        </FieldRow>
      </div>
      <FieldRow><FieldLabel>Head (in)</FieldLabel>
        <TextInput inputMode="decimal" value={head} onChange={(e) => setHead(e.target.value)} placeholder="15.4" />
      </FieldRow>
      <FieldRow><FieldLabel>Measured</FieldLabel>
        <TextInput type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </FieldRow>
      <FieldRow><FieldLabel>Where</FieldLabel>
        <TextInput value={source} onChange={(e) => setSource(e.target.value)} placeholder="pediatrician, home scale, anywhere" />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">{busy ? 'Saving…' : 'Keep this measurement'}</Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
