import { supabase } from './supabase';

/**
 * Native "Sign in with Apple" for iOS.
 *
 * Uses the @capacitor-community/apple-sign-in plugin to present the native
 * ASAuthorization sheet (Face ID / Touch ID, no browser), then authenticates
 * with Supabase via signInWithIdToken. This avoids the web OAuth redirect
 * entirely, which cannot return to the native app (no custom URL scheme /
 * Universal Link is registered).
 *
 * Nonce flow (easy to get wrong):
 *   - The RAW nonce is random.
 *   - The HASHED nonce (SHA-256 of the raw nonce) is sent to Apple.
 *   - The RAW nonce is sent to Supabase, which hashes it and compares against
 *     the `nonce` claim Apple embedded in the identity token.
 *   Rule: hashed -> Apple, raw -> Supabase. Swapping them causes "Nonce mismatch".
 */

// Apple Services ID (configured in the Apple Developer portal for the web flow).
// On native iOS the plugin ignores clientId/redirectURI, but the plugin's
// TypeScript options require them, so we pass the documented values.
const APPLE_SERVICE_ID = 'com.theclimatenote.web';

/** Thrown when the native flow cannot run (e.g. Web Crypto unavailable). */
export class AppleNativeUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppleNativeUnavailableError';
  }
}

/** Generate a cryptographically random, URL-safe nonce string. */
function generateRawNonce(length = 32): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => charset[v % charset.length]).join('');
}

/** Lowercase hex SHA-256 of a UTF-8 string, via the Web Crypto API. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

/**
 * Run the native Apple sign-in flow and establish a Supabase session.
 * Resolves once the session is set (App.tsx's onAuthStateChange handles
 * navigation). Throws on failure or user cancellation — use isUserCancel()
 * to distinguish a cancel from a real error.
 */
export async function signInWithAppleNative(): Promise<void> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new AppleNativeUnavailableError('Web Crypto API is unavailable');
  }

  const rawNonce = generateRawNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  // Dynamic import keeps the native plugin out of the web bundle.
  const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

  const result = await SignInWithApple.authorize({
    clientId: APPLE_SERVICE_ID,
    redirectURI: import.meta.env.VITE_APP_URL || window.location.origin,
    scopes: 'name email',
    nonce: hashedNonce, // hashed -> Apple
  });

  const identityToken = result.response?.identityToken;
  if (!identityToken) {
    throw new Error('Apple Sign-In did not return an identity token');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
    nonce: rawNonce, // raw -> Supabase
  });
  if (error) throw error;
}

/**
 * Whether an error from the native Apple flow represents the user dismissing
 * the sheet (ASAuthorizationError.canceled, code 1001) rather than a failure.
 */
export function isUserCancel(err: unknown): boolean {
  if (!err) return false;
  const code = (err as { code?: unknown }).code;
  if (code === 1001 || code === '1001') return true;
  const message = String((err as { message?: unknown }).message ?? err).toLowerCase();
  return (
    message.includes('1001') ||
    message.includes('cancel') || // "canceled" / "cancelled"
    message.includes('popup_closed_by_user')
  );
}
