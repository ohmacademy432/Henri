import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { useBook } from '../lib/book';

export function About() {
  const nav = useNavigate();
  const { baby, caregiver } = useBook();

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>colophon</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>About this <span className="accent">book</span></h1>
        <div className="gold-rule" />
      </div>

      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 18,
          lineHeight: 1.7,
          color: 'var(--ink)',
        }}
      >
        <p>
          Henri is a keeping book — a private, beautifully kept place for the days of {baby?.name ?? 'a child'}.
          It is read only by the people you invite. It belongs to your family, not to anyone else.
        </p>
        <p style={{ fontStyle: 'italic', color: 'var(--ink-soft)' }}>
          The pages can be photos, voices, prompts, the small daily things — feeds, sleeps, doses. They can be the
          quiet questions you might one day be glad you answered.
        </p>
        <p>
          The book belongs to {caregiver?.display_name ?? 'its keeper'}. Every entry is private to your family until
          you decide to print it, share it, or carry it with you.
        </p>
      </div>

      <div className="gold-rule" style={{ margin: '24px 0' }} />

      <div className="eyebrow" style={{ marginBottom: 10 }}>credits</div>
      <Card tone="parchment">
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 16,
            color: 'var(--ink-soft)',
            lineHeight: 1.6,
          }}
        >
          Set in <strong style={{ fontWeight: 500 }}>Cormorant Garamond</strong> and{' '}
          <strong style={{ fontWeight: 500 }}>Jost</strong>.<br />
          Built quietly, with love, for a small family.
        </div>
      </Card>

      <div style={{ marginTop: 28 }}>
        <button
          type="button"
          onClick={() => nav('/menu')}
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            color: 'var(--gold-deep)',
            fontSize: 16,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          ← back to the table of contents
        </button>
      </div>
    </div>
  );
}
