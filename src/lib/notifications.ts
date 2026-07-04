import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule } from '../types';

/**
 * Local notifications that surface each scheduled "bell" at its time, even when
 * the app is backgrounded. The in-app engine performs the actual playback; these
 * notifications give the schedule an OS-level presence and reminder.
 */

const CHANNEL_ID = 'schedules';

let configured = false;

async function configure(): Promise<void> {
  if (configured) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Schedules',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  configured = true;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    await configure();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  return { hour: h || 0, minute: m || 0 };
}

/** Cancels all schedule notifications and re-registers the enabled ones. */
export async function syncScheduleNotifications(schedules: Schedule[]): Promise<void> {
  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const s of schedules) {
      if (!s.enabled) continue;
      const { hour, minute } = parseTime(s.time);
      const title = s.action === 'play' ? 'Bell ringing' : 'Playback stopping';
      const body = s.label || (s.action === 'play' ? 'Scheduled playback' : 'Scheduled stop');
      const content = { title, body, channelId: CHANNEL_ID };

      const days = s.days.length > 0 ? s.days : [-1];
      for (const day of days) {
        const trigger =
          day === -1
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
                hour,
                minute,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY as const,
                weekday: day + 1, // JS 0=Sun -> Expo 1=Sun
                hour,
                minute,
              };
        await Notifications.scheduleNotificationAsync({ content, trigger });
      }
    }
  } catch {
    // Notifications are best-effort; the in-app engine still fires schedules.
  }
}
