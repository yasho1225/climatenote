import DOMPurify from 'dompurify';

const IMAGE_URL_REGEX = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp))/gi;

const SANITIZE_OPTIONS = {
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
    'pre',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):[^\s<>"']*|\/(?!\/)[^\s<>"']*|#[^\s<>"']*|[^:\s<>"'/][^\s<>"':]*)$/i,
  ALLOW_DATA_ATTR: false,
  FORBID_ATTR: ['style'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
  ADD_ATTR: ['target', 'rel'],
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
} as const;

export function normalizeArticleInput(rawContent: string): string {
  return rawContent.replace(
    IMAGE_URL_REGEX,
    '<img src="$1" alt="Article image" class="w-full rounded-lg my-4" />'
  );
}

export function sanitizeArticleHtml(html: string): string {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  try {
    // Reset any stale Trusted Types / config state on the shared instance.
    DOMPurify.clearConfig?.();
    return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}

export function normalizeAndSanitizeArticleInput(rawContent: string): string {
  return sanitizeArticleHtml(normalizeArticleInput(rawContent));
}
