import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

import { useLists } from './lists';
import type { LetterList } from './lists';
import { dayKey, useProgress } from './progress';

/** A repeating practice reminder. `days` are 0 = Monday … 6 = Sunday. */
export type Reminder = {
  id: string;
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[];
  /** Optional saved list the reminder opens straight into. */
  listId?: string;
};

type Saved = { reminders: Reminder[]; streakSaver: boolean };
export type Permission = 'unknown' | 'granted' | 'denied';

const STORAGE_KEY = 'tamil-app/reminders/v1';
const CHANNEL = 'reminders';
const STREAK_SAVER_HOUR = 21;
/** Local notifications only exist on phones; the web preview just stores the settings. */
export const REMINDERS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

if (REMINDERS_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

type RemindersContextValue = {
  reminders: Reminder[];
  streakSaver: boolean;
  permission: Permission;
  /** Add or replace a reminder. Asks for notification permission the first time. */
  save: (r: Reminder) => Promise<void>;
  remove: (id: string) => void;
  setEnabled: (id: string, on: boolean) => Promise<void>;
  setStreakSaver: (on: boolean) => Promise<void>;
};

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ reminders: [], streakSaver: false });
  const [permission, setPermission] = useState<Permission>('unknown');
  const loaded = useRef(false);
  const { lists } = useLists();
  const { days } = useProgress();
  const practicedToday = days.includes(dayKey(Date.now()));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setSaved(JSON.parse(json));
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
    if (REMINDERS_SUPPORTED) {
      Notifications.getPermissionsAsync()
        .then((p) => setPermission(p.granted ? 'granted' : p.canAskAgain ? 'unknown' : 'denied'))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved]);

  // Keep the phone's schedule in step with the settings, the lists' names, and whether today is done.
  useEffect(() => {
    if (!loaded.current || permission !== 'granted') return;
    schedule(saved, lists, practicedToday).catch(() => {});
  }, [saved, lists, practicedToday, permission]);

  // Opening a reminder goes straight to practice.
  const response = REMINDERS_SUPPORTED ? Notifications.useLastNotificationResponse() : null;
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const id = response?.notification.request.identifier;
    const url = response?.notification.request.content.data?.url;
    if (!id || handled.current === id || typeof url !== 'string') return;
    handled.current = id;
    router.push(url as never);
  }, [response]);

  const ask = useCallback(async () => {
    if (!REMINDERS_SUPPORTED) return false;
    const p = await Notifications.requestPermissionsAsync();
    setPermission(p.granted ? 'granted' : 'denied');
    return p.granted;
  }, []);

  const value = useMemo<RemindersContextValue>(
    () => ({
      reminders: saved.reminders,
      streakSaver: saved.streakSaver,
      permission,
      save: async (r) => {
        setSaved((s) => ({
          ...s,
          reminders: s.reminders.some((x) => x.id === r.id)
            ? s.reminders.map((x) => (x.id === r.id ? r : x))
            : [...s.reminders, r],
        }));
        if (r.enabled && permission !== 'granted') await ask();
      },
      remove: (id) => setSaved((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })),
      setEnabled: async (id, on) => {
        setSaved((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: on } : r)) }));
        if (on && permission !== 'granted') await ask();
      },
      setStreakSaver: async (on) => {
        setSaved((s) => ({ ...s, streakSaver: on }));
        if (on && permission !== 'granted') await ask();
      },
    }),
    [saved, permission, ask],
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders() {
  const ctx = useContext(RemindersContext);
  if (!ctx) throw new Error('useReminders must be used inside RemindersProvider');
  return ctx;
}

async function schedule(saved: Saved, lists: LetterList[], practicedToday: boolean) {
  if (!REMINDERS_SUPPORTED) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Practice reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const r of saved.reminders) {
    if (!r.enabled) continue;
    const list = lists.find((l) => l.id === r.listId);
    const content: Notifications.NotificationContentInput = list
      ? {
          title: `Time to practice “${list.name}”`,
          body: `${list.ids.length} ${list.ids.length === 1 ? 'letter' : 'letters'} waiting. A few minutes is enough.`,
          data: { url: `/drill?ids=${list.ids.join(',')}` },
        }
      : {
          title: 'Time for some Tamil',
          body: 'A few minutes of practice keeps your letters fresh.',
          data: { url: '/' },
        };
    for (const d of r.days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          // Notifications count weekdays from Sunday = 1; ours start at Monday = 0.
          weekday: ((d + 1) % 7) + 1,
          hour: r.hour,
          minute: r.minute,
          channelId: CHANNEL,
        },
      });
    }
  }

  if (saved.streakSaver) {
    // One nudge at 9 PM on the next day that doesn't have practice yet. Rescheduled each time the app opens.
    const at = new Date();
    at.setHours(STREAK_SAVER_HOUR, 0, 0, 0);
    if (practicedToday || at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep your streak going',
        body: "You haven't practiced today yet. One quick round counts.",
        data: { url: '/' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
  }
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** "Every day", "Weekdays", "Weekends" or "Mon, Wed, Fri". */
export function describeDays(days: number[]) {
  const set = [...new Set(days)].sort();
  if (set.length === 7) return 'Every day';
  if (set.join() === '0,1,2,3,4') return 'Weekdays';
  if (set.join() === '5,6') return 'Weekends';
  if (set.length === 0) return 'No days picked';
  return set.map((d) => DAY_NAMES[d]).join(', ');
}

/** "7:30 PM" in 12-hour time. */
export function formatTime(hour: number, minute: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
