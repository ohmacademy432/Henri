import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Countdown } from '../../components/Countdown';
import { SectionLabel } from '../../components/SectionLabel';
import { fetchMedication, listDoses, nextSafeDose } from '../../lib/medications';
import type { Dose, Medication } from '../../lib/types';
import { supabase } from '../../lib/supabase';

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [med, setMed] = useState<Medication | null>(null);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [m, d] = await Promise.all([fetchMedication(id), listDoses(id, 50)]);
    setMed(m);
    setDoses(d);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  if (!med) {
    return (
      <div className="page">
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          finding the bottle…
        </div>
      </div>
    );
  }

  const last = doses[0] ?? null;
  const state = nextSafeDose(med, last);

  async function toggleActive() {
    if (!med) return;
    setBusy(true);
    await supabase.from('medications').update({ active: !med.active }).eq('id', med.id);
    await load();
    setBusy(false);
  }

  return (
    <div className="page">
      <button
        type="button"
        onClick={() => nav('/medications')}
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--ink-mute)',
          fontSize: 15,
          marginBottom: 14,
        }}
      >
        ← back to the cabinet
      </button>

      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          {med.active ? 'currently giving' : 'past medication'}
        </div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>{med.name}</h1>
        <div className="editorial-sub">
          {med.dose_amount} {med.dose_unit} · every {med.frequency_hours}h
          {med.reason ? ` · for ${med.reason}` : ''}
        </div>
        <div className="gold-rule" />
      </div>

      {med.active && (
        <Card tone="ink" padded>
          <div className="eyebrow" style={{ color: 'rgba(249, 244, 234, 0.6)', marginBottom: 6 }}>
            {state.pastDue ? 'next dose' : 'next dose safe in'}
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, lineHeight: 1 }}>
            <Countdown to={state.nextSafe} pastDueLabel="Safe to give now" />
          </div>
          {last && (
            <div className="caption" style={{ color: 'rgba(249, 244, 234, 0.6)', marginTop: 8 }}>
              last given {new Date(last.given_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Button
              variant="gold"
              size="md"
              onClick={() => nav(`/medications/${med.id}/dose`)}
            >
              Log a dose
            </Button>
          </div>
        </Card>
      )}

      <SectionLabel right={`${doses.length} kept`}>doses given</SectionLabel>

      {doses.length === 0 ? (
        <Card tone="parchment">
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
            No doses kept yet.
          </div>
        </Card>
      ) : (
        <Card tone="parchment" padded={false}>
          <div style={{ padding: '6px 18px' }}>
            {doses.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: i === doses.length - 1 ? 'none' : '1px solid var(--rule)',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>
                    {d.amount ? `${d.amount} ${med.dose_unit}` : 'A dose'}
                  </div>
                  {d.notes && <div className="caption" style={{ marginTop: 2 }}>{d.notes}</div>}
                </div>
                <div className="caption">
                  {new Date(d.given_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="sm" onClick={toggleActive} disabled={busy}>
          {med.active ? 'Mark as past' : 'Mark as currently giving'}
        </Button>
      </div>
    </div>
  );
}
