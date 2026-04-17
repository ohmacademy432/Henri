import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldLabel, FieldRow, TextInput } from '../../components/FormBits';
import { createMedication } from '../../lib/medications';
import { useBook } from '../../lib/book';

const UNITS = ['mg', 'mL', 'drops', 'puffs'];

export function New() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [name, setName] = useState('');
  const [generic, setGeneric] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState<string>('mL');
  const [freq, setFreq] = useState('');
  const [maxPerDay, setMaxPerDay] = useState('');
  const [reason, setReason] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!baby) return;
    if (!name.trim() || !doseAmount || !freq) {
      setErr('Name, dose amount, and how often are all needed.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const med = await createMedication(baby.id, {
        name: name.trim(),
        generic_name: generic.trim() || null,
        dose_amount: Number(doseAmount),
        dose_unit: doseUnit,
        frequency_hours: Number(freq),
        max_per_day: maxPerDay ? Number(maxPerDay) : null,
        reason: reason.trim() || null,
        prescribed_by: prescribedBy.trim() || null,
      });
      nav(`/medications/${med.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a new medication</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>What he is <span className="accent">taking.</span></h1>
        <div className="gold-rule" />
      </div>

      <FieldRow><FieldLabel>Brand or trade name</FieldLabel>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Tylenol" />
      </FieldRow>
      <FieldRow><FieldLabel>Generic name</FieldLabel>
        <TextInput value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="acetaminophen" />
      </FieldRow>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <FieldRow><FieldLabel>Dose</FieldLabel>
          <TextInput inputMode="decimal" value={doseAmount} onChange={(e) => setDoseAmount(e.target.value)} placeholder="2.5" />
        </FieldRow>
        <FieldRow><FieldLabel>Unit</FieldLabel>
          <select
            value={doseUnit}
            onChange={(e) => setDoseUnit(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 2px',
              border: 'none',
              borderBottom: '1px solid var(--gold-light)',
              background: 'transparent',
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              outline: 'none',
              appearance: 'none',
            }}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FieldRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FieldRow><FieldLabel>Every how many hours</FieldLabel>
          <TextInput inputMode="decimal" value={freq} onChange={(e) => setFreq(e.target.value)} placeholder="6" />
        </FieldRow>
        <FieldRow><FieldLabel>Max per day</FieldLabel>
          <TextInput inputMode="numeric" value={maxPerDay} onChange={(e) => setMaxPerDay(e.target.value)} placeholder="4" />
        </FieldRow>
      </div>

      <FieldRow><FieldLabel>For</FieldLabel>
        <TextInput value={reason} onChange={(e) => setReason(e.target.value)} placeholder="fever, ear pain, post-vaccine" />
      </FieldRow>

      <FieldRow><FieldLabel>Prescribed by</FieldLabel>
        <TextInput value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="Dr. Patel" />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">{busy ? 'Saving…' : 'Add to the cabinet'}</Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
