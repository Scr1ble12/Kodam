import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { WordCard } from '../components/WordCard';
import { Icon, IconButton, PrimaryButton, Screen, SecondaryButton, T } from '../components/ui';
import { deckOfWord, WORDS } from '../data/words';
import type { Word } from '../data/words';
import { useProgress } from '../lib/progress';
import type { Direction, LetterProgress } from '../lib/progress';
import { showRoman } from '../lib/roman';
import { useTheme } from '../lib/theme';
import { useToday, useVocab } from '../lib/vocab';

/** For words, letterToSound is Tamil → English and soundToLetter is English → Tamil. */
type Item = { key: string; word: Word; kind: 'intro' | 'quiz'; dir: Direction; retry?: number };

/** A deck study session asks about this many words, new ones included. */
const DECK_SESSION = 15;
const DECK_NEW = 5;
/** A missed word comes back this many cards later, at most twice. */
const RETRY_GAP = 3;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ask the direction not yet answered right; once both are, either. */
function directionFor(p: LetterProgress): Direction {
  if (!p.dirs.letterToSound) return 'letterToSound';
  if (!p.dirs.soundToLetter) return 'soundToLetter';
  return Math.random() < 0.5 ? 'letterToSound' : 'soundToLetter';
}

/**
 * Each new word gets an intro card, then a question a couple of cards later, with
 * review questions mixed in between so it isn't asked straight after being shown.
 */
function buildItems(fresh: Word[], review: Word[], get: (id: string) => LetterProgress): Item[] {
  const reviews: Item[] = review.map((w) => ({ key: `q-${w.id}`, word: w, kind: 'quiz', dir: directionFor(get(w.id)) }));
  const items: Item[] = [];
  const waiting: Item[] = [];
  for (const w of fresh) {
    items.push({ key: `i-${w.id}`, word: w, kind: 'intro', dir: 'letterToSound' });
    waiting.push({ key: `q-${w.id}`, word: w, kind: 'quiz', dir: 'letterToSound' });
    const r = reviews.shift();
    if (r) items.push(r);
    if (waiting.length >= 2) items.push(waiting.shift()!);
  }
  return [...items, ...waiting, ...reviews];
}

/** Three wrong answers from the same topic when possible, never sharing the right answer's text. */
function buildOptions(word: Word, dir: Direction): Word[] {
  const shown = (w: Word) => (dir === 'letterToSound' ? w.english : w.tamil);
  const topic = deckOfWord(word.id)?.words ?? [];
  const picked: Word[] = [];
  for (const w of [...shuffle(topic), ...shuffle(WORDS)]) {
    if (picked.length === 3) break;
    if (shown(w) !== shown(word) && !picked.some((p) => shown(p) === shown(w))) picked.push(w);
  }
  return shuffle([word, ...picked]);
}

function buzz(ok: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

/** A vocabulary session: `?today=1` for the daily review, or `?deck=<id>` to study one deck. */
export default function ReviewScreen() {
  const { colors, settings } = useTheme();
  const progress = useProgress();
  const { decks } = useVocab();
  const today = useToday();
  const params = useLocalSearchParams<{ today?: string; deck?: string }>();
  const deck = decks.find((d) => d.id === params.deck);

  const [items, setItems] = useState<Item[]>(() => {
    if (deck) {
      const get = (w: Word) => progress.get(w.id);
      const fresh = deck.words.filter((w) => get(w).seen === 0).slice(0, DECK_NEW);
      const review = deck.words
        .filter((w) => get(w).seen > 0)
        .sort((a, b) => get(a).due - get(b).due || get(a).rung - get(b).rung)
        .slice(0, Math.max(DECK_SESSION - fresh.length, 0));
      return buildItems(fresh, shuffle(review), progress.get);
    }
    return buildItems(today.fresh, today.due, progress.get);
  });
  const [index, setIndex] = useState(0);
  const [options, setOptions] = useState<Word[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [missed, setMissed] = useState<Word[]>([]);
  const [learned, setLearned] = useState(0);

  const item = items[index];
  const done = index >= items.length;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/vocabulary'));

  useEffect(() => {
    if (item?.kind === 'quiz') setOptions(buildOptions(item.word, item.dir));
    setPicked(null);
  }, [index, item?.key]);

  const next = () => setIndex((i) => i + 1);

  // A right answer moves on after a short look at the full card; a wrong one waits for Continue.
  useEffect(() => {
    if (!picked || !item || picked !== item.word.id) return;
    const t = setTimeout(next, 1400);
    return () => clearTimeout(t);
  }, [picked, item]);

  if (!deck && params.deck) return <Redirect href="/vocabulary" />;

  const answer = (choice: Word) => {
    if (!item || picked) return;
    const ok = choice.id === item.word.id;
    setPicked(choice.id);
    buzz(ok);
    progress.recordAnswer(item.word.id, item.dir, ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), asked: s.asked + 1 }));
    if (!ok) {
      setMissed((m) => (m.some((w) => w.id === item.word.id) ? m : [...m, item.word]));
      const tries = item.retry ?? 0;
      if (tries < 2) {
        setItems((xs) => {
          const copy = [...xs];
          copy.splice(Math.min(index + 1 + RETRY_GAP, copy.length), 0, {
            ...item,
            key: `${item.key}-r${tries + 1}`,
            retry: tries + 1,
          });
          return copy;
        });
      }
    }
  };

  const title = deck ? deck.name : "Today's review";

  if (items.length === 0) {
    return (
      <Screen>
        <View style={[styles.column, styles.summary]}>
          <T size={30} weight="bold" style={{ lineHeight: 38 }}>
            Nothing due right now
          </T>
          <T size={15} tone="muted">
            {today.activeCount === 0
              ? 'Turn on a deck on the Vocabulary tab to start getting daily reviews.'
              : "You've done today's words. Study a deck if you want more."}
          </T>
          <View style={{ flex: 1 }} />
          <PrimaryButton label="Back to decks" onPress={close} />
        </View>
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <View style={[styles.column, styles.summary]}>
          <T size={13} tone="muted">
            {title} · complete
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 38 }}>
            {score.right} of {score.asked} right
          </T>
          {learned > 0 && (
            <T size={15} tone="muted">
              {learned} new {learned === 1 ? 'word' : 'words'} learned.
            </T>
          )}
          {missed.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <T size={13} tone="muted">
                Worth another look
              </T>
              {missed.map((w) => (
                <View key={w.id} style={[styles.missedRow, { borderTopColor: colors.line }]}>
                  <T size={20}>{w.tamil}</T>
                  <T size={14} tone="muted">
                    {w.english}
                  </T>
                </View>
              ))}
            </View>
          )}
          <View style={{ flex: 1 }} />
          <SecondaryButton label="Done" onPress={close} />
        </View>
      </Screen>
    );
  }

  const isRight = picked === item.word.id;
  const wasWrong = !!picked && !isRight;
  const tamilToEnglish = item.dir === 'letterToSound';
  const stage = progress.stage(item.word.id);

  return (
    <Screen>
      <View style={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close review" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View style={[styles.fill, { backgroundColor: colors.accent, width: `${(index / items.length) * 100}%` }]} />
          </View>
          <T size={14} tone="muted">
            {index + 1} / {items.length}
          </T>
        </View>

        {item.kind === 'intro' ? (
          <>
            <T size={13} weight="medium" tone="accent">
              NEW WORD · {title}
            </T>
            <ScrollView
              style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}
              contentContainerStyle={styles.promptInner}
            >
              <WordCard word={item.word} />
            </ScrollView>
            <PrimaryButton
              label="Got it"
              onPress={() => {
                setLearned((n) => n + 1);
                next();
              }}
            />
          </>
        ) : (
          <>
            <T size={13} weight="medium" tone="muted">
              {tamilToEnglish ? 'What does this mean?' : 'How do you say this in Tamil?'}
            </T>
            <ScrollView
              style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}
              contentContainerStyle={styles.promptInner}
            >
              {picked ? (
                <WordCard word={item.word} compact />
              ) : tamilToEnglish ? (
                <>
                  <T size={44} weight="medium" style={{ textAlign: 'center' }}>
                    {item.word.tamil}
                  </T>
                  {settings.spoken === 'both' && item.word.spoken && (
                    <T size={16} tone="muted">
                      spoken: {item.word.spoken}
                    </T>
                  )}
                  {showRoman(settings.roman, stage) && (
                    <T size={14} tone="muted">
                      {item.word.roman}
                    </T>
                  )}
                </>
              ) : (
                <T size={32} weight="bold" style={{ textAlign: 'center' }}>
                  {item.word.english}
                </T>
              )}
            </ScrollView>

            <View style={styles.options}>
              {options.map((o) => {
                const gotIt = isRight && o.id === item.word.id;
                const missedIt = wasWrong && o.id === item.word.id;
                const isWrongPick = picked === o.id && o.id !== item.word.id;
                return (
                  <Pressable
                    key={o.id}
                    accessibilityRole="button"
                    accessibilityLabel={tamilToEnglish ? o.english : o.tamil}
                    onPress={() => answer(o)}
                    style={[
                      styles.option,
                      { backgroundColor: colors.surface, borderColor: colors.line },
                      gotIt && { backgroundColor: colors.success, borderColor: colors.success, borderWidth: 1.5 },
                      missedIt && { backgroundColor: colors.successBg, borderColor: colors.success, borderWidth: 1.5 },
                      isWrongPick && { backgroundColor: colors.errorBg, borderColor: colors.error, borderWidth: 1.5 },
                    ]}
                  >
                    <T
                      size={tamilToEnglish ? 16 : 20}
                      weight="medium"
                      tone={isWrongPick ? 'error' : 'ink'}
                      style={[
                        { textAlign: 'center' },
                        gotIt ? { color: '#FFFFFF' } : missedIt ? { color: colors.successInk } : undefined,
                      ]}
                    >
                      {tamilToEnglish ? o.english : o.tamil}
                    </T>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ minHeight: 52, justifyContent: 'center' }}>
              {wasWrong && <PrimaryButton label="Continue" onPress={next} />}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  prompt: { flex: 1, borderRadius: 24, borderWidth: 1 },
  promptInner: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 20 },
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
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  missedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
});
