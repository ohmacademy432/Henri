import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Wordmark';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useBook } from '../lib/book';

type Step = 'your_name' | 'baby' | 'birth' | 'done';
type Arrived = 'yes' | 'not_yet' | null;

export function Welcome() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { refresh } = useBook();
  const [step, setStep] = useState<Step>('your_name');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [yourName, setYourName] = useState(user?.user_metadata?.full_name ?? '');
  const [relationship, setRelationship] = useState('Mother');
  const [babyName, setBabyName] = useState('');
  const [arrived, setArrived] = useState<Arrived>(null);
  const [birthDate, setBirthDate] = useState(''); // yyyy-mm-dd
  const [birthTime, setBirthTime] = useState(''); // hh:mm
  const [weightOz, setWeightOz] = useState('');
  const [lengthIn, setLengthIn] = useState('');
  const [birthLocation, setBirthLocation] = useState('');

  async function finish() {
    if (!user) {
      setError('You need to be signed in to begin.');
      return;
    }
    setBusy(true);
    setError(null);

    const birthIso =
      arrived === 'yes' && birthDate && birthTime
        ? new Date(`${birthDate}T${birthTime}`).toISOString()
        : arrived === 'yes' && birthDate
        ? new Date(`${birthDate}T12:00`).toISOString()
        : null;

    const { data: babyRow, error: babyErr } = await supabase
      .from('babies')
      .insert({
        name: babyName.trim(),
        birth_time: birthIso,
        birth_weight_oz: weightOz ? Number(weightOz) : null,
        birth_length_in: lengthIn ? Number(lengthIn) : null,
        birth_location: birthLocation.trim() || null,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (babyErr || !babyRow) {
      setError(babyErr?.message ?? 'Could not create the book.');
      setBusy(false);
      return;
    }

    const { error: careErr } = await supabase.from('caregivers').insert({
      baby_id: babyRow.id,
      user_id: user.id,
      display_name: yourName.trim(),
      relationship,
      can_edit: true,
    });

    if (careErr) {
      setError(careErr.message);
      setBusy(false);
      return;
    }

    await refresh();
    setStep('done');
    setBusy(false);
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Wordmark size={40} />
        </div>
        <div style={{ height: 1, width: 56, background: 'var(--gold)', margin: '0 auto 26px' }} />

        {step === 'your_name' && (
          <Panel
            eyebrow="first, you"
            title={<>A book begins with<br /><span className="accent">its keeper.</span></>}
          >
            <Field
              label="Your name"
              value={yourName}
              onChange={setYourName}
              placeholder="What should he call you here?"
            />
            <Select
              label="You are…"
              value={relationship}
              onChange={setRelationship}
              options={['Mother', 'Father', 'Parent', 'Grandmother', 'Grandfather', 'YahYah', 'Guardian', 'Other']}
            />
            <Button size="lg" block onClick={() => setStep('baby')} disabled={!yourName.trim()}>
              Next
            </Button>
          </Panel>
        )}

        {step === 'baby' && (
          <Panel
            eyebrow="next, the child"
            title={<>Who is this<br /><span className="accent">book for?</span></>}
          >
            <Field
              label="His name"
              value={babyName}
              onChange={setBabyName}
              placeholder="Henri"
            />
            <Button size="lg" block onClick={() => setStep('birth')} disabled={!babyName.trim()}>
              Next
            </Button>
            <BackLink onClick={() => setStep('your_name')} />
          </Panel>
        )}

        {step === 'birth' && (
          <Panel
            eyebrow="the first page"
            title={
              arrived === 'not_yet'
                ? (<>The days<br /><span className="accent">before.</span></>)
                : (<>The day he<br /><span className="accent">arrived.</span></>)
            }
          >
            {arrived === null && (
              <>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 18,
                    color: 'var(--ink-soft)',
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}
                >
                  Has he arrived?
                </div>
                <Button size="lg" block onClick={() => setArrived('yes')}>
                  Yes, he is here
                </Button>
                <div style={{ height: 10 }} />
                <Button size="lg" block variant="secondary" onClick={() => setArrived('not_yet')}>
                  Not yet — on the way
                </Button>
                <BackLink onClick={() => setStep('baby')} />
              </>
            )}

            {arrived === 'yes' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Date" value={birthDate} onChange={setBirthDate} type="date" />
                  <Field label="Time" value={birthTime} onChange={setBirthTime} type="time" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Weight (oz)" value={weightOz} onChange={setWeightOz} placeholder="120" inputMode="decimal" />
                  <Field label="Length (in)" value={lengthIn} onChange={setLengthIn} placeholder="19.5" inputMode="decimal" />
                </div>
                <Field
                  label="Where he was born"
                  value={birthLocation}
                  onChange={setBirthLocation}
                  placeholder="St. Mary's, New York"
                />
                {error && (
                  <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>
                    {error}
                  </div>
                )}
                <Button size="lg" block onClick={(e) => { e.preventDefault(); void finish(); }} disabled={busy}>
                  {busy ? 'Binding the book…' : 'Begin the book'}
                </Button>
                <BackLink onClick={() => setArrived(null)} />
              </>
            )}

            {arrived === 'not_yet' && (
              <>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 20,
                    color: 'var(--ink-soft)',
                    marginBottom: 28,
                    lineHeight: 1.5,
                  }}
                >
                  Then the pages will wait for him.
                  <br />
                  You can begin with the quiet months before —
                  the hoping, the choosing of names, the first time you felt him move.
                </div>
                {error && (
                  <div className="caption" style={{ color: 'var(--gold-deep)', marginBottom: 12 }}>
                    {error}
                  </div>
                )}
                <Button size="lg" block onClick={(e) => { e.preventDefault(); void finish(); }} disabled={busy}>
                  {busy ? 'Binding the book…' : 'Begin the book'}
                </Button>
                <BackLink onClick={() => setArrived(null)} />
              </>
            )}
          </Panel>
        )}

        {step === 'done' && (
          <Panel eyebrow="done" title={<>The book is <span className="accent">ready.</span></>}>
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 18,
                color: 'var(--ink-soft)',
                marginBottom: 24,
                lineHeight: 1.5,
              }}
            >
              Open it now, and begin.
            </div>
            <Button size="lg" block onClick={() => nav('/today')}>
              Open
            </Button>
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        {eyebrow}
      </div>
      <h1 className="editorial-header" style={{ fontSize: 36, marginBottom: 28 }}>
        {title}
      </h1>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <label style={{ display: 'block', marginBottom: 20 }}>
      <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 2px',
          border: 'none',
          borderBottom: '1px solid var(--gold-light)',
          background: 'transparent',
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--ink)',
          outline: 'none',
        }}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label style={{ display: 'block', marginBottom: 24 }}>
      <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 2px',
          border: 'none',
          borderBottom: '1px solid var(--gold-light)',
          background: 'transparent',
          fontFamily: 'var(--font-serif)',
          fontSize: 20,
          color: 'var(--ink)',
          outline: 'none',
          appearance: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        margin: '16px auto 0',
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        color: 'var(--ink-mute)',
        fontSize: 15,
      }}
    >
      ← a step back
    </button>
  );
}
