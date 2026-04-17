import type { CSSProperties, ReactNode } from 'react';

type Tone = 'parchment' | 'cream' | 'blush' | 'ink' | 'sage';

type Props = {
  tone?: Tone;
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  padded?: boolean;
  bordered?: boolean;
  lift?: boolean;
};

const bgFor: Record<Tone, string> = {
  parchment: 'var(--parchment-warm)',
  cream:     'var(--cream)',
  blush:     'var(--blush)',
  ink:       'var(--ink)',
  sage:      'var(--sage-soft)',
};

const fgFor: Record<Tone, string> = {
  parchment: 'var(--ink)',
  cream:     'var(--ink)',
  blush:     'var(--ink)',
  ink:       'var(--cream)',
  sage:      'var(--ink)',
};

export function Card({
  tone = 'parchment',
  children,
  onClick,
  style,
  className,
  padded = true,
  bordered = false,
  lift = false,
}: Props) {
  const clickable = !!onClick;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={className}
      style={{
        background: bgFor[tone],
        color: fgFor[tone],
        borderRadius: 'var(--radius-lg)',
        padding: padded ? '18px 18px' : 0,
        border: bordered ? '1px solid var(--gold-light)' : 'none',
        boxShadow: lift ? 'var(--shadow-soft)' : 'none',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
