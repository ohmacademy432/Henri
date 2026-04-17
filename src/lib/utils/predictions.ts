import type { SleepSession } from '../types';

type Prediction = {
  label: string;
  time: string | null;
  confidence: string;
};

// Looks at the last seven days of completed sleep sessions.
// Next likely nap-start = mean of hour-of-day offsets from wake-up.
// Falls back gracefully when data is thin.
export function predictNextNap(sessions: SleepSession[], now: Date = new Date()): Prediction {
  if (sessions.length < 3) {
    return {
      label: 'Next likely nap',
      time: null,
      confidence: sessions.length === 0
        ? 'log a few sleeps and we will begin to see his pattern'
        : 'a pattern will take shape as you log more',
    };
  }

  // For each sleep, find the gap since the previous sleep ended.
  const sorted = [...sessions]
    .filter((s) => s.ended_at && s.started_at)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const gapsMin: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].ended_at!).getTime();
    const next = new Date(sorted[i].started_at).getTime();
    const gap = (next - prev) / 60_000;
    if (gap > 15 && gap < 600) gapsMin.push(gap); // plausible wake windows
  }

  if (gapsMin.length === 0) {
    return { label: 'Next likely nap', time: null, confidence: 'log a few more sleeps' };
  }
  const meanGapMin = gapsMin.reduce((a, b) => a + b, 0) / gapsMin.length;

  const last = sorted[sorted.length - 1];
  const lastEnd = last.ended_at ? new Date(last.ended_at) : new Date(last.started_at);

  const predicted = new Date(lastEnd.getTime() + meanGapMin * 60_000);
  // If the prediction is in the past, bump it into "soon."
  const eta = predicted.getTime() < now.getTime() ? new Date(now.getTime() + 15 * 60_000) : predicted;

  return {
    label: 'Next likely nap',
    time: formatClock(eta),
    confidence: `based on ${gapsMin.length} recent wake-window${gapsMin.length === 1 ? '' : 's'}`,
  };
}

function formatClock(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}
