import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, IconButton, PrimaryButton, Segmented, T } from '../../components/ui';
import { LETTERS, SEGMENTS } from '../../data/letters';
import type { SegmentId } from '../../data/letters';
import { stageLevel, useProgress } from '../../lib/progress';
import { showRoman } from '../../lib/roman';
import { useTheme } from '../../lib/theme';

const PAD = 20;
const GAP = 10;
const MAX_WIDTH = 560;

export default function AlphabetScreen() {
  const { colors, letterPx, settings } = useTheme();
  const progress = useProgress();
  const { width } = useWindowDimensions();
  const [segment, setSegment] = useState<SegmentId>('vowels');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const letters = SEGMENTS.find((s) => s.id === segment)!.letters;
  const chosen = LETTERS.filter((l) => selected[l.id]);
  const allOn = letters.every((l) => selected[l.id]);
  const mastered = LETTERS.filter((l) => progress.stage(l.id) === 'mastered').length;
  const cell = (Math.min(width, MAX_WIDTH) - PAD * 2 - GAP * 3) / 4;

  const toggleAll = () =>
    setSelected((cur) => {
      const next = { ...cur };
      letters.forEach((l) => (next[l.id] = !allOn));
      return next;
    });

  const ids = (chosen.length ? chosen : letters).map((l) => l.id).join(',');

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View>
              <T size={13} tone="muted">
                எழுத்து
              </T>
              <T size={30} weight="bold" style={{ lineHeight: 36 }}>
                Alphabet
              </T>
              <T size={13} tone="muted">
                {mastered} of {LETTERS.length} letters learned
              </T>
            </View>
            <View
              accessibilityLabel={`${progress.streak} day streak`}
              style={[styles.streak, { backgroundColor: colors.streakBg }]}
            >
              <Icon.Flame color={colors.streakInk} />
              <T size={15} weight="bold" style={{ color: colors.streakInk }}>
                {progress.streak}
              </T>
              <T size={13} style={{ color: colors.streakInk }}>
                {progress.streak === 1 ? 'day' : 'days'}
              </T>
            </View>
          </View>
          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
          <View style={styles.hintRow}>
            <T size={13} tone="muted">
              Tap letters to choose what to drill
            </T>
            <Pressable onPress={toggleAll} hitSlop={10} accessibilityRole="button">
              <T size={13} weight="medium" tone="accent">
                {allOn ? 'Clear' : 'Select all'}
              </T>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {letters.map((l) => {
            const on = !!selected[l.id];
            const stage = progress.stage(l.id);
            return (
              <Pressable
                key={l.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${l.tamil}, ${l.roman}`}
                onPress={() => setSelected((cur) => ({ ...cur, [l.id]: !cur[l.id] }))}
                style={[
                  styles.cell,
                  { width: cell, height: Math.max(80, letterPx * 2.6) },
                  on
                    ? { backgroundColor: colors.accent, borderColor: colors.accent, borderWidth: 1.5 }
                    : { backgroundColor: colors.surface, borderColor: colors.line },
                ]}
              >
                <T size={letterPx} tone={on ? 'onAccent' : 'ink'}>
                  {l.tamil}
                </T>
                {showRoman(settings.roman, stage) && (
                  <T size={12} tone={on ? 'onAccent' : 'muted'} style={{ lineHeight: 15 }}>
                    {l.roman}
                  </T>
                )}
                {!on && (
                  <View style={[styles.bar, { backgroundColor: colors.line }]}>
                    <View
                      style={[styles.barFill, { backgroundColor: colors.accent, width: `${(stageLevel(stage) / 3) * 100}%` }]}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.bg }]}>
          <PrimaryButton
            style={{ flex: 1 }}
            disabled={chosen.length === 0}
            label={
              chosen.length === 0
                ? 'Select letters to practice'
                : `Practice ${chosen.length} ${chosen.length === 1 ? 'letter' : 'letters'}`
            }
            onPress={() => router.push({ pathname: '/drill', params: { ids } })}
          />
          <IconButton
            bordered
            size={52}
            label={chosen.length ? 'Trace selected letters' : 'Trace these letters'}
            onPress={() => router.push({ pathname: '/trace', params: { ids } })}
          >
            <Icon.Pencil color={colors.ink} />
          </IconButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 12, gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 999,
  },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, paddingBottom: 16 },
  cell: { borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  bar: { width: 28, height: 3, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: PAD, paddingVertical: 12, borderTopWidth: 1 },
});
