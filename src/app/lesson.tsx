import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, IconButton, PrimaryButton, Screen, SecondaryButton, T } from '../components/ui';
import { getLesson, LESSONS, unitOf } from '../data/lessons';
import type { Lesson, ReadItem, Step } from '../data/lessons';
import { confusablesOf, getLetter, LETTERS, splitLetters } from '../data/letters';
import type { Letter } from '../data/letters';
import { getWord } from '../data/words';
import { useLessons } from '../lib/lessons';
import { useProgress } from '../lib/progress';
import type { Direction } from '../lib/progress';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';
import { useUnlock } from '../lib/unlock';

/** A read item with everything filled in from the vocabulary when it names a word. */
type Reading = {
  key: string;
  tamil: string;
  english: string;
  say: string;
  spoken?: string;
  gloss?: [string, string][];
  wordId?: string;
};

type Card =
  | { key: string; kind: 'teach'; step: Extract<Step, { kind: 'teach' }> }
  | { key: string; kind: 'letter'; letter: Letter }
  | { key: string; kind: 'quiz'; letter: Letter; dir: Direction; options: Letter[]; retry?: boolean }
  | { key: string; kind: 'build'; consonant: Letter; vowel: Letter; answer: Letter; options: Letter[]; retry?: boolean }
  | { key: string; kind: 'read'; item: Reading; options: string[]; retry?: boolean };

/** A missed question comes back this many cards later, once. */
const RETRY_GAP = 3;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const letters = (ids: string[]) => ids.map(getLetter).filter((l): l is Letter => !!l);

/** Three wrong answers: look-alikes first, then others from the lesson, then the same kind of letter. */
function letterOptions(answer: Letter, pool: Letter[]): Letter[] {
  const sameKind = LETTERS.filter((l) =>
    answer.group === 'compound' ? l.group === 'compound' && l.consonant === answer.consonant : l.group === answer.group,
  );
  const picked: Letter[] = [];
  for (const l of [...letters(confusablesOf(answer.id)), ...shuffle(pool), ...shuffle(sameKind)]) {
    if (picked.length === 3) break;
    if (l.id !== answer.id && !picked.some((p) => p.id === l.id)) picked.push(l);
  }
  return shuffle([answer, ...picked]);
}

function resolve(item: ReadItem, i: number): Reading | undefined {
  if ('word' in item) {
    const w = getWord(item.word);
    return w && { key: w.id, tamil: w.tamil, english: w.english, say: w.say, spoken: w.spoken, wordId: w.id };
  }
  return { key: `r${i}-${item.tamil}`, ...item };
}

/** Turns a lesson's steps into the cards the player shows, in order. */
function buildCards(lesson: Lesson): Card[] {
  const cards: Card[] = [];
  lesson.steps.forEach((step, s) => {
    const key = (x: string | number) => `${s}-${x}`;
    if (step.kind === 'teach') cards.push({ key: key('t'), kind: 'teach', step });
    if (step.kind === 'letters') {
      for (const l of letters(step.ids)) cards.push({ key: key(l.id), kind: 'letter', letter: l });
    }
    if (step.kind === 'quiz') {
      const pool = letters(step.ids);
      let order: Letter[] = [];
      for (let n = 0; n < step.count; n++) {
        if (!order.length) order = shuffle(pool);
        const letter = order.pop()!;
        // Alternate directions so both get practice.
        const dir: Direction = n % 2 === 0 ? 'letterToSound' : 'soundToLetter';
        cards.push({ key: key(`q${n}`), kind: 'quiz', letter, dir, options: letterOptions(letter, pool) });
      }
    }
    if (step.kind === 'build') {
      const vowels = step.pairs.map(([, v]) => v);
      for (const [c, v] of step.pairs) {
        const consonant = getLetter(c);
        const vowel = getLetter(v);
        const answer = getLetter(`${c}_${v}`);
        if (!consonant || !vowel || !answer) continue;
        const pool = letters([...vowels, 'a', 'aa', 'i', 'ii', 'e', 'ee'].map((x) => `${c}_${x}`));
        cards.push({ key: key(`b${c}${v}`), kind: 'build', consonant, vowel, answer, options: letterOptions(answer, pool) });
      }
    }
    if (step.kind === 'read') {
      const items = step.items.map(resolve).filter((r): r is Reading => !!r);
      for (const item of items) {
        const others = shuffle(items.filter((x) => x.english !== item.english).map((x) => x.english)).slice(0, 3);
        cards.push({ key: key(item.key), kind: 'read', item, options: shuffle([item.english, ...others]) });
      }
    }
  });
  return cards;
}

function buzz(ok: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

/** Plays one lesson: `?id=<lesson id>`. */
export default function LessonScreen() {
  const { colors, settings } = useTheme();
  const progress = useProgress();
  const lessons = useLessons();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = getLesson(id);
  const { isLessonLocked } = useUnlock();

  const [cards, setCards] = useState<Card[]>(() => (lesson ? buildCards(lesson) : []));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const saved = useRef(false);

  const card = cards[index];
  const done = !!lesson && index >= cards.length;
  const nextLesson = useMemo(() => {
    const i = LESSONS.findIndex((l) => l.id === id);
    return i >= 0 ? LESSONS[i + 1] : undefined;
  }, [id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/lessons'));
  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    if (!done || saved.current || !lesson) return;
    saved.current = true;
    lessons.complete(lesson.id, score.right, score.asked);
  }, [done]);

  // A right answer moves on after a short look; a wrong one waits for Continue.
  const correctKey = card && answerKey(card);
  useEffect(() => {
    if (!picked || picked !== correctKey) return;
    const t = setTimeout(next, 1300);
    return () => clearTimeout(t);
  }, [picked, correctKey]);

  if (!lesson) return <Redirect href="/lessons" />;
  if (isLessonLocked(lesson.id)) return <Redirect href="/unlock" />;
  const unit = unitOf(lesson.id);

  const answer = (choice: string) => {
    if (!card || picked || card.kind === 'teach' || card.kind === 'letter') return;
    const ok = choice === correctKey;
    setPicked(choice);
    buzz(ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), asked: s.asked + 1 }));
    if (card.kind === 'quiz') progress.recordAnswer(card.letter.id, card.dir, ok);
    if (card.kind === 'build') progress.recordAnswer(card.answer.id, 'soundToLetter', ok);
    if (card.kind === 'read' && card.item.wordId) progress.recordAnswer(card.item.wordId, 'letterToSound', ok);
    if (!ok && !card.retry) {
      setCards((xs) => {
        const copy = [...xs];
        copy.splice(Math.min(index + 1 + RETRY_GAP, copy.length), 0, { ...card, key: `${card.key}-r`, retry: true });
        return copy;
      });
    }
  };

  if (done) {
    return (
      <Screen>
        <View style={[styles.column, styles.summary]}>
          <T size={13} tone="muted">
            {unit?.title} · lesson complete
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 38 }}>
            {lesson.title}
          </T>
          {score.asked > 0 && (
            <T size={17} tone="muted">
              {score.right} of {score.asked} answers right.
            </T>
          )}
          <T size={15} tone="muted">
            What you practiced here now shows up in your reviews, so it sticks.
          </T>
          <View style={{ flex: 1 }} />
          {nextLesson ? (
            <>
              <PrimaryButton
                label={isLessonLocked(nextLesson.id) ? 'Unlock the next lessons' : `Next: ${nextLesson.title}`}
                onPress={() =>
                  isLessonLocked(nextLesson.id)
                    ? router.replace('/unlock')
                    : router.replace({ pathname: '/lesson', params: { id: nextLesson.id } })
                }
              />
              <SecondaryButton label="All lessons" onPress={close} />
            </>
          ) : (
            <>
              <T size={15}>That's every lesson so far. More are on the way.</T>
              <PrimaryButton label="All lessons" onPress={close} />
            </>
          )}
        </View>
      </Screen>
    );
  }

  const isRight = !!picked && picked === correctKey;
  const wasWrong = !!picked && !isRight;

  const optionStyle = (key: string) => {
    const gotIt = isRight && key === correctKey;
    const missedIt = wasWrong && key === correctKey;
    const wrongPick = wasWrong && key === picked;
    return {
      box: [
        styles.option,
        { backgroundColor: colors.surface, borderColor: colors.line },
        gotIt && { backgroundColor: colors.success, borderColor: colors.success, borderWidth: 1.5 },
        missedIt && { backgroundColor: colors.successBg, borderColor: colors.success, borderWidth: 1.5 },
        wrongPick && { backgroundColor: colors.errorBg, borderColor: colors.error, borderWidth: 1.5 },
      ],
      text: gotIt ? { color: '#FFFFFF' } : missedIt ? { color: colors.successInk } : wrongPick ? { color: colors.error } : undefined,
    };
  };

  const options = (items: { key: string; label: string; tamil?: boolean }[]) => (
    <View style={styles.options}>
      {items.map((o) => {
        const s = optionStyle(o.key);
        return (
          <Pressable key={o.key} accessibilityRole="button" accessibilityLabel={o.label} onPress={() => answer(o.key)} style={s.box}>
            <T size={o.tamil ? 26 : 16} weight="medium" style={[{ textAlign: 'center' }, s.text]}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );

  const footer = (
    <View style={{ minHeight: 52, justifyContent: 'center' }}>
      {wasWrong && <PrimaryButton label="Continue" onPress={next} />}
    </View>
  );

  const speaker = (text: string, label = 'Play') => (
    <IconButton bordered label={label} onPress={() => speakTamil(text)}>
      <Icon.Speaker color={colors.ink} />
    </IconButton>
  );

  let body: ReactNode = null;

  if (card.kind === 'teach') {
    body = (
      <>
        <ScrollView
          style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}
          contentContainerStyle={styles.teachInner}
        >
          <T size={24} weight="bold">
            {card.step.title}
          </T>
          {card.step.body.split('\n\n').map((p, i) => (
            <T key={i} size={16} style={{ lineHeight: 24 }}>
              {p}
            </T>
          ))}
          {card.step.examples && (
            <View style={styles.examples}>
              {card.step.examples.map((ex) => (
                <Pressable
                  key={ex}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${ex}`}
                  onPress={() => speakTamil(ex)}
                  style={({ pressed }) => [styles.example, { backgroundColor: colors.track, opacity: pressed ? 0.7 : 1 }]}
                >
                  <T size={ex.length > 3 ? 20 : 30} weight="medium">
                    {ex}
                  </T>
                  <Icon.Speaker color={colors.muted} size={14} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        <PrimaryButton label="Continue" onPress={next} />
      </>
    );
  }

  if (card.kind === 'letter') {
    const l = card.letter;
    body = (
      <>
        <T size={13} weight="medium" tone="accent">
          NEW LETTER
        </T>
        <View style={[styles.prompt, styles.promptInner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={96} weight="medium" style={{ lineHeight: 120 }}>
            {l.tamil}
          </T>
          <T size={26} weight="bold">
            {l.roman}
          </T>
          <T size={15} tone="muted" style={{ textAlign: 'center' }}>
            {l.hint}
          </T>
          <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
            {speaker(l.tamil, `Play ${l.tamil}`)}
            <SecondaryButton style={{ minHeight: 44 }} label="Trace it" onPress={() => router.push({ pathname: '/trace', params: { ids: l.id } })} />
          </View>
        </View>
        <PrimaryButton label="Got it" onPress={next} />
      </>
    );
  }

  if (card.kind === 'quiz') {
    const l = card.letter;
    const toSound = card.dir === 'letterToSound';
    body = (
      <>
        <T size={13} weight="medium" tone="muted">
          {toSound ? 'How does this letter sound?' : 'Which letter makes this sound?'}
        </T>
        <View style={[styles.prompt, styles.promptInner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {toSound ? (
            <T size={88} weight="medium" style={{ lineHeight: 112 }}>
              {l.tamil}
            </T>
          ) : (
            <>
              <T size={44} weight="bold">
                {l.roman}
              </T>
              <T size={14} tone="muted" style={{ textAlign: 'center' }}>
                {l.hint}
              </T>
            </>
          )}
          {picked && (
            <T size={15} tone="muted" style={{ textAlign: 'center' }}>
              {l.tamil} · {l.roman}
            </T>
          )}
          {(picked || !toSound) && <View style={{ marginTop: 6 }}>{speaker(l.tamil)}</View>}
        </View>
        {options(card.options.map((o) => ({ key: o.id, label: toSound ? o.roman : o.tamil, tamil: !toSound })))}
        {footer}
      </>
    );
  }

  if (card.kind === 'build') {
    body = (
      <>
        <T size={13} weight="medium" tone="muted">
          Put them together
        </T>
        <View style={[styles.prompt, styles.promptInner, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.equation}>
            <T size={56} weight="medium">
              {card.consonant.tamil}
            </T>
            <T size={32} tone="muted">
              +
            </T>
            <T size={56} weight="medium">
              {card.vowel.tamil}
            </T>
            <T size={32} tone="muted">
              =
            </T>
            <T size={56} weight="medium" tone={picked ? 'accent' : 'muted'}>
              {picked ? card.answer.tamil : '?'}
            </T>
          </View>
          <T size={15} tone="muted">
            {card.consonant.roman} + {card.vowel.roman} = {picked ? card.answer.roman : '…'}
          </T>
          {picked && <View style={{ marginTop: 6 }}>{speaker(card.answer.tamil)}</View>}
        </View>
        {options(card.options.map((o) => ({ key: o.id, label: o.tamil, tamil: true })))}
        {footer}
      </>
    );
  }

  if (card.kind === 'read') {
    const item = card.item;
    const long = item.tamil.length > 10;
    body = (
      <>
        <T size={13} weight="medium" tone="muted">
          {item.gloss ? 'What does this sentence mean?' : 'Read it. What does it mean?'}
        </T>
        <ScrollView
          style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}
          contentContainerStyle={styles.promptInner}
        >
          <T size={long ? 32 : 48} weight="medium" style={{ textAlign: 'center' }}>
            {item.tamil}
          </T>
          {settings.spoken === 'both' && item.spoken && (
            <T size={15} tone="muted">
              spoken: {item.spoken}
            </T>
          )}
          {picked && (
            <>
              <T size={15} tone="muted">
                say “{item.say}”
              </T>
              {item.gloss ? (
                <View style={styles.gloss}>
                  {item.gloss.map(([ta, en], i) => (
                    <View key={i} style={[styles.glossWord, { backgroundColor: colors.track }]}>
                      <T size={17} weight="medium">
                        {ta}
                      </T>
                      <T size={12} tone="muted">
                        {en}
                      </T>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.gloss}>
                  {splitLetters(item.tamil).map((p, i) => (
                    <View key={i} style={[styles.glossWord, { backgroundColor: colors.track }]}>
                      <T size={20} weight="medium">
                        {p.text}
                      </T>
                      <T size={12} tone="muted">
                        {p.letter?.roman ?? ''}
                      </T>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ marginTop: 6 }}>{speaker(item.spoken ?? item.tamil)}</View>
            </>
          )}
        </ScrollView>
        {options(card.options.map((o) => ({ key: o, label: o })))}
        {footer}
      </>
    );
  }

  return (
    <Screen>
      <View style={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close lesson" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View style={[styles.fill, { backgroundColor: colors.accent, width: `${(index / cards.length) * 100}%` }]} />
          </View>
        </View>
        {body}
      </View>
    </Screen>
  );
}

/** The option key that answers a question card. */
function answerKey(card: Card): string | undefined {
  if (card.kind === 'quiz') return card.letter.id;
  if (card.kind === 'build') return card.answer.id;
  if (card.kind === 'read') return card.item.english;
  return undefined;
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  prompt: { flex: 1, borderRadius: 24, borderWidth: 1 },
  promptInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
  teachInner: { flexGrow: 1, justifyContent: 'center', gap: 14, padding: 24 },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  example: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 56, paddingHorizontal: 16, borderRadius: 14 },
  equation: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gloss: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 },
  glossWord: { alignItems: 'center', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, minWidth: 44 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summary: { gap: 14, paddingTop: 40 },
});
