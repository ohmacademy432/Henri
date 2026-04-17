import { useNavigate } from 'react-router-dom';
import { Hamburger } from '../components/Hamburger';
import { useMenu } from '../lib/menu';

export function Dedication() {
  const nav = useNavigate();
  const { open } = useMenu();

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--parchment)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(40px + var(--safe-top)) 28px calc(40px + var(--safe-bottom))',
        position: 'relative',
      }}
    >
      {/* Quiet return -------------------------------------------------- */}
      <button
        type="button"
        onClick={() => nav(-1)}
        style={{
          position: 'absolute',
          top: `calc(24px + var(--safe-top))`,
          left: 22,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 15,
          color: 'var(--ink-mute)',
          background: 'transparent',
          border: 'none',
          padding: 4,
          cursor: 'pointer',
        }}
      >
        ← return
      </button>

      {/* Hamburger: access to the table of contents from this page too */}
      <div
        style={{
          position: 'absolute',
          top: `calc(22px + var(--safe-top))`,
          right: 18,
        }}
      >
        <Hamburger onClick={open} ariaLabel="Open the table of contents" />
      </div>

      {/* Dedication content ------------------------------------------- */}
      <div
        style={{
          maxWidth: 460,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--gold-deep)',
          }}
        >
          A note from YahYah
        </div>

        <div style={{ height: 72 }} />

        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 30,
            lineHeight: 1.4,
            color: 'var(--ink)',
          }}
        >
          <p style={{ margin: 0 }}>
            Built by April Louise,<br />
            your maternal grandmother<br />
            known as YahYah.
          </p>

          <p style={{ margin: '1.2em 0 0' }}>
            Created with love, compassion,<br />
            and intentions for a smooth<br />
            transition to earth.
          </p>

          <p style={{ margin: '1.2em 0 0' }}>
            I so love you, little one.
          </p>
        </div>
      </div>
    </div>
  );
}
