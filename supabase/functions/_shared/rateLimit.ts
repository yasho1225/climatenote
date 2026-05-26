import { isRateLimitingEnabled } from './securityFlags.ts';

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/** Remove expired buckets so one-off identifiers do not accumulate forever. */
function pruneExpired(now: number): void {
  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt) {
      store.delete(key);
    }
  }
}

/** Per-session bucket key from Authorization header (not user id). */
export async function rateLimitKeyFromAuth(
  req: Request,
  endpoint: string,
): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')?.trim();
  if (!authHeader) return null;

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(authHeader),
  );
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${endpoint}:${hex.slice(0, 32)}`;
}

export function checkRateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000,
): { limited: boolean; retryAfterSec?: number } {
  if (!isRateLimitingEnabled()) {
    return { limited: false };
  }

  const now = Date.now();
  pruneExpired(now);

  const current = store.get(identifier);

  if (!current) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  if (current.count >= limit) {
    return {
      limited: true,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { limited: false };
}

/** Test-only helpers — not used in production handlers. */
export function _resetRateLimitStoreForTests(): void {
  store.clear();
}

export function _rateLimitStoreSizeForTests(): number {
  return store.size;
}
