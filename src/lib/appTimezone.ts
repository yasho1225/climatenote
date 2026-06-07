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

/** ISO date-time range strings for leaderboard queries (America/Chicago). */
export function getAppDateRange(period: 'daily' | 'weekly' | 'monthly'): {
  start: string;
  end: string;
} {
  const { year, month, day, weekday } = getAppDateParts();
  const todayStr = toIsoDate(year, month, day);

  if (period === 'daily') {
    return {
      start: `${todayStr}T00:00:00`,
      end: `${todayStr}T23:59:59`,
    };
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
    return {
      start: `${mondayStr}T00:00:00`,
      end: `${todayStr}T23:59:59`,
    };
  }

  const monthStart = `${year}-${month}-01`;
  return {
    start: `${monthStart}T00:00:00`,
    end: `${todayStr}T23:59:59`,
  };
}
