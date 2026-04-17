import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  right?: ReactNode;
};

export function SectionLabel({ children, right }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        margin: '24px 0 10px',
      }}
    >
      <span className="eyebrow">{children}</span>
      {right && <span className="caption">{right}</span>}
    </div>
  );
}
