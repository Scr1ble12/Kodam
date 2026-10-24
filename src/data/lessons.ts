/**
 * Guided lessons. The order follows a classic Tamil course: vowels, then consonants
 * (reading real words as soon as they're known), then vowel signs, then first sentences.
 * All explanations and examples are written for this app.
 *
 * A lesson is a list of steps. The lesson player turns each step into one or more screens.
 */

/** A word or sentence to read. Either a vocabulary word by id, or written out here. */
export type ReadItem =
  | { word: string }
  | {
      tamil: string;
      english: string;
      /** "Sounds like" spelling. */
      say: string;
      /** Everyday spoken form, when it differs. */
      spoken?: string;
      /** Sentences: each Tamil word with its meaning, shown after answering. */
      gloss?: [string, string][];
    };

export type Step =
  /** An explanation with optional examples the learner can tap to hear. */
  | { kind: 'teach'; title: string; body: string; examples?: string[] }
  /** One intro card per letter (letter ids from letters.json). */
  | { kind: 'letters'; ids: string[] }
  /** Multiple-choice questions on these letters, both directions. */
  | { kind: 'quiz'; ids: string[]; count: number }
  /** "Consonant + vowel = ?" for each [consonant id, vowel id]. */
  | { kind: 'build'; pairs: [string, string][] }
  /** Read each item and pick what it means. Needs at least four items. */
  | { kind: 'read'; items: ReadItem[] };

export type Lesson = { id: string; title: string; summary: string; steps: Step[] };
export type Unit = { id: string; title: string; tamilTitle: string; lessons: Lesson[] };

const VOWELS = ['a', 'aa', 'i', 'ii', 'u', 'uu', 'e', 'ee', 'ai', 'o', 'oo', 'au'];
const HARD = ['k', 'c', 'tt', 't', 'p', 'rr'];
const SOFT = ['ng', 'nj', 'nn', 'n', 'm', 'nnn'];
const MEDIUM = ['y', 'r', 'l', 'v', 'zh', 'll'];

export const UNITS: Unit[] = [
  {
    id: 'vowels',
    title: 'Vowels',
    tamilTitle: 'உயிர் எழுத்து',
    lessons: [
      {
        id: 'vowels-1',
        title: 'Your first vowels',
        summary: 'அ ஆ இ ஈ',
        steps: [
          {
            kind: 'teach',
            title: 'Short and long',
            body:
              'Tamil has 12 vowels. Most come in pairs: a short one and a long one. The long vowel is the same sound held about twice as long.\n\nThe difference matters. It can change the meaning of a word, so listen for it.',
            examples: ['அ', 'ஆ'],
          },
          { kind: 'letters', ids: ['a', 'aa', 'i', 'ii'] },
          { kind: 'quiz', ids: ['a', 'aa', 'i', 'ii'], count: 6 },
        ],
      },
      {
        id: 'vowels-2',
        title: 'u and e',
        summary: 'உ ஊ எ ஏ',
        steps: [
          {
            kind: 'teach',
            title: 'Two more pairs',
            body:
              'The next two pairs work the same way: a short vowel, then its long partner.\n\nRound your lips for உ and ஊ, as in "put" and "food".',
            examples: ['உ', 'ஊ', 'எ', 'ஏ'],
          },
          { kind: 'letters', ids: ['u', 'uu', 'e', 'ee'] },
          { kind: 'quiz', ids: ['a', 'aa', 'i', 'ii', 'u', 'uu', 'e', 'ee'], count: 8 },
        ],
      },
      {
        id: 'vowels-3',
        title: 'ai, o, au and ஃ',
        summary: 'ஐ ஒ ஓ ஔ ஃ',
        steps: [
          {
            kind: 'teach',
            title: 'The last vowels',
            body:
              'ஒ and ஓ are one more short and long pair. ஐ and ஔ have no short partner; they count as long.\n\nஃ is a special letter that is neither a vowel nor a consonant. It sounds like a soft h. Today it mostly appears in ஃப, which writes the f sound in English words.',
            examples: ['ஐ', 'ஒ', 'ஓ', 'ஔ'],
          },
          { kind: 'letters', ids: ['ai', 'o', 'oo', 'au', 'aytham'] },
          { kind: 'quiz', ids: [...VOWELS, 'aytham'], count: 10 },
        ],
      },
    ],
  },
  {
    id: 'consonants',
    title: 'Consonants',
    tamilTitle: 'மெய் எழுத்து',
    lessons: [
      {
        id: 'consonants-1',
        title: 'The dot and the hidden a',
        summary: 'க் ச் ட் த் ப் ற்',
        steps: [
          {
            kind: 'teach',
            title: 'The dot',
            body:
              'Tamil has 18 consonants. Written with a dot on top (called புள்ளி, pulli), a consonant is just its sound: க் is k.\n\nTake the dot away and the letter gets a hidden a: க is ka. Most letters you see in words have no dot.',
            examples: ['க்', 'க'],
          },
          {
            kind: 'teach',
            title: 'Three families',
            body:
              'The consonants come in three families of six: hard, soft and medium. This lesson is the hard family.',
          },
          { kind: 'letters', ids: HARD },
          {
            kind: 'teach',
            title: 'Hard letters soften',
            body:
              'At the start of a word, when doubled, or next to another hard letter, the hard letters stay hard. Between two vowels, or after an n or m sound, they soften: க can sound like g or h, ச like s or j, ட like d, த like dh and ப like b.\n\nSo மகன் (son) is said "magan", not "makan".',
            examples: ['மகன்', 'பக்கம்'],
          },
          { kind: 'quiz', ids: HARD, count: 8 },
        ],
      },
      {
        id: 'consonants-2',
        title: 'Soft consonants',
        summary: 'ங் ஞ் ண் ந் ம் ன்',
        steps: [
          {
            kind: 'teach',
            title: 'The nasal family',
            body:
              'The soft family are all said through the nose. There are three n sounds:\n\nண் with the tongue curled back, ந் with the tongue on the teeth (mostly at the start of a word), and ன் with the tongue on the ridge behind the teeth (inside or at the end of a word).',
            examples: ['ண்', 'ந்', 'ன்'],
          },
          { kind: 'letters', ids: SOFT },
          { kind: 'quiz', ids: [...SOFT, ...HARD], count: 8 },
        ],
      },
      {
        id: 'consonants-3',
        title: 'Medium consonants',
        summary: 'ய் ர் ல் வ் ழ் ள்',
        steps: [
          {
            kind: 'teach',
            title: 'Three kinds of l',
            body:
              'The medium family has three l sounds. ல் is a plain l. ள் is said with the tongue curled back.\n\nழ் curls the tongue even further back, between an r and an l. It is the zh in தமிழ் (Tamizh), the name of the language.',
            examples: ['ல்', 'ள்', 'ழ்', 'தமிழ்'],
          },
          { kind: 'letters', ids: MEDIUM },
          { kind: 'quiz', ids: [...MEDIUM, ...SOFT], count: 8 },
        ],
      },
      {
        id: 'consonants-4',
        title: 'Read your first words',
        summary: 'மரம் · கடல் · வணக்கம்',
        steps: [
          {
            kind: 'teach',
            title: 'You can read now',
            body:
              'With vowels, consonants and the hidden a, you can already read real words. Read letter by letter: ம + ர + ம் is ma-ra-m, மரம் (tree).\n\nA vowel letter like அ only appears at the start of a word.',
            examples: ['மரம்', 'அவள்'],
          },
          {
            kind: 'read',
            items: [
              { tamil: 'மரம்', english: 'tree', say: 'maram' },
              { tamil: 'கடல்', english: 'sea', say: 'kadal' },
              { word: 'w.food.fruit' },
              { word: 'w.family.son' },
              { word: 'w.family.daughter' },
              { word: 'w.body.eye' },
              { word: 'w.greetings.hello' },
              { tamil: 'அவள்', english: 'she', say: 'aval' },
            ],
          },
          { kind: 'quiz', ids: [...HARD, ...SOFT, ...MEDIUM], count: 6 },
        ],
      },
    ],
  },
  {
    id: 'signs',
    title: 'Vowel signs',
    tamilTitle: 'உயிர்மெய்',
    lessons: [
      {
        id: 'signs-1',
        title: 'Signs on the right',
        summary: 'கா கி கீ',
        steps: [
          {
            kind: 'teach',
            title: 'Vowels become signs',
            body:
              'After a consonant, a vowel is written as a sign joined to it. 18 consonants times 12 vowels makes 216 letters, but you only need to learn the signs.\n\nThe first three sit on the right: ா is aa, ி is i and ீ is ii.',
            examples: ['க', 'கா', 'கி', 'கீ'],
          },
          {
            kind: 'build',
            pairs: [
              ['k', 'aa'],
              ['m', 'aa'],
              ['p', 'i'],
              ['t', 'ii'],
              ['v', 'aa'],
              ['n', 'i'],
            ],
          },
          { kind: 'quiz', ids: ['k_aa', 'k_i', 'k_ii', 'm_aa', 'p_i', 't_ii', 'v_aa', 'n_i'], count: 6 },
          {
            kind: 'read',
            items: [
              { word: 'w.food.milk' },
              { word: 'w.body.leg-foot' },
              { tamil: 'மீன்', english: 'fish', say: 'meen' },
              { word: 'w.food.water' },
              { word: 'w.food.rice-uncooked' },
              { word: 'w.home.key' },
            ],
          },
        ],
      },
      {
        id: 'signs-2',
        title: 'Signs on the left',
        summary: 'கெ கே கை',
        steps: [
          {
            kind: 'teach',
            title: 'Written first, said second',
            body:
              'These three signs are written before the consonant but said after it: கெ is ke, கே is kee and கை is kai.\n\nRead the consonant first, then the sign in front of it.',
            examples: ['கெ', 'கே', 'கை'],
          },
          {
            kind: 'build',
            pairs: [
              ['k', 'e'],
              ['m', 'ee'],
              ['t', 'ai'],
              ['v', 'e'],
              ['p', 'ee'],
              ['l', 'ai'],
            ],
          },
          { kind: 'quiz', ids: ['k_e', 'k_ee', 'k_ai', 'm_ee', 't_ai', 'v_e', 'l_ai', 'k_aa'], count: 6 },
          {
            kind: 'read',
            items: [
              { word: 'w.body.hand-arm' },
              { word: 'w.body.head' },
              { word: 'w.home.table' },
              { word: 'w.colours.white' },
              { word: 'w.colours.green' },
              { tamil: 'மாலை', english: 'evening', say: 'maalai', spoken: 'சாயங்காலம்' },
            ],
          },
        ],
      },
      {
        id: 'signs-3',
        title: 'Signs on both sides',
        summary: 'கொ கோ கௌ',
        steps: [
          {
            kind: 'teach',
            title: 'Wrapping around',
            body:
              'These signs wrap around the consonant. ொ is ெ on the left and ா on the right: கொ is ko. ோ is ே and ா: கோ is koo.\n\nௌ (au) is rare: கௌ is kau.',
            examples: ['கொ', 'கோ', 'கௌ'],
          },
          {
            kind: 'build',
            pairs: [
              ['k', 'o'],
              ['t', 'oo'],
              ['p', 'o'],
              ['c', 'oo'],
              ['k', 'au'],
              ['m', 'oo'],
            ],
          },
          { kind: 'quiz', ids: ['k_o', 'k_oo', 't_oo', 'p_o', 'c_oo', 'k_au', 'k_e', 'k_ee'], count: 6 },
          {
            kind: 'read',
            items: [
              { word: 'w.food.dosa' },
              { word: 'w.verbs.go' },
              { word: 'w.body.shoulder' },
              { tamil: 'கோவில்', english: 'temple', say: 'kovil' },
            ],
          },
        ],
      },
      {
        id: 'signs-4',
        title: 'The shape-shifters',
        summary: 'கு கூ டு மு ரு',
        steps: [
          {
            kind: 'teach',
            title: 'Learn these by sight',
            body:
              'The signs for u and uu change shape from one consonant to the next. They fall into a few shape groups, with some exceptions, so it\'s easiest to learn each one by sight.\n\nCompare கு and கூ, டு and டூ, மு and மூ.',
            examples: ['கு', 'கூ', 'டு', 'டூ', 'மு', 'மூ'],
          },
          {
            kind: 'build',
            pairs: [
              ['k', 'u'],
              ['k', 'uu'],
              ['tt', 'u'],
              ['m', 'u'],
              ['r', 'u'],
              ['p', 'uu'],
            ],
          },
          { kind: 'quiz', ids: ['k_u', 'k_uu', 'tt_u', 'tt_uu', 'm_u', 'm_uu', 'r_u', 'p_uu'], count: 8 },
          {
            kind: 'read',
            items: [
              { word: 'w.home.house-home' },
              { word: 'w.body.ear' },
              { word: 'w.body.nose' },
              { tamil: 'பூ', english: 'flower', say: 'poo' },
              { word: 'w.food.salt' },
              { word: 'w.food.cooked-rice' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sentences',
    title: 'First sentences',
    tamilTitle: 'முதல் வாக்கியங்கள்',
    lessons: [
      {
        id: 'sentences-1',
        title: 'This and that',
        summary: 'இது வீடு',
        steps: [
          {
            kind: 'teach',
            title: 'No word for "is"',
            body:
              'இது means this and அது means that. Tamil doesn\'t need a word for "is": இது வீடு means "This is a house."\n\nWords starting with இ point to something near, and words starting with அ to something far: இங்கே is here, அங்கே is there.',
            examples: ['இது வீடு', 'அது மரம்'],
          },
          {
            kind: 'read',
            items: [
              { tamil: 'இது வீடு', english: 'This is a house.', say: 'idhu veedu', gloss: [['இது', 'this'], ['வீடு', 'house']] },
              { tamil: 'அது மரம்', english: 'That is a tree.', say: 'adhu maram', gloss: [['அது', 'that'], ['மரம்', 'tree']] },
              { tamil: 'இது என்ன?', english: 'What is this?', say: 'idhu enna?', gloss: [['இது', 'this'], ['என்ன', 'what']] },
              { tamil: 'அது பால்', english: 'That is milk.', say: 'adhu paal', gloss: [['அது', 'that'], ['பால்', 'milk']] },
              {
                tamil: 'இது புத்தகம்',
                english: 'This is a book.',
                say: 'idhu puthagam',
                gloss: [['இது', 'this'], ['புத்தகம்', 'book']],
              },
            ],
          },
        ],
      },
      {
        id: 'sentences-2',
        title: 'Yes or no?',
        summary: 'இது வீடா?',
        steps: [
          {
            kind: 'teach',
            title: 'Add ஆ to ask',
            body:
              'To turn a sentence into a yes-or-no question, add ஆ (the ா sign) to the last word: இது வீடு becomes இது வீடா? "Is this a house?" A final ு sign is replaced by ா.\n\nA word ending in ம் drops the dot first: புத்தகம் becomes புத்தகமா? Answer with ஆமாம் (yes) or இல்லை (no).',
            examples: ['இது வீடா?', 'புத்தகமா?', 'ஆமாம்', 'இல்லை'],
          },
          {
            kind: 'read',
            items: [
              { tamil: 'இது வீடா?', english: 'Is this a house?', say: 'idhu veedaa?', gloss: [['இது', 'this'], ['வீடா', 'house?']] },
              { tamil: 'அது பாலா?', english: 'Is that milk?', say: 'adhu paalaa?', gloss: [['அது', 'that'], ['பாலா', 'milk?']] },
              {
                tamil: 'இது புத்தகமா?',
                english: 'Is this a book?',
                say: 'idhu puthagamaa?',
                gloss: [['இது', 'this'], ['புத்தகமா', 'book?']],
              },
              {
                tamil: 'ஆமாம், இது வீடு',
                english: 'Yes, this is a house.',
                say: 'aamaam, idhu veedu',
                spoken: 'ஆமா, இது வீடு',
                gloss: [['ஆமாம்', 'yes'], ['இது', 'this'], ['வீடு', 'house']],
              },
              {
                tamil: 'இல்லை, அது தண்ணீர்',
                english: 'No, that is water.',
                say: 'illai, adhu thanneer',
                spoken: 'இல்ல, அது தண்ணி',
                gloss: [['இல்லை', 'no'], ['அது', 'that'], ['தண்ணீர்', 'water']],
              },
            ],
          },
        ],
      },
      {
        id: 'sentences-3',
        title: 'Me and you',
        summary: 'நான் · நீங்கள் · அவர்',
        steps: [
          {
            kind: 'teach',
            title: 'Polite and familiar',
            body:
              'நான் is I and என் is my. For "you", use நீ with close friends and children, and நீங்கள் with elders and anyone you don\'t know well. உங்கள் is "your" (polite).\n\nFor he and she, அவன் and அவள் are familiar. அவர் is the polite word for either.',
            examples: ['நான்', 'நீ', 'நீங்கள்', 'அவர்'],
          },
          {
            kind: 'read',
            items: [
              {
                tamil: 'என் பெயர் மீனா',
                english: 'My name is Meena.',
                say: 'en peyar meenaa',
                spoken: 'என் பேரு மீனா',
                gloss: [['என்', 'my'], ['பெயர்', 'name'], ['மீனா', 'Meena']],
              },
              {
                tamil: 'உங்கள் பெயர் என்ன?',
                english: 'What is your name?',
                say: 'ungal peyar enna?',
                spoken: 'உங்க பேரு என்ன?',
                gloss: [['உங்கள்', 'your'], ['பெயர்', 'name'], ['என்ன', 'what']],
              },
              {
                tamil: 'நீங்கள் யார்?',
                english: 'Who are you?',
                say: 'neengal yaar?',
                spoken: 'நீங்க யாரு?',
                gloss: [['நீங்கள்', 'you'], ['யார்', 'who']],
              },
              {
                tamil: 'அவர் என் அப்பா',
                english: 'He is my father.',
                say: 'avar en appaa',
                gloss: [['அவர்', 'he (polite)'], ['என்', 'my'], ['அப்பா', 'father']],
              },
              {
                tamil: 'அவள் என் அக்கா',
                english: 'She is my older sister.',
                say: 'aval en akkaa',
                gloss: [['அவள்', 'she'], ['என்', 'my'], ['அக்கா', 'older sister']],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const LESSONS = UNITS.flatMap((u) => u.lessons);

export function getLesson(id: string | undefined) {
  return LESSONS.find((l) => l.id === id);
}

export function unitOf(lessonId: string) {
  return UNITS.find((u) => u.lessons.some((l) => l.id === lessonId));
}
