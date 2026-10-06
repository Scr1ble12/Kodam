import raw from './letters.json';

export type LetterGroup = 'vowel' | 'aytham' | 'consonant';

export type Letter = {
  id: string;
  group: LetterGroup;
  /** The letter as written. Consonants are shown in their pure (mei) form, with the pulli dot. */
  tamil: string;
  /** ISO 15919 transliteration, unique per letter. */
  roman: string;
  /** Casual English-keyboard spelling, shown as a helper next to `roman`. */
  friendly: string;
  /** How it sounds, in plain English. */
  hint: string;
};

export const LETTERS = raw as Letter[];
export const CONSONANTS = LETTERS.filter((l) => l.group === 'consonant');

const byId = new Map(LETTERS.map((l) => [l.id, l]));

export function getLetter(id: string): Letter | undefined {
  return byId.get(id);
}

/** The segments on the Alphabet tab. Compound and Grantha letters come in a later build. */
export const SEGMENTS = [
  { id: 'vowels', label: 'Vowels', letters: LETTERS.filter((l) => l.group !== 'consonant') },
  { id: 'consonants', label: 'Consonants', letters: CONSONANTS },
] as const;

export type SegmentId = (typeof SEGMENTS)[number]['id'];

/**
 * Letters that learners commonly mix up. The quiz pulls distractors from here
 * once a letter is fairly well known, so practice stays usefully hard.
 */
const CONFUSABLE: string[][] = [
  ['a', 'aa'],
  ['i', 'ii'],
  ['u', 'uu'],
  ['e', 'ee'],
  ['o', 'oo'],
  ['ai', 'au'],
  ['tt', 't'],
  ['nn', 'n', 'nnn'],
  ['l', 'll', 'zh'],
  ['r', 'rr'],
  ['ng', 'nj'],
];

export function confusablesOf(id: string): string[] {
  const group = CONFUSABLE.find((g) => g.includes(id));
  return group ? group.filter((x) => x !== id) : [];
}
