import { supabase } from './supabase';
import { UserProfile } from '../types';
import { getAppToday, addAppDays } from './appTimezone';

async function selectUserProfile(userId: string): Promise<UserProfile> {
  const { data: profile, error: selectError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (selectError) throw selectError;
  return profile;
}

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

  return selectUserProfile(userId);
}

/** True when streak may be stale (missed days) and needs server recompute. */
export function profileStatsNeedRefresh(profile: UserProfile): boolean {
  if (profile.total_notes === 0 && profile.streak > 0) return true;
  if (!profile.last_note_date) return profile.streak > 0;

  const appToday = getAppToday();
  const appYesterday = addAppDays(-1, appToday);
  const lastNote = profile.last_note_date.slice(0, 10);
  if (lastNote < appYesterday && profile.streak > 0) return true;

  return false;
}

/** Reconcile stats when notes exist but profile counters are still zero. */
export async function reconcileProfileStatsIfNeeded(
  userId: string,
  profile: UserProfile
): Promise<UserProfile> {
  if (profile.total_notes > 0 && !profileStatsNeedRefresh(profile)) return profile;

  const { count, error } = await supabase
    .from('user_notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return profile;
  if (!count && !profileStatsNeedRefresh(profile)) return profile;

  try {
    return await refreshUserProfileStats(userId);
  } catch (err) {
    console.error('Failed to reconcile profile stats:', err);
    return profile;
  }
}

/** Load profile and refresh streak/total_notes from server (best-effort). */
export async function loadFreshUserProfile(userId: string): Promise<UserProfile> {
  try {
    return await refreshUserProfileStats(userId);
  } catch (err) {
    console.warn('Profile stats refresh failed, using stored profile:', err);
    const profile = await selectUserProfile(userId);
    return reconcileProfileStatsIfNeeded(userId, profile);
  }
}
