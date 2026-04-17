type Props = {
  size?: number;
  color?: string;
};

export function Wordmark({ size = 20, color = 'var(--ink)' }: Props) {
  return (
    <span
      className="wordmark"
      style={{
        fontSize: size,
        color,
        lineHeight: 1,
        display: 'inline-block',
      }}
    >
      Henri
    </span>
  );
}
