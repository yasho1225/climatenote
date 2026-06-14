import { supabase } from './supabase';

export async function permanentlyDeleteAccount(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be signed in to delete your account.');
  }

  const { data, error } = await supabase.functions.invoke('delete-account', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }

  await supabase.auth.signOut();
}
