type Vis = 'shared' | 'private';

type Props = {
  value: Vis;
  onChange: (v: Vis) => void;
};

export function VisibilityToggle({ value, onChange }: Props) {
  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: 999,
        background: 'var(--parchment-warm)',
        border: '1px solid var(--gold-light)',
        padding: 3,
      }}
    >
      <Segment active={value === 'shared'} onClick={() => onChange('shared')}>
        Share with family
      </Segment>
      <Segment active={value === 'private'} onClick={() => onChange('private')}>
        Keep private
      </Segment>
    </div>
  );
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        fontFamily: 'var(--font-sans)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--cream)' : 'var(--ink-soft)',
        transition: 'background 150ms ease, color 150ms ease',
      }}
    >
      {children}
    </button>
  );
}
