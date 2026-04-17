import { useState } from 'react';
import type { CalendarEventInput } from '../lib/calendar';
import { addToCalendar } from '../lib/calendar';

type Props = {
  /** The event to add when tapped. Called fresh on each tap. */
  event: () => CalendarEventInput;
  /** Optional override label, default "Remind me". */
  label?: string;
  /** If true, the button is rendered on a dark surface (inverts colors subtly). */
  onDark?: boolean;
};

export function RemindMeButton({ event, label = 'Remind me', onDark = false }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  function onClick() {
    addToCalendar(event());
    setConfirmed(true);
    window.setTimeout(() => setConfirmed(false), 2200);
  }

  const text = confirmed ? 'Added to your calendar' : label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: 'transparent',
        border: onDark ? '1px solid rgba(249, 244, 234, 0.35)' : '1px solid var(--gold-light)',
        color: onDark ? 'var(--gold-light)' : 'var(--gold-deep)',
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 13,
        transition: 'background 150ms ease, color 150ms ease',
      }}
    >
      <CalendarGlyph color={onDark ? 'var(--gold-light)' : 'var(--gold-deep)'} />
      {text}
    </button>
  );
}

function CalendarGlyph({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="1.4" />
      <path d="M3 9h18" stroke={color} strokeWidth="1.4" />
      <path d="M8 3v4M16 3v4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
