/** Runtime kill switches (set in Supabase Edge Function secrets). */

function envFlag(key: string): string | undefined {
  if (typeof Deno !== 'undefined') {
    return Deno.env.get(key);
  }
  return undefined;
}

export function isAuthEnforcementEnabled(): boolean {
  return envFlag('SECURITY_ENFORCE_AUTH') !== 'false';
}

export function isRateLimitingEnabled(): boolean {
  return envFlag('SECURITY_RATE_LIMIT_ENABLED') !== 'false';
}

export function areAiEndpointsEnabled(): boolean {
  return envFlag('SECURITY_AI_ENDPOINTS_ENABLED') !== 'false';
}
