import { useEffect } from 'react';
import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, eyebrow, children }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 31, 24, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 60,
        animation: 'qa-fade 180ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cream)',
          width: '100%',
          maxWidth: 560,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '16px 22px calc(26px + var(--safe-bottom))',
          boxShadow: '0 -20px 40px rgba(42, 31, 24, 0.18)',
          animation: 'qa-rise 220ms ease',
          maxHeight: '92dvh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 4,
            width: 42,
            background: 'var(--rule)',
            borderRadius: 4,
            margin: '0 auto 16px',
          }}
        />
        {eyebrow && (
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            marginBottom: 18,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
