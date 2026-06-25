import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { supabase } from './supabase';

const APPLE_BUNDLE_ID = 'com.theclimatenote.app';
const SUPABASE_APPLE_CALLBACK = 'https://noefayakyrmmknqlcklf.supabase.co/auth/v1/callback';

function generateRandomString(length = 32): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (value) => charset[value % charset.length]).join('');
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildAppleDisplayName(givenName?: string | null, familyName?: string | null): string | null {
  const parts = [givenName, familyName].filter((part): part is string => Boolean(part?.trim()));
  return parts.length ? parts.join(' ').trim() : null;
}

export function canUseNativeAppleSignIn(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

/** Native Sign in with Apple on iOS (recommended for App Store). */
export async function signInWithAppleNative(): Promise<{ ok: boolean; error?: string }> {
  if (!canUseNativeAppleSignIn()) {
    return { ok: false, error: 'Native Apple Sign In is only available on iOS.' };
  }

  try {
    const rawNonce = generateRandomString();
    const hashedNonce = await sha256(rawNonce);

    const result = await SignInWithApple.authorize({
      clientId: APPLE_BUNDLE_ID,
      redirectURI: SUPABASE_APPLE_CALLBACK,
      scopes: 'email name',
      state: generateRandomString(),
      nonce: hashedNonce,
    });

    const token = result.response.identityToken;
    if (!token) {
      return { ok: false, error: 'Apple did not return a sign-in token.' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token,
      nonce: rawNonce,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const displayName = buildAppleDisplayName(
      result.response.givenName,
      result.response.familyName,
    );

    if (displayName) {
      await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          given_name: result.response.givenName ?? undefined,
          family_name: result.response.familyName ?? undefined,
        },
      });
    }

    if (result.response.email && data.user && !data.user.email) {
      await supabase.auth.updateUser({ email: result.response.email });
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Apple Sign In failed';
    if (message.toLowerCase().includes('cancel')) {
      return { ok: false, error: 'Sign in cancelled.' };
    }
    return { ok: false, error: message };
  }
}
