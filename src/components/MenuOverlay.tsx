import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../lib/menu';

type Chapter = {
  numeral: string;
  title: string;
  caption: string;
  to: string;
};

const chapters: Chapter[] = [
  { numeral: 'i.',   title: 'Today',           caption: 'the daily pulse',              to: '/today' },
  { numeral: 'ii.',  title: 'The Memory Book', caption: 'photos, voice, prompts',       to: '/memories' },
  { numeral: 'iii.', title: 'Health Record',   caption: 'growth, vaccines, visits',     to: '/health' },
  { numeral: 'iv.',  title: 'Medications',     caption: 'doses & reminders',            to: '/medications' },
  { numeral: 'v.',   title: 'Family Tree',     caption: 'his people & stories',         to: '/family' },
  { numeral: 'vi.',  title: 'Counsel',         caption: 'a gentle friend, on the page', to: '/counsel' },
];

const footer = [
  { title: 'Invitations',     caption: 'who may read',                  to: '/invitations' },
  { title: 'Print the book',  caption: 'a chapter, or the whole thing', to: '/print' },
  { title: 'Dedication',      caption: 'a note from YahYah',            to: '/dedication' },
  { title: 'Settings',        caption: '',                              to: '/settings' },
  { title: 'About this book', caption: '',                              to: '/about' },
];

export function MenuOverlay() {
  const { isOpen, close } = useMenu();
  const nav = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      // Prevent body scroll while open.
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [isOpen, close]);

  function go(to: string) {
    close();
    // slight delay so the drawer close animation reads as intentional
    window.requestAnimationFrame(() => nav(to));
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Table of Contents"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 31, 24, 0.55)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-start',
        animation: 'henri-menu-fade 180ms ease',
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--parchment)',
          width: 'min(420px, 88vw)',
          maxWidth: '100%',
          height: '100dvh',
          overflowY: 'auto',
          padding: 'calc(22px + var(--safe-top)) 22px calc(24px + var(--safe-bottom))',
          boxShadow: '10px 0 40px rgba(42, 31, 24, 0.22)',
          animation: 'henri-menu-slide 240ms cubic-bezier(0.2, 0.7, 0.2, 1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <h1 className="editorial-header" style={{ fontSize: 30, marginBottom: 6, lineHeight: 1 }}>
              Henri<span className="accent">'s</span> book
            </h1>
            <div className="eyebrow" style={{ marginTop: 8 }}>Table of Contents</div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--ink)',
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
            }}
          >
            close
          </button>
        </div>

        <hr className="hairline" style={{ margin: '6px 0 2px' }} />

        <nav>
          {chapters.map((c) => (
            <button
              key={c.to}
              type="button"
              onClick={() => go(c.to)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                padding: '16px 0',
                textAlign: 'left',
                borderBottom: '1px solid var(--rule)',
                background: 'transparent',
              }}
            >
              <span className="numeral" style={{ fontSize: 17, width: 30, flexShrink: 0 }}>
                {c.numeral}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.1, color: 'var(--ink)' }}>
                  {c.title}
                </div>
                <div className="caption" style={{ marginTop: 2 }}>
                  {c.caption}
                </div>
              </div>
              <span aria-hidden style={{ color: 'var(--gold)', fontSize: 20, fontFamily: 'var(--font-serif)' }}>
                →
              </span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 26, borderTop: '1px solid var(--rule)' }}>
          {footer.map((f) => (
            <button
              key={f.to}
              type="button"
              onClick={() => go(f.to)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '14px 0',
                borderBottom: '1px solid var(--rule)',
                textAlign: 'left',
                background: 'transparent',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 17,
                    color: 'var(--ink)',
                  }}
                >
                  {f.title}
                </div>
                {f.caption && (
                  <div className="caption" style={{ marginTop: 2 }}>
                    {f.caption}
                  </div>
                )}
              </div>
              <span aria-hidden style={{ color: 'var(--gold)' }}>
                →
              </span>
            </button>
          ))}
        </div>
      </aside>

      <style>{`
        @keyframes henri-menu-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes henri-menu-slide {
          from { transform: translateX(-12px); opacity: 0.6; }
          to   { transform: translateX(0);     opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
