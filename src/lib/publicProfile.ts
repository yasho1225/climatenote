export function publicAuthorName(profile?: {
  display_name?: string | null;
} | null): string {
  const name = profile?.display_name?.trim();
  return name || 'Climate Member';
}

export function publicAuthorInitial(profile?: {
  display_name?: string | null;
} | null): string {
  return publicAuthorName(profile).charAt(0).toUpperCase();
}

export function colorSeedForProfile(profile?: {
  display_name?: string | null;
  id?: string;
} | null, fallbackId = ''): string {
  return profile?.display_name?.trim() || profile?.id || fallbackId || 'member';
}
