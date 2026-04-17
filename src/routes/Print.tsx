import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { fetchBundle, type Bundle } from '../lib/print';
import { useBook } from '../lib/book';

type Section =
  | 'cover'
  | 'today'
  | 'health'
  | 'medications'
  | 'memories'
  | 'family';

const ALL_SECTIONS: { key: Section; label: string; description: string }[] = [
  { key: 'cover',       label: 'Title page',         description: 'his name, his details' },
  { key: 'today',       label: 'Recent days',        description: 'feeds, sleep, diapers' },
  { key: 'health',      label: 'Wellness',           description: 'growth, vaccines, illness' },
  { key: 'medications', label: 'Medications',        description: 'doses given, schedule' },
  { key: 'memories',    label: 'The memory book',    description: 'photos, prompts, written pages' },
  { key: 'family',      label: 'Family tree',        description: 'his people' },
];

export function Print() {
  const nav = useNavigate();
  const [search, setSearch] = useSearchParams();
  const { baby } = useBook();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [days, setDays] = useState(() => Number(search.get('days') ?? '0'));
  const [picked, setPicked] = useState<Set<Section>>(() => {
    const fromUrl = (search.get('sections') ?? '').split(',').filter(Boolean) as Section[];
    return fromUrl.length
      ? new Set(fromUrl)
      : new Set(['cover', 'today', 'health', 'memories'] as Section[]);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!baby) return;
    setLoading(true);
    fetchBundle(baby.id, days).then((b) => {
      setBundle(b);
      setLoading(false);
    });
  }, [baby, days]);

  function toggle(s: Section) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      const params = new URLSearchParams(search);
      params.set('sections', Array.from(next).join(','));
      params.set('days', String(days));
      setSearch(params, { replace: true });
      return next;
    });
  }

  function setDaysAndUrl(d: number) {
    setDays(d);
    const params = new URLSearchParams(search);
    params.set('days', String(d));
    setSearch(params, { replace: true });
  }

  const sectionsInOrder = useMemo(
    () => ALL_SECTIONS.filter((s) => picked.has(s.key)),
    [picked]
  );

  return (
    <div className="page">
      {/* Configurator (hidden on print) ----------------------------- */}
      <div className="no-print" style={{ marginBottom: 26 }}>
        <button
          type="button"
          onClick={() => nav(-1)}
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            fontSize: 15,
            marginBottom: 14,
          }}
        >
          ← back
        </button>
        <div className="eyebrow" style={{ marginBottom: 10 }}>print or save as pdf</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>
          The book, on <span className="accent">paper.</span>
        </h1>
        <div className="gold-rule" />
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-soft)',
            fontSize: 17,
            lineHeight: 1.5,
            marginBottom: 22,
          }}
        >
          Choose what to include. The browser's print dialog will let you save as a PDF or send it to a printer.
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>chapters</div>
        <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
          {ALL_SECTIONS.map((s) => {
            const on = picked.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: on ? 'var(--parchment-warm)' : 'var(--cream)',
                  border: on ? '1px solid var(--gold)' : '1px solid var(--rule)',
                  borderRadius: 'var(--radius)',
                  textAlign: 'left',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{s.label}</div>
                  <div className="caption" style={{ marginTop: 2 }}>{s.description}</div>
                </div>
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: on ? 'var(--ink)' : 'transparent',
                    border: '1px solid ' + (on ? 'var(--ink)' : 'var(--gold-light)'),
                    color: 'var(--cream)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                  }}
                >
                  {on ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>how far back</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {[
            { v: 7,   label: '7 days' },
            { v: 30,  label: '30 days' },
            { v: 90,  label: '3 months' },
            { v: 365, label: '1 year' },
            { v: 0,   label: 'Everything' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setDaysAndUrl(o.v)}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: days === o.v ? 'var(--ink)' : 'transparent',
                color: days === o.v ? 'var(--cream)' : 'var(--ink-soft)',
                border: days === o.v ? '1px solid var(--ink)' : '1px solid var(--gold-light)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <Button onClick={() => window.print()} size="lg" disabled={loading || picked.size === 0}>
          {loading ? 'Gathering pages…' : 'Print or save as PDF'}
        </Button>
      </div>

      {/* The printable document ----------------------------------- */}
      {bundle && (
        <div className="print-page">
          {sectionsInOrder.map((s, idx) => (
            <div key={s.key} className={`print-section ${idx > 0 ? 'page-break' : ''}`} style={{ marginBottom: 36 }}>
              {s.key === 'cover'       && <CoverSection baby={baby!} />}
              {s.key === 'today'       && <RecentDaysSection bundle={bundle} />}
              {s.key === 'health'      && <HealthSection bundle={bundle} />}
              {s.key === 'medications' && <MedicationsSection bundle={bundle} />}
              {s.key === 'memories'    && <MemoriesSection bundle={bundle} />}
              {s.key === 'family'      && <FamilySection bundle={bundle} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Print sections ----------------------------------------------

function CoverSection({ baby }: { baby: { name: string; birth_time: string | null; birth_weight_oz: number | null; birth_length_in: number | null; birth_location: string | null } }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 14,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--gold-deep)',
          marginBottom: 30,
        }}
      >
        a book of
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 500,
          fontSize: 88,
          lineHeight: 0.95,
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        {baby.name}
      </h1>
      <div style={{ height: 1, width: 80, background: 'var(--gold)', margin: '36px auto' }} />
      {baby.birth_time && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--ink-soft)',
            lineHeight: 1.6,
          }}
        >
          born {new Date(baby.birth_time).toLocaleDateString(undefined, { dateStyle: 'long' })}
          {baby.birth_location ? <><br />in {baby.birth_location}</> : null}
          {baby.birth_weight_oz ? <><br />{Math.round(baby.birth_weight_oz / 16 * 10) / 10} lb</> : null}
          {baby.birth_length_in ? <>, {baby.birth_length_in} in long</> : null}
        </div>
      )}
      {!baby.birth_time && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--ink-soft)',
          }}
        >
          on the way
        </div>
      )}
    </div>
  );
}

function PrintHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontWeight: 500,
          fontSize: 30,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-soft)',
            fontSize: 16,
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      )}
      <div style={{ height: 1, width: 50, background: 'var(--gold)', marginTop: 14 }} />
    </div>
  );
}

function RecentDaysSection({ bundle }: { bundle: Bundle }) {
  return (
    <section>
      <PrintHeader title="Recent days" subtitle="feeds, sleep, diapers" />
      <PrintTable
        rows={bundle.feeds.slice(0, 50).map((f) => [
          new Date(f.started_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
          'Feed',
          f.type === 'bottle'
            ? `Bottle · ${f.amount_ml ? Math.round(f.amount_ml / 29.5735 * 10) / 10 + ' oz' : '—'}`
            : f.type.replace('_', ' ') + (f.duration_min ? ` · ${f.duration_min} min` : ''),
          f.notes ?? '',
        ])}
        headers={['When', 'Kind', 'Detail', 'Notes']}
      />
      <PrintTable
        rows={bundle.sleeps.slice(0, 50).map((s) => [
          new Date(s.started_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
          'Sleep',
          s.ended_at
            ? `${Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)} min`
            : 'asleep',
          s.location ?? s.quality ?? '',
        ])}
        headers={['When', 'Kind', 'Length', 'Where / quality']}
      />
      <PrintTable
        rows={bundle.diapers.slice(0, 50).map((d) => [
          new Date(d.occurred_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
          'Diaper',
          d.type,
          d.notes ?? '',
        ])}
        headers={['When', 'Kind', 'Type', 'Notes']}
      />
    </section>
  );
}

function HealthSection({ bundle }: { bundle: Bundle }) {
  return (
    <section>
      <PrintHeader title="Wellness" subtitle="growth, vaccines, illness" />

      {bundle.growth.length > 0 && (
        <>
          <SubHead>Growth</SubHead>
          <PrintTable
            headers={['Date', 'Weight (lb)', 'Length (in)', 'Head (in)', 'Source']}
            rows={bundle.growth.map((g) => [
              new Date(g.measured_at).toLocaleDateString(),
              g.weight_lb?.toString() ?? '—',
              g.length_in?.toString() ?? '—',
              g.head_circ_in?.toString() ?? '—',
              g.source ?? '',
            ])}
          />
        </>
      )}

      {bundle.vaccines.length > 0 && (
        <>
          <SubHead>Vaccinations</SubHead>
          <PrintTable
            headers={['Vaccine', 'Due', 'Given', 'Provider', 'Notes']}
            rows={bundle.vaccines.map((v) => [
              v.vaccine_name,
              v.due_at ? new Date(v.due_at).toLocaleDateString() : '',
              v.given_at ? new Date(v.given_at).toLocaleDateString() : '',
              v.provider ?? '',
              v.reaction_notes ?? '',
            ])}
          />
        </>
      )}

      {bundle.illnesses.length > 0 && (
        <>
          <SubHead>Illnesses</SubHead>
          <PrintTable
            headers={['Began', 'Resolved', 'Name', 'Symptoms', 'Highest temp', 'Notes']}
            rows={bundle.illnesses.map((i) => [
              new Date(i.started_at).toLocaleDateString(),
              i.resolved_at ? new Date(i.resolved_at).toLocaleDateString() : '',
              i.name,
              i.symptoms ?? '',
              i.highest_temp_f ? `${i.highest_temp_f}°F` : '',
              i.notes ?? '',
            ])}
          />
        </>
      )}
    </section>
  );
}

function MedicationsSection({ bundle }: { bundle: Bundle }) {
  return (
    <section>
      <PrintHeader title="Medications" subtitle="doses given, schedule" />
      {bundle.medications.length === 0 && (
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          No medications kept yet.
        </div>
      )}
      {bundle.medications.map((m) => {
        const doses = bundle.doses.filter((d) => d.medication_id === m.id);
        return (
          <div key={m.id} style={{ marginBottom: 22 }}>
            <SubHead>{m.name}</SubHead>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-soft)', marginBottom: 8 }}>
              {m.dose_amount} {m.dose_unit} every {m.frequency_hours}h{m.reason ? ` · for ${m.reason}` : ''}
            </div>
            {doses.length > 0 && (
              <PrintTable
                headers={['Given at', 'Amount', 'Notes']}
                rows={doses.map((d) => [
                  new Date(d.given_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }),
                  d.amount?.toString() ?? '',
                  d.notes ?? '',
                ])}
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

function MemoriesSection({ bundle }: { bundle: Bundle }) {
  return (
    <section>
      <PrintHeader title="The memory book" subtitle="photos, prompts, written pages" />
      {bundle.memories.length === 0 && (
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          No pages yet.
        </div>
      )}
      {bundle.memories.map((m) => (
        <article key={m.id} style={{ marginBottom: 26, paddingBottom: 18, borderBottom: '1px solid var(--rule)' }}>
          <div className="caption" style={{ marginBottom: 4 }}>
            {new Date(m.occurred_on).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
          {m.title && (
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, margin: '4px 0' }}>{m.title}</h3>
          )}
          {m.body && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: 'var(--ink)',
              }}
            >
              {m.body}
            </div>
          )}
          {m.photo_urls && m.photo_urls.length > 0 && (
            <div className="caption" style={{ marginTop: 6, fontStyle: 'italic' }}>
              {m.photo_urls.length} photo{m.photo_urls.length > 1 ? 's' : ''} on this page
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function FamilySection({ bundle }: { bundle: Bundle }) {
  return (
    <section>
      <PrintHeader title="His people" subtitle="the family tree" />
      {bundle.family.length === 0 && (
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          No family members added yet.
        </div>
      )}
      {bundle.family.map((p) => (
        <div key={p.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{p.name}</div>
          <div className="caption">{p.relationship}{p.side ? ` · ${p.side}` : ''}</div>
          {p.story && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ink-soft)',
                marginTop: 4,
              }}
            >
              {p.story}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 18,
        color: 'var(--ink)',
        margin: '16px 0 8px',
      }}
    >
      {children}
    </div>
  );
}

function PrintTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) return null;
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: 16,
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        color: 'var(--ink)',
      }}
    >
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: 10,
                color: 'var(--ink-mute)',
                borderBottom: '1px solid var(--rule)',
                padding: '6px 6px',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (
              <td
                key={j}
                style={{
                  padding: '6px 6px',
                  borderBottom: '1px solid var(--rule)',
                  verticalAlign: 'top',
                  fontFamily: j === 0 ? 'var(--font-sans)' : 'var(--font-serif)',
                  fontSize: 13,
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
