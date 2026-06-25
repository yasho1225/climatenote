export type SecurityResult = 'allowed' | 'blocked';

export type SecurityEvent = {
  endpoint: string;
  result: SecurityResult;
  reason?: string;
  user_id?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip');
}

export function logSecurityEvent(event: SecurityEvent): void {
  console.log(
    JSON.stringify({
      type: 'security_event',
      timestamp: new Date().toISOString(),
      ...event,
    }),
  );
}
