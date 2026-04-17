import { useEffect, useState } from 'react';

type Props = {
  to: Date | null;
  pastDueLabel?: string;
};

/**
 * "2:14 hrs" / "47 min" / "Safe to give now" — ticks every 30s.
 */
export function Countdown({ to, pastDueLabel = 'Safe to give now' }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!to) return <span>{pastDueLabel}</span>;
  const ms = to.getTime() - Date.now();
  if (ms <= 0) return <span>{pastDueLabel}</span>;

  const totalMin = Math.ceil(ms / 60_000);
  if (totalMin >= 60) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return <span>{h}:{m.toString().padStart(2, '0')} hrs</span>;
  }
  return <span>{totalMin} min</span>;
}
