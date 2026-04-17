import type { MemoryWithUrls } from '../lib/memories';

type Props = {
  memories: MemoryWithUrls[];
  onOpen: (memory: MemoryWithUrls) => void;
};

export function PhotoGrid({ memories, onOpen }: Props) {
  if (memories.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}
    >
      {memories.map((m) => (
        <Tile key={m.id} memory={m} onOpen={onOpen} />
      ))}
    </div>
  );
}

function Tile({ memory, onOpen }: { memory: MemoryWithUrls; onOpen: (m: MemoryWithUrls) => void }) {
  const thumb = memory.thumb_signed_urls[0] ?? memory.full_signed_urls[0];
  const caption = (memory.title ?? memory.body ?? '').trim();
  const isWrittenOnly = !thumb;

  return (
    <button
      type="button"
      onClick={() => onOpen(memory)}
      style={{
        position: 'relative',
        aspectRatio: '3 / 4',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        background: isWrittenOnly ? 'var(--parchment-warm)' : 'var(--ink)',
        border: '1px solid var(--rule)',
        padding: 0,
        textAlign: 'left',
      }}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: 14,
            display: 'flex',
            alignItems: 'flex-end',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--ink)',
            lineHeight: 1.35,
          }}
        >
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {caption || 'A written page'}
          </span>
        </div>
      )}
      {thumb && caption && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: '24px 12px 10px',
            background:
              'linear-gradient(to top, rgba(42,31,24,0.75), rgba(42,31,24,0))',
            color: 'var(--cream)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14,
            lineHeight: 1.2,
          }}
        >
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {caption}
          </span>
        </div>
      )}
      {memory.visibility === 'private' && (
        <div
          aria-label="private"
          title="Private"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'rgba(249, 244, 234, 0.9)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ink)',
          }}
        >
          ·
        </div>
      )}
    </button>
  );
}
