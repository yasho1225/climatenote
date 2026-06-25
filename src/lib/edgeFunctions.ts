import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

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
      if (error.context.status === 401) {
        return 'Sign in to use AI features.';
      }
    } catch {
      // ignore JSON parse failures
    }
  }

  if (error instanceof FunctionsFetchError) {
    return 'Could not reach the AI service. Check your connection, sign in, and try again.';
  }

  if (error instanceof Error) {
    if (error.message.includes('Failed to send a request to the Edge Function')) {
      return 'Could not reach the AI service. Sign in, refresh the page, and try again.';
    }
    if (error.message) return error.message;
  }

  return 'AI request failed. Please try again.';
}
