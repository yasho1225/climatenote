import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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

/** Open legal page in-app (hash route) or system browser on native. */
export async function openLegalPage(page: 'privacy' | 'terms') {
  const hash = page === 'privacy' ? '#/privacy-policy' : '#/terms-of-service';

  if (Capacitor.isNativePlatform()) {
    const url = page === 'privacy' ? LEGAL.privacyUrl : LEGAL.termsUrl;
    try {
      await Browser.open({ url, presentationStyle: 'popover' });
      return;
    } catch {
      // Fall through to hash navigation
    }
  }

  window.location.hash = hash;
  window.dispatchEvent(new Event('app-route-change'));
}

export function openSupportEmail(subject = 'The Climate Note Support') {
  const mailto = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent(subject)}`;
  window.location.href = mailto;
}

export function openReportContent(noteId: string, excerpt: string) {
  const body = [
    'I would like to report community content.',
    '',
    `Note ID: ${noteId}`,
    `Excerpt: ${excerpt.slice(0, 200)}`,
  ].join('\n');
  const mailto = `mailto:${LEGAL.supportEmail}?subject=${encodeURIComponent('Report community note')}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}
