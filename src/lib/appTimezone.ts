/** App publishing timezone (US Central — articles publish at midnight CST/CDT). */
export const APP_TIMEZONE = 'America/Chicago';

/** YYYY-MM-DD for "today" in the app timezone. */
export function getAppToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());
}

/** Add calendar days to an app-timezone date string (YYYY-MM-DD). */
export function addAppDays(days: number, base = getAppToday()): string {
  const [year, month, day] = base.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getAppDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    weekday: get('weekday'),
  };
}

function toIsoDate(year: string, month: string, day: string): string {
  return `${year}-${month}-${day}`;
}

/** Offset (ms) such that: UTC instant + offsetMs formats as those wall-clock parts in `timeZone`. */
function getTimezoneOffsetMs(timeZone: string, utcInstant: Date): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(utcInstant).map((part) => [part.type, part.value]),
  );

  const hour = Number(parts.hour);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour === 24 ? 0 : hour,
    Number(parts.minute),
    Number(parts.second),
  );

  return asUtc - utcInstant.getTime();
}

/** Convert a Chicago wall-clock time on a given date to a UTC ISO string. */
function chicagoLocalToUtcIso(dateStr: string, hour: number, minute: number, second: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  // Seed with offset at local noon on that calendar day (handles CST vs CDT).
  const noonProbe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  let guess = localAsUtc - getTimezoneOffsetMs(APP_TIMEZONE, noonProbe);

  // Fixed-point refinement (converges in 1–2 steps; safe on DST transition days).
  for (let i = 0; i < 4; i++) {
    const instant = new Date(guess);
    if (Number.isNaN(instant.getTime())) {
      break;
    }
    const nextGuess = localAsUtc - getTimezoneOffsetMs(APP_TIMEZONE, instant);
    if (nextGuess === guess) {
      break;
    }
    guess = nextGuess;
  }

  const result = new Date(guess);
  if (Number.isNaN(result.getTime())) {
    throw new RangeError(`Invalid time value for Chicago local ${dateStr} ${hour}:${minute}:${second}`);
  }

  return result.toISOString();
}

function dayBoundsUtc(dateStr: string): { start: string; end: string } {
  return {
    start: chicagoLocalToUtcIso(dateStr, 0, 0, 0),
    end: chicagoLocalToUtcIso(dateStr, 23, 59, 59),
  };
}

/** ISO date-time range strings for leaderboard queries (America/Chicago). */
export function getAppDateRange(period: 'daily' | 'weekly' | 'monthly'): {
  start: string;
  end: string;
} {
  const { year, month, day, weekday } = getAppDateParts();
  const todayStr = toIsoDate(year, month, day);

  if (period === 'daily') {
    return dayBoundsUtc(todayStr);
  }

  if (period === 'weekly') {
    const weekdayMap: Record<string, number> = {
      Mon: 0,
      Tue: 1,
      Wed: 2,
      Thu: 3,
      Fri: 4,
      Sat: 5,
      Sun: 6,
    };
    const daysFromMonday = weekdayMap[weekday] ?? 0;
    const todayUtc = Date.UTC(Number(year), Number(month) - 1, Number(day));
    const mondayUtc = todayUtc - daysFromMonday * 86_400_000;
    const monday = new Date(mondayUtc);
    const mondayStr = toIsoDate(
      String(monday.getUTCFullYear()),
      String(monday.getUTCMonth() + 1).padStart(2, '0'),
      String(monday.getUTCDate()).padStart(2, '0')
    );
    const weekStart = dayBoundsUtc(mondayStr).start;
    const weekEnd = dayBoundsUtc(todayStr).end;
    return { start: weekStart, end: weekEnd };
  }

  const monthStart = `${year}-${month}-01`;
  const monthStartUtc = dayBoundsUtc(monthStart).start;
  const monthEndUtc = dayBoundsUtc(todayStr).end;
  return { start: monthStartUtc, end: monthEndUtc };
}
