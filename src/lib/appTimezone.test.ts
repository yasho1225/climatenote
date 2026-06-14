import { describe, it, expect } from 'vitest';
import { getAppToday, getAppDateRange, APP_TIMEZONE, addAppDays } from './appTimezone';

describe('appTimezone', () => {
  it('uses America/Chicago timezone', () => {
    expect(APP_TIMEZONE).toBe('America/Chicago');
  });

  it('returns YYYY-MM-DD for today', () => {
    const today = getAppToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns daily range with UTC ISO timestamps', () => {
    const { start, end } = getAppDateRange('daily');
    expect(start <= end).toBe(true);
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('returns weekly range starting on or before today', () => {
    const { start, end } = getAppDateRange('weekly');
    expect(start.slice(0, 10) <= end.slice(0, 10)).toBe(true);
  });

  it('adds calendar days in app date space', () => {
    expect(addAppDays(7, '2026-06-01')).toBe('2026-06-08');
    expect(addAppDays(-1, '2026-06-01')).toBe('2026-05-31');
  });
});
