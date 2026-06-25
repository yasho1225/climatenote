import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './lib/supabase';

export class CapacitorNotifications {
  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Request permissions
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

    // Register for push notifications
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
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: scheduleAt },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              action: 'open_app'
            }
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }

  static async cancelAllNotifications() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [] });
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

// App state listeners
export class CapacitorApp {
  static initialize() {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    App.addListener('appStateChange', ({ isActive }) => {
      
      if (isActive) {
        // App became active - you can refresh data here
        window.dispatchEvent(new CustomEvent('app-became-active'));
      }
    });

    App.addListener('appUrlOpen', async (event) => {

      // Handle OAuth callback deep links
      // The URL will contain access_token / refresh_token after OAuth sign-in
      const url = new URL(event.url);

      // Check for OAuth callback with tokens in the hash fragment or query params
      if (url.hash || url.searchParams.has('code') || url.searchParams.has('access_token')) {
        // Close the in-app browser that was opened for OAuth
        try {
          await Browser.close();
        } catch {
          // Browser may already be closed
        }

        // Extract tokens from hash fragment (Supabase implicit grant flow)
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }

        // Handle PKCE flow with authorization code
        if (url.searchParams.has('code')) {
          const code = url.searchParams.get('code')!;
          await supabase.auth.exchangeCodeForSession(code);
        }
      }

      // Handle password reset deep links
      if (event.url.includes('type=recovery') || event.url.includes('/reset-password')) {
        window.location.hash = '#/reset-password';
      }
    });
  }
}