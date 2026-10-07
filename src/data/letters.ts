import raw from './letters.json';
import extra from './letters.extra.json';

export type LetterGroup = 'vowel' | 'aytham' | 'consonant' | 'compound' | 'grantha';

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
  /** Compound letters only: the consonant and vowel ids they are built from. */
  consonant?: string;
  vowel?: string;
};

/** Base letters (hand-written hints) followed by the generated compound and Grantha letters. */
export const LETTERS = [...raw, ...extra] as Letter[];
export const CONSONANTS = LETTERS.filter((l) => l.group === 'consonant');
export const COMPOUNDS = LETTERS.filter((l) => l.group === 'compound');

const byId = new Map(LETTERS.map((l) => [l.id, l]));

export function getLetter(id: string): Letter | undefined {
  return byId.get(id);
}

/** The segments on the Alphabet tab. */
export const SEGMENTS = [
  { id: 'vowels', label: 'Vowels', letters: LETTERS.filter((l) => l.group === 'vowel' || l.group === 'aytham') },
  { id: 'consonants', label: 'Consonants', letters: CONSONANTS },
  { id: 'compound', label: 'Compound', letters: COMPOUNDS },
  { id: 'grantha', label: 'Grantha', letters: LETTERS.filter((l) => l.group === 'grantha') },
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

function lookalikes(id: string): string[] {
  const group = CONFUSABLE.find((g) => g.includes(id));
  return group ? group.filter((x) => x !== id) : [];
}

export function confusablesOf(id: string): string[] {
  const letter = byId.get(id);
  if (letter?.group !== 'compound' || !letter.consonant || !letter.vowel) return lookalikes(id);
  // A compound is confused with the same consonant plus a look-alike vowel, and the reverse.
  const { consonant, vowel } = letter;
  return [
    ...lookalikes(vowel).map((v) => `${consonant}_${v}`),
    ...lookalikes(consonant).map((c) => `${c}_${vowel}`),
  ];
}
