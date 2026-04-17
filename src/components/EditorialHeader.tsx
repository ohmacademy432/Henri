import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  italicTail?: string;
};

export function EditorialHeader({ eyebrow, title, subtitle, italicTail }: Props) {
  return (
    <div style={{ marginBottom: 18 }}>
      {eyebrow && (
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          {eyebrow}
        </div>
      )}
      <h1 className="editorial-header">
        {title}
        {italicTail && <span className="accent">{italicTail}</span>}
      </h1>
      {subtitle && <div className="editorial-sub">{subtitle}</div>}
      <div className="gold-rule" />
    </div>
  );
}
