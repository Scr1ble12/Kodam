import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { MarksSheet } from '../components/MarksSheet';
import { TracePanel } from '../components/TracePanel';
import { Icon, IconButton, PrimaryButton, Screen, SecondaryButton, T } from '../components/ui';
import { confusablesOf, getLetter, LETTERS } from '../data/letters';
import type { Letter } from '../data/letters';
import { pickNext, useProgress } from '../lib/progress';
import type { Direction } from '../lib/progress';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';

type Mode = Direction | 'trace';

const MODES: { id: Mode; label: string; detail: string }[] = [
  { id: 'letterToSound', label: 'Letter → Sound', detail: 'See a Tamil letter, pick its sound' },
  { id: 'soundToLetter', label: 'Sound → Letter', detail: 'See and hear a sound, pick its letter' },
  { id: 'trace', label: 'Trace', detail: 'See a sound, write the letter from memory' },
];

type Question = { n: number; letter: Letter; options: Letter[] };

/** A missed letter comes back this many questions later. */
const RETRY_GAP = 3;

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Three wrong answers: look-alike sounds first, then other drilled letters, then the rest of the group. */
function buildOptions(target: Letter, pool: Letter[]): Letter[] {
  const sameKind = (l: Letter) => (l.group === 'consonant') === (target.group === 'consonant');
  const confusable = confusablesOf(target.id)
    .map(getLetter)
    .filter((l): l is Letter => !!l);
  const rest = [...shuffle(pool.filter(sameKind)), ...shuffle(LETTERS.filter(sameKind))];
  const picked: Letter[] = [];
  for (const l of [...shuffle(confusable).slice(0, 2), ...rest]) {
    if (picked.length === 3) break;
    if (l.id !== target.id && !picked.some((p) => p.id === l.id)) picked.push(l);
  }
  return shuffle([target, ...picked]);
}

function buzz(ok: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(
    ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
}

export default function DrillScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { height } = useWindowDimensions();
  const { ids, mode: startMode } = useLocalSearchParams<{ ids?: string; mode?: Mode }>();
  const pool = useMemo(
    () =>
      (ids ?? '')
        .split(',')
        .map(getLetter)
        .filter((l): l is Letter => !!l),
    [ids],
  );
  const total = Math.min(20, Math.max(10, pool.length * 2));

  // The quiz type is picked once before the session starts and stays fixed.
  const [mode, setMode] = useState<Mode | null>(startMode ?? null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  const [inARow, setInARow] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [retry, setRetry] = useState<{ id: string; at: number }[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const done = answered >= total;

  const makeQuestion = (n: number, avoid?: string): Question => {
    const due = retry.find((r) => r.at <= n && r.id !== avoid);
    const letter = (due && getLetter(due.id)) || pickNext(pool, progress.get, avoid);
    if (due) setRetry((rs) => rs.filter((r) => r !== due));
    return { n, letter, options: buildOptions(letter, pool) };
  };

  useEffect(() => {
    if (mode && !question && pool.length) setQuestion(makeQuestion(0));
  }, [pool, mode]);

  const advance = () => {
    const n = answered + 1;
    setAnswered(n);
    setPicked(null);
    if (n < total) setQuestion(makeQuestion(n, question?.letter.id));
  };

  // A right answer moves on by itself after a beat; a wrong one waits for Continue.
  useEffect(() => {
    if (!picked || !question || picked !== question.letter.id) return;
    const t = setTimeout(advance, 900);
    return () => clearTimeout(t);
  }, [picked, question]);

  if (!pool.length) return <Redirect href="/" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const scoreAnswer = (ok: boolean) => {
    if (!question) return;
    buzz(ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), asked: s.asked + 1 }));
    setInARow((k) => (ok ? k + 1 : 0));
    if (!ok) {
      setMissed((m) => (m.includes(question.letter.id) ? m : [...m, question.letter.id]));
      setRetry((rs) => [...rs, { id: question.letter.id, at: answered + 1 + RETRY_GAP }]);
    }
  };

  const answer = (choice: Letter) => {
    if (!question || picked || !mode || mode === 'trace') return;
    const ok = choice.id === question.letter.id;
    setPicked(choice.id);
    progress.recordAnswer(question.letter.id, mode, ok);
    scoreAnswer(ok);
  };

  const restart = () => {
    setAnswered(0);
    setScore({ right: 0, asked: 0 });
    setInARow(0);
    setMissed([]);
    setRetry([]);
    setPicked(null);
    setQuestion(makeQuestion(0));
  };

  if (done) {
    return (
      <Screen>
        <View style={[styles.column, styles.summary]}>
          <T size={13} tone="muted">
            Session complete
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 38 }}>
            {score.right} of {score.asked} right
          </T>
          {missed.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <T size={13} tone="muted">
                Worth another look
              </T>
              <View style={styles.missed}>
                {missed.map(getLetter).map(
                  (l) =>
                    l && (
                      <View key={l.id} style={styles.missedItem}>
                        <T size={30}>{l.tamil}</T>
                        <T size={12} tone="muted">
                          {l.roman}
                        </T>
                      </View>
                    ),
                )}
              </View>
            </View>
          ) : (
            score.asked > 0 && (
              <T size={15} tone="muted">
                No misses this time.
              </T>
            )
          )}
          <View style={{ flex: 1 }} />
          <PrimaryButton label="Practice again" onPress={restart} />
          <SecondaryButton
            label="Change quiz type"
            onPress={() => {
              restart();
              setQuestion(null);
              setMode(null);
            }}
          />
          <SecondaryButton label="Done" onPress={close} />
        </View>
      </Screen>
    );
  }

  if (!mode) {
    return (
      <Screen>
        <View style={styles.column}>
          <View style={styles.top}>
            <IconButton label="Close" onPress={close}>
              <Icon.Close color={colors.ink} />
            </IconButton>
          </View>
          <View>
            <T size={13} tone="muted">
              {pool.length} {pool.length === 1 ? 'letter' : 'letters'} · {total} questions
            </T>
            <T size={28} weight="bold" style={{ lineHeight: 36 }}>
              How do you want to practice?
            </T>
          </View>
          {MODES.map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              onPress={() => setMode(m.id)}
              style={({ pressed }) => [
                styles.modeCard,
                { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <T size={18} weight="medium">
                {m.label}
              </T>
              <T size={14} tone="muted">
                {m.detail}
              </T>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  if (!question) return null;
  const { letter, options } = question;
  const modeLabel = MODES.find((m) => m.id === mode)!.label;
  const wasWrong = !!picked && picked !== letter.id;
  const lookalikes = confusablesOf(letter.id).map(getLetter);

  return (
    <Screen>
      <View style={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close drill" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View style={[styles.fill, { backgroundColor: colors.accent, width: `${(answered / total) * 100}%` }]} />
          </View>
          <T size={14} tone="muted">
            {answered + 1} / {total}
          </T>
        </View>

        <T size={13} weight="medium" tone="muted">
          {modeLabel}
        </T>

        {mode === 'trace' ? (
          <TracePanel
            key={`${question.n}-${letter.id}`}
            letter={letter}
            reserve={430}
            quiz
            onAnswer={scoreAnswer}
            nextLabel="Continue"
            onNext={advance}
          />
        ) : (
          <>
            <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {mode === 'soundToLetter' && (
                <View style={styles.speaker}>
                  <IconButton bordered label="Play sound" onPress={() => speakTamil(letter.tamil)}>
                    <Icon.Speaker color={colors.ink} />
                  </IconButton>
                </View>
              )}
              <T size={13} tone="muted">
                {mode === 'letterToSound' ? 'What sound is this?' : 'Which letter makes this sound?'}
              </T>
              {mode === 'letterToSound' ? (
                <T size={Math.min(132, height * 0.14)} weight="medium">
                  {letter.tamil}
                </T>
              ) : (
                <T size={Math.min(88, height * 0.1)} weight="medium">
                  {letter.roman}
                </T>
              )}
              {picked && (
                <T size={14} tone="muted" style={styles.feedback}>
                  {letter.tamil} ({letter.roman}): {letter.hint}
                </T>
              )}
            </View>

            <View style={styles.options}>
              {options.map((o) => {
                const isAnswer = picked && o.id === letter.id;
                const isWrongPick = picked === o.id && o.id !== letter.id;
                return (
                  <Pressable
                    key={o.id}
                    accessibilityRole="button"
                    accessibilityLabel={mode === 'letterToSound' ? o.roman : o.tamil}
                    onPress={() => answer(o)}
                    style={[
                      styles.option,
                      { backgroundColor: colors.surface, borderColor: colors.line },
                      isAnswer && { backgroundColor: colors.accent, borderColor: colors.accent, borderWidth: 1.5 },
                      isWrongPick && { backgroundColor: colors.errorBg, borderColor: colors.error, borderWidth: 1.5 },
                    ]}
                  >
                    <T
                      size={mode === 'letterToSound' ? 22 : 34}
                      weight="medium"
                      tone={isAnswer ? 'onAccent' : isWrongPick ? 'error' : 'ink'}
                    >
                      {mode === 'letterToSound' ? o.roman : o.tamil}
                    </T>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setGuideOpen(true)}
              style={[styles.guideLink, wasWrong && { backgroundColor: colors.track }]}
            >
              <Icon.Info color={colors.accent} />
              <T size={14} weight="medium" tone="accent">
                Dots and lines confusing? See what they mean
              </T>
            </Pressable>

            {wasWrong ? (
              <PrimaryButton label="Continue" onPress={advance} />
            ) : (
              <View style={styles.footer}>
                <T size={13} tone="muted">
                  {lookalikes.length
                    ? `Confusable set: ${[letter, ...lookalikes].map((l) => l?.tamil).join(' · ')}`
                    : ' '}
                </T>
                <T size={13} tone="muted">
                  {inARow >= 2 ? `${inARow} in a row` : ' '}
                </T>
              </View>
            )}
          </>
        )}
      </View>
      <MarksSheet visible={guideOpen} letters={options} onClose={() => setGuideOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  modeCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 2, minHeight: 72, justifyContent: 'center' },
  prompt: {
    flex: 1,
    minHeight: 220,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  speaker: { position: 'absolute', right: 16, top: 16 },
  feedback: { textAlign: 'center', paddingHorizontal: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    width: '48.5%',
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLink: {
    alignSelf: 'center',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 52, alignItems: 'center' },
  summary: { gap: 14, paddingTop: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  missed: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  missedItem: { alignItems: 'center' },
});
