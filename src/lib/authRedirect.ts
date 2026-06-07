import { Capacitor } from '@capacitor/core';

const NATIVE_AUTH_SCHEME = 'com.theclimatenote.app';

export function getAuthRedirectUrl(path = '/auth/callback') {
  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_AUTH_SCHEME}://${path.replace(/^\//, '')}`;
  }

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return path === '/auth/callback' ? appUrl : `${appUrl}${path}`;
}
