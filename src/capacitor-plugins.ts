import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { completeOAuthSignInFromUrl } from './lib/oauthCallback';
import { closeInAppOAuthBrowser } from './lib/nativeOAuth';

const REMINDER_NOTIFICATION_ID = 1001;
let notificationListenersRegistered = false;
let appListenersRegistered = false;

export class CapacitorNotifications {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const localResult = await LocalNotifications.requestPermissions();
      if (localResult.display === 'granted') {
        await this.setupNotificationListeners();
        return true;
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error initializing local notifications:', error);
      }
      return false;
    }
  }

  static async setupNotificationListeners() {
    if (notificationListenersRegistered) {
      return;
    }
    notificationListenersRegistered = true;

    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      window.location.href = '/';
    });
  }

  static async scheduleDailyReminder(reminderTime: string) {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const [hours, minutes] = reminderTime.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return false;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Time for your Climate Note',
            body: "Read today's story and log one action to keep your streak going.",
            id: REMINDER_NOTIFICATION_ID,
            schedule: {
              on: { hour: hours, minute: minutes },
              every: 'day',
            },
            extra: { action: 'open_app' },
          },
        ],
      });
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error scheduling daily reminder:', error);
      }
      return false;
    }
  }

  static async cancelAllNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error canceling notifications:', error);
      }
    }
  }
}

async function handleDeepLink(urlString: string) {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return;
  }

  const isOAuthCallback =
    url.searchParams.has('code') ||
    url.hash.includes('access_token') ||
    url.pathname.includes('auth/callback') ||
    url.host === 'auth' ||
    urlString.includes('auth/callback');

  const isPasswordReset =
    urlString.includes('type=recovery') || urlString.includes('reset-password');

  if (isOAuthCallback) {
    await closeInAppOAuthBrowser();

    const result = await completeOAuthSignInFromUrl(urlString);
    window.dispatchEvent(
      new CustomEvent('native-auth-complete', { detail: result }),
    );
  }

  if (isPasswordReset) {
    window.location.hash = '#/reset-password';
    window.dispatchEvent(new Event('app-route-change'));
  }
}

export class CapacitorApp {
  static initialize() {
    if (!Capacitor.isNativePlatform() || appListenersRegistered) {
      return;
    }
    appListenersRegistered = true;

    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        window.dispatchEvent(new CustomEvent('app-became-active'));

        const { loadNotificationSettings } = await import('./lib/notificationScheduler');
        const settings = loadNotificationSettings();
        if (settings?.browserNotifications) {
          await CapacitorNotifications.scheduleDailyReminder(settings.reminderTime);
        }
      }
    });

    App.addListener('appUrlOpen', (event) => {
      void handleDeepLink(event.url);
    });

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        void handleDeepLink(result.url);
      }
    });
  }
}
