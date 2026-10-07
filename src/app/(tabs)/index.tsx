import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NameModal } from '../../components/NameModal';
import { Icon, IconButton, PrimaryButton, Segmented, T } from '../../components/ui';
import { CONSONANTS, LETTERS, SEGMENTS } from '../../data/letters';
import type { Letter, SegmentId } from '../../data/letters';
import { nextListName, useLists } from '../../lib/lists';
import { stageLevel, useProgress } from '../../lib/progress';
import { showRoman } from '../../lib/roman';
import { useTheme } from '../../lib/theme';

const PAD = 20;
const GAP = 10;
const MAX_WIDTH = 560;
/** The "N of 247" count follows the spec: every letter except the optional Grantha set. */
const COUNTED = LETTERS.filter((l) => l.group !== 'grantha');

export default function AlphabetScreen() {
  const { colors, letterPx, settings } = useTheme();
  const progress = useProgress();
  const { lists, create } = useLists();
  const { width } = useWindowDimensions();
  const [segment, setSegment] = useState<SegmentId>('vowels');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [naming, setNaming] = useState(false);

  const letters: readonly Letter[] = SEGMENTS.find((s) => s.id === segment)!.letters;
  const chosen = LETTERS.filter((l) => selected[l.id]);
  const allOn = letters.every((l) => selected[l.id]);
  const mastered = COUNTED.filter((l) => progress.stage(l.id) === 'mastered').length;
  const cell = (Math.min(width, MAX_WIDTH) - PAD * 2 - GAP * 3) / 4;
  const chosenKey = chosen.map((l) => l.id).join(',');

  const setMany = (group: readonly Letter[], on: boolean) =>
    setSelected((cur) => {
      const next = { ...cur };
      group.forEach((l) => (next[l.id] = on));
      return next;
    });

  const loadList = (ids: string[]) => {
    setSelected(Object.fromEntries(ids.map((id) => [id, true])));
    const first = LETTERS.find((l) => l.id === ids[0]);
    const home = first && SEGMENTS.find((s) => (s.letters as readonly Letter[]).includes(first));
    if (home) setSegment(home.id);
  };

  const ids = (chosen.length ? chosen : letters).map((l) => l.id).join(',');

  const renderCell = (l: Letter) => {
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
  };

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
                {mastered} of {COUNTED.length} letters learned
              </T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${progress.streak} day streak, see activity`}
              onPress={() => router.push('/activity')}
              style={({ pressed }) => [styles.streak, { backgroundColor: colors.streakBg, opacity: pressed ? 0.7 : 1 }]}
            >
              <Icon.Flame color={colors.streakInk} />
              <T size={15} weight="bold" style={{ color: colors.streakInk }}>
                {progress.streak}
              </T>
              <T size={13} style={{ color: colors.streakInk }}>
                {progress.streak === 1 ? 'day' : 'days'}
              </T>
            </Pressable>
          </View>

          {lists.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lists}>
              {lists.map((list) => {
                const on = list.ids.join(',') === chosenKey;
                return (
                  <Pressable
                    key={list.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => loadList(list.ids)}
                    style={[
                      styles.listChip,
                      on
                        ? { backgroundColor: colors.ink, borderColor: colors.ink }
                        : { backgroundColor: colors.surface, borderColor: colors.line },
                    ]}
                  >
                    <T size={13} weight="medium" style={{ color: on ? colors.bg : colors.ink }}>
                      {list.name}
                    </T>
                    <T size={12} style={{ color: on ? colors.bg : colors.muted }}>
                      {list.ids.length}
                    </T>
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/lists')}
                style={[styles.listChip, { borderColor: colors.line }]}
              >
                <T size={13} weight="medium" tone="accent">
                  Manage lists
                </T>
              </Pressable>
            </ScrollView>
          )}

          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
          <View style={styles.hintRow}>
            {chosen.length ? (
              <View style={styles.links}>
                <T size={13} tone="muted">
                  {chosen.length} selected
                </T>
                <Pressable onPress={() => setSelected({})} hitSlop={10} accessibilityRole="button">
                  <T size={13} weight="medium" tone="accent">
                    Clear
                  </T>
                </Pressable>
              </View>
            ) : (
              <T size={13} tone="muted">
                Tap letters to choose what to drill
              </T>
            )}
            <View style={styles.links}>
              {chosen.length > 0 && (
                <Pressable onPress={() => setNaming(true)} hitSlop={10} accessibilityRole="button">
                  <T size={13} weight="medium" tone="accent">
                    Save list
                  </T>
                </Pressable>
              )}
              {!allOn && (
                <Pressable onPress={() => setMany(letters, true)} hitSlop={10} accessibilityRole="button">
                  <T size={13} weight="medium" tone="accent">
                    Select all
                  </T>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.grid}>
          {segment === 'compound'
            ? // Compound letters come in rows of twelve, one row per consonant. Tap a row's header to pick it all.
              CONSONANTS.map((c) => {
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

      <NameModal
        visible={naming}
        title={`Save ${chosen.length} ${chosen.length === 1 ? 'letter' : 'letters'} as a list`}
        initial={nextListName(lists)}
        confirmLabel="Save"
        onClose={() => setNaming(false)}
        onSubmit={(name) => {
          create(name, chosen.map((l) => l.id));
          setNaming(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 12, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 999,
  },
  lists: { gap: 8 },
  listChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, paddingBottom: 16 },
  section: { width: '100%', gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 36 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  bar: { width: 28, height: 3, borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: PAD, paddingVertical: 12, borderTopWidth: 1 },
});
