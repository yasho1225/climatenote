/** Strip HTML tags and normalize whitespace for client-side text search. */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  const doc = typeof DOMParser !== 'undefined'
    ? new DOMParser().parseFromString(html, 'text/html')
    : null;
  const text = doc?.body?.textContent ?? html.replace(/<[^>]+>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export function matchesQuery(haystack: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return haystack.toLowerCase().includes(normalizedQuery);
}
