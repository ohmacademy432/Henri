import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { RemindMeButton } from '../../components/RemindMeButton';
import { SectionLabel } from '../../components/SectionLabel';
import { fetchGrowth, fetchIllnesses, fetchVaccinations } from '../../lib/health';
import { useBook } from '../../lib/book';
import type { GrowthMeasurement, Illness, Vaccination } from '../../lib/types';

export function Index() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [growth, setGrowth] = useState<GrowthMeasurement[]>([]);
  const [vaccines, setVaccines] = useState<Vaccination[]>([]);
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    const [g, v, i] = await Promise.all([
      fetchGrowth(baby.id),
      fetchVaccinations(baby.id),
      fetchIllnesses(baby.id),
    ]);
    setGrowth(g);
    setVaccines(v);
    setIllnesses(i);
    setLoading(false);
  }, [baby]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = growth[0];
  const upcoming = useMemo(
    () => vaccines.filter((v) => !v.given_at).slice(0, 6),
    [vaccines]
  );
  const past = useMemo(() => vaccines.filter((v) => !!v.given_at), [vaccines]);
  const activeIllness = illnesses.find((i) => !i.resolved_at);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>chapter iii</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>Wellness</h1>
        <div className="editorial-sub">Growth, vaccines, and care</div>
        <div className="gold-rule" />
      </div>

      <SectionLabel right={latest ? `last weighed ${formatShort(latest.measured_at)}` : undefined}>
        growth
      </SectionLabel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Stat label="Weight" value={fmtLb(latest?.weight_lb)} unit="lb" />
        <Stat label="Length" value={fmtIn(latest?.length_in)} unit="in" />
        <Stat label="Head"   value={fmtIn(latest?.head_circ_in)} unit="in" />
      </div>
      <div style={{ marginTop: 12 }}>
        <Button variant="secondary" size="sm" onClick={() => nav('/health/growth/new')}>
          + Add a measurement
        </Button>
      </div>

      <SectionLabel right={`${vaccines.length} total`}>vaccinations</SectionLabel>

      {upcoming.length > 0 && (
        <Card tone="parchment" padded={false}>
          <div style={{ padding: '6px 18px' }}>
            {upcoming.map((v, i) => (
              <div
                key={v.id}
                style={{
                  padding: '14px 0',
                  borderBottom: i === upcoming.length - 1 ? 'none' : '1px solid var(--rule)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 17,
                      color: 'var(--ink)',
                    }}
                  >
                    {v.vaccine_name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--gold-deep)',
                      flexShrink: 0,
                    }}
                  >
                    {v.due_at ? `due ${formatShort(v.due_at)}` : 'on schedule'}
                  </span>
                </div>
                {v.due_at && (
                  <div style={{ marginTop: 8 }}>
                    <RemindMeButton
                      event={() => ({
                        kind: 'all-day',
                        title: `${v.vaccine_name} due`,
                        description: `Scheduled vaccination for Henri.`,
                        date: new Date(v.due_at!),
                      })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {past.length > 0 && (
        <>
          <SectionLabel>given</SectionLabel>
          <Card tone="parchment" padded={false}>
            <div style={{ padding: '6px 18px' }}>
              {past.slice(0, 8).map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 0',
                    borderBottom: i === Math.min(past.length, 8) - 1 ? 'none' : '1px solid var(--rule)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>{v.vaccine_name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="caption">{v.given_at ? formatShort(v.given_at) : ''}</span>
                    <span aria-hidden style={{ color: 'var(--sage)', fontSize: 14 }}>✓</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <SectionLabel right={illnesses.length ? `${illnesses.length} kept` : undefined}>
        illness log
      </SectionLabel>

      {activeIllness ? (
        <Card tone="ink" padded>
          <div className="eyebrow" style={{ color: 'rgba(249,244,234,0.6)', marginBottom: 6 }}>
            currently
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22 }}>{activeIllness.name}</div>
          {activeIllness.symptoms && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 15,
                marginTop: 4,
                color: 'rgba(249,244,234,0.8)',
              }}
            >
              {activeIllness.symptoms}
            </div>
          )}
          <div className="caption" style={{ color: 'rgba(249,244,234,0.6)', marginTop: 10 }}>
            began {formatShort(activeIllness.started_at)}
            {activeIllness.highest_temp_f ? ` · highest ${activeIllness.highest_temp_f}°F` : ''}
          </div>
        </Card>
      ) : illnesses.length > 0 ? (
        <Card tone="parchment" padded={false}>
          <div style={{ padding: '6px 18px' }}>
            {illnesses.slice(0, 6).map((ill, i) => (
              <div
                key={ill.id}
                style={{
                  padding: '14px 0',
                  borderBottom: i === Math.min(illnesses.length, 6) - 1 ? 'none' : '1px solid var(--rule)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17 }}>{ill.name}</span>
                  <span className="caption">
                    {formatShort(ill.started_at)}
                    {ill.resolved_at ? ` → ${formatShort(ill.resolved_at)}` : ''}
                  </span>
                </div>
                {ill.symptoms && (
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: 'var(--ink-soft)',
                      marginTop: 4,
                    }}
                  >
                    {ill.symptoms}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card tone="parchment">
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 17,
              color: 'var(--ink-soft)',
              lineHeight: 1.5,
            }}
          >
            No illnesses kept yet. When he is unwell, log it here so the pattern is visible.
          </div>
        </Card>
      )}

      <div style={{ marginTop: 12 }}>
        <Button variant="secondary" size="sm" onClick={() => nav('/health/illness/new')}>
          + Log an illness
        </Button>
      </div>

      <SectionLabel>for the doctor</SectionLabel>
      <Card tone="parchment">
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 17,
            color: 'var(--ink-soft)',
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          A printed summary of his recent feeds, sleep, growth, vaccines, and any illness — ready to bring to a visit.
        </div>
        <Button onClick={() => nav('/print?sections=cover,today,health,medications&days=30')} size="md">
          Prepare a pediatric visit
        </Button>
      </Card>

      {loading && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            marginTop: 20,
          }}
        >
          gathering the records…
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string | null; unit: string }) {
  return (
    <div
      style={{
        background: 'var(--parchment-warm)',
        borderRadius: 'var(--radius)',
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: value ? 26 : 18,
          color: value ? 'var(--ink)' : 'var(--ink-mute)',
          fontStyle: value ? 'normal' : 'italic',
          lineHeight: 1,
        }}
      >
        {value ?? '—'}
      </div>
      {value && (
        <div className="caption" style={{ marginTop: 2 }}>
          {unit}
        </div>
      )}
    </div>
  );
}

function fmtLb(v: number | null | undefined): string | null {
  if (v == null) return null;
  return (Math.round(v * 10) / 10).toString();
}
function fmtIn(v: number | null | undefined): string | null {
  if (v == null) return null;
  return (Math.round(v * 10) / 10).toString();
}

function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
