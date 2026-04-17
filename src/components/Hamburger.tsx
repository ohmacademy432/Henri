type Props = {
  onClick?: () => void;
  dim?: boolean;
  ariaLabel?: string;
};

export function Hamburger({ onClick, dim = false, ariaLabel = 'Open menu' }: Props) {
  const color = 'var(--ink)';
  const opacity = dim ? 0.35 : 1;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 32,
        height: 32,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 4,
        opacity,
      }}
    >
      <span style={{ display: 'block', height: 1.5, width: 16, background: color, borderRadius: 1 }} />
      <span style={{ display: 'block', height: 1.5, width: 12, background: color, borderRadius: 1 }} />
      <span style={{ display: 'block', height: 1.5, width: 14, background: color, borderRadius: 1 }} />
    </button>
  );
}
