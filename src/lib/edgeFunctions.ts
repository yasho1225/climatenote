import { FunctionsHttpError } from '@supabase/supabase-js';

/** Extract a user-facing message from a Supabase Edge Function invoke result. */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  data: unknown,
): Promise<string> {
  if (data && typeof data === 'object' && 'error' in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const body = await error.context.json();
      if (body && typeof body.error === 'string' && body.error.trim()) {
        return body.error;
      }
    } catch {
      // ignore JSON parse failures
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return 'AI request failed. Please try again.';
}
