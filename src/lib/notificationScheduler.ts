import { Capacitor } from '@capacitor/core';

const SETTINGS_KEY = 'climateNoteSettings';
const REMINDER_TAG = 'climate-note-reminder';

export interface NotificationSettings {
  browserNotifications: boolean;
  reminderTime: string;
  lastUpdated?: string;
}

let webReminderTimeout: ReturnType<typeof setTimeout> | null = null;

export function loadNotificationSettings(): NotificationSettings | null {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as NotificationSettings;
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
    return null;
  }
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...settings, lastUpdated: new Date().toISOString() })
  );
}

export function stopWebReminderSchedule() {
  if (webReminderTimeout !== null) {
    clearTimeout(webReminderTimeout);
    webReminderTimeout = null;
  }
}

function scheduleNextWebReminder(reminderTime: string) {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();
  webReminderTimeout = setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time for your Climate Note! 🌱', {
        body: "Read today's environmental story and write your action note to keep your streak going.",
        icon: '/favicon.ico',
        tag: REMINDER_TAG,
        requireInteraction: true,
      });
    }
    scheduleNextWebReminder(reminderTime);
  }, delay);
}

export function startWebReminderSchedule(reminderTime: string) {
  stopWebReminderSchedule();
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  scheduleNextWebReminder(reminderTime);
}

export async function applySavedReminderSchedule() {
  const settings = loadNotificationSettings();
  if (!settings?.browserNotifications) {
    stopWebReminderSchedule();
    return;
  }

  if (Capacitor.isNativePlatform()) {
    const { CapacitorNotifications } = await import('../capacitor-plugins');
    await CapacitorNotifications.initialize();
    await CapacitorNotifications.scheduleDailyReminder(settings.reminderTime);
    return;
  }

  startWebReminderSchedule(settings.reminderTime);
}

export async function stopAllReminders() {
  stopWebReminderSchedule();
  if (Capacitor.isNativePlatform()) {
    const { CapacitorNotifications } = await import('../capacitor-plugins');
    await CapacitorNotifications.cancelAllNotifications();
  }
}
