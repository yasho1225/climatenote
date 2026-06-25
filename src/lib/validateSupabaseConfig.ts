const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function describeApiKey(key: string) {
  if (key.startsWith('sb_publishable_')) {
    return 'publishable key (sb_publishable_...)';
  }
  if (key.startsWith('eyJ')) {
    return `legacy anon JWT (${key.length} chars, ends with …${key.slice(-4)})`;
  }
  return `unrecognized format (${key.length} chars)`;
}

export async function getSupabaseConfigError(): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return 'Missing Supabase settings. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env';
  }

  const keyDescription = describeApiKey(supabaseAnonKey);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (response.status === 401) {
      return [
        `Supabase rejected the API key saved in .env (${keyDescription}).`,
        'Open Supabase Dashboard → Project Settings → API.',
        'If you migrated to new keys, copy the Publishable key (sb_publishable_...) into VITE_SUPABASE_ANON_KEY.',
        'Otherwise use Legacy API Keys → anon public, click Reveal, copy the entire key, save .env, and restart npm run dev.',
        'Confirm the project URL matches noefayakyrmmknqlcklf and the legacy anon key is still enabled.',
      ].join(' ');
    }

    if (!response.ok) {
      return `Could not connect to Supabase (${response.status}). Check VITE_SUPABASE_URL in .env`;
    }
  } catch {
    return 'Could not reach Supabase. Check your internet connection and VITE_SUPABASE_URL in .env';
  }

  return null;
}
