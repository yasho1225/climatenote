import { supabase } from './supabase';
import { UserProfile } from '../types';

/** Server-side streak/total_notes sync (RPC with select fallback). */
export async function refreshUserProfileStats(userId: string): Promise<UserProfile> {
  const { data, error } = await supabase.rpc('refresh_user_profile_stats', {
    p_user_id: userId,
  });

  if (!error && data) {
    return data as UserProfile;
  }

  if (error && error.code !== 'PGRST202') {
    console.warn('refresh_user_profile_stats RPC unavailable, falling back to select:', error.message);
  }

  const { data: profile, error: selectError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (selectError) throw selectError;
  return profile;
}

/** Reconcile stats when notes exist but profile counters are still zero. */
export async function reconcileProfileStatsIfNeeded(
  userId: string,
  profile: UserProfile
): Promise<UserProfile> {
  if (profile.total_notes > 0) return profile;

  const { count, error } = await supabase
    .from('user_notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error || !count) return profile;

  try {
    return await refreshUserProfileStats(userId);
  } catch (err) {
    console.error('Failed to reconcile profile stats:', err);
    return profile;
  }
}
