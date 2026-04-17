type Props = {
  onClick: () => void;
  label?: string;
};

export function FAB({ onClick, label = 'Add' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-no-print
      style={{
        position: 'fixed',
        right: 20,
        bottom: `calc(24px + var(--safe-bottom))`,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--ink)',
        color: 'var(--cream)',
        boxShadow: 'var(--shadow-lift)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
