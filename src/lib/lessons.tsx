import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { LESSONS } from '../data/lessons';
import type { Lesson } from '../data/lessons';

/** When each lesson was finished, and the best score on it. */
type Done = Record<string, { at: number; right: number; asked: number }>;

const STORAGE_KEY = 'tamil-app/lessons/v1';

type LessonsContextValue = {
  done: Done;
  isDone: (id: string) => boolean;
  /** The first lesson not yet finished, or undefined once all are. */
  next: Lesson | undefined;
  complete: (id: string, right: number, asked: number) => void;
  reset: () => void;
};

const LessonsContext = createContext<LessonsContextValue | null>(null);

export function LessonsProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<Done>({});
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setDone(JSON.parse(json).done ?? {});
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ done })).catch(() => {});
  }, [done]);

  const value = useMemo<LessonsContextValue>(
    () => ({
      done,
      isDone: (id) => !!done[id],
      next: LESSONS.find((l) => !done[l.id]),
      complete: (id, right, asked) =>
        setDone((d) => {
          const old = d[id];
          const better = !old || !old.asked || right / Math.max(asked, 1) >= old.right / old.asked;
          return { ...d, [id]: better ? { at: Date.now(), right, asked } : { ...old, at: Date.now() } };
        }),
      reset: () => setDone({}),
    }),
    [done],
  );

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>;
}

export function useLessons() {
  const ctx = useContext(LessonsContext);
  if (!ctx) throw new Error('useLessons must be used inside LessonsProvider');
  return ctx;
}
