import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { GLYPHS } from '../data/glyphs.generated';
import type { Letter } from '../data/letters';
import { TRACE_STEPS, useProgress } from '../lib/progress';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';
import { PASS_STARS, scoreTrace } from '../lib/tracing';
import type { Stroke, TraceResult } from '../lib/tracing';
import { TraceCanvas } from './TraceCanvas';
import type { GuideLevel } from './TraceCanvas';
import { Icon, IconButton, PrimaryButton, SecondaryButton, T } from './ui';

const STEPS: { label: string; guide: GuideLevel; prompt: string }[] = [
  { label: 'Trace', guide: 'full', prompt: 'Trace over the letter' },
  { label: 'Outline', guide: 'faint', prompt: 'Trace the faint outline' },
  { label: 'Memory', guide: 'none', prompt: 'Write it from memory' },
];

const VERDICT = ['Not quite. Try again', 'Getting there', 'Nice tracing', 'Excellent'];

/**
 * One letter's tracing exercise.
 *
 * Practice: the learner starts at the first step they haven't passed; passing a
 * step (2+ stars) unlocks the next one.
 *
 * Quiz: the learner only gets the sound and writes the letter from memory.
 * After checking, the letter is revealed, and they can choose to practice it
 * through all three steps.
 */
export function TracePanel({
  letter,
  onNext,
  nextLabel,
  reserve,
  quiz,
  onAnswer,
}: {
  letter: Letter;
  onNext: () => void;
  nextLabel: string;
  /** Vertical px the surrounding screen and the panel's own controls need. */
  reserve: number;
  quiz?: boolean;
  /** Quiz only: called once with whether the letter was written well enough. */
  onAnswer?: (ok: boolean) => void;
}) {
  const { colors } = useTheme();
  const progress = useProgress();
  const [phase, setPhase] = useState<'quiz' | 'practice'>(quiz ? 'quiz' : 'practice');
  // Practice started from a quiz walks every step from the start.
  const [reached, setReached] = useState(quiz ? 0 : progress.get(letter.id).traceStep);
  const passed = Math.min(reached, TRACE_STEPS - 1);
  const [step, setStep] = useState(quiz ? TRACE_STEPS - 1 : passed);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [result, setResult] = useState<TraceResult | null>(null);
  const glyph = GLYPHS[letter.id];
  const { width, height } = useWindowDimensions();
  // Leave room above and below the canvas for the controls on short phones.
  const side = Math.max(220, Math.min(width - 40, 520, height - reserve));

  const restart = (nextStep = step) => {
    setStep(nextStep);
    setStrokes([]);
    setResult(null);
  };

  const check = () => {
    const r = scoreTrace(glyph, strokes);
    setResult(r);
    const ok = r.stars >= PASS_STARS;
    if (phase === 'quiz') {
      onAnswer?.(ok);
      if (ok) progress.passTraceStep(letter.id, TRACE_STEPS);
      return;
    }
    if (ok) {
      progress.passTraceStep(letter.id, step + 1);
      setReached((n) => Math.max(n, step + 1));
    }
  };

  const startPractice = () => {
    setPhase('practice');
    restart(0);
  };

  const canAdvance = phase === 'practice' && result && result.stars >= PASS_STARS && step < TRACE_STEPS - 1;
  const quizOk = phase === 'quiz' && result && result.stars >= PASS_STARS;

  return (
    <View style={styles.wrap}>
      {phase === 'practice' && (
        <View style={styles.steps}>
          {STEPS.map((s, i) => {
            const on = i === step;
            const locked = i > passed;
            return (
              <Pressable
                key={s.label}
                disabled={locked}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: locked }}
                onPress={() => restart(i)}
                style={[
                  styles.chip,
                  on ? { backgroundColor: colors.ink } : { borderWidth: 1, borderColor: colors.line },
                  locked && { opacity: 0.45 },
                ]}
              >
                <T size={13} style={{ color: on ? colors.bg : colors.muted }}>
                  {i + 1}. {s.label}
                </T>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <T size={13} tone="muted">
            {phase === 'quiz' ? 'Write the letter for this sound' : STEPS[step].prompt}
          </T>
          <View style={styles.sound}>
            <T size={40} weight="bold" style={{ lineHeight: 48 }}>
              {letter.roman}
            </T>
            {letter.friendly !== letter.roman && (
              <T size={15} tone="muted">
                like "{letter.friendly}"
              </T>
            )}
          </View>
          <T size={13} tone="muted">
            {letter.hint}
          </T>
        </View>
        <IconButton bordered label="Play sound" onPress={() => speakTamil(letter.tamil)}>
          <Icon.Speaker color={colors.ink} />
        </IconButton>
      </View>

      <TraceCanvas
        side={side}
        glyph={glyph}
        guide={result || phase === 'quiz' ? 'none' : STEPS[step].guide}
        strokes={strokes}
        onStrokesChange={setStrokes}
        reveal={!!result}
        disabled={!!result}
      />

      {result ? (
        <View style={styles.result}>
          <View style={styles.stars} accessibilityLabel={`${result.stars} of 3 stars`}>
            {[1, 2, 3].map((n) => (
              <View
                key={n}
                style={[styles.star, { backgroundColor: n <= result.stars ? colors.accent : colors.line }]}
              />
            ))}
          </View>
          <T size={15} weight="medium" style={{ textAlign: 'center' }}>
            {phase === 'quiz'
              ? quizOk
                ? `Correct, that's ${letter.tamil}`
                : `Not quite. This is ${letter.tamil}`
              : VERDICT[result.stars]}
          </T>
          <T size={13} tone="muted" style={{ textAlign: 'center' }}>
            Covered {Math.round(result.coverage * 100)}% of the letter, {Math.round(result.accuracy * 100)}% of your ink
            on the lines
          </T>
          <View style={styles.actions}>
            {phase === 'quiz' ? (
              quizOk ? (
                <SecondaryButton style={{ flex: 1 }} label="Practice it" onPress={startPractice} />
              ) : (
                <PrimaryButton style={{ flex: 1 }} label="Practice it" onPress={startPractice} />
              )
            ) : (
              <SecondaryButton style={{ flex: 1 }} label="Try again" onPress={() => restart()} />
            )}
            {phase === 'quiz' && !quizOk ? (
              <SecondaryButton style={{ flex: 1 }} label={nextLabel} onPress={onNext} />
            ) : canAdvance ? (
              <PrimaryButton style={{ flex: 1 }} label={`Step ${step + 2}`} onPress={() => restart(step + 1)} />
            ) : (
              <PrimaryButton style={{ flex: 1 }} label={nextLabel} onPress={onNext} />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <IconButton bordered size={52} label="Undo last stroke" onPress={() => setStrokes((s) => s.slice(0, -1))}>
            <Icon.Undo color={colors.ink} />
          </IconButton>
          <SecondaryButton style={{ flex: 1 }} label="Clear" onPress={() => setStrokes([])} />
          <PrimaryButton style={{ flex: 1 }} label="Check" disabled={strokes.length === 0} onPress={check} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  steps: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, minHeight: 32, borderRadius: 999, justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sound: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  result: { gap: 8 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { width: 28, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10 },
});
