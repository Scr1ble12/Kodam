import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CONSONANTS, SEGMENTS } from '../data/letters';
import type { Letter, SegmentId } from '../data/letters';
import { stageLevel, useProgress } from '../lib/progress';
import { showRoman } from '../lib/roman';
import { useTheme } from '../lib/theme';
import { T } from './ui';

export const GRID_PAD = 20;
const GAP = 10;
export const MAX_WIDTH = 560;

/**
 * The selectable 4-column letter grid for one segment. Compound letters come in
 * rows of twelve, one row per consonant, each with a "Select row" header.
 */
export function LetterGrid({
  segment,
  selected,
  onToggle,
  setMany,
}: {
  segment: SegmentId;
  selected: Record<string, boolean>;
  onToggle: (id: string) => void;
  setMany: (letters: readonly Letter[], on: boolean) => void;
}) {
  const { colors, letterPx, settings } = useTheme();
  const progress = useProgress();
  const { width } = useWindowDimensions();
  const letters: readonly Letter[] = SEGMENTS.find((s) => s.id === segment)!.letters;
  const cell = (Math.min(width, MAX_WIDTH) - GRID_PAD * 2 - GAP * 3) / 4;

  const renderCell = (l: Letter) => {
    const on = !!selected[l.id];
    const stage = progress.stage(l.id);
    return (
      <Pressable
        key={l.id}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: on }}
        accessibilityLabel={`${l.tamil}, ${l.roman}`}
        onPress={() => onToggle(l.id)}
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
  };

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {segment === 'compound'
        ? CONSONANTS.map((c) => {
            const row = letters.filter((l) => l.consonant === c.id);
            const rowOn = row.every((l) => selected[l.id]);
            return (
              <View key={c.id} style={styles.section}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${rowOn ? 'Unselect' : 'Select'} the ${c.roman} row`}
                  onPress={() => setMany(row, !rowOn)}
                  style={styles.sectionHeader}
                >
                  <T size={16} weight="medium">
                    {c.tamil} · {c.roman}
                  </T>
                  <T size={13} weight="medium" tone="accent">
                    {rowOn ? 'Unselect row' : 'Select row'}
                  </T>
                </Pressable>
                <View style={styles.cells}>{row.map(renderCell)}</View>
              </View>
            );
          })
        : letters.map(renderCell)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: GRID_PAD, paddingBottom: 16 },
  section: { width: '100%', gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  bar: { width: 28, height: 3, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
});
