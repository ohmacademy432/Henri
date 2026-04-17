import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldLabel, FieldRow, TextArea, TextInput } from '../../components/FormBits';
import { fetchMedication, logDose } from '../../lib/medications';
import { useBook } from '../../lib/book';
import type { Medication } from '../../lib/types';

function nowLocalInputValue(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DoseNew() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { caregiver } = useBook();
  const [med, setMed] = useState<Medication | null>(null);
  const [givenAt, setGivenAt] = useState(nowLocalInputValue());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fetchMedication(id).then((m) => {
      setMed(m);
      if (m) setAmount(m.dose_amount.toString());
    });
  }, [id]);

  async function save() {
    if (!id || !med) return;
    setBusy(true);
    setErr(null);
    try {
      await logDose(id, caregiver?.id ?? null, {
        given_at: new Date(givenAt).toISOString(),
        amount: amount ? Number(amount) : null,
        notes: notes.trim() || null,
      });
      nav(`/medications/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a dose given</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>
          {med?.name ?? 'A dose'}
        </h1>
        {med && (
          <div className="editorial-sub">
            usual: {med.dose_amount} {med.dose_unit} every {med.frequency_hours}h
          </div>
        )}
        <div className="gold-rule" />
      </div>

      <FieldRow><FieldLabel>When</FieldLabel>
        <TextInput type="datetime-local" value={givenAt} onChange={(e) => setGivenAt(e.target.value)} />
      </FieldRow>
      <FieldRow><FieldLabel>How much {med ? `(${med.dose_unit})` : ''}</FieldLabel>
        <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </FieldRow>
      <FieldRow><FieldLabel>Notes</FieldLabel>
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="anything to remember about this dose" rows={3} />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">{busy ? 'Saving…' : 'Keep this dose'}</Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
