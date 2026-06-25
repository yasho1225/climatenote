export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

export function isValidNoteContent(value: unknown, maxLength = 2000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function hasValidCronSecret(providedSecret: string | null, expectedSecret: string | undefined): boolean {
  return Boolean(expectedSecret) && providedSecret === expectedSecret;
}
