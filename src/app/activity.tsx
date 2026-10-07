import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Icon, IconButton, Screen, T } from '../components/ui';
import { dayKey, useProgress } from '../lib/progress';
import { useTheme } from '../lib/theme';

const DAY = 24 * 60 * 60 * 1000;
const WEEKS = 12;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Opened from the streak pill: streaks, a 12-week grid of visits, and the last 7 days. */
export default function ActivityScreen() {
  const { colors } = useTheme();
  const { streak, bestStreak, days, activity } = useProgress();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Grid columns are weeks (oldest on the left), rows are Monday to Sunday.
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = today.getTime() - (mondayOffset + (WEEKS - 1) * 7) * DAY;
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const t = start + (w * 7 + d) * DAY;
      return t > today.getTime() ? null : (activity[dayKey(t)]?.opens ?? 0);
    }),
  );
  const shade = (n: number) => (n >= 5 ? 1 : n >= 3 ? 0.75 : n === 2 ? 0.55 : 0.35);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const t = today.getTime() - i * DAY;
    const a = activity[dayKey(t)] ?? { opens: 0, answers: 0 };
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(t).toLocaleDateString(undefined, { weekday: 'long' });
    return { key: dayKey(t), label, ...a };
  });
  const weekOpens = last7.reduce((n, d) => n + d.opens, 0);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close activity" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
        </View>
        <View>
          <T size={13} tone="muted">
            செயல்பாடு
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Activity
          </T>
        </View>

        <View style={styles.tiles}>
          <Tile value={streak} label="day streak" highlight />
          <Tile value={bestStreak} label="best streak" />
          <Tile value={days.length} label="days practiced" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={15} weight="medium">
            Visits, last {WEEKS} weeks
          </T>
          <View style={styles.grid}>
            <View style={styles.week}>
              {WEEKDAYS.map((d, i) => (
                <T key={i} size={10} tone="muted" style={styles.dayLabel}>
                  {d}
                </T>
              ))}
            </View>
            {weeks.map((week, w) => (
              <View key={w} style={styles.week}>
                {week.map((n, d) => (
                  <View
                    key={d}
                    accessibilityLabel={n === null ? undefined : `${n} visits`}
                    style={[
                      styles.cell,
                      n === null
                        ? { backgroundColor: 'transparent' }
                        : n === 0
                          ? { backgroundColor: colors.track }
                          : { backgroundColor: colors.accent, opacity: shade(n) },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
          <T size={12} tone="muted">
            Darker squares mean more visits that day.
          </T>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={15} weight="medium">
            Last 7 days · {weekOpens} {weekOpens === 1 ? 'visit' : 'visits'}
          </T>
          {last7.map((d) => (
            <View key={d.key} style={[styles.row, { borderTopColor: colors.line }]}>
              <T size={14} style={{ flex: 1 }}>
                {d.label}
              </T>
              <T size={14} tone="muted">
                {d.opens} {d.opens === 1 ? 'visit' : 'visits'} · {d.answers} {d.answers === 1 ? 'answer' : 'answers'}
              </T>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Tile({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        highlight
          ? { backgroundColor: colors.streakBg, borderColor: colors.streakBg }
          : { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      {highlight && <Icon.Flame color={colors.streakInk} />}
      <T size={26} weight="bold" style={highlight ? { color: colors.streakInk } : undefined}>
        {value}
      </T>
      <T size={12} tone="muted" style={highlight ? { color: colors.streakInk } : undefined}>
        {label}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row' },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'flex-start', gap: 0 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  grid: { flexDirection: 'row', gap: 4 },
  week: { flex: 1, gap: 4 },
  dayLabel: { height: 18, lineHeight: 18, textAlign: 'center' },
  cell: { aspectRatio: 1, borderRadius: 4, maxHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
});
