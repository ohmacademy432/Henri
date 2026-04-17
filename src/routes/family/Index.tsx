import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { FAB } from '../../components/FAB';
import { SectionLabel } from '../../components/SectionLabel';
import { listFamily } from '../../lib/family';
import { useBook } from '../../lib/book';
import type { FamilyMember } from '../../lib/types';

const TIERS: { generation: number; label: string }[] = [
  { generation: -2, label: 'great-grandparents' },
  { generation: -1, label: 'grandparents' },
  { generation:  0, label: 'parents · aunts · uncles' },
  { generation:  1, label: 'henri & cousins' },
  { generation:  2, label: 'his children, one day' },
];

export function Index() {
  const nav = useNavigate();
  const { baby } = useBook();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!baby) return;
    setLoading(true);
    const rows = await listFamily(baby.id);
    setMembers(rows);
    setLoading(false);
  }, [baby]);

  useEffect(() => {
    void load();
  }, [load]);

  const byTier = useMemo(() => {
    const map = new Map<number, FamilyMember[]>();
    for (const m of members) {
      const tier = m.generation ?? 0;
      const arr = map.get(tier) ?? [];
      arr.push(m);
      map.set(tier, arr);
    }
    return map;
  }, [members]);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>chapter v</div>
        <h1 className="editorial-header" style={{ fontSize: 36 }}>His <span className="accent">people</span></h1>
        <div className="editorial-sub">The hands that hold him</div>
        <div className="gold-rule" />
      </div>

      {loading ? (
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-mute)' }}>
          gathering the family…
        </div>
      ) : members.length === 0 ? (
        <Card tone="parchment">
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 18,
              lineHeight: 1.5,
              color: 'var(--ink-soft)',
              marginBottom: 14,
            }}
          >
            Begin with the people he will know best — his parents, then a grandparent, then anyone who will love him.
          </div>
          <button
            type="button"
            onClick={() => nav('/family/new')}
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              borderBottom: '1px solid var(--gold)',
              paddingBottom: 3,
            }}
          >
            Add the first person →
          </button>
        </Card>
      ) : (
        <>
          {TIERS.map((t) => {
            const tierMembers = byTier.get(t.generation) ?? [];
            if (tierMembers.length === 0) return null;
            return (
              <div key={t.generation} style={{ marginBottom: 26 }}>
                <SectionLabel>{t.label}</SectionLabel>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 14,
                  }}
                >
                  {tierMembers.map((m) => (
                    <Avatar key={m.id} member={m} onClick={() => nav(`/family/${m.id}`)} isHenri={t.generation === 1 && m.relationship.toLowerCase().includes('henri')} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Members without an explicit generation */}
          {(byTier.get(0)?.length ?? 0) === 0 && byTier.get(null as unknown as number) && null}
        </>
      )}

      <FAB onClick={() => nav('/family/new')} label="Add a family member" />
    </div>
  );
}

function Avatar({ member, onClick, isHenri }: { member: FamilyMember; onClick: () => void; isHenri?: boolean }) {
  const initial = member.name.trim().charAt(0).toUpperCase() || '·';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'transparent',
        textAlign: 'center',
        padding: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: '50%',
          background: isHenri
            ? 'radial-gradient(circle at 30% 30%, var(--gold-light) 0%, var(--gold) 50%, var(--gold-deep) 100%)'
            : 'var(--parchment-warm)',
          border: '1px solid var(--gold-light)',
          boxShadow: isHenri ? '0 0 0 4px rgba(212, 179, 147, 0.25)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          overflow: 'hidden',
        }}
      >
        {member.photo_url ? (
          <img src={member.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 32,
              color: isHenri ? 'var(--cream)' : 'var(--ink)',
            }}
          >
            {initial}
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 15,
          color: 'var(--ink)',
          lineHeight: 1.1,
        }}
      >
        {member.name}
      </div>
      <div
        className="caption"
        style={{
          marginTop: 2,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontSize: 9,
        }}
      >
        {member.relationship}
      </div>
    </button>
  );
}
