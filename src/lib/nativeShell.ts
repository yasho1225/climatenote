import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

const SAGE_CANVAS = '#eef2ec';
const FOREST_PRIMARY = '#2f4233';

/** Apply mobile-app document shell (viewport lock, safe areas, touch behavior). */
export function applyMobileAppShell() {
  document.documentElement.classList.add('mobile-app');
}

/** Configure native chrome on iOS/Android. */
export async function initializeNativeShell() {
  applyMobileAppShell();

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: SAGE_CANVAS });
    }
    await StatusBar.show();
  } catch {
    // Status bar plugin unavailable in web preview
  }
}

/** Hide the native splash once the React tree is ready. */
export async function hideNativeSplash() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Splash plugin unavailable
  }
}

export const nativeTheme = {
  canvas: SAGE_CANVAS,
  primary: FOREST_PRIMARY,
} as const;
