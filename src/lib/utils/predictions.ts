import type { Feed, SleepSession } from '../types';

export type NapPrediction = {
  label: string;
  windowStart: Date | null;
  windowEnd: Date | null;
  confidence: string;
};

export type FeedPrediction = {
  label: string;
  nextAt: Date | null;
  confidence: string;
};

/**
 * Looks at the last seven days of completed sleep sessions and computes a
 * likely next-nap window. Narrow ±20 min band around the mean wake-window
 * so it reads as a friendly hint, not a clinical forecast.
 */
export function predictNextNap(sessions: SleepSession[], now: Date = new Date()): NapPrediction {
  if (sessions.length < 3) {
    return {
      label: 'Next likely nap',
      windowStart: null,
      windowEnd: null,
      confidence: sessions.length === 0
        ? 'log a few sleeps and we will begin to see his pattern'
        : 'a pattern will take shape as you log more',
    };
  }

  const sorted = [...sessions]
    .filter((s) => s.ended_at && s.started_at)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const gapsMin: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].ended_at!).getTime();
    const next = new Date(sorted[i].started_at).getTime();
    const gap = (next - prev) / 60_000;
    if (gap > 15 && gap < 600) gapsMin.push(gap);
  }
  if (gapsMin.length === 0) {
    return { label: 'Next likely nap', windowStart: null, windowEnd: null, confidence: 'log a few more sleeps' };
  }
  const meanGapMin = gapsMin.reduce((a, b) => a + b, 0) / gapsMin.length;

  const last = sorted[sorted.length - 1];
  const lastEnd = last.ended_at ? new Date(last.ended_at) : new Date(last.started_at);

  const predicted = new Date(lastEnd.getTime() + meanGapMin * 60_000);
  // If the prediction is in the past, bump it into "soon" (15 min out).
  const center = predicted.getTime() < now.getTime() ? new Date(now.getTime() + 15 * 60_000) : predicted;
  const halfWindowMs = 20 * 60_000;

  return {
    label: 'Next likely nap',
    windowStart: new Date(center.getTime() - halfWindowMs),
    windowEnd: new Date(center.getTime() + halfWindowMs),
    confidence: `based on ${gapsMin.length} recent wake-window${gapsMin.length === 1 ? '' : 's'}`,
  };
}

/**
 * Predicts the next feed from the median interval between recent feed starts.
 * Median is more robust than mean against one extra-long cluster-fed evening.
 */
export function predictNextFeed(feeds: Feed[], now: Date = new Date()): FeedPrediction {
  if (feeds.length < 3) {
    return {
      label: 'Next likely feed',
      nextAt: null,
      confidence: feeds.length === 0
        ? 'log a few feeds and his rhythm will emerge'
        : 'his rhythm will take shape as you log more',
    };
  }

  const sorted = [...feeds]
    .filter((f) => !!f.started_at)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  const intervalsMin: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].started_at).getTime();
    const next = new Date(sorted[i].started_at).getTime();
    const gap = (next - prev) / 60_000;
    if (gap > 15 && gap < 480) intervalsMin.push(gap);
  }
  if (intervalsMin.length === 0) {
    return { label: 'Next likely feed', nextAt: null, confidence: 'log a few more feeds' };
  }
  intervalsMin.sort((a, b) => a - b);
  const medianMin = intervalsMin[Math.floor(intervalsMin.length / 2)];

  const last = sorted[sorted.length - 1];
  const lastStart = new Date(last.started_at);
  const predicted = new Date(lastStart.getTime() + medianMin * 60_000);
  const eta = predicted.getTime() < now.getTime() ? new Date(now.getTime() + 15 * 60_000) : predicted;

  return {
    label: 'Next likely feed',
    nextAt: eta,
    confidence: `based on the last ${intervalsMin.length} feed${intervalsMin.length === 1 ? '' : 's'}`,
  };
}

export function formatClock(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Compact variant, drops AM/PM when both endpoints share it. "8:45 – 9:30" */
export function formatClockRange(start: Date, end: Date): string {
  const sAm = start.getHours() >= 12;
  const eAm = end.getHours() >= 12;
  if (sAm === eAm) {
    // same half of day — render only one AM/PM
    const shortStart = clockOnly(start);
    const full = formatClock(end);
    return `${shortStart} – ${full}`;
  }
  return `${formatClock(start)} – ${formatClock(end)}`;
}

function clockOnly(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')}`;
}
