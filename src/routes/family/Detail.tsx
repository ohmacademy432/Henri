import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { FieldLabel, FieldRow, TextArea, TextInput } from '../../components/FormBits';
import { deleteFamilyMember, fetchFamilyMember, updateFamilyMember } from '../../lib/family';
import type { FamilyMember } from '../../lib/types';

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [m, setM] = useState<FamilyMember | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  // form state
  const [story, setStory] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const row = await fetchFamilyMember(id);
      if (row) {
        setM(row);
        setStory(row.story ?? '');
        setBirthYear(row.birth_year?.toString() ?? '');
        setDeathYear(row.death_year?.toString() ?? '');
      }
    })();
  }, [id]);

  if (!m) {
    return (
      <div className="page">
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          finding their page…
        </div>
      </div>
    );
  }

  async function save() {
    if (!id) return;
    setBusy(true);
    await updateFamilyMember(id, {
      story: story.trim() || null,
      birth_year: birthYear ? Number(birthYear) : null,
      death_year: deathYear ? Number(deathYear) : null,
    });
    const row = await fetchFamilyMember(id);
    if (row) setM(row);
    setEditing(false);
    setBusy(false);
  }

  async function remove() {
    if (!id) return;
    if (!confirm(`Remove ${m?.name} from the tree?`)) return;
    await deleteFamilyMember(id);
    nav('/family');
  }

  return (
    <div className="page">
      <button
        type="button"
        onClick={() => nav('/family')}
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--ink-mute)',
          fontSize: 15,
          marginBottom: 14,
        }}
      >
        ← back to the tree
      </button>

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--parchment-warm)',
            border: '1px solid var(--gold-light)',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {m.photo_url ? (
            <img src={m.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 48, color: 'var(--ink)' }}>
              {m.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="editorial-header" style={{ fontSize: 32 }}>{m.name}</h1>
        <div className="editorial-sub">
          {m.relationship}
          {m.side ? ` · ${m.side}` : ''}
        </div>
        {(m.birth_year || m.death_year) && (
          <div className="caption" style={{ marginTop: 6 }}>
            {m.birth_year ?? '?'}{m.death_year ? ` – ${m.death_year}` : ''}
          </div>
        )}
        <div className="gold-rule" style={{ margin: '20px auto 0' }} />
      </div>

      {!editing ? (
        <Card tone="parchment">
          {m.story ? (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                lineHeight: 1.6,
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.story}
            </div>
          ) : (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'var(--ink-mute)',
                fontSize: 16,
              }}
            >
              No story kept yet. Add one — what should he know about them?
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={remove}>Remove</Button>
          </div>
        </Card>
      ) : (
        <Card tone="parchment">
          <FieldRow><FieldLabel>Their story</FieldLabel>
            <TextArea value={story} onChange={(e) => setStory(e.target.value)} rows={6} />
          </FieldRow>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FieldRow><FieldLabel>Born</FieldLabel>
              <TextInput inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
            </FieldRow>
            <FieldRow><FieldLabel>Died</FieldLabel>
              <TextInput inputMode="numeric" value={deathYear} onChange={(e) => setDeathYear(e.target.value)} />
            </FieldRow>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
