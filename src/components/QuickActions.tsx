import { useEffect, useRef } from 'react';

type Action = {
  id: string;
  label: string;
  hint?: string;
  primary?: boolean;
  icon: 'camera' | 'gallery' | 'feed' | 'sleep' | 'diaper' | 'med';
  onSelect: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  actions: Action[];
};

export function QuickActions({ open, onClose, actions }: Props) {
  const sheetRef = useRef<HTMLDivElement | null>(null);

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
      aria-label="Quick actions"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 31, 24, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
        animation: 'qa-fade 180ms ease',
      }}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--cream)',
          width: '100%',
          maxWidth: 560,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '16px 18px calc(20px + var(--safe-bottom))',
          boxShadow: '0 -20px 40px rgba(42, 31, 24, 0.18)',
          animation: 'qa-rise 220ms ease',
        }}
      >
        <div
          style={{
            height: 4,
            width: 42,
            background: 'var(--rule)',
            borderRadius: 4,
            margin: '0 auto 14px',
          }}
        />
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          A new entry
        </div>
        {actions.map((a) => {
          const isPrimary = a.primary;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                a.onSelect();
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: isPrimary ? '18px 16px' : '14px 4px',
                background: isPrimary ? 'var(--ink)' : 'transparent',
                color: isPrimary ? 'var(--cream)' : 'var(--ink)',
                borderRadius: isPrimary ? 'var(--radius)' : 0,
                textAlign: 'left',
                marginBottom: isPrimary ? 8 : 0,
                borderBottom: isPrimary ? 'none' : '1px solid var(--rule)',
              }}
            >
              <ActionIcon kind={a.icon} primary={isPrimary} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: isPrimary ? 20 : 18,
                    fontStyle: isPrimary ? 'normal' : 'italic',
                    fontWeight: isPrimary ? 500 : 400,
                    lineHeight: 1.1,
                  }}
                >
                  {a.label}
                </div>
                {a.hint && (
                  <div
                    className="caption"
                    style={{ color: isPrimary ? 'rgba(249,244,234,0.7)' : 'var(--ink-mute)', marginTop: 2 }}
                  >
                    {a.hint}
                  </div>
                )}
              </div>
              <span aria-hidden style={{ opacity: 0.5 }}>›</span>
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes qa-rise { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes qa-fade { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

function ActionIcon({ kind, primary }: { kind: Action['icon']; primary?: boolean }) {
  const stroke = primary ? 'var(--cream)' : 'var(--ink)';
  const size = primary ? 26 : 22;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const };
  switch (kind) {
    case 'camera':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" stroke={stroke} strokeWidth="1.4" />
          <circle cx="12" cy="13.5" r="3.5" stroke={stroke} strokeWidth="1.4" />
          <path d="M8 7l1.5-2h5L16 7" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'gallery':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" stroke={stroke} strokeWidth="1.4" />
          <path d="M4 16l4-4 4 4 3-3 5 5" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="9" cy="9" r="1.3" fill={stroke} />
        </svg>
      );
    case 'feed':
      return (
        <svg {...common}>
          <path d="M8 3h8v5a4 4 0 0 1-8 0V3Z" stroke={stroke} strokeWidth="1.4" />
          <path d="M12 12v8M9 21h6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'sleep':
      return (
        <svg {...common}>
          <path d="M20 15.5A8 8 0 0 1 8.5 4a7 7 0 1 0 11.5 11.5Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case 'diaper':
      return (
        <svg {...common}>
          <path d="M3 8h18l-2 8a3 3 0 0 1-3 2H8a3 3 0 0 1-3-2L3 8Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M9 12h6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'med':
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="6" rx="3" stroke={stroke} strokeWidth="1.4" />
          <path d="M12 9v6" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
  }
}
