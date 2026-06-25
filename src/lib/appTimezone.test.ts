import { describe, it, expect, afterEach, vi } from 'vitest';
import { getAppToday, getAppDateRange, APP_TIMEZONE, addAppDays } from './appTimezone';

describe('appTimezone', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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
    expect(Number.isNaN(Date.parse(start))).toBe(false);
    expect(Number.isNaN(Date.parse(end))).toBe(false);
  });

  it('returns weekly range starting on or before today', () => {
    const { start, end } = getAppDateRange('weekly');
    expect(start.slice(0, 10) <= end.slice(0, 10)).toBe(true);
  });

  it('adds calendar days in app date space', () => {
    expect(addAppDays(7, '2026-06-01')).toBe('2026-06-08');
    expect(addAppDays(-1, '2026-06-01')).toBe('2026-05-31');
  });

  it('Chicago CDT midnight maps to 05:00 UTC (summer)', () => {
    vi.setSystemTime(new Date('2026-07-15T18:00:00.000Z'));
    const { start, end } = getAppDateRange('daily');
    expect(start).toBe('2026-07-15T05:00:00.000Z');
    expect(end).toBe('2026-07-16T04:59:59.000Z');
  });

  it('Chicago CST midnight maps to 06:00 UTC (winter)', () => {
    vi.setSystemTime(new Date('2026-01-15T18:00:00.000Z'));
    const { start, end } = getAppDateRange('daily');
    expect(start).toBe('2026-01-15T06:00:00.000Z');
    expect(end).toBe('2026-01-16T05:59:59.000Z');
  });

  it('does not throw on US DST spring-forward Sunday in Chicago', () => {
    vi.setSystemTime(new Date('2026-03-08T15:00:00.000Z'));
    expect(() => getAppDateRange('daily')).not.toThrow();
    const { start, end } = getAppDateRange('daily');
    expect(Number.isNaN(Date.parse(start))).toBe(false);
    expect(Number.isNaN(Date.parse(end))).toBe(false);
  });

  it('does not throw on US DST fall-back Sunday in Chicago', () => {
    vi.setSystemTime(new Date('2026-11-01T15:00:00.000Z'));
    expect(() => getAppDateRange('daily')).not.toThrow();
    const { start, end } = getAppDateRange('daily');
    expect(Number.isNaN(Date.parse(start))).toBe(false);
    expect(Number.isNaN(Date.parse(end))).toBe(false);
  });
});
