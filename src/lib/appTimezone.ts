/** App publishing timezone (US Central — articles publish at midnight CST/CDT). */
export const APP_TIMEZONE = 'America/Chicago';

/** YYYY-MM-DD for "today" in the app timezone. */
export function getAppToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(new Date());
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

/** Convert a Chicago wall-clock time on a given date to a UTC ISO string. */
function chicagoLocalToUtcIso(dateStr: string, hour: number, minute: number, second: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const targetDate = dateStr;
  const targetTime = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const readChicago = (ms: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(ms)).map((part) => [part.type, part.value])
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  };

  const [year, month, day] = dateStr.split('-').map(Number);
  let guess = Date.UTC(year, month - 1, day, hour + 6, minute, second);

  for (let i = 0; i < 8; i++) {
    const got = readChicago(guess);
    const target = `${targetDate}T${targetTime}`;
    if (got === target) {
      return new Date(guess).toISOString();
    }

    const targetMs = Date.parse(`${target}Z`);
    const gotMs = Date.parse(`${got}Z`);
    guess += targetMs - gotMs;
  }

  return new Date(guess).toISOString();
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
