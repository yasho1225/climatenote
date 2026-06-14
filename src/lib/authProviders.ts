const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type OAuthProvider = 'google' | 'apple';

export type EnabledOAuthProviders = Record<OAuthProvider, boolean>;

let cachedProviders: EnabledOAuthProviders | null = null;

export async function getEnabledOAuthProviders(): Promise<EnabledOAuthProviders> {
  if (cachedProviders) {
    return cachedProviders;
  }

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return { google: false, apple: false };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
    if (!response.ok) {
      return { google: false, apple: false };
    }

    const data = await response.json();
    cachedProviders = {
      google: Boolean(data.external?.google),
      apple: Boolean(data.external?.apple),
    };
    return cachedProviders;
  } catch {
    return { google: false, apple: false };
  }
}

export function getOAuthProviderSetupMessage(provider: OAuthProvider): string {
  if (provider === 'apple') {
    return 'Apple Sign In is not enabled. In Supabase Dashboard → Authentication → Providers, turn on Apple and add your Service ID, Team ID, Key ID, and .p8 secret. See OAUTH_SETUP_GUIDE.md for Apple Developer steps.';
  }
  return 'Google Sign In is not enabled. In Supabase Dashboard → Authentication → Providers, turn on Google and add your OAuth client credentials.';
}
