import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size = 'md' | 'lg' | 'sm';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  block?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  children,
  style,
  ...rest
}: Props) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    borderRadius: 999,
    transition: 'background 150ms ease, transform 150ms ease, opacity 150ms ease',
    width: block ? '100%' : undefined,
  };

  const sizes: Record<Size, { fs: number; py: number; px: number; tracking: string }> = {
    sm: { fs: 11, py: 8,  px: 16, tracking: '0.14em' },
    md: { fs: 12, py: 12, px: 22, tracking: '0.16em' },
    lg: { fs: 13, py: 16, px: 28, tracking: '0.2em'  },
  };
  const s = sizes[size];

  const variants: Record<Variant, CSSProperties> = {
    primary: {
      background: 'var(--ink)',
      color: 'var(--cream)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--ink)',
      border: '1px solid var(--gold-light)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-soft)',
    },
    gold: {
      background: 'var(--gold)',
      color: 'var(--cream)',
    },
  };

  return (
    <button
      {...rest}
      style={{
        ...base,
        fontSize: s.fs,
        padding: `${s.py}px ${s.px}px`,
        letterSpacing: s.tracking,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
