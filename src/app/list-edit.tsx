import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { GRID_PAD, LetterGrid, MAX_WIDTH } from '../components/LetterGrid';
import { Icon, IconButton, PrimaryButton, Screen, Segmented, T } from '../components/ui';
import { homeSegment, LETTERS, SEGMENTS } from '../data/letters';
import type { Letter, SegmentId } from '../data/letters';
import { nextListName, useLists } from '../lib/lists';
import { useTheme } from '../lib/theme';

/** Make a new list, or change the name and letters of a saved one (`?id=`). `?ids=` pre-picks letters. */
export default function ListEditScreen() {
  const { colors, fonts } = useTheme();
  const params = useLocalSearchParams<{ id?: string; ids?: string }>();
  const { lists, create, edit } = useLists();
  const existing = lists.find((l) => l.id === params.id);
  const startIds = existing?.ids ?? (params.ids ? params.ids.split(',') : []);

  const [name, setName] = useState(existing?.name ?? nextListName(lists));
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(startIds.map((id) => [id, true])),
  );
  const [segment, setSegment] = useState<SegmentId>(() => homeSegment(startIds[0]) ?? 'vowels');

  const chosen = LETTERS.filter((l) => selected[l.id]).map((l) => l.id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const setMany = (group: readonly Letter[], on: boolean) =>
    setSelected((cur) => {
      const next = { ...cur };
      group.forEach((l) => (next[l.id] = on));
      return next;
    });
  const letters = SEGMENTS.find((s) => s.id === segment)!.letters as readonly Letter[];
  const allOn = letters.every((l) => selected[l.id]);

  const save = () => {
    const trimmed = name.trim() || nextListName(lists);
    if (existing) edit(existing.id, trimmed, chosen);
    else create(trimmed, chosen);
    close();
  };

  return (
    <Screen>
      <View style={styles.column}>
        <View style={styles.header}>
          <View style={styles.top}>
            <IconButton label="Close" onPress={close}>
              <Icon.Close color={colors.ink} />
            </IconButton>
            <T size={17} weight="bold">
              {existing ? 'Edit list' : 'New list'}
            </T>
            <View style={{ width: 44 }} />
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={40}
            selectTextOnFocus
            placeholder="List name"
            placeholderTextColor={colors.muted}
            accessibilityLabel="List name"
            style={[
              styles.input,
              { borderColor: colors.line, color: colors.ink, backgroundColor: colors.surface, fontFamily: fonts.medium },
            ]}
          />
          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />
          <View style={styles.hintRow}>
            <T size={13} tone="muted">
              {chosen.length ? `${chosen.length} in this list` : 'Tap the letters to add'}
            </T>
            <View style={styles.links}>
              {chosen.length > 0 && (
                <Pressable onPress={() => setSelected({})} hitSlop={10} accessibilityRole="button">
                  <T size={13} weight="medium" tone="accent">
                    Clear
                  </T>
                </Pressable>
              )}
              <Pressable onPress={() => setMany(letters, !allOn)} hitSlop={10} accessibilityRole="button">
                <T size={13} weight="medium" tone="accent">
                  {allOn ? 'Unselect all' : 'Select all'}
                </T>
              </Pressable>
            </View>
          </View>
        </View>

        <LetterGrid
          segment={segment}
          selected={selected}
          onToggle={(id) => setSelected((cur) => ({ ...cur, [id]: !cur[id] }))}
          setMany={setMany}
        />

        <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.bg }]}>
          <PrimaryButton
            style={{ flex: 1 }}
            disabled={chosen.length === 0}
            label={
              chosen.length === 0
                ? 'Pick at least one letter'
                : `Save list · ${chosen.length} ${chosen.length === 1 ? 'letter' : 'letters'}`
            }
            onPress={save}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  header: { paddingHorizontal: GRID_PAD, paddingTop: 4, paddingBottom: 12, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, fontSize: 18 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: GRID_PAD, paddingVertical: 12, borderTopWidth: 1 },
});
