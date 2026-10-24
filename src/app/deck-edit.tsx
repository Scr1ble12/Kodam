import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon, IconButton, PrimaryButton, Screen, T } from '../components/ui';
import { DECKS } from '../data/words';
import { useTheme } from '../lib/theme';
import { useVocab } from '../lib/vocab';

/** Make a custom deck from words in any topic, or change one (`?id=`). */
export default function DeckEditScreen() {
  const { colors, fonts } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { custom, createDeck, editDeck } = useVocab();
  const existing = custom.find((d) => d.id === id);

  const [name, setName] = useState(existing?.name ?? `My deck ${custom.length + 1}`);
  const [picked, setPicked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((existing?.wordIds ?? []).map((w) => [w, true])),
  );
  const [open, setOpen] = useState<string | null>(DECKS[0].id);
  const chosen = DECKS.flatMap((d) => d.words).filter((w) => picked[w.id]).map((w) => w.id);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/vocabulary'));

  const save = () => {
    const trimmed = name.trim() || `My deck ${custom.length + 1}`;
    if (existing) editDeck(existing.id, trimmed, chosen);
    else createDeck(trimmed, chosen);
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
              {existing ? 'Edit deck' : 'New deck'}
            </T>
            <View style={{ width: 44 }} />
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={40}
            selectTextOnFocus
            placeholder="Deck name"
            placeholderTextColor={colors.muted}
            accessibilityLabel="Deck name"
            style={[
              styles.input,
              { borderColor: colors.line, color: colors.ink, backgroundColor: colors.surface, fontFamily: fonts.medium },
            ]}
          />
          <T size={13} tone="muted">
            {chosen.length ? `${chosen.length} words picked` : 'Open a topic and tap the words you want'}
          </T>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {DECKS.map((deck) => {
            const count = deck.words.filter((w) => picked[w.id]).length;
            const all = count === deck.words.length;
            const expanded = open === deck.id;
            return (
              <View key={deck.id} style={[styles.topic, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => setOpen(expanded ? null : deck.id)}
                  style={styles.topicHead}
                >
                  <View style={{ flex: 1 }}>
                    <T size={16} weight="medium">
                      {deck.name}
                    </T>
                    <T size={12} tone="muted">
                      {count ? `${count} of ${deck.words.length} picked` : `${deck.words.length} words`}
                    </T>
                  </View>
                  <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
                    <Icon.Chevron color={colors.muted} />
                  </View>
                </Pressable>
                {expanded && (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setPicked((cur) => {
                          const next = { ...cur };
                          deck.words.forEach((w) => (next[w.id] = !all));
                          return next;
                        })
                      }
                      style={styles.selectAll}
                    >
                      <T size={13} weight="medium" tone="accent">
                        {all ? 'Unselect all' : 'Select all'}
                      </T>
                    </Pressable>
                    {deck.words.map((w) => {
                      const on = !!picked[w.id];
                      return (
                        <Pressable
                          key={w.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: on }}
                          accessibilityLabel={`${w.tamil}, ${w.english}`}
                          onPress={() => setPicked((cur) => ({ ...cur, [w.id]: !cur[w.id] }))}
                          style={[styles.word, { borderTopColor: colors.line }]}
                        >
                          <View
                            style={[
                              styles.box,
                              on
                                ? { backgroundColor: colors.accent, borderColor: colors.accent }
                                : { borderColor: colors.line },
                            ]}
                          >
                            {on && (
                              <T size={13} weight="bold" tone="onAccent">
                                ✓
                              </T>
                            )}
                          </View>
                          <T size={17} style={{ flex: 1 }}>
                            {w.tamil}
                          </T>
                          <T size={14} tone="muted" style={{ maxWidth: '45%', textAlign: 'right' }}>
                            {w.english}
                          </T>
                        </Pressable>
                      );
                    })}
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.bg }]}>
          <PrimaryButton
            style={{ flex: 1 }}
            disabled={chosen.length === 0}
            label={chosen.length ? `Save deck · ${chosen.length} words` : 'Pick at least one word'}
            onPress={save}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 50, paddingHorizontal: 14, fontSize: 18 },
  list: { paddingHorizontal: 20, paddingBottom: 16, gap: 10 },
  topic: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  topicHead: { flexDirection: 'row', alignItems: 'center', minHeight: 60 },
  selectAll: { alignSelf: 'flex-end', minHeight: 32, justifyContent: 'center' },
  word: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, borderTopWidth: 1 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
});
