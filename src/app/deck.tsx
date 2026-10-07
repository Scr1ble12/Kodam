import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ConfirmModal } from '../components/ConfirmModal';
import { Icon, IconButton, PrimaryButton, Screen, T } from '../components/ui';
import { stageLevel, useProgress } from '../lib/progress';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';
import { deckProgress, useVocab } from '../lib/vocab';

/** One deck: its words, whether it's in the daily review, and a button to study it now. */
export default function DeckScreen() {
  const { colors, settings } = useTheme();
  const progress = useProgress();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, isActive, setActive, removeDeck } = useVocab();
  const [deleting, setDeleting] = useState(false);
  const deck = decks.find((d) => d.id === id);
  if (!deck) return <Redirect href="/vocabulary" />;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/vocabulary'));
  const { started, mastered, total } = deckProgress(deck.words, progress.get, progress.stage);
  const on = isActive(deck.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close deck" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          {deck.custom && (
            <IconButton
              label={`Edit ${deck.name}`}
              onPress={() => router.push({ pathname: '/deck-edit', params: { id: deck.id } })}
            >
              <Icon.Pencil color={colors.ink} />
            </IconButton>
          )}
        </View>
        <View>
          {deck.tamilName && (
            <T size={13} tone="muted">
              {deck.tamilName}
            </T>
          )}
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            {deck.name}
          </T>
          <T size={13} tone="muted">
            {started} of {total} started · {mastered} mastered
          </T>
        </View>

        <View style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={{ flex: 1 }}>
            <T size={15}>In my daily review</T>
            <T size={12} tone="muted">
              New words from this deck show up in Today, a few each day.
            </T>
          </View>
          <Switch
            value={on}
            onValueChange={(v) => setActive(deck.id, v)}
            trackColor={{ true: colors.accent, false: colors.line }}
            accessibilityLabel="In my daily review"
          />
        </View>

        <PrimaryButton
          label={total ? 'Study this deck now' : 'Add words to study'}
          disabled={!total}
          onPress={() => router.push({ pathname: '/review', params: { deck: deck.id } })}
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {deck.words.map((w, i) => {
            const level = stageLevel(progress.stage(w.id));
            return (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                accessibilityLabel={`${w.english}. Play ${w.tamil}`}
                onPress={() => speakTamil(w.spoken ?? w.tamil)}
                style={[styles.word, i > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
              >
                <View style={{ flex: 1 }}>
                  <T size={19} weight="medium">
                    {w.tamil}
                  </T>
                  <T size={12} tone="muted">
                    {settings.spoken === 'both' && w.spoken ? `${w.spoken} · ` : ''}“{w.say}”
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4, maxWidth: '45%' }}>
                  <T size={14} style={{ textAlign: 'right' }}>
                    {w.english}
                  </T>
                  <View style={styles.dots}>
                    {[1, 2, 3].map((n) => (
                      <View
                        key={n}
                        style={[styles.dot, { backgroundColor: n <= level ? colors.accent : colors.track }]}
                      />
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}
          {total === 0 && (
            <T size={14} tone="muted">
              This deck is empty. Tap the pencil to add words.
            </T>
          )}
        </View>

        <T size={12} tone="muted" style={{ textAlign: 'center' }}>
          Tap a word to hear it. Draft word list: a native speaker still needs to review it.
        </T>

        {deck.custom && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleting(true)}
            style={[styles.delete, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
          >
            <T size={15} weight="bold" tone="error">
              Delete deck
            </T>
          </Pressable>
        )}
      </ScrollView>
      <ConfirmModal
        visible={deleting}
        title={`Delete “${deck.name}”?`}
        message="The deck will be removed from Your decks. Your progress on its words stays. This can't be undone."
        confirmLabel="Delete deck"
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          setDeleting(false);
          removeDeck(deck.id);
          close();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  delete: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
