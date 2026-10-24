import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, IconButton, Screen, T } from '../components/ui';
import { LESSONS, UNITS } from '../data/lessons';
import { useLessons } from '../lib/lessons';
import { useTheme } from '../lib/theme';

/** The lesson path: every unit and lesson, in order. Any lesson can be opened. */
export default function LessonsScreen() {
  const { colors } = useTheme();
  const { done, next } = useLessons();
  const finished = LESSONS.filter((l) => done[l.id]).length;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close lessons" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
        </View>
        <View>
          <T size={13} tone="muted">
            பாடங்கள்
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Lessons
          </T>
          <T size={13} tone="muted">
            {finished} of {LESSONS.length} done · each takes about 3 minutes
          </T>
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
                return (
                  <Pressable
                    key={lesson.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Lesson ${n}: ${lesson.title}${isDone ? ', done' : isNext ? ', next' : ''}`}
                    onPress={() => router.push({ pathname: '/lesson', params: { id: lesson.id } })}
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
                    <Icon.Chevron color={colors.muted} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 18 },
  top: { flexDirection: 'row' },
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
