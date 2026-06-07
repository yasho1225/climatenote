import { useEffect, useState } from 'react';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  startWebReminderSchedule,
  stopWebReminderSchedule,
} from '../lib/notificationScheduler';

interface NotificationSettings {
  browserNotifications: boolean;
  reminderTime: string;
  lastUpdated: string;
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: false,
    reminderTime: '18:00',
    lastUpdated: new Date().toISOString(),
  });

  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const savedSettings = loadNotificationSettings();
    if (savedSettings) {
      setSettings({
        browserNotifications: savedSettings.browserNotifications,
        reminderTime: savedSettings.reminderTime,
        lastUpdated: savedSettings.lastUpdated || new Date().toISOString(),
      });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const scheduleReminder = (time: string) => {
    if (permission !== 'granted') return;
    startWebReminderSchedule(time);
  };

  const sendStreakReminder = (streakCount: number) => {
    if (permission !== 'granted') return;

    new Notification(`${streakCount} Day Streak! 🔥`, {
      body: "Keep your climate action streak alive! Write today's note.",
      icon: '/favicon.ico',
      tag: 'streak-reminder',
    });
  };

  const sendEncouragementNotification = (message: string) => {
    if (permission !== 'granted') return;

    new Notification('Someone encouraged your action! 💚', {
      body: message,
      icon: '/favicon.ico',
      tag: 'encouragement',
    });
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      lastUpdated: new Date().toISOString(),
    };
    setSettings(updatedSettings);
    saveNotificationSettings(updatedSettings);

    if (updatedSettings.browserNotifications && permission === 'granted') {
      scheduleReminder(updatedSettings.reminderTime);
    } else {
      stopWebReminderSchedule();
    }
  };

  return {
    settings,
    permission,
    requestPermission,
    scheduleReminder,
    sendStreakReminder,
    sendEncouragementNotification,
    updateSettings,
  };
}
