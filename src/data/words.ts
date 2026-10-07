import data from './words.json';

/** One vocabulary word. DRAFT content: needs a native speaker's review before release. */
export type Word = {
  /** `w.<deck>.<slug>`, kept apart from letter ids in the shared progress store. */
  id: string;
  /** Written (formal) Tamil. */
  tamil: string;
  /** ISO 15919 romanization of `tamil`. */
  roman: string;
  english: string;
  /** How it's usually said (Chennai-style colloquial), when that differs from the written form. */
  spoken?: string;
  spokenRoman?: string;
  /** Easy "sounds like" spelling of the spoken form. */
  say: string;
  note?: string;
};

export type Deck = { id: string; name: string; tamilName: string; words: Word[] };

export const DECKS = data.decks as Deck[];
export const WORDS = DECKS.flatMap((d) => d.words);

const byId = new Map(WORDS.map((w) => [w.id, w]));
const deckOf = new Map(DECKS.flatMap((d) => d.words.map((w) => [w.id, d] as const)));

export function getWord(id: string): Word | undefined {
  return byId.get(id);
}

/** The built-in deck a word comes from. */
export function deckOfWord(id: string): Deck | undefined {
  return deckOf.get(id);
}
