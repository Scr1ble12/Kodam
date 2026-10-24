import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, PrimaryButton, T } from '../../components/ui';
import { LESSONS, UNITS, unitOf } from '../../data/lessons';
import { useLessons } from '../../lib/lessons';
import { useProgress } from '../../lib/progress';
import { useTheme } from '../../lib/theme';
import { useUnlock } from '../../lib/unlock';

/** The Lessons tab: the next lesson up top, then every unit and lesson in order. Any lesson can be opened. */
export default function LessonsScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { done, next } = useLessons();
  const finished = LESSONS.filter((l) => done[l.id]).length;
  const nextUnit = next && unitOf(next.id);
  const { isLessonLocked } = useUnlock();
  const nextLocked = !!next && isLessonLocked(next.id);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.header}>
          <View>
            <T size={13} tone="muted">
              பாடங்கள்
            </T>
            <T size={30} weight="bold" style={{ lineHeight: 36 }}>
              Lessons
            </T>
            <T size={13} tone="muted">
              {finished} of {LESSONS.length} done · about 3 minutes each
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

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={13} weight="bold" tone="accent" style={{ letterSpacing: 0.8 }}>
            {next ? (nextLocked ? 'UP NEXT · FULL UNLOCK' : finished ? 'UP NEXT' : 'START HERE') : 'ALL DONE'}
          </T>
          <T size={22} weight="bold">
            {next ? next.title : 'You finished every lesson'}
          </T>
          <T size={14} tone="muted">
            {next ? `Lesson ${LESSONS.indexOf(next) + 1} · ${nextUnit?.title} · ${next.summary}` : 'More are on the way. Replay any lesson below.'}
          </T>
          {next && (
            <PrimaryButton
              label={nextLocked ? 'See the Full Unlock' : finished ? 'Continue' : 'Start the first lesson'}
              onPress={() =>
                nextLocked ? router.push('/unlock') : router.push({ pathname: '/lesson', params: { id: next.id } })
              }
            />
          )}
        </View>

        {UNITS.map((unit, u) => (
          <View key={unit.id} style={{ gap: 8 }}>
            <View style={styles.unitHead}>
              <T size={13} weight="bold" tone="muted" style={{ letterSpacing: 0.8 }}>
                UNIT {u + 1}
              </T>
              <T size={13} tone="muted">
                {unit.tamilTitle}
              </T>
            </View>
            <T size={20} weight="bold">
              {unit.title}
            </T>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              {unit.lessons.map((lesson, i) => {
                const isDone = !!done[lesson.id];
                const isNext = next?.id === lesson.id;
                const n = LESSONS.indexOf(lesson) + 1;
                const last = i === unit.lessons.length - 1;
                const locked = isLessonLocked(lesson.id);
                return (
                  <Pressable
                    key={lesson.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Lesson ${n}: ${lesson.title}${isDone ? ', done' : isNext ? ', next' : ''}${locked ? ', part of the Full Unlock' : ''}`}
                    onPress={() =>
                      locked ? router.push('/unlock') : router.push({ pathname: '/lesson', params: { id: lesson.id } })
                    }
                    style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={styles.rail}>
                      <View
                        style={[
                          styles.node,
                          isDone || isNext
                            ? { backgroundColor: colors.accent, borderColor: colors.accent }
                            : { backgroundColor: colors.surface, borderColor: colors.line },
                        ]}
                      >
                        <T size={14} weight="bold" tone={isDone || isNext ? 'onAccent' : 'muted'}>
                          {isDone ? '✓' : n}
                        </T>
                      </View>
                      {!last && <View style={[styles.line, { backgroundColor: isDone ? colors.accent : colors.line }]} />}
                    </View>
                    <View style={[styles.text, !last && { paddingBottom: 18 }]}>
                      <View style={styles.titleRow}>
                        <T size={16} weight="medium" style={{ flexShrink: 1 }}>
                          {lesson.title}
                        </T>
                        {isNext && (
                          <View style={[styles.pill, { backgroundColor: colors.accent }]}>
                            <T size={11} weight="bold" tone="onAccent">
                              NEXT
                            </T>
                          </View>
                        )}
                      </View>
                      <T size={14} tone="muted">
                        {lesson.summary}
                      </T>
                    </View>
                    {locked ? <Icon.Lock color={colors.muted} /> : <Icon.Chevron color={colors.muted} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <T size={12} tone="muted" style={{ textAlign: 'center' }}>
          Lessons teach the letters and words you then practice in your daily reviews.
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 44, borderRadius: 999 },
  hero: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  unitHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rail: { alignItems: 'center', alignSelf: 'stretch' },
  node: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 2 },
  text: { flex: 1, gap: 2, paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
