import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PhotoCapture } from '../../components/PhotoCapture';
import { VisibilityToggle } from '../../components/VisibilityToggle';
import { FieldLabel, FieldRow, TextArea, TextInput } from '../../components/FormBits';
import { supabase } from '../../lib/supabase';
import { createMemory } from '../../lib/memories';
import { useBook } from '../../lib/book';
import type { Prompt } from '../../lib/types';

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function New() {
  const nav = useNavigate();
  const [search] = useSearchParams();
  const { baby, caregiver } = useBook();

  const promptId = search.get('prompt');
  const source = (search.get('source') ?? 'gallery') as 'camera' | 'gallery' | 'write';

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [occurredOn, setOccurredOn] = useState(todayLocal());
  const [visibility, setVisibility] = useState<'shared' | 'private'>('shared');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!promptId) return;
    void (async () => {
      const { data } = await supabase.from('prompts').select('*').eq('id', promptId).maybeSingle();
      if (data) setPrompt(data as Prompt);
    })();
  }, [promptId]);

  async function save() {
    if (!baby) return;
    if (!files.length && !title.trim() && !body.trim()) {
      setErr('Add a photo, a title, or a few words — anything you want to keep.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createMemory({
        babyId: baby.id,
        caregiverId: caregiver?.id ?? null,
        occurredOn,
        title: title.trim() || null,
        body: body.trim() || null,
        visibility,
        promptId: prompt?.id ?? null,
        files,
      });
      nav('/memories');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save the memory.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>a new page</div>
        <h1 className="editorial-header" style={{ fontSize: 34 }}>
          Keep this<span className="accent"> moment.</span>
        </h1>
        <div className="gold-rule" />
      </div>

      {prompt && (
        <div
          style={{
            background: 'var(--blush)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            marginBottom: 22,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>answering</div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 20,
              lineHeight: 1.3,
              color: 'var(--ink)',
            }}
          >
            {prompt.question}
          </div>
        </div>
      )}

      {/* Photos row -------------------------------------------------- */}
      <FieldRow>
        <FieldLabel>Photos</FieldLabel>
        {files.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  background: 'var(--parchment-warm)',
                }}
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(249, 244, 234, 0.9)',
                    fontFamily: 'var(--font-serif)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <PhotoCapture
            source="camera"
            onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}
          >
            {(openCam) => (
              <Button variant={source === 'camera' ? 'primary' : 'secondary'} size="sm" onClick={openCam}>
                Take a photo
              </Button>
            )}
          </PhotoCapture>
          <PhotoCapture
            source="gallery"
            onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}
          >
            {(openLib) => (
              <Button variant="secondary" size="sm" onClick={openLib}>
                From gallery
              </Button>
            )}
          </PhotoCapture>
        </div>
      </FieldRow>

      <FieldRow>
        <FieldLabel>Title</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="a phrase to remember it by"
        />
      </FieldRow>

      <FieldRow>
        <FieldLabel>Words</FieldLabel>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="what you want him to know"
          rows={6}
        />
      </FieldRow>

      <FieldRow>
        <FieldLabel>When this happened</FieldLabel>
        <TextInput
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
        />
      </FieldRow>

      <FieldRow>
        <FieldLabel>Who may read</FieldLabel>
        <div style={{ marginTop: 4 }}>
          <VisibilityToggle value={visibility} onChange={setVisibility} />
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            fontSize: 14,
          }}
        >
          {visibility === 'shared'
            ? 'All family members who read Henri\u2019s book will see this.'
            : 'Only you will see this. A quiet page, just yours.'}
        </div>
      </FieldRow>

      {err && (
        <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button onClick={save} disabled={busy} size="lg">
          {busy ? 'Keeping…' : 'Keep this page'}
        </Button>
        <Button variant="ghost" onClick={() => nav(-1)} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
