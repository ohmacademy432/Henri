import type { ReactNode } from 'react';
import { Hamburger } from './Hamburger';
import { Wordmark } from './Wordmark';

type Props = {
  onMenu?: () => void;
  hamburgerDim?: boolean;
  right?: ReactNode;
  unread?: number;
};

export function TopBar({ onMenu, hamburgerDim, right, unread = 0 }: Props) {
  const defaultRight = (
    <button
      type="button"
      aria-label="Notifications"
      style={{
        position: 'relative',
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
      }}
    >
      <BellIcon />
      {unread > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 7,
            height: 7,
            borderRadius: 4,
            background: 'var(--gold-deep)',
          }}
        />
      )}
    </button>
  );

  return (
    <header
      data-no-print
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'var(--sage-light)',
        paddingTop: 'var(--safe-top)',
        borderBottom: '1px solid rgba(42, 31, 24, 0.12)',
      }}
    >
      <div
        style={{
          height: 'var(--topbar-h)',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          padding: '0 14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Hamburger onClick={onMenu} dim={hamburgerDim} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Wordmark size={20} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {right ?? defaultRight}
        </div>
      </div>
    </header>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15L6 17Z"
        stroke="var(--ink)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M10 20.5a2 2 0 0 0 4 0"
        stroke="var(--ink)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
