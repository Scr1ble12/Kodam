import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { LESSONS, unitOf } from '../data/lessons';
import { useLessons } from '../lib/lessons';
import { useTheme } from '../lib/theme';
import { Icon, T } from './ui';

/** "Continue lesson" card: opens the next unfinished lesson, or the lesson path once all are done. */
export function ContinueLesson() {
  const { colors } = useTheme();
  const { next, done } = useLessons();
  const finished = LESSONS.filter((l) => done[l.id]).length;
  const unit = next && unitOf(next.id);
  const started = finished > 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={next ? `${started ? 'Continue' : 'Start'} lesson: ${next.title}` : 'All lessons'}
        onPress={() =>
          next ? router.push({ pathname: '/lesson', params: { id: next.id } }) : router.push('/lessons')
        }
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.7 : 1 }]}
      >
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <T size={15} weight="bold" tone="onAccent">
            {next ? LESSONS.indexOf(next) + 1 : '✓'}
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={12} weight="bold" tone="accent" style={{ letterSpacing: 0.6 }}>
            {next ? (started ? 'CONTINUE LESSON' : 'START HERE') : 'ALL LESSONS DONE'}
          </T>
          <T size={15} weight="medium" numberOfLines={1}>
            {next ? `${unit?.title} · ${next.title}` : 'Replay any lesson'}
          </T>
        </View>
        <Icon.Chevron color={colors.muted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/lessons')}
        hitSlop={8}
        style={({ pressed }) => [styles.all, { borderLeftColor: colors.line, opacity: pressed ? 0.7 : 1 }]}
      >
        <T size={13} weight="medium" tone="accent">
          All
        </T>
        <T size={11} tone="muted">
          {finished}/{LESSONS.length}
        </T>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'stretch', borderRadius: 16, borderWidth: 1 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  all: { width: 60, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1 },
});
