import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  question: string;
  footer?: ReactNode;
  onAnswer?: () => void;
};

export function PromptCard({ eyebrow = "Today's prompt", question, footer, onAnswer }: Props) {
  return (
    <div
      role={onAnswer ? 'button' : undefined}
      onClick={onAnswer}
      style={{
        background: 'var(--blush)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 22px 20px',
        position: 'relative',
        cursor: onAnswer ? 'pointer' : 'default',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 6,
          left: 18,
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 56,
          lineHeight: 1,
          color: 'var(--gold)',
          opacity: 0.45,
        }}
      >
        “
      </span>
      <div className="eyebrow" style={{ marginBottom: 10, marginTop: 18 }}>
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.3,
          color: 'var(--ink)',
        }}
      >
        {question}
      </div>
      {footer && (
        <div style={{ marginTop: 14, color: 'var(--ink-soft)' }}>{footer}</div>
      )}
    </div>
  );
}
