export function ageInDays(birth: Date | string, at: Date = new Date()): number {
  const b = typeof birth === 'string' ? new Date(birth) : birth;
  const ms = at.getTime() - b.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function weeksAndDays(birth: Date | string, at: Date = new Date()) {
  const days = ageInDays(birth, at);
  return { weeks: Math.floor(days / 7), days: days % 7, total: days };
}

export function editorialAgeLabel(birth: Date | string, at: Date = new Date()): string {
  const { weeks, days, total } = weeksAndDays(birth, at);
  if (total < 14) return `${total} ${total === 1 ? 'day' : 'days'} old`;
  if (total < 60) return `${weeks} weeks · ${days} ${days === 1 ? 'day' : 'days'} old`;
  const months = Math.floor(total / 30.44);
  if (months < 24) return `${months} months old`;
  return `${Math.floor(months / 12)} years old`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function asOrdinalWord(n: number): string {
  const base = [
    '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
    'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth',
    'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  ];
  if (n <= 20) return base[n];
  const tens = ['', '', 'twenty', 'thirty'];
  const t = Math.floor(n / 10);
  const u = n % 10;
  if (u === 0) return tens[t] + 'ieth';
  return tens[t] + '-' + base[u];
}

export function editorialDate(at: Date = new Date()): string {
  const day = DAYS[at.getDay()];
  const month = MONTHS[at.getMonth()];
  return `${day}, the ${asOrdinalWord(at.getDate())} of ${month}`;
}

export function relativeTime(when: Date): string {
  const mins = Math.round((Date.now() - when.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function greeting(at: Date = new Date()): string {
  const h = at.getHours();
  if (h < 5) return 'Still awake';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
