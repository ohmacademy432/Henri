import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { Lightbox } from '../../components/Lightbox';
import { PhotoGrid } from '../../components/PhotoGrid';
import { PromptCard } from '../../components/PromptCard';
import { SectionLabel } from '../../components/SectionLabel';
import { listMemoriesWithUrls, type MemoryWithUrls } from '../../lib/memories';
import { fetchSuggestedPrompts, pickTodaysPrompt } from '../../lib/prompts';
import type { Prompt } from '../../lib/types';
import { useBook } from '../../lib/book';

type Filter = 'all' | 'photos' | 'voice' | 'prompted';

export function List() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [memories, setMemories] = useState<MemoryWithUrls[]>([]);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [suggested, setSuggested] = useState<Prompt[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<MemoryWithUrls | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    setErr(null);
    try {
      const [rows, p] = await Promise.all([
        listMemoriesWithUrls(baby.id),
        pickTodaysPrompt(baby.id, baby.birth_time),
      ]);
      setMemories(rows);
      setPrompt(p);
      const sugg = await fetchSuggestedPrompts(baby.id, baby.birth_time, p?.id, 6);
      setSuggested(sugg);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load memories.');
    } finally {
      setLoading(false);
    }
  }, [baby]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'photos':   return memories.filter((m) => (m.thumb_signed_urls?.length ?? 0) > 0);
      case 'voice':    return memories.filter((m) => !!m.audio_url);
      case 'prompted': return memories.filter((m) => !!m.prompt_id);
      default:         return memories;
    }
  }, [memories, filter]);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>chapter ii</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>
          A book of <span className="accent">{baby?.name ?? 'Henri'}</span>
        </h1>
        <div className="editorial-sub">Volume one · the first year</div>
        <div className="gold-rule" />
      </div>

      {prompt && (
        <PromptCard
          eyebrow="today's prompt"
          question={prompt.question}
          footer={
            <button
              type="button"
              onClick={() => nav(`/memories/new?prompt=${prompt.id}`)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
                borderBottom: '1px solid var(--gold)',
                paddingBottom: 3,
              }}
            >
              Answer this →
            </button>
          }
        />
      )}

      {suggested.length > 0 && (
        <>
          <SectionLabel right={`${suggested.length} waiting`}>more pages, waiting</SectionLabel>
          <div
            style={{
              background: 'var(--cream)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--rule)',
              padding: '4px 18px',
            }}
          >
            {suggested.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => nav(`/memories/new?prompt=${p.id}`)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '16px 0',
                  textAlign: 'left',
                  borderBottom:
                    idx === suggested.length - 1 ? 'none' : '1px solid var(--rule)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 17,
                    lineHeight: 1.35,
                    color: 'var(--ink)',
                    flex: 1,
                  }}
                >
                  {p.question}
                </span>
                <span
                  aria-hidden
                  style={{
                    color: 'var(--gold)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--ink-mute)',
              fontSize: 14,
            }}
          >
            Answer one when something feels right — they will keep changing as he grows.
          </div>
        </>
      )}

      <SectionLabel right={filtered.length ? `${filtered.length} kept` : undefined}>
        the pages so far
      </SectionLabel>

      <FilterChips value={filter} onChange={setFilter} />

      {loading && (
        <div
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            fontSize: 16,
          }}
        >
          turning the pages…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card tone="parchment" style={{ marginTop: 14, padding: 22 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'var(--ink-soft)',
              lineHeight: 1.5,
            }}
          >
            {filter === 'all'
              ? 'The first page is waiting. Answer today\u2019s prompt, or start with a photo.'
              : 'Nothing in this view yet.'}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 14 }}>
        <PhotoGrid memories={filtered} onOpen={setOpen} />
      </div>

      {err && (
        <div className="caption" style={{ color: 'var(--gold-deep)', marginTop: 16 }}>
          {err}
        </div>
      )}

      <FAB onClick={() => nav('/memories/new?source=camera')} label="Add a memory" />

      <Lightbox memory={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function FilterChips({ value, onChange }: { value: Filter; onChange: (v: Filter) => void }) {
  const options: { v: Filter; label: string }[] = [
    { v: 'all',      label: 'All' },
    { v: 'photos',   label: 'Photos' },
    { v: 'voice',    label: 'Voice' },
    { v: 'prompted', label: 'Prompted' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--cream)' : 'var(--ink-soft)',
              border: active ? '1px solid var(--ink)' : '1px solid var(--gold-light)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
