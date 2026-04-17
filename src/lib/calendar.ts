// Build RFC 5545 .ics calendar events and hand them off to the native
// calendar app on any device. No push permissions, no service workers,
// no VAPID keys — the phone handles the alarm.

type TimedEvent = {
  kind: 'timed';
  title: string;
  description?: string;
  startTime: Date;
  durationMinutes?: number;
  /** Minutes before startTime the alarm should fire. Defaults to 0 (at start). */
  alarmOffsetMinutes?: number;
};

type AllDayEvent = {
  kind: 'all-day';
  title: string;
  description?: string;
  date: Date;
  /** For all-day events, when should the alarm fire? Default: 9 AM on the day. */
  alarmTime?: { hour: number; minute?: number };
};

export type CalendarEventInput = TimedEvent | AllDayEvent;

/**
 * Builds an .ics text blob for a single event and triggers the native
 * "Add to Calendar" flow: on iOS Safari → Apple Calendar; on Android →
 * Google Calendar / default; on desktop → downloads the file.
 */
export function addToCalendar(input: CalendarEventInput): void {
  const ics = buildIcs(input);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const filename = `henri-${slug(input.title)}.ics`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  // iOS Safari ignores the download attribute for text/calendar and opens
  // the event in Apple Calendar directly, which is what we want.
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Revoke later so iOS has time to hand off to the Calendar app.
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

// ------------------------------------------------------------------
// .ics assembly
// ------------------------------------------------------------------

function buildIcs(input: CalendarEventInput): string {
  const uid = `${cryptoRandom()}@henri.app`;
  const dtstamp = formatUtcDateTime(new Date());

  let lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Henri//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${escapeText(input.title)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeText(input.description)}`);
  }

  if (input.kind === 'timed') {
    const start = input.startTime;
    const durationMs = (input.durationMinutes ?? 15) * 60_000;
    const end = new Date(start.getTime() + durationMs);
    lines.push(`DTSTART:${formatUtcDateTime(start)}`);
    lines.push(`DTEND:${formatUtcDateTime(end)}`);

    const alarmOffset = input.alarmOffsetMinutes ?? 0;
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(input.title)}`,
      `TRIGGER:${icsOffset(alarmOffset)}`,
      'END:VALARM'
    );
  } else {
    // All-day event. DTSTART as DATE, DTEND as the day after per RFC 5545.
    const start = dateOnly(input.date);
    const end = new Date(input.date);
    end.setDate(end.getDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${formatDate(start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(end)}`);

    // Alarm at a specific clock time on the event day — default 9 AM.
    const hour = input.alarmTime?.hour ?? 9;
    const minute = input.alarmTime?.minute ?? 0;
    const alarmDate = new Date(input.date);
    alarmDate.setHours(hour, minute, 0, 0);
    const startMidnight = new Date(input.date);
    startMidnight.setHours(0, 0, 0, 0);
    const offsetMin = Math.round((alarmDate.getTime() - startMidnight.getTime()) / 60_000);
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(input.title)}`,
      // offsetMin > 0 means alarm fires *after* start-of-day. Use +PT{min}M.
      `TRIGGER:${icsPositiveOffset(offsetMin)}`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT', 'END:VCALENDAR', '');
  // RFC 5545 uses CRLF line endings. Fold long lines too — keep it simple
  // and fold at 73 octets.
  return lines.map(foldLine).join('\r\n');
}

// ------------------------------------------------------------------
// Formatting helpers
// ------------------------------------------------------------------

function formatUtcDateTime(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate())
  );
}

function dateOnly(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function icsOffset(minutesBefore: number): string {
  if (minutesBefore <= 0) return 'PT0M';
  return `-PT${minutesBefore}M`;
}

function icsPositiveOffset(minutes: number): string {
  if (minutes <= 0) return 'PT0M';
  if (minutes % 60 === 0) return `PT${minutes / 60}H`;
  return `PT${minutes}M`;
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldLine(line: string): string {
  if (line.length <= 73) return line;
  let out = '';
  let remaining = line;
  while (remaining.length > 73) {
    out += remaining.slice(0, 73) + '\r\n ';
    remaining = remaining.slice(73);
  }
  out += remaining;
  return out;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'event';
}

function cryptoRandom(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
