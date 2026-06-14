import { supabase } from './supabase';

function cleanOAuthParams(url: URL) {
  if (typeof window === 'undefined') return;

  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');

  const search = url.searchParams.toString();
  const clean = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`;
  window.history.replaceState({}, document.title, clean || '/');
}

function isBenignExchangeError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('invalid flow state') ||
    normalized.includes('flow state not found') ||
    normalized.includes('code verifier') ||
    normalized.includes('invalid grant') ||
    normalized.includes('already been used') ||
    normalized.includes('auth code') ||
    normalized.includes('pkce')
  );
}

let activeExchange: Promise<{ ok: boolean; error?: string }> | null = null;
let lastExchangedCode: string | null = null;

async function sessionExists() {
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session);
}

export type OAuthSignInResult = { ok: boolean; error?: string };

async function exchangeOAuthUrl(
  url: URL,
  options?: { cleanHistory?: boolean },
): Promise<OAuthSignInResult> {
  const oauthError = url.searchParams.get('error_description') ?? url.searchParams.get('error');
  if (oauthError) {
    if (options?.cleanHistory) cleanOAuthParams(url);
    return { ok: false, error: oauthError };
  }

  const code = url.searchParams.get('code');
  if (code) {
    if (lastExchangedCode === code && (await sessionExists())) {
      if (options?.cleanHistory) cleanOAuthParams(url);
      return { ok: true };
    }

    if (!activeExchange) {
      activeExchange = (async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (options?.cleanHistory) cleanOAuthParams(url);

        if (!error) {
          lastExchangedCode = code;
          return { ok: true };
        }

        if ((await sessionExists()) && isBenignExchangeError(error.message)) {
          lastExchangedCode = code;
          return { ok: true };
        }

        return { ok: false, error: error.message };
      })().finally(() => {
        activeExchange = null;
      });
    }

    return activeExchange;
  }

  const hash = url.hash;
  if (hash.includes('access_token')) {
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (options?.cleanHistory && typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      if (error) {
        if (await sessionExists()) {
          return { ok: true };
        }
        return { ok: false, error: error.message };
      }
      return { ok: true };
    }
  }

  return { ok: false };
}

/** Handle OAuth callback from a deep-link URL (native in-app browser return). */
export async function completeOAuthSignInFromUrl(
  urlString: string,
): Promise<OAuthSignInResult> {
  try {
    const url = new URL(urlString);
    return exchangeOAuthUrl(url, { cleanHistory: false });
  } catch {
    return { ok: false, error: 'Invalid OAuth callback URL' };
  }
}

/** Handle OAuth callback from the current web page URL. */
export async function completeOAuthSignIn(): Promise<OAuthSignInResult> {
  if (typeof window === 'undefined') {
    return { ok: false };
  }

  const url = new URL(window.location.href);
  return exchangeOAuthUrl(url, { cleanHistory: true });
}
