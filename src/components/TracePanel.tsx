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
 * One letter's tracing exercise. The learner starts at the first step they
 * haven't passed; passing a step (2+ stars) unlocks the next one.
 */
export function TracePanel({
  letter,
  onNext,
  nextLabel,
  reserve,
}: {
  letter: Letter;
  onNext: () => void;
  nextLabel: string;
  /** Vertical px the surrounding screen and the panel's own controls need. */
  reserve: number;
}) {
  const { colors } = useTheme();
  const progress = useProgress();
  const passed = progress.get(letter.id).traceStep;
  const [step, setStep] = useState(Math.min(passed, TRACE_STEPS - 1));
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
    if (r.stars >= PASS_STARS) progress.passTraceStep(letter.id, step + 1);
  };

  const canAdvance = result && result.stars >= PASS_STARS && step < TRACE_STEPS - 1;

  return (
    <View style={styles.wrap}>
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

      <View style={styles.infoRow}>
        <View style={{ flex: 1 }}>
          <T size={13} tone="muted">
            {STEPS[step].prompt}
          </T>
          <T size={18} weight="medium">
            {letter.tamil} · {letter.roman}
          </T>
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
        guide={result ? 'none' : STEPS[step].guide}
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
            {VERDICT[result.stars]}
          </T>
          <T size={13} tone="muted" style={{ textAlign: 'center' }}>
            Covered {Math.round(result.coverage * 100)}% of the letter, {Math.round(result.accuracy * 100)}% of your
            ink on the lines
          </T>
          <View style={styles.actions}>
            <SecondaryButton style={{ flex: 1 }} label="Try again" onPress={() => restart()} />
            {canAdvance ? (
              <PrimaryButton style={{ flex: 1 }} label={`Step ${step + 2}`} onPress={() => restart(step + 1)} />
            ) : (
              <PrimaryButton style={{ flex: 1 }} label={nextLabel} onPress={onNext} />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <IconButton
            bordered
            size={52}
            label="Undo last stroke"
            onPress={() => setStrokes((s) => s.slice(0, -1))}
          >
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
  result: { gap: 8 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { width: 28, height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', gap: 10 },
});
