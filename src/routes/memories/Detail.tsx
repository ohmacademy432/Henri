import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/Card';
import { fetchMemory, withSignedUrls, type MemoryWithUrls } from '../../lib/memories';
import { Lightbox } from '../../components/Lightbox';

export function Detail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [memory, setMemory] = useState<MemoryWithUrls | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const m = await fetchMemory(id);
      if (m) setMemory(await withSignedUrls(m));
    })();
  }, [id]);

  if (!memory) {
    return (
      <div className="page">
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--ink-mute)',
            fontSize: 18,
          }}
        >
          finding the page…
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        type="button"
        onClick={() => nav(-1)}
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--ink-mute)',
          fontSize: 15,
          marginBottom: 18,
        }}
      >
        ← back to the pages
      </button>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        {new Date(memory.occurred_on).toLocaleDateString(undefined, { dateStyle: 'long' })}
      </div>
      {memory.title && (
        <h1 className="editorial-header" style={{ fontSize: 32, marginBottom: 10 }}>
          {memory.title}
        </h1>
      )}
      <div className="gold-rule" />

      {memory.thumb_signed_urls.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            display: 'block',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            padding: 0,
            marginBottom: 18,
            background: 'var(--ink)',
          }}
        >
          <img
            src={memory.full_signed_urls[0] ?? memory.thumb_signed_urls[0]}
            alt=""
            style={{ width: '100%', display: 'block' }}
          />
        </button>
      )}

      {memory.thumb_signed_urls.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 18,
          }}
        >
          {memory.thumb_signed_urls.slice(1).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setOpen(true)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                padding: 0,
                background: 'var(--ink)',
              }}
            >
              <img
                src={u}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}

      {memory.body && (
        <Card tone="parchment" style={{ padding: 22 }}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 19,
              lineHeight: 1.6,
              color: 'var(--ink)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {memory.body}
          </div>
        </Card>
      )}

      <div
        style={{
          marginTop: 20,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--ink-mute)',
          fontSize: 14,
        }}
      >
        {memory.visibility === 'private' ? 'a private page' : 'shared with the family'}
      </div>

      <Lightbox memory={open ? memory : null} onClose={() => setOpen(false)} />
    </div>
  );
}
