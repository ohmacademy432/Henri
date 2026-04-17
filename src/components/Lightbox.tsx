import { useEffect, useState } from 'react';
import type { MemoryWithUrls } from '../lib/memories';

type Props = {
  memory: MemoryWithUrls | null;
  onClose: () => void;
};

export function Lightbox({ memory, onClose }: Props) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (memory) setI(0);
  }, [memory]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!memory) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((v) => Math.min(v + 1, (memory.full_signed_urls.length || 1) - 1));
      if (e.key === 'ArrowLeft')  setI((v) => Math.max(v - 1, 0));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [memory, onClose]);

  if (!memory) return null;

  const urls = memory.full_signed_urls;
  const hasPhotos = urls.length > 0;
  const caption = memory.title || (memory.body ?? '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18, 12, 8, 0.96)',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--safe-top) 0 var(--safe-bottom)',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 18px' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--cream)',
            opacity: 0.8,
          }}
        >
          close
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 18px',
          overflow: 'hidden',
        }}
      >
        {hasPhotos ? (
          <img
            src={urls[i]}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        ) : (
          <div
            style={{
              maxWidth: 560,
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--cream)',
              fontSize: 22,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {memory.body || memory.title || '—'}
          </div>
        )}
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{ padding: '14px 22px 24px', color: 'var(--cream)' }}
      >
        {caption && (
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: hasPhotos ? 'italic' : 'normal',
              fontSize: hasPhotos ? 16 : 14,
              lineHeight: 1.4,
              color: 'var(--cream)',
              opacity: 0.9,
              marginBottom: 8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {hasPhotos ? caption : null}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="caption" style={{ color: 'rgba(249,244,234,0.6)' }}>
            {new Date(memory.occurred_on).toLocaleDateString(undefined, { dateStyle: 'long' })}
          </div>
          {hasPhotos && urls.length > 1 && (
            <div style={{ display: 'flex', gap: 16 }}>
              <button
                type="button"
                onClick={() => setI((v) => Math.max(v - 1, 0))}
                disabled={i === 0}
                style={{ color: 'var(--cream)', opacity: i === 0 ? 0.4 : 0.9, fontSize: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              >
                ← prev
              </button>
              <span className="caption" style={{ color: 'rgba(249,244,234,0.6)' }}>
                {i + 1} / {urls.length}
              </span>
              <button
                type="button"
                onClick={() => setI((v) => Math.min(v + 1, urls.length - 1))}
                disabled={i === urls.length - 1}
                style={{ color: 'var(--cream)', opacity: i === urls.length - 1 ? 0.4 : 0.9, fontSize: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}
              >
                next →
              </button>
            </div>
          )}
          {hasPhotos && (
            <a
              href={urls[i]}
              download
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--cream)',
                borderBottom: '1px solid var(--gold-light)',
                paddingBottom: 2,
              }}
            >
              Save
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
