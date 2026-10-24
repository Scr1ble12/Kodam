import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { DECKS, getWord } from '../data/words';
import type { Word } from '../data/words';
import { dayKey, useProgress } from './progress';
import type { LetterProgress } from './progress';
import { useTheme } from './theme';

/** A deck the learner built from words in any topic. */
export type CustomDeck = { id: string; name: string; wordIds: string[] };

/** Any deck shown on the Vocabulary tab, built-in or custom. */
export type AnyDeck = { id: string; name: string; tamilName?: string; words: Word[]; custom: boolean };

type Saved = {
  /** Decks (built-in or custom ids) whose words go into the daily review. */
  active: string[];
  custom: CustomDeck[];
};

const STORAGE_KEY = 'tamil-app/vocab/v1';
const DEFAULT: Saved = { active: ['greetings'], custom: [] };

type VocabContextValue = {
  decks: AnyDeck[];
  custom: CustomDeck[];
  isActive: (deckId: string) => boolean;
  setActive: (deckId: string, on: boolean) => void;
  createDeck: (name: string, wordIds: string[]) => CustomDeck;
  editDeck: (id: string, name: string, wordIds: string[]) => void;
  removeDeck: (id: string) => void;
};

const VocabContext = createContext<VocabContextValue | null>(null);

export function VocabProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(DEFAULT);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setSaved({ ...DEFAULT, ...JSON.parse(json) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved]);

  const value = useMemo<VocabContextValue>(() => {
    const decks: AnyDeck[] = [
      ...DECKS.map((d) => ({ ...d, custom: false })),
      ...saved.custom.map((c) => ({
        id: c.id,
        name: c.name,
        words: c.wordIds.map(getWord).filter((w): w is Word => !!w),
        custom: true,
      })),
    ];
    return {
      decks,
      custom: saved.custom,
      isActive: (id) => saved.active.includes(id),
      setActive: (id, on) =>
        setSaved((s) => ({
          ...s,
          active: on ? [...new Set([...s.active, id])] : s.active.filter((x) => x !== id),
        })),
      createDeck: (name, wordIds) => {
        const deck = { id: `c.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, wordIds };
        // A new deck goes straight into the daily review, since you made it to study it.
        setSaved((s) => ({ ...s, custom: [...s.custom, deck], active: [...s.active, deck.id] }));
        return deck;
      },
      editDeck: (id, name, wordIds) =>
        setSaved((s) => ({ ...s, custom: s.custom.map((c) => (c.id === id ? { ...c, name, wordIds } : c)) })),
      removeDeck: (id) =>
        setSaved((s) => ({ custom: s.custom.filter((c) => c.id !== id), active: s.active.filter((x) => x !== id) })),
    };
  }, [saved]);

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
}

export function useVocab() {
  const ctx = useContext(VocabContext);
  if (!ctx) throw new Error('useVocab must be used inside VocabProvider');
  return ctx;
}

const isToday = (t?: number) => !!t && dayKey(t) === dayKey(Date.now());

/** What today's review holds: words that are due, and new words up to the daily limit. */
export function useToday() {
  const { decks, isActive } = useVocab();
  const progress = useProgress();
  const { settings } = useTheme();
  return useMemo(() => {
    const now = Date.now();
    const seenIds = new Set<string>();
    const words: Word[] = [];
    for (const d of decks) {
      if (!isActive(d.id)) continue;
      for (const w of d.words) {
        if (seenIds.has(w.id)) continue;
        seenIds.add(w.id);
        words.push(w);
      }
    }
    const p = (w: Word) => progress.get(w.id);
    const due = words.filter((w) => p(w).seen > 0 && p(w).due <= now).sort((a, b) => p(a).due - p(b).due);
    const introducedToday = words.filter((w) => isToday(p(w).firstSeen)).length;
    const unseen = words.filter((w) => p(w).seen === 0);
    const fresh = unseen.slice(0, Math.max(0, settings.newWords - introducedToday));
    // About 10 seconds per review question; a new word is an intro card plus a question.
    const minutes = Math.max(1, Math.round(((due.length + fresh.length * 2) * 10) / 60));
    return { due, fresh, minutes, activeCount: words.length, unseenLeft: unseen.length };
  }, [decks, isActive, progress, settings.newWords]);
}

/** Started / mastered counts for a set of words. */
export function deckProgress(words: Word[], get: (id: string) => LetterProgress, stage: (id: string) => string) {
  const started = words.filter((w) => get(w.id).seen > 0).length;
  const mastered = words.filter((w) => stage(w.id) === 'mastered').length;
  return { started, mastered, total: words.length };
}
