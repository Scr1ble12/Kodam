import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, PrimaryButton, T } from '../../components/ui';
import { useProgress } from '../../lib/progress';
import { useTheme } from '../../lib/theme';
import { deckProgress, useToday, useVocab } from '../../lib/vocab';
import type { AnyDeck } from '../../lib/vocab';

export default function VocabularyScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { decks } = useVocab();
  const today = useToday();
  const builtIn = decks.filter((d) => !d.custom);
  const custom = decks.filter((d) => d.custom);
  const total = today.due.length + today.fresh.length;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.titleRow}>
          <View>
            <T size={13} tone="muted">
              சொற்கள்
            </T>
            <T size={30} weight="bold" style={{ lineHeight: 36 }}>
              Vocabulary
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

        <View style={[styles.today, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={13} weight="bold" tone="muted" style={{ letterSpacing: 0.8 }}>
            TODAY
          </T>
          <View style={styles.figures}>
            <Figure value={today.due.length} label="reviews due" />
            <Figure value={today.fresh.length} label="new words" />
            <Figure value={total ? `~${today.minutes}` : '0'} label="minutes" />
          </View>
          <PrimaryButton
            label={total ? 'Start review' : today.activeCount ? 'All done for today' : 'Turn on a deck below'}
            disabled={!total}
            onPress={() => router.push({ pathname: '/review', params: { today: '1' } })}
          />
          {!total && today.activeCount > 0 && (
            <T size={13} tone="muted" style={{ textAlign: 'center' }}>
              {today.unseenLeft
                ? 'More new words tomorrow. Tap a deck to study it now.'
                : 'Every word in your decks is started. Turn on another deck for more.'}
            </T>
          )}
        </View>

        <View style={styles.sectionHead}>
          <T size={17} weight="bold">
            Decks
          </T>
          <T size={13} tone="muted">
            ✓ = in your daily review
          </T>
        </View>
        {builtIn.map((d) => (
          <DeckRow key={d.id} deck={d} />
        ))}

        <View style={styles.sectionHead}>
          <T size={17} weight="bold">
            Your decks
          </T>
        </View>
        {custom.map((d) => (
          <DeckRow key={d.id} deck={d} />
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/deck-edit')}
          style={({ pressed }) => [styles.newDeck, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon.Plus color={colors.accent} />
          <T size={15} weight="medium" tone="accent">
            New custom deck
          </T>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeckRow({ deck }: { deck: AnyDeck }) {
  const { colors } = useTheme();
  const progress = useProgress();
  const { isActive } = useVocab();
  const on = isActive(deck.id);
  const { started, total } = deckProgress(deck.words, progress.get, progress.stage);
  // A short word fits the tile without being cut off; very short ones (like டீ) look lost in it.
  const sample =
    deck.words.find((w) => w.tamil.length >= 3 && w.tamil.length <= 5) ??
    [...deck.words].sort((a, b) => a.tamil.length - b.tamil.length)[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${deck.name}, ${started} of ${total} words started${on ? ', in daily review' : ''}`}
      onPress={() => router.push({ pathname: '/deck', params: { id: deck.id } })}
      style={({ pressed }) => [
        styles.deck,
        { backgroundColor: colors.surface, borderColor: on ? colors.accent : colors.line, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.sample, { backgroundColor: colors.track }]}>
        <T size={sample && sample.tamil.length > 4 ? 16 : 20} weight="medium" numberOfLines={1}>
          {sample?.tamil ?? '–'}
        </T>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.deckTitle}>
          <T size={16} weight="medium" numberOfLines={1} style={{ flexShrink: 1 }}>
            {deck.name}
          </T>
          {deck.tamilName && (
            <T size={13} tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
              {deck.tamilName}
            </T>
          )}
        </View>
        <View style={[styles.bar, { backgroundColor: colors.track }]}>
          <View
            style={[styles.barFill, { backgroundColor: colors.accent, width: `${total ? (started / total) * 100 : 0}%` }]}
          />
        </View>
        <T size={12} tone="muted">
          {started} of {total} started
        </T>
      </View>
      {on ? (
        <View style={[styles.check, { backgroundColor: colors.accent }]}>
          <T size={14} weight="bold" tone="onAccent">
            ✓
          </T>
        </View>
      ) : (
        <Icon.Chevron color={colors.muted} />
      )}
    </Pressable>
  );
}

function Figure({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T size={26} weight="bold">
        {value}
      </T>
      <T size={12} tone="muted">
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 44, borderRadius: 999 },
  today: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },
  figures: { flexDirection: 'row' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 },
  deck: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 12 },
  sample: { width: 64, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  deckTitle: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  newDeck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
