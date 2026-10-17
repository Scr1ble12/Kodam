import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** A saved set of letters to practice, named by the learner. */
export type LetterList = { id: string; name: string; ids: string[] };

const STORAGE_KEY = 'tamil-app/lists/v1';

type ListsContextValue = {
  lists: LetterList[];
  create: (name: string, ids: string[]) => LetterList;
  rename: (id: string, name: string) => void;
  /** Change a list's name and letters. */
  edit: (id: string, name: string, ids: string[]) => void;
  remove: (id: string) => void;
};

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<LetterList[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) setLists(JSON.parse(json));
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists)).catch(() => {});
  }, [lists]);

  const value = useMemo<ListsContextValue>(
    () => ({
      lists,
      create: (name, ids) => {
        const list = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, ids };
        setLists((ls) => [...ls, list]);
        return list;
      },
      rename: (id, name) => setLists((ls) => ls.map((l) => (l.id === id ? { ...l, name } : l))),
      edit: (id, name, ids) => setLists((ls) => ls.map((l) => (l.id === id ? { ...l, name, ids } : l))),
      remove: (id) => setLists((ls) => ls.filter((l) => l.id !== id)),
    }),
    [lists],
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used inside ListsProvider');
  return ctx;
}

/** A name like "List 3" that isn't taken yet. */
export function nextListName(lists: LetterList[]) {
  let n = lists.length + 1;
  while (lists.some((l) => l.name === `List ${n}`)) n++;
  return `List ${n}`;
}
