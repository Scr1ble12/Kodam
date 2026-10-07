import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';

import type { Letter } from '../data/letters';

/** Which way a drill question runs. */
export type Direction = 'letterToSound' | 'soundToLetter';

/**
 * Per-letter learning state, stored on the device only.
 *
 * Reviews use a simple spaced-repetition ladder: a right answer on a letter that
 * is due moves it up one rung and pushes its next review further out; a wrong
 * answer drops it back to the first rung. Answering a letter again before it is
 * due still counts toward accuracy but doesn't climb the ladder, so mastery has
 * to be earned across several days.
 */
export type LetterProgress = {
  rung: number;
  /** When the letter is next due for review (ms since epoch). 0 = due now. */
  due: number;
  seen: number;
  correct: number;
  lastCorrect: boolean;
  /** Has the learner ever answered it right in this direction? */
  dirs: Record<Direction, boolean>;
  /** Tracing steps passed (0-3). A bonus: it never blocks mastery. */
  traceStep: number;
};

export type Stage = 'new' | 'learning' | 'familiar' | 'mastered';

const DAY = 24 * 60 * 60 * 1000;
/** Days until the next review once a letter reaches each rung. */
const RUNG_DAYS = [0, 1, 3, 7, 21, 45];
export const TRACE_STEPS = 3;

const STORAGE_KEY = 'tamil-app/progress/v1';
const EMPTY: LetterProgress = {
  rung: 0,
  due: 0,
  seen: 0,
  correct: 0,
  lastCorrect: false,
  dirs: { letterToSound: false, soundToLetter: false },
  traceStep: 0,
};

/**
 * Stages from the spec: Learning once answered right, Familiar once right both
 * ways with the next review a week or more out, Mastered once the next review
 * is three weeks or more out and the last answer was right.
 */
export function stageOf(p: LetterProgress): Stage {
  if (p.correct === 0) return p.seen === 0 ? 'new' : 'learning';
  if (RUNG_DAYS[p.rung] >= 21 && p.lastCorrect) return 'mastered';
  if (RUNG_DAYS[p.rung] >= 7 && p.dirs.letterToSound && p.dirs.soundToLetter) return 'familiar';
  return 'learning';
}

/** 0-3, for the thin mastery bar under each letter. */
export function stageLevel(stage: Stage) {
  return { new: 0, learning: 1, familiar: 2, mastered: 3 }[stage];
}

/** What happened in the app on one day. */
export type DayActivity = { opens: number; answers: number; correct?: number; seconds?: number };

type Saved = {
  letters: Record<string, LetterProgress>;
  /** Days with practice (local date keys), for the streak. */
  days: string[];
  activity: Record<string, DayActivity>;
};

const EMPTY_SAVED: Saved = { letters: {}, days: [], activity: {} };
/** Coming back to the app after this long counts as a new visit. */
const NEW_VISIT_AFTER = 30 * 60 * 1000;

type ProgressContextValue = {
  get: (id: string) => LetterProgress;
  stage: (id: string) => Stage;
  recordAnswer: (id: string, direction: Direction, correct: boolean) => void;
  passTraceStep: (id: string, step: number) => void;
  /** Consecutive days with practice, counting today or yesterday as the latest. */
  streak: number;
  bestStreak: number;
  /** Practice days, oldest first. */
  days: string[];
  activity: Record<string, DayActivity>;
  /** Seconds in the app today that haven't been saved yet (the current stretch). */
  unsavedSeconds: () => number;
  reset: () => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function countStreak(days: string[], now: number) {
  const set = new Set(days);
  let t = set.has(dayKey(now)) ? now : now - DAY;
  let n = 0;
  while (set.has(dayKey(t))) {
    n++;
    t -= DAY;
  }
  return n;
}

function longestStreak(days: string[]) {
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const d of [...new Set(days)].sort()) {
    const t = new Date(`${d}T12:00:00`).getTime();
    run = prev && Math.round((t - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

function bump(s: Saved, field: keyof DayActivity, by = 1, at = Date.now()): Saved {
  const day = dayKey(at);
  const cur = s.activity[day] ?? { opens: 0, answers: 0 };
  return { ...s, activity: { ...s.activity, [day]: { ...cur, [field]: (cur[field] ?? 0) + by } } };
}

/** Longest stretch of time-in-app counted at once, so a phone left on the table doesn't inflate it. */
const MAX_SESSION = 20 * 60 * 1000;

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(EMPTY_SAVED);
  const loaded = useRef(false);
  const lastActive = useRef(Date.now());
  const activeSince = useRef(Date.now());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setSaved({ ...EMPTY_SAVED, ...JSON.parse(json) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setSaved((s) => bump(s, 'opens'));
      });
  }, []);

  // Count a new visit when the app comes back to the foreground after a while.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        const now = Date.now();
        const spent = Math.min(now - activeSince.current, MAX_SESSION);
        // 'inactive' (iOS app switcher) is followed by 'background', so count each stretch once.
        if (spent > 1000) setSaved((s) => bump(s, 'seconds', Math.round(spent / 1000), activeSince.current));
        activeSince.current = now;
        lastActive.current = now;
        return;
      }
      activeSince.current = Date.now();
      if (loaded.current && Date.now() - lastActive.current > NEW_VISIT_AFTER) setSaved((s) => bump(s, 'opens'));
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved]);

  const update = useCallback((id: string, fn: (p: LetterProgress) => LetterProgress, practiced: boolean) => {
    setSaved((s) => {
      const today = dayKey(Date.now());
      const days = practiced && !s.days.includes(today) ? [...s.days.slice(-400), today] : s.days;
      return { ...s, days, letters: { ...s.letters, [id]: fn({ ...EMPTY, ...s.letters[id] }) } };
    });
  }, []);

  const value = useMemo<ProgressContextValue>(() => {
    const get = (id: string) => ({ ...EMPTY, ...saved.letters[id] });
    return {
      get,
      stage: (id) => stageOf(get(id)),
      recordAnswer: (id, direction, correct) => {
        setSaved((s) => (correct ? bump(bump(s, 'answers'), 'correct') : bump(s, 'answers')));
        update(
          id,
          (p) => {
            const now = Date.now();
            const base = { ...p, seen: p.seen + 1, lastCorrect: correct };
            if (!correct) return { ...base, rung: Math.min(p.rung, 1), due: now };
            const rung = now >= p.due ? Math.min(p.rung + 1, RUNG_DAYS.length - 1) : p.rung;
            return {
              ...base,
              correct: p.correct + 1,
              rung,
              due: rung === p.rung ? p.due : now + RUNG_DAYS[rung] * DAY,
              dirs: { ...p.dirs, [direction]: true },
            };
          },
          true,
        );
      },
      passTraceStep: (id, step) =>
        update(id, (p) => ({ ...p, traceStep: Math.max(p.traceStep, Math.min(step, TRACE_STEPS)) }), true),
      streak: countStreak(saved.days, Date.now()),
      bestStreak: longestStreak(saved.days),
      days: saved.days,
      activity: saved.activity,
      unsavedSeconds: () => Math.min(Date.now() - activeSince.current, MAX_SESSION) / 1000,
      reset: () => setSaved(EMPTY_SAVED),
    };
  }, [saved, update]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

/**
 * Pick the next letter to ask about: letters that are due and on low rungs come
 * up most, and the letter just asked is avoided when there is any choice.
 */
export function pickNext(pool: Letter[], get: (id: string) => LetterProgress, avoid?: string): Letter {
  const options = pool.length > 1 ? pool.filter((l) => l.id !== avoid) : pool;
  const now = Date.now();
  const weights = options.map((l) => {
    const p = get(l.id);
    return (p.due <= now ? 3 : 1) * (RUNG_DAYS.length - p.rung);
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}
