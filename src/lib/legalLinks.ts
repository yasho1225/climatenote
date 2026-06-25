import { Capacitor } from '@capacitor/core';

const DEFAULT_PRIVACY_URL =
  import.meta.env.VITE_PRIVACY_URL ||
  'https://yasho1225.github.io/climatenote/privacy';
const DEFAULT_TERMS_URL =
  import.meta.env.VITE_TERMS_URL ||
  'https://yasho1225.github.io/climatenote/terms';
const SUPPORT_EMAIL = 'support@theclimatenote.app';

export const LEGAL = {
  privacyUrl: DEFAULT_PRIVACY_URL,
  termsUrl: DEFAULT_TERMS_URL,
  supportEmail: SUPPORT_EMAIL,
} as const;

/** Open legal page inside the app on native; use hosted URL only on web if needed. */
export async function openLegalPage(page: 'privacy' | 'terms') {
  const hash = page === 'privacy' ? '#/privacy-policy' : '#/terms-of-service';

  // Keep legal content in-app on iOS/Android — never open Safari during review flows.
  if (Capacitor.isNativePlatform()) {
    window.location.hash = hash;
    window.dispatchEvent(new Event('app-route-change'));
    return;
  }

  window.location.hash = hash;
  window.dispatchEvent(new Event('app-route-change'));
}

export function openSupportEmail(subject = 'The Climate Note Support') {
  const mailto = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}`;
  window.location.href = mailto;
}

export function openReportContent(noteId: string, excerpt: string, reason?: string) {
  const body = [
    'I would like to report community content.',
    '',
    reason ? `Reason: ${reason}` : '',
    `Note ID: ${noteId}`,
    `Excerpt: ${excerpt.slice(0, 200)}`,
  ]
    .filter(Boolean)
    .join('\n');
  const mailto = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent('Report community note')}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}
