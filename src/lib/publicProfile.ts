type PublicProfileFields = {
  display_name?: string | null;
  email?: string | null;
};

export function resolvePublicDisplayName(
  profile?: PublicProfileFields | null,
  fallback = 'Climate Member',
): string {
  const name = profile?.display_name?.trim();
  if (name) return name;

  const fromEmail = profile?.email?.split('@')[0]?.trim();
  if (fromEmail) return fromEmail;

  return fallback;
}

export function defaultDisplayNameForUser(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata;
  const oauthName = [meta?.full_name, meta?.name, meta?.user_name].find(
    (value) => typeof value === 'string' && value.trim(),
  ) as string | undefined;
  if (oauthName) return oauthName.trim().slice(0, 30);

  const fromEmail = user.email?.split('@')[0]?.trim();
  if (fromEmail) return fromEmail.slice(0, 30);

  return '';
}

export function publicAuthorName(profile?: PublicProfileFields | null): string {
  return resolvePublicDisplayName(profile, 'Climate Member');
}

export function publicAuthorInitial(profile?: {
  display_name?: string | null;
} | null): string {
  return publicAuthorName(profile).charAt(0).toUpperCase();
}

export function colorSeedForProfile(
  profile?: PublicProfileFields & { id?: string } | null,
  fallbackId = '',
): string {
  return (
    profile?.display_name?.trim() ||
    profile?.email?.split('@')[0]?.trim() ||
    profile?.id ||
    fallbackId ||
    'member'
  );
}
