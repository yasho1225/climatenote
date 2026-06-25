import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

let browserListenerRegistered = false;

function registerBrowserListeners() {
  if (browserListenerRegistered || !Capacitor.isNativePlatform()) return;
  browserListenerRegistered = true;

  void Browser.addListener('browserFinished', () => {
    window.dispatchEvent(new CustomEvent('native-oauth-browser-closed'));
  });
}

/**
 * Opens OAuth in an in-app browser sheet (SFSafariViewController on iOS).
 * Never uses the system Safari app — required for App Store Guideline 4.
 */
export async function openInAppOAuth(oauthUrl: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    window.location.href = oauthUrl;
    return;
  }

  registerBrowserListeners();

  try {
    await Browser.close();
  } catch {
    // No browser open yet
  }

  await Browser.open({
    url: oauthUrl,
    presentationStyle: 'popover',
    toolbarColor: '#eef2ec',
  });
}

export async function closeInAppOAuthBrowser(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Browser.close();
  } catch {
    // Already closed
  }
}
