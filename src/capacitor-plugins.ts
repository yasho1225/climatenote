import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { completeOAuthSignInFromUrl } from './lib/oauthCallback';
import { closeInAppOAuthBrowser } from './lib/nativeOAuth';

let notificationListenersRegistered = false;
let appListenersRegistered = false;

export class CapacitorNotifications {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const pushResult = await PushNotifications.requestPermissions();
      const localResult = await LocalNotifications.requestPermissions();

      if (pushResult.receive === 'granted' || localResult.display === 'granted') {
        await this.setupNotificationListeners();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error initializing Capacitor notifications:', error);
      return false;
    }
  }

  static async setupNotificationListeners() {
    // Handle notification received
    PushNotifications.addListener('pushNotificationReceived', (_notification) => {
      // handled by system
    });

    // Handle notification action performed
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      // Navigate to the app when notification is tapped
      if (notification.actionId === 'tap') {
        // You can add navigation logic here
        window.location.href = '/';
      }
    });

    // Handle local notification action
    LocalNotifications.addListener('localNotificationActionPerformed', (_notification) => {
      window.location.href = '/';
    });

    await PushNotifications.register();
  }

  static async scheduleLocalNotification(title: string, body: string, scheduleAt: Date) {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 1001,
            schedule: { at: scheduleAt },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: { action: 'open_app' },
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }

  static async scheduleDailyReminder(reminderTime: string) {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await this.cancelAllNotifications();
    return this.scheduleLocalNotification(
      'Time for your Climate Note! 🌱',
      "Read today's environmental story and write your action note to keep your streak going.",
      scheduledTime
    );
  }

  static async cancelAllNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

async function handleDeepLink(urlString: string) {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    console.error('Invalid deep link URL');
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

    App.addListener('appStateChange', ({ isActive }) => {
      
      if (isActive) {
        window.dispatchEvent(new CustomEvent('app-became-active'));
      }
    });

    App.addListener('appUrlOpen', async (event) => {

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

