import DOMPurify from 'dompurify';

const IMAGE_URL_REGEX = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp))/gi;

export function normalizeArticleInput(rawContent: string): string {
  return rawContent.replace(
    IMAGE_URL_REGEX,
    '<img src="$1" alt="Article image" class="w-full rounded-lg my-4" />'
  );
}

export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'strong',
      'em',
      'blockquote',
      'a',
      'img',
      'code',
      'pre'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
    // Explicit allowlist: safe schemes, same-origin paths (not //protocol-relative), fragments, or colon-free relative names.
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto):[^\s<>"']*|\/(?!\/)[^\s<>"']*|#[^\s<>"']*|[^:\s<>"'/][^\s<>"':]*)$/i,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
    ADD_ATTR: ['target', 'rel'],
    RETURN_DOM: false,
  });
}

export function normalizeAndSanitizeArticleInput(rawContent: string): string {
  return sanitizeArticleHtml(normalizeArticleInput(rawContent));
}
