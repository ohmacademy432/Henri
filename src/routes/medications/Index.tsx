import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Countdown } from '../../components/Countdown';
import { SectionLabel } from '../../components/SectionLabel';
import {
  listDoses,
  listMedications,
  listRecentDosesForBaby,
  nextSafeDose,
} from '../../lib/medications';
import type { Dose, Medication } from '../../lib/types';
import { useBook } from '../../lib/book';

export function Index() {
  const nav = useNavigate();
  const { baby, caregiver } = useBook();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [latestPerMed, setLatestPerMed] = useState<Map<string, Dose | null>>(new Map());
  const [recentLog, setRecentLog] = useState<Array<Dose & { medication: Medication | null }>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    const list = await listMedications(baby.id);
    setMeds(list);
    const map = new Map<string, Dose | null>();
    await Promise.all(
      list.map(async (m) => {
        const doses = await listDoses(m.id, 1);
        map.set(m.id, doses[0] ?? null);
      })
    );
    setLatestPerMed(map);
    setRecentLog(await listRecentDosesForBaby(baby.id, 8));
    setLoading(false);
  }, [baby]);

  useEffect(() => { void load(); }, [load]);

  const active = meds.filter((m) => m.active);
  const inactive = meds.filter((m) => !m.active);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>chapter iv</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>Medications</h1>
        <div className="editorial-sub">Doses kept carefully</div>
        <div className="gold-rule" />
      </div>

      {loading && (
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          opening the cabinet…
        </div>
      )}

      {!loading && active.length === 0 && (
        <Card tone="parchment">
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 17,
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              marginBottom: 14,
            }}
          >
            Nothing on the shelf. When he is given a medication — even infant Tylenol — keep it here so YahYah and Dad know exactly when the last dose was given.
          </div>
          <Button size="md" onClick={() => nav('/medications/new')}>
            + Add the first medication
          </Button>
        </Card>
      )}

      {active.length > 0 && (
        <SectionLabel right="currently giving">on the shelf</SectionLabel>
      )}

      {active.map((m) => (
        <ActiveMedCard
          key={m.id}
          med={m}
          last={latestPerMed.get(m.id) ?? null}
          caregiverName={caregiver?.display_name}
          onLogDose={() => nav(`/medications/${m.id}/dose`)}
          onOpen={() => nav(`/medications/${m.id}`)}
        />
      ))}

      {recentLog.length > 0 && (
        <>
          <SectionLabel>today's log</SectionLabel>
          <Card tone="parchment" padded={false}>
            <div style={{ padding: '6px 18px' }}>
              {recentLog.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: i === recentLog.length - 1 ? 'none' : '1px solid var(--rule)',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>
                      {d.medication?.name ?? 'a medication'}
                    </div>
                    <div className="caption" style={{ marginTop: 2 }}>
                      {d.amount ? `${d.amount} ${d.medication?.dose_unit ?? ''}` : 'a dose'}
                      {d.notes ? ` · ${d.notes}` : ''}
                    </div>
                  </div>
                  <div className="caption">
                    {new Date(d.given_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {inactive.length > 0 && (
        <>
          <SectionLabel>past medications</SectionLabel>
          <Card tone="parchment" padded={false}>
            <div style={{ padding: '6px 18px' }}>
              {inactive.map((m, i) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => nav(`/medications/${m.id}`)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: i === inactive.length - 1 ? 'none' : '1px solid var(--rule)',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>{m.name}</span>
                  <span className="caption">{m.reason ?? 'past'}</span>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <Button variant="secondary" size="sm" onClick={() => nav('/medications/new')}>
          + Add a medication
        </Button>
      </div>
    </div>
  );
}

function ActiveMedCard({
  med,
  last,
  caregiverName,
  onLogDose,
  onOpen,
}: {
  med: Medication;
  last: Dose | null;
  caregiverName?: string;
  onLogDose: () => void;
  onOpen: () => void;
}) {
  const state = nextSafeDose(med, last);
  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--ink)',
        color: 'var(--cream)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 22px 18px',
        marginBottom: 14,
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(212, 179, 147, 0.35), rgba(212, 179, 147, 0) 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="eyebrow"
        style={{ color: 'rgba(249, 244, 234, 0.6)', marginBottom: 6, position: 'relative' }}
      >
        Currently giving
      </div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          color: 'var(--cream)',
          margin: 0,
          background: 'transparent',
          padding: 0,
          textAlign: 'left',
        }}
      >
        {med.name}
      </button>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--gold-light)',
          marginTop: 2,
        }}
      >
        {med.dose_amount} {med.dose_unit} · every {med.frequency_hours}h
        {med.reason ? ` · for ${med.reason}` : ''}
      </div>

      <div style={{ marginTop: 18, position: 'relative' }}>
        <div
          className="eyebrow"
          style={{ color: 'rgba(249, 244, 234, 0.6)', marginBottom: 6 }}
        >
          {state.pastDue ? 'next dose' : 'next dose safe in'}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 36,
            lineHeight: 1,
          }}
        >
          <Countdown to={state.nextSafe} pastDueLabel="Safe to give now" />
        </div>
        {last && (
          <div
            className="caption"
            style={{ color: 'rgba(249, 244, 234, 0.6)', marginTop: 8 }}
          >
            last given {new Date(last.given_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          background: 'var(--blush)',
          color: 'var(--ink)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        {caregiverName ?? 'You'} will be alerted when the next dose is due · web push · also pings any caregiver who opted in.
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onLogDose}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 999,
            background: 'var(--gold)',
            color: 'var(--cream)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Log a dose
        </button>
        <button
          type="button"
          onClick={onOpen}
          style={{
            padding: '12px 16px',
            borderRadius: 999,
            background: 'transparent',
            color: 'var(--cream)',
            border: '1px solid rgba(249, 244, 234, 0.3)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Detail
        </button>
      </div>
    </div>
  );
}
