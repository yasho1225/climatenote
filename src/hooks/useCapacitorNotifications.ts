import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorNotifications } from '../capacitor-plugins';

interface CapacitorNotificationSettings {
  isNative: boolean;
  permissionsGranted: boolean;
  canSchedule: boolean;
}

export function useCapacitorNotifications() {
  const [settings, setSettings] = useState<CapacitorNotificationSettings>({
    isNative: false,
    permissionsGranted: false,
    canSchedule: false,
  });

  useEffect(() => {
    const initializeCapacitor = async () => {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        const permissionsGranted = await CapacitorNotifications.initialize();
        setSettings({
          isNative: true,
          permissionsGranted,
          canSchedule: permissionsGranted,
        });
      } else {
        setSettings({
          isNative: false,
          permissionsGranted: false,
          canSchedule: false,
        });
      }
    };

    void initializeCapacitor();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await CapacitorNotifications.initialize();
    setSettings((prev) => ({
      ...prev,
      permissionsGranted: granted,
      canSchedule: granted,
    }));
    return granted;
  };

  const scheduleReminder = async (time: string) => {
    if (!settings.canSchedule) {
      return false;
    }
    return CapacitorNotifications.scheduleDailyReminder(time);
  };

  const cancelReminders = async () => {
    if (settings.canSchedule) {
      await CapacitorNotifications.cancelAllNotifications();
    }
  };

  return {
    ...settings,
    requestPermissions,
    scheduleReminder,
    cancelReminders,
  };
}
