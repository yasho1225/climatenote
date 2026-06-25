import { describe, expect, it } from 'vitest';
import { hasValidCronSecret, isValidNoteContent, isValidUuid } from './requestGuards';

describe('requestGuards', () => {
  it('validates UUID format', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });

  it('validates note content bounds', () => {
    expect(isValidNoteContent('I will bike to school')).toBe(true);
    expect(isValidNoteContent('')).toBe(false);
    expect(isValidNoteContent('   ')).toBe(false);
    expect(isValidNoteContent('a'.repeat(2001))).toBe(false);
  });

  it('enforces cron secret matching', () => {
    expect(hasValidCronSecret('abc123', 'abc123')).toBe(true);
    expect(hasValidCronSecret('wrong', 'abc123')).toBe(false);
    expect(hasValidCronSecret(null, 'abc123')).toBe(false);
    expect(hasValidCronSecret('abc123', undefined)).toBe(false);
  });
});
