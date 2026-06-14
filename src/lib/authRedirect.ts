import { Capacitor } from '@capacitor/core';

const NATIVE_AUTH_SCHEME = 'com.theclimatenote.app';

export function getAuthRedirectUrl(path = '/auth/callback') {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_AUTH_SCHEME}://${path.replace(/^\//, '')}`;
  }

  // Prefer live origin so OAuth redirect matches the port Vite is actually using.
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : import.meta.env.VITE_APP_URL || '';
  return path === '/auth/callback' ? appUrl : `${appUrl}${path}`;
}
