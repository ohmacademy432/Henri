import type { CSSProperties, ReactNode } from 'react';

export function FieldRow({ children }: { children: ReactNode }) {
  return <div style={{ marginBottom: 18 }}>{children}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
      {children}
    </span>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        width: '100%',
        padding: '10px 2px',
        border: 'none',
        borderBottom: '1px solid var(--gold-light)',
        background: 'transparent',
        fontFamily: 'var(--font-serif)',
        fontSize: 20,
        color: 'var(--ink)',
        outline: 'none',
        ...style,
      }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { style, ...rest } = props;
  return (
    <textarea
      {...rest}
      style={{
        width: '100%',
        padding: '10px 2px',
        border: 'none',
        borderBottom: '1px solid var(--gold-light)',
        background: 'transparent',
        fontFamily: 'var(--font-serif)',
        fontSize: 18,
        fontStyle: 'italic',
        color: 'var(--ink)',
        outline: 'none',
        resize: 'vertical',
        minHeight: 72,
        ...style,
      }}
    />
  );
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
  style,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, ...style }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--cream)' : 'var(--ink-soft)',
              border: active ? '1px solid var(--ink)' : '1px solid var(--gold-light)',
              transition: 'background 150ms',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
