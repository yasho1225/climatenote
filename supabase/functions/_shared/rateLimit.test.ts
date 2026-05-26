import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  rateLimitKeyFromAuth,
  _rateLimitStoreSizeForTests,
  _resetRateLimitStoreForTests,
} from './rateLimit.ts';

afterEach(() => {
  _resetRateLimitStoreForTests();
});

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const id = `test-${crypto.randomUUID()}`;
    expect(checkRateLimit(id, 3, 60_000).limited).toBe(false);
    expect(checkRateLimit(id, 3, 60_000).limited).toBe(false);
    expect(checkRateLimit(id, 3, 60_000).limited).toBe(false);
  });

  it('blocks requests over the limit', () => {
    const id = `test-${crypto.randomUUID()}`;
    checkRateLimit(id, 2, 60_000);
    checkRateLimit(id, 2, 60_000);
    expect(checkRateLimit(id, 2, 60_000).limited).toBe(true);
  });

  it('resets the window after expiry', () => {
    vi.useFakeTimers();
    const id = 'window-reset-id';
    expect(checkRateLimit(id, 1, 1_000).limited).toBe(false);
    expect(checkRateLimit(id, 1, 1_000).limited).toBe(true);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit(id, 1, 1_000).limited).toBe(false);
    vi.useRealTimers();
  });

  it('builds distinct rate-limit keys per Authorization header', async () => {
    const reqA = new Request('https://example.com', {
      headers: { Authorization: 'Bearer token-a' },
    });
    const reqB = new Request('https://example.com', {
      headers: { Authorization: 'Bearer token-b' },
    });

    const keyA = await rateLimitKeyFromAuth(reqA, 'test-endpoint');
    const keyB = await rateLimitKeyFromAuth(reqB, 'test-endpoint');

    expect(keyA).toMatch(/^test-endpoint:[a-f0-9]{32}$/);
    expect(keyB).toMatch(/^test-endpoint:[a-f0-9]{32}$/);
    expect(keyA).not.toBe(keyB);
  });

  it('rate-limits sessions independently for the same user id', async () => {
    const reqA = new Request('https://example.com', {
      headers: { Authorization: 'Bearer session-a' },
    });
    const reqB = new Request('https://example.com', {
      headers: { Authorization: 'Bearer session-b' },
    });

    const keyA = (await rateLimitKeyFromAuth(reqA, 'ai'))!;
    const keyB = (await rateLimitKeyFromAuth(reqB, 'ai'))!;

    checkRateLimit(keyA, 1, 60_000);
    checkRateLimit(keyB, 1, 60_000);

    expect(checkRateLimit(keyA, 1, 60_000).limited).toBe(true);
    expect(checkRateLimit(keyB, 1, 60_000).limited).toBe(true);
  });

  it('prunes expired orphan identifiers from the store', () => {
    vi.useFakeTimers();
    checkRateLimit('orphan-a', 5, 1_000);
    checkRateLimit('orphan-b', 5, 1_000);
    expect(_rateLimitStoreSizeForTests()).toBe(2);

    vi.advanceTimersByTime(1_001);
    checkRateLimit('orphan-c', 5, 1_000);

    expect(_rateLimitStoreSizeForTests()).toBe(1);
    vi.useRealTimers();
  });
});
