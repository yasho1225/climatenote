import React, { useState, useEffect } from 'react';
import { Bell, Clock, Smartphone, Globe, Check, X } from 'lucide-react';
import { showToast } from './ui/Toast';
import { useCapacitorNotifications } from '../hooks/useCapacitorNotifications';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  applySavedReminderSchedule,
  stopAllReminders,
} from '../lib/notificationScheduler';

interface NotificationSettingsProps {
  onClose: () => void;
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [reminderTime, setReminderTime] = useState('18:00');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const capacitorNotifications = useCapacitorNotifications();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const settings = loadNotificationSettings();
    if (settings) {
      setBrowserNotifications(settings.browserNotifications || false);
      setReminderTime(settings.reminderTime || '18:00');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (capacitorNotifications.isNative) {
      const granted = await capacitorNotifications.requestPermissions();
      if (granted) {
        setBrowserNotifications(true);
        showToast('Notifications enabled!', 'success');
      } else {
        showToast('Notifications blocked. Enable them in device settings.', 'error');
      }
      return;
    }

    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setBrowserNotifications(true);
        showToast('Notifications enabled!', 'success');
        new Notification('The Climate Note', {
          body: "You'll now receive daily reminders to write your climate note.",
          icon: '/favicon.ico',
          tag: 'climate-note-welcome',
        });
      } else {
        showToast('Notifications blocked. Enable them in your browser settings.', 'error');
      }
    }
  };

  const saveSettings = async () => {
    saveNotificationSettings({ browserNotifications, reminderTime });

    if (browserNotifications) {
      if (capacitorNotifications.isNative) {
        if (!capacitorNotifications.canSchedule) {
          const granted = await capacitorNotifications.requestPermissions();
          if (!granted) {
            showToast('Notification permission is required', 'error');
            return;
          }
        }
        await capacitorNotifications.scheduleReminder(reminderTime);
      } else if (permission === 'granted') {
        await applySavedReminderSchedule();
      } else {
        showToast('Please enable notifications first', 'error');
        return;
      }
    } else {
      await stopAllReminders();
    }

    showToast('Notification settings saved!', 'success');
    onClose();
  };

  const testNotification = () => {
    if (capacitorNotifications.isNative && capacitorNotifications.canSchedule) {
      void capacitorNotifications.scheduleReminder(
        new Date(Date.now() + 5000).toTimeString().slice(0, 5)
      );
      showToast('Test notification scheduled for ~5 seconds from now', 'success');
      return;
    }

    if (permission === 'granted') {
      new Notification('Test Reminder 🌱', {
        body: 'This is how your daily climate note reminder will look!',
        icon: '/favicon.ico',
        tag: 'climate-note-test',
      });
      showToast('Test notification sent!', 'success');
    } else {
      showToast('Please enable notifications first', 'error');
    }
  };

  const canUseNotifications =
    capacitorNotifications.permissionsGranted || permission === 'granted';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <span>Notification Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {capacitorNotifications.isNative ? 'Daily Reminder' : 'Browser Notifications'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {capacitorNotifications.isNative
                      ? 'Local reminder at your chosen time each day'
                      : 'Get reminded on this device'}
                  </p>
                </div>
              </div>
              <button
                onClick={
                  canUseNotifications
                    ? () => setBrowserNotifications(!browserNotifications)
                    : requestNotificationPermission
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  browserNotifications && canUseNotifications
                    ? 'bg-emerald-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    browserNotifications && canUseNotifications
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {permission === 'denied' && !capacitorNotifications.isNative && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Notifications are blocked. Enable them in your browser settings to receive reminders.
                </p>
              </div>
            )}

            {capacitorNotifications.isNative && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-800">
                  Native app notifications reschedule automatically when you reopen the app.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="font-medium text-gray-900">Daily Reminder Time</h3>
                <p className="text-sm text-gray-600">When should we remind you?</p>
              </div>
            </div>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => void saveSettings()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>

            {browserNotifications && canUseNotifications && (
              <button
                onClick={testNotification}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
