import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FieldLabel, FieldRow, TextArea, TextInput } from '../../components/FormBits';
import { createFamilyMember } from '../../lib/family';
import { useBook } from '../../lib/book';

const RELATIONSHIPS = [
  { label: 'Mother',           gen: 0  },
  { label: 'Father',           gen: 0  },
  { label: 'Parent',           gen: 0  },
  { label: 'Aunt',             gen: 0  },
  { label: 'Uncle',            gen: 0  },
  { label: 'Grandmother',      gen: -1 },
  { label: 'Grandfather',      gen: -1 },
  { label: 'YahYah',           gen: -1 },
  { label: 'Great-grandmother', gen: -2 },
  { label: 'Great-grandfather', gen: -2 },
  { label: 'Godparent',        gen: 0  },
  { label: 'Cousin',           gen: 1  },
  { label: 'Other',            gen: 0  },
];

export function New() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Grandmother');
  const [side, setSide] = useState<'maternal' | 'paternal' | 'chosen'>('maternal');
  const [story, setStory] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!baby) return;
    if (!name.trim()) {
      setErr('A name, first.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const gen = RELATIONSHIPS.find((r) => r.label === relationship)?.gen ?? 0;
      await createFamilyMember(baby.id, {
        name: name.trim(),
        relationship,
        generation: gen,
        side,
        story: story.trim() || null,
        birth_year: birthYear ? Number(birthYear) : null,
      });
      nav('/family');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a new person</div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>Someone in his <span className="accent">life.</span></h1>
        <div className="gold-rule" />
      </div>

      <FieldRow><FieldLabel>Name</FieldLabel>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="April" />
      </FieldRow>
      <FieldRow><FieldLabel>Who they are to him</FieldLabel>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 2px',
            border: 'none',
            borderBottom: '1px solid var(--gold-light)',
            background: 'transparent',
            fontFamily: 'var(--font-serif)',
            fontSize: 20,
            color: 'var(--ink)',
            outline: 'none',
            appearance: 'none',
          }}
        >
          {RELATIONSHIPS.map((r) => (
            <option key={r.label} value={r.label}>{r.label}</option>
          ))}
        </select>
      </FieldRow>
      <FieldRow><FieldLabel>Side</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['maternal', 'paternal', 'chosen'] as const).map((s) => {
            const active = s === side;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--cream)' : 'var(--ink-soft)',
                  border: active ? '1px solid var(--ink)' : '1px solid var(--gold-light)',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </FieldRow>
      <FieldRow><FieldLabel>Born (year)</FieldLabel>
        <TextInput inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1957" />
      </FieldRow>
      <FieldRow><FieldLabel>A story to keep</FieldLabel>
        <TextArea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="who they are, what they have meant"
          rows={5}
        />
      </FieldRow>

      {err && <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">{busy ? 'Saving…' : 'Add to the tree'}</Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}
