import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { QuickActions } from '../components/QuickActions';
import { RemindMeButton } from '../components/RemindMeButton';
import { SectionLabel } from '../components/SectionLabel';
import { LogSheets } from '../components/LogSheets';
import { addToCalendar, type CalendarEventInput } from '../lib/calendar';
import { useBook } from '../lib/book';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchFeedsSince,
  fetchLastDiaper,
  fetchLastFeed,
  fetchLastSleep,
  fetchSleepSessionsSince,
} from '../lib/repo';
import type { Diaper, Feed, SleepSession } from '../lib/types';
import { mockBaby, mockLastEntries } from '../lib/mock';
import { editorialAgeLabel, editorialDate, greeting, relativeTime } from '../lib/utils/age';
import {
  formatClock,
  formatClockRange,
  predictNextFeed,
  predictNextNap,
} from '../lib/utils/predictions';

export function Today() {
  const nav = useNavigate();
  const { baby, caregiver } = useBook();
  const [qaOpen, setQaOpen] = useState(false);
  const [logKind, setLogKind] = useState<'feed' | 'sleep' | 'diaper' | null>(null);

  const [lastFeed, setLastFeed] = useState<Feed | null>(null);
  const [lastSleep, setLastSleep] = useState<SleepSession | null>(null);
  const [lastDiaper, setLastDiaper] = useState<Diaper | null>(null);
  const [sleepLastWeek, setSleepLastWeek] = useState<SleepSession[]>([]);
  const [feedsLastWeek, setFeedsLastWeek] = useState<Feed[]>([]);

  const usingMock = !isSupabaseConfigured || !baby;

  const refresh = useCallback(async () => {
    if (usingMock || !baby) return;
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [f, s, d, weekSleep, weekFeeds] = await Promise.all([
      fetchLastFeed(baby.id),
      fetchLastSleep(baby.id),
      fetchLastDiaper(baby.id),
      fetchSleepSessionsSince(baby.id, since),
      fetchFeedsSince(baby.id, since),
    ]);
    setLastFeed(f);
    setLastSleep(s);
    setLastDiaper(d);
    setSleepLastWeek(weekSleep);
    setFeedsLastWeek(weekFeeds);
  }, [usingMock, baby]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const now = new Date();
  const displayBaby = baby ?? mockBaby;
  const awaitingArrival = !displayBaby.birth_time;
  const g = greeting(now);
  const dateLine = editorialDate(now);
  const ageLine = awaitingArrival
    ? 'on the way'
    : editorialAgeLabel(displayBaby.birth_time!, now);

  const feedCard = usingMock
    ? mockLastEntries.find((e) => e.kind === 'feed')
    : lastFeed
      ? mapFeedForCard(lastFeed)
      : null;
  const sleepCard = usingMock
    ? mockLastEntries.find((e) => e.kind === 'sleep')
    : lastSleep
      ? mapSleepForCard(lastSleep)
      : null;
  const diaperCard = usingMock
    ? mockLastEntries.find((e) => e.kind === 'diaper')
    : lastDiaper
      ? mapDiaperForCard(lastDiaper)
      : null;

  const napPrediction  = usingMock ? null : predictNextNap(sleepLastWeek, now);
  const feedPrediction = usingMock ? null : predictNextFeed(feedsLastWeek, now);
  const hasAnyPrediction =
    !!(napPrediction?.windowStart && napPrediction?.windowEnd) || !!feedPrediction?.nextAt;

  return (
    <div className="page">
      <div style={{ marginTop: 6 }}>
        <h1 className="editorial-header" style={{ fontSize: 32, lineHeight: 1.05 }}>
          {awaitingArrival ? (
            <>Waiting for <span className="accent">{displayBaby.name}</span></>
          ) : (
            <>{g}, {displayBaby.name}</>
          )}
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 18,
            color: 'var(--ink-soft)',
            marginTop: 8,
          }}
        >
          {dateLine}
        </div>
        <div className="eyebrow" style={{ marginTop: 12, color: 'var(--gold-deep)' }}>
          {ageLine}
        </div>
      </div>

      {awaitingArrival ? (
        <>
          <SectionLabel>the quiet months before</SectionLabel>
          <Card tone="blush">
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 20,
                lineHeight: 1.5,
                color: 'var(--ink)',
              }}
            >
              The book is open.
              <br />
              Write what you want him to know —
              the hoping, the waiting, the first time he moved.
            </div>
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => nav('/memories')}
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
                Write in the memory book →
              </button>
            </div>
          </Card>

          <SectionLabel>when he arrives</SectionLabel>
          <Card tone="parchment">
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                color: 'var(--ink-soft)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              Add his birth date in{' '}
              <button
                type="button"
                onClick={() => nav('/settings')}
                style={{
                  color: 'var(--gold-deep)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  fontStyle: 'italic',
                }}
              >
                Settings
              </button>{' '}
              and the daily pages will unfold.
            </div>
          </Card>
        </>
      ) : (
        <>
          <SectionLabel right="last recorded">— a quiet log —</SectionLabel>

          <div style={{ display: 'grid', gap: 10 }}>
            {feedCard   ? <LastCard kind="feed"   entry={feedCard}   /> : <EmptyCard kind="feed"   onLog={() => setLogKind('feed')} />}
            {sleepCard  ? <LastCard kind="sleep"  entry={sleepCard}  /> : <EmptyCard kind="sleep"  onLog={() => setLogKind('sleep')} />}
            {diaperCard ? <LastCard kind="diaper" entry={diaperCard} /> : <EmptyCard kind="diaper" onLog={() => setLogKind('diaper')} />}
          </div>

          {hasAnyPrediction && (
            <>
              <SectionLabel>a gentle prediction</SectionLabel>

              <Card tone="parchment" bordered style={{ padding: 22, borderColor: 'var(--gold)' }}>
                {napPrediction?.windowStart && napPrediction?.windowEnd && (
                  <NapBlock
                    start={napPrediction.windowStart}
                    end={napPrediction.windowEnd}
                    confidence={napPrediction.confidence}
                    babyName={displayBaby.name}
                  />
                )}
                {feedPrediction?.nextAt && (
                  <FeedBlock
                    when={feedPrediction.nextAt}
                    confidence={feedPrediction.confidence}
                    spaced={!!napPrediction?.windowStart}
                  />
                )}
              </Card>
            </>
          )}
        </>
      )}

      {!awaitingArrival && (
        <div style={{ marginTop: 28 }}>
          <Button size="lg" block onClick={() => setQaOpen(true)}>
            Add an entry
          </Button>
        </div>
      )}

      <QuickActions
        open={qaOpen}
        onClose={() => setQaOpen(false)}
        actions={[
          { id: 'photo',   label: 'Take a photo',   hint: 'save a moment',    icon: 'camera',  primary: true, onSelect: () => nav('/memories/new?source=camera') },
          { id: 'gallery', label: 'From gallery',   icon: 'gallery', onSelect: () => nav('/memories/new?source=gallery') },
          { id: 'feed',    label: 'Log a feed',     icon: 'feed',    onSelect: () => setLogKind('feed') },
          { id: 'sleep',   label: 'Log sleep',      icon: 'sleep',   onSelect: () => setLogKind('sleep') },
          { id: 'diaper',  label: 'Log diaper',     icon: 'diaper',  onSelect: () => setLogKind('diaper') },
          { id: 'med',     label: 'Log medication', icon: 'med',     onSelect: () => nav('/medications') },
        ]}
      />

      {baby && (
        <LogSheets
          babyId={baby.id}
          caregiverId={caregiver?.id ?? null}
          kind={logKind}
          onClose={() => setLogKind(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

type CardEntry = { when: Date; primary: string; secondary?: string; footer?: React.ReactNode };

function LastCard({ kind, entry }: { kind: 'feed' | 'sleep' | 'diaper'; entry: CardEntry }) {
  const label = kind === 'feed' ? 'last feed' : kind === 'sleep' ? 'last sleep' : 'last diaper';
  return (
    <Card tone="parchment">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div className="eyebrow">{label}</div>
        <div className="caption">{relativeTime(entry.when)}</div>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          lineHeight: 1.1,
          color: 'var(--ink)',
          marginTop: 8,
        }}
      >
        {entry.primary}
      </div>
      {entry.secondary && (
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--ink-soft)',
            marginTop: 2,
          }}
        >
          {entry.secondary}
        </div>
      )}
      {entry.footer && <div style={{ marginTop: 10 }}>{entry.footer}</div>}
    </Card>
  );
}

function NapBlock({
  start,
  end,
  confidence,
  babyName,
}: {
  start: Date;
  end: Date;
  confidence: string;
  babyName: string;
}) {
  return (
    <div>
      <div className="eyebrow" style={{ color: 'var(--gold-deep)', marginBottom: 6 }}>
        Next likely nap
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1.25,
          color: 'var(--ink)',
        }}
      >
        {babyName} usually settles between{' '}
        <span style={{ fontStyle: 'normal', fontWeight: 500 }}>{formatClockRange(start, end)}</span>.
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-mute)',
          marginTop: 4,
        }}
      >
        {confidence}
      </div>
    </div>
  );
}

function FeedBlock({
  when,
  confidence,
  spaced,
}: {
  when: Date;
  confidence: string;
  spaced: boolean;
}) {
  return (
    <div style={{ marginTop: spaced ? 18 : 0, paddingTop: spaced ? 18 : 0, borderTop: spaced ? '1px solid var(--rule)' : 'none' }}>
      <div className="eyebrow" style={{ color: 'var(--gold-deep)', marginBottom: 6 }}>
        Next likely feed
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          lineHeight: 1.25,
          color: 'var(--ink)',
        }}
      >
        Usually around{' '}
        <span style={{ fontStyle: 'normal', fontWeight: 500 }}>{formatClock(when)}</span>.
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-mute)',
          marginTop: 4,
          marginBottom: 10,
        }}
      >
        {confidence}
      </div>
      <RemindMeButton
        event={() => ({
          kind: 'timed',
          title: "Henri's next feed",
          description: 'A gentle nudge for the next feeding window.',
          startTime: when,
          durationMinutes: 15,
          alarmOffsetMinutes: 0,
        })}
      />
    </div>
  );
}

function EmptyCard({ kind, onLog }: { kind: 'feed' | 'sleep' | 'diaper'; onLog: () => void }) {
  const copy = {
    feed:   { label: 'last feed',   hint: 'when the first bottle is offered,\nits quiet time will be kept here.' },
    sleep:  { label: 'last sleep',  hint: 'his rest, once logged, reveals\na gentle pattern over days.' },
    diaper: { label: 'last diaper', hint: 'a careful record,\nnot a checklist.' },
  }[kind];

  return (
    <button
      type="button"
      onClick={onLog}
      style={{
        textAlign: 'left',
        background: 'var(--parchment-warm)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px',
        border: '1px dashed var(--gold-light)',
        width: '100%',
      }}
    >
      <div className="eyebrow">{copy.label}</div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 17,
          color: 'var(--ink-soft)',
          marginTop: 6,
          whiteSpace: 'pre-line',
          lineHeight: 1.4,
        }}
      >
        {copy.hint}
      </div>
    </button>
  );
}

function mapFeedForCard(f: Feed): CardEntry {
  const when = new Date(f.started_at);
  let primary = 'A feed';
  if (f.type === 'bottle') {
    const oz = f.amount_ml ? (f.amount_ml / 29.5735) : null;
    primary = oz ? `Bottle · ${fmtNum(oz)} oz` : 'Bottle';
  } else if (f.type === 'breast_left' || f.type === 'breast_right') {
    const side = f.type === 'breast_left' ? 'left' : 'right';
    primary = f.duration_min ? `Breast · ${side} · ${fmtNum(f.duration_min)} min` : `Breast · ${side}`;
  } else if (f.type === 'solid') {
    primary = 'A solid meal';
  }

  const nextInThreeHours = new Date(when.getTime() + 3 * 3600_000);
  const footer = (
    <RemindInThreeHoursLink
      event={() => ({
        kind: 'timed' as const,
        title: "Henri's next feed",
        description: 'A gentle three-hour nudge from the last feed.',
        startTime: nextInThreeHours,
        durationMinutes: 15,
        alarmOffsetMinutes: 0,
      })}
    />
  );

  return { when, primary, secondary: f.notes ?? undefined, footer };
}

function RemindInThreeHoursLink({ event }: { event: () => CalendarEventInput }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        addToCalendar(event());
        setAdded(true);
        window.setTimeout(() => setAdded(false), 2200);
      }}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: 14,
        color: 'var(--gold-deep)',
        textDecoration: 'underline',
        textUnderlineOffset: 3,
        cursor: 'pointer',
      }}
    >
      {added ? 'Added to your calendar' : 'Remind me in 3 hours'}
    </button>
  );
}

function mapSleepForCard(s: SleepSession): CardEntry {
  const when = new Date(s.started_at);
  const end = s.ended_at ? new Date(s.ended_at) : null;
  let primary = 'Sleep';
  if (end) {
    const mins = Math.round((end.getTime() - when.getTime()) / 60_000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    primary = h > 0 ? `${h} h ${m} m ${mins >= 240 ? 'night' : 'nap'}` : `${m} m ${mins >= 240 ? 'night' : 'nap'}`;
  } else {
    primary = 'Asleep now';
  }
  return { when, primary, secondary: s.location ?? undefined };
}

function mapDiaperForCard(d: Diaper): CardEntry {
  const when = new Date(d.occurred_at);
  const primary = d.type.charAt(0).toUpperCase() + d.type.slice(1);
  return { when, primary, secondary: d.notes ?? undefined };
}

function fmtNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return (r % 1 === 0 ? r.toFixed(0) : r.toFixed(1));
}
