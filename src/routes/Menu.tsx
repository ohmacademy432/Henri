import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/TopBar';

type Chapter = {
  numeral: string;
  title: string;
  caption: string;
  to: string;
};

const chapters: Chapter[] = [
  { numeral: 'i.',   title: 'Today',           caption: 'the daily pulse',          to: '/today' },
  { numeral: 'ii.',  title: 'The Memory Book', caption: 'photos, voice, prompts',   to: '/memories' },
  { numeral: 'iii.', title: 'Health Record',   caption: 'growth, vaccines, visits', to: '/health' },
  { numeral: 'iv.',  title: 'Medications',     caption: 'doses & reminders',        to: '/medications' },
  { numeral: 'v.',   title: 'Family Tree',     caption: 'his people & stories',     to: '/family' },
];

const footer = [
  { title: 'Invitations',     caption: 'who may read',                to: '/invitations' },
  { title: 'Print the book',  caption: 'a chapter, or the whole thing', to: '/print' },
  { title: 'Settings',        caption: '',                            to: '/settings' },
  { title: 'About this book', caption: '',                            to: '/about' },
];

export function Menu() {
  const nav = useNavigate();

  const closeRight = (
    <button
      type="button"
      onClick={() => nav(-1)}
      aria-label="Close menu"
      style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 13,
        color: 'var(--ink)',
        padding: '4px 6px',
      }}
    >
      close
    </button>
  );

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--parchment)' }}>
      <TopBar hamburgerDim right={closeRight} />
      <div className="page">
        <div style={{ marginTop: 8 }}>
          <h1
            className="editorial-header"
            style={{ fontSize: 44, marginBottom: 6 }}
          >
            Henri<span className="accent">'s</span> book
          </h1>
          <div className="eyebrow" style={{ marginTop: 10 }}>
            Table of Contents
          </div>
          <hr className="hairline" style={{ margin: '22px 0' }} />
        </div>

        <nav>
          {chapters.map((c) => (
            <button
              key={c.to}
              type="button"
              onClick={() => nav(c.to)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                gap: 14,
                padding: '18px 0',
                textAlign: 'left',
                borderBottom: '1px solid var(--rule)',
              }}
            >
              <span
                className="numeral"
                style={{ fontSize: 18, width: 32, flexShrink: 0 }}
              >
                {c.numeral}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    lineHeight: 1.1,
                    color: 'var(--ink)',
                  }}
                >
                  {c.title}
                </div>
                <div className="caption" style={{ marginTop: 2 }}>
                  {c.caption}
                </div>
              </div>
              <span
                aria-hidden
                style={{
                  color: 'var(--gold)',
                  fontSize: 22,
                  fontFamily: 'var(--font-serif)',
                }}
              >
                →
              </span>
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 36, borderTop: '1px solid var(--rule)' }}>
          {footer.map((f) => (
            <button
              key={f.to}
              type="button"
              onClick={() => nav(f.to)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderBottom: '1px solid var(--rule)',
                textAlign: 'left',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 18,
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
      </div>
    </div>
  );
}
