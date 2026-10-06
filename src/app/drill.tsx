import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarksSheet } from '../components/MarksSheet';
import { TracePanel } from '../components/TracePanel';
import { Icon, IconButton, PrimaryButton, SecondaryButton, T } from '../components/ui';
import { confusablesOf, getLetter, LETTERS } from '../data/letters';
import type { Letter } from '../data/letters';
import { pickNext, useProgress } from '../lib/progress';
import type { Direction } from '../lib/progress';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';

type Mode = Direction | 'trace';

const MODES: { id: Mode; label: string }[] = [
  { id: 'letterToSound', label: 'Letter → Sound' },
  { id: 'soundToLetter', label: 'Sound → Letter' },
  { id: 'trace', label: 'Trace' },
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
  Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(
    () => {},
  );
}

export default function DrillScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { height } = useWindowDimensions();
  const { ids, mode: startMode } = useLocalSearchParams<{ ids?: string; mode?: Mode }>();
  const pool = useMemo(() => (ids ?? '').split(',').map(getLetter).filter((l): l is Letter => !!l), [ids]);
  const total = Math.min(20, Math.max(10, pool.length * 2));

  const [mode, setMode] = useState<Mode>(startMode ?? 'letterToSound');
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
    if (!question && pool.length) setQuestion(makeQuestion(0));
  }, [pool]);

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

  const answer = (choice: Letter) => {
    if (!question || picked || mode === 'trace') return;
    const ok = choice.id === question.letter.id;
    setPicked(choice.id);
    buzz(ok);
    progress.recordAnswer(question.letter.id, mode, ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), asked: s.asked + 1 }));
    setInARow((k) => (ok ? k + 1 : 0));
    if (!ok) {
      setMissed((m) => (m.includes(question.letter.id) ? m : [...m, question.letter.id]));
      setRetry((rs) => [...rs, { id: question.letter.id, at: answered + 1 + RETRY_GAP }]);
    }
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
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
        <View style={[styles.column, styles.summary]}>
          <T size={13} tone="muted">
            Session complete
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 38 }}>
            {score.asked ? `${score.right} of ${score.asked} right` : 'Nice tracing'}
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
          <SecondaryButton label="Done" onPress={close} />
        </View>
      </SafeAreaView>
    );
  }

  if (!question) return null;
  const { letter, options } = question;
  const wasWrong = !!picked && picked !== letter.id;
  const lookalikes = confusablesOf(letter.id).map(getLetter);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
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

        <View style={styles.modes}>
          {MODES.map((m) => {
            const on = m.id === mode;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  if (on || picked) return;
                  setMode(m.id);
                }}
                style={[styles.chip, on ? { backgroundColor: colors.ink } : { borderWidth: 1, borderColor: colors.line }]}
              >
                <T size={13} style={{ color: on ? colors.bg : colors.muted }}>
                  {m.label}
                </T>
              </Pressable>
            );
          })}
        </View>

        {mode === 'trace' ? (
          <TracePanel
            key={`${question.n}-${letter.id}`}
            letter={letter}
            reserve={430}
            nextLabel="Continue"
            onNext={advance}
          />
        ) : (
          <>
            <View style={[styles.prompt, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.speaker}>
                <IconButton bordered label="Play sound" onPress={() => speakTamil(letter.tamil)}>
                  <Icon.Speaker color={colors.ink} />
                </IconButton>
              </View>
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
                  {lookalikes.length ? `Confusable set: ${[letter, ...lookalikes].map((l) => l?.tamil).join(' · ')}` : ' '}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, minHeight: 32, borderRadius: 999, justifyContent: 'center' },
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
