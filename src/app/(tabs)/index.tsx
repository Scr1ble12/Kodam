import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GRID_PAD, LetterGrid, MAX_WIDTH } from '../../components/LetterGrid';
import { NameModal } from '../../components/NameModal';
import { Icon, IconButton, PrimaryButton, Segmented, T } from '../../components/ui';
import { getLetter, homeSegment, LETTERS, SEGMENTS } from '../../data/letters';
import type { Letter, SegmentId } from '../../data/letters';
import { nextListName, useLists } from '../../lib/lists';
import type { LetterList } from '../../lib/lists';
import { useProgress } from '../../lib/progress';
import { useTheme } from '../../lib/theme';

/** The "N of 247" count follows the spec: every letter except the optional Grantha set. */
const COUNTED = LETTERS.filter((l) => l.group !== 'grantha');

export default function AlphabetScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { lists, create } = useLists();
  const [segment, setSegment] = useState<SegmentId>('vowels');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [naming, setNaming] = useState(false);

  const letters: readonly Letter[] = SEGMENTS.find((s) => s.id === segment)!.letters;
  const chosen = LETTERS.filter((l) => selected[l.id]);
  const allOn = letters.every((l) => selected[l.id]);
  const mastered = COUNTED.filter((l) => progress.stage(l.id) === 'mastered').length;
  const chosenKey = sortedKey(chosen.map((l) => l.id));
  const activeList = chosen.length ? lists.find((l) => sortedKey(l.ids) === chosenKey) : undefined;

  const setMany = (group: readonly Letter[], on: boolean) =>
    setSelected((cur) => {
      const next = { ...cur };
      group.forEach((l) => (next[l.id] = on));
      return next;
    });

  // Tapping the list that is already picked clears it again.
  const toggleList = (list: LetterList) => {
    if (activeList?.id === list.id) return setSelected({});
    setSelected(Object.fromEntries(list.ids.map((id) => [id, true])));
    const home = homeSegment(list.ids[0]);
    if (home) setSegment(home);
  };

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
                {mastered} of {COUNTED.length} letters learned
              </T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${progress.streak} day streak, see your stats`}
              onPress={() => router.push('/stats')}
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
        </View>

        <View style={styles.listsBlock}>
          <View style={styles.listsTitle}>
            <T size={17} weight="bold">
              My lists
            </T>
            {lists.length > 0 && (
              <Pressable onPress={() => router.push('/lists')} hitSlop={10} accessibilityRole="button">
                <T size={13} weight="medium" tone="accent">
                  Manage
                </T>
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New list"
              onPress={() =>
                router.push({
                  pathname: '/list-edit',
                  params: chosen.length ? { ids: chosen.map((l) => l.id).join(',') } : {},
                })
              }
              style={({ pressed }) => [
                styles.listCard,
                styles.newCard,
                { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Icon.Plus color={colors.accent} size={22} />
              <T size={14} weight="medium" tone="accent">
                New list
              </T>
            </Pressable>
            {lists.length === 0 && (
              <View style={[styles.listCard, styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <T size={13} tone="muted">
                  Save the letters you study most and pick them up again in one tap.
                </T>
              </View>
            )}
            {lists.map((list) => {
              const on = activeList?.id === list.id;
              const preview = list.ids
                .slice(0, 4)
                .map((id) => getLetter(id)?.tamil ?? '')
                .join(' ');
              return (
                <Pressable
                  key={list.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${list.name}, ${list.ids.length} letters`}
                  onPress={() => toggleList(list)}
                  style={({ pressed }) => [
                    styles.listCard,
                    on
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.surface, borderColor: colors.line },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <T size={14} weight="medium" numberOfLines={1} tone={on ? 'onAccent' : 'ink'}>
                    {list.name}
                  </T>
                  <T size={18} numberOfLines={1} tone={on ? 'onAccent' : 'ink'}>
                    {preview}
                  </T>
                  <T size={12} tone={on ? 'onAccent' : 'muted'}>
                    {list.ids.length} {list.ids.length === 1 ? 'letter' : 'letters'}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.pickHeader}>
          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
          <View style={styles.hintRow}>
            {chosen.length ? (
              <View style={styles.links}>
                <T size={13} tone="muted">
                  {activeList ? activeList.name : `${chosen.length} selected`}
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
            {!allOn && (
              <Pressable onPress={() => setMany(letters, true)} hitSlop={10} accessibilityRole="button">
                <T size={13} weight="medium" tone="accent">
                  Select all
                </T>
              </Pressable>
            )}
          </View>
        </View>

        <LetterGrid
          segment={segment}
          selected={selected}
          onToggle={(id) => setSelected((cur) => ({ ...cur, [id]: !cur[id] }))}
          setMany={setMany}
        />

        <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.bg }]}>
          {chosen.length > 0 && !activeList && (
            <IconButton bordered size={52} label="Save as a list" onPress={() => setNaming(true)}>
              <Icon.Bookmark color={colors.accent} />
            </IconButton>
          )}
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

const sortedKey = (ids: string[]) => [...ids].sort().join(',');

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: GRID_PAD, paddingTop: 16, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 999,
  },
  listsBlock: { gap: 8, paddingBottom: 14 },
  listsTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GRID_PAD,
  },
  listsRow: { gap: 10, paddingHorizontal: GRID_PAD },
  listCard: { width: 128, height: 92, borderRadius: 16, borderWidth: 1, padding: 12, justifyContent: 'space-between' },
  newCard: { width: 96, borderStyle: 'dashed', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 4 },
  emptyCard: { width: 220, justifyContent: 'center' },
  pickHeader: { paddingHorizontal: GRID_PAD, paddingBottom: 12, gap: 12 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: GRID_PAD, paddingVertical: 12, borderTopWidth: 1 },
});
