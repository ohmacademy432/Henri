import type { ReactNode } from 'react';
import { EditorialHeader } from '../components/EditorialHeader';

type Props = {
  eyebrow: string;
  title: ReactNode;
  italicTail?: string;
  subtitle?: string;
  note?: string;
};

export function Stub({ eyebrow, title, italicTail, subtitle, note }: Props) {
  return (
    <div className="page">
      <EditorialHeader
        eyebrow={eyebrow}
        title={title}
        italicTail={italicTail}
        subtitle={subtitle}
      />
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--ink-soft)',
          padding: '40px 0',
          lineHeight: 1.5,
        }}
      >
        {note ?? 'This chapter is still being bound.'}
      </div>
    </div>
  );
}
