import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Icon, IconButton, PrimaryButton, Screen, T } from '../components/ui';
import { LETTERS, SEGMENTS } from '../data/letters';
import type { Letter } from '../data/letters';
import { WORDS } from '../data/words';
import { dayKey, useProgress } from '../lib/progress';
import type { Stage } from '../lib/progress';
import { useTheme } from '../lib/theme';

const DAY = 24 * 60 * 60 * 1000;
const WEEKS = 12;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
/** Stages from strongest to weakest, as they stack in the bars. */
const STAGES: { id: Stage; label: string; opacity: number }[] = [
  { id: 'mastered', label: 'Mastered', opacity: 1 },
  { id: 'familiar', label: 'Familiar', opacity: 0.6 },
  { id: 'learning', label: 'Learning', opacity: 0.3 },
];
/** A letter needs this many answers before its accuracy counts toward "trickiest". */
const MIN_SEEN = 3;
const COUNTED = LETTERS.filter((l) => l.group !== 'grantha');

/** Opened from the streak pill or Settings: streaks, letter progress, accuracy, time and visits. */
export default function StatsScreen() {
  const { colors } = useTheme();
  const progress = useProgress();
  const { streak, bestStreak, days, activity } = progress;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const now = today.getTime();
  const mondayOffset = (today.getDay() + 6) % 7;

  // Letter progress
  const countStages = (letters: readonly Letter[]) => {
    const n: Record<Stage, number> = { new: 0, learning: 0, familiar: 0, mastered: 0 };
    letters.forEach((l) => n[progress.stage(l.id)]++);
    return n;
  };
  const overall = countStages(COUNTED);

  // Accuracy
  const answered = LETTERS.map((l) => ({ l, p: progress.get(l.id) })).filter((x) => x.p.seen > 0);
  const totalSeen = answered.reduce((n, x) => n + x.p.seen, 0);
  const totalCorrect = answered.reduce((n, x) => n + x.p.correct, 0);
  const trickiest = answered
    .filter((x) => x.p.seen >= MIN_SEEN && x.p.correct < x.p.seen)
    .sort((a, b) => a.p.correct / a.p.seen - b.p.correct / b.p.seen || b.p.seen - a.p.seen)
    .slice(0, 4);

  // Vocabulary
  const weekStart = now - mondayOffset * DAY - 12 * 60 * 60 * 1000;
  const wordStats = WORDS.map((w) => progress.get(w.id));
  const wordsStarted = wordStats.filter((p) => p.seen > 0).length;
  const wordsKnown = WORDS.filter((w) => ['familiar', 'mastered'].includes(progress.stage(w.id))).length;
  const wordSeen = wordStats.reduce((n, p) => n + p.seen, 0);
  const wordCorrect = wordStats.reduce((n, p) => n + p.correct, 0);
  const wordsThisWeek = wordStats.filter((p) => (p.firstSeen ?? 0) >= weekStart).length;

  // This week (Monday to Sunday), minutes in the app per day
  const week = Array.from({ length: 7 }, (_, d) => {
    const t = now - (mondayOffset - d) * DAY;
    const a = activity[dayKey(t)];
    let secs = a?.seconds ?? 0;
    if (d === mondayOffset) secs += progress.unsavedSeconds();
    return { label: WEEKDAYS[d], today: d === mondayOffset, minutes: Math.round(secs / 60), answers: a?.answers ?? 0 };
  });
  const weekMinutes = week.reduce((n, d) => n + d.minutes, 0);
  const weekAnswers = week.reduce((n, d) => n + d.answers, 0);
  const maxMinutes = Math.max(10, ...week.map((d) => d.minutes));

  // 12-week grid of visits: columns are weeks (oldest on the left), rows are Monday to Sunday.
  const start = now - (mondayOffset + (WEEKS - 1) * 7) * DAY;
  const grid = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const t = start + (w * 7 + d) * DAY;
      return t > now ? null : (activity[dayKey(t)]?.opens ?? 0);
    }),
  );
  const shade = (n: number) => (n >= 5 ? 1 : n >= 3 ? 0.75 : n === 2 ? 0.55 : 0.35);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const t = now - i * DAY;
    const a = activity[dayKey(t)] ?? { opens: 0, answers: 0 };
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(t).toLocaleDateString(undefined, { weekday: 'long' });
    return { key: dayKey(t), label, opens: a.opens, answers: a.answers };
  });

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.line }];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close stats" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
        </View>
        <View>
          <T size={13} tone="muted">
            புள்ளிவிவரம்
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Your stats
          </T>
        </View>

        <View style={styles.tiles}>
          <Tile value={streak} label="day streak" highlight />
          <Tile value={bestStreak} label="best streak" />
          <Tile value={days.length} label="days practiced" />
        </View>

        <View style={card}>
          <View style={styles.cardTitle}>
            <T size={15} weight="medium">
              Alphabet
            </T>
            <T size={13} tone="muted">
              {overall.mastered} of {COUNTED.length} mastered
            </T>
          </View>
          <StageBar counts={overall} total={COUNTED.length} height={12} />
          <View style={styles.legend}>
            {STAGES.map((s) => (
              <View key={s.id} style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: colors.accent, opacity: s.opacity }]} />
                <T size={12} tone="muted">
                  {s.label} {overall[s.id]}
                </T>
              </View>
            ))}
            <View style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: colors.track }]} />
              <T size={12} tone="muted">
                New {overall.new}
              </T>
            </View>
          </View>
          {SEGMENTS.map((seg) => {
            const n = countStages(seg.letters);
            const started = seg.letters.length - n.new;
            return (
              <View key={seg.id} style={[styles.segRow, { borderTopColor: colors.line }]}>
                <View style={styles.cardTitle}>
                  <T size={14}>{seg.label}</T>
                  <T size={12} tone="muted">
                    {started} of {seg.letters.length} started
                  </T>
                </View>
                <StageBar counts={n} total={seg.letters.length} height={6} />
              </View>
            );
          })}
        </View>

        <View style={card}>
          <View style={styles.cardTitle}>
            <T size={15} weight="medium">
              Vocabulary
            </T>
            <T size={13} tone="muted">
              {wordsKnown} of {WORDS.length} known
            </T>
          </View>
          <View style={styles.tiles}>
            <Figure value={`${wordsStarted}`} label="words started" />
            <Figure value={wordSeen ? `${Math.round((wordCorrect / wordSeen) * 100)}%` : '–'} label="reviews right" />
            <Figure value={`${wordsThisWeek}`} label="added this week" />
          </View>
          <T size={12} tone="muted">
            A word counts as known once you've got it right both ways and it isn't due for a week.
          </T>
        </View>

        <View style={card}>
          <T size={15} weight="medium">
            Letters track record
          </T>
          <View style={styles.tiles}>
            <Figure value={totalSeen ? `${Math.round((totalCorrect / totalSeen) * 100)}%` : '–'} label="right overall" />
            <Figure value={`${totalSeen}`} label="answers ever" />
            <Figure value={`${weekAnswers}`} label="answers this week, all" />
          </View>
          <T size={14} weight="medium" style={{ marginTop: 4 }}>
            Trickiest letters
          </T>
          {trickiest.length === 0 ? (
            <T size={13} tone="muted">
              Answer a few more questions and the letters you miss most will show up here.
            </T>
          ) : (
            <>
              <View style={styles.tricky}>
                {trickiest.map(({ l, p }) => (
                  <View key={l.id} style={[styles.trickyCell, { backgroundColor: colors.bg, borderColor: colors.line }]}>
                    <T size={26}>{l.tamil}</T>
                    <T size={12} tone="muted">
                      {l.roman} · {Math.round((p.correct / p.seen) * 100)}%
                    </T>
                  </View>
                ))}
              </View>
              <PrimaryButton
                label={trickiest.length === 1 ? 'Drill this letter' : `Drill these ${trickiest.length}`}
                onPress={() =>
                  router.push({ pathname: '/drill', params: { ids: trickiest.map((x) => x.l.id).join(',') } })
                }
              />
            </>
          )}
        </View>

        <View style={card}>
          <View style={styles.cardTitle}>
            <T size={15} weight="medium">
              Time in the app this week
            </T>
            <T size={13} tone="muted">
              {weekMinutes} min
            </T>
          </View>
          <View style={styles.chart}>
            {week.map((d, i) => (
              <View key={i} style={styles.chartCol} accessibilityLabel={`${d.label}: ${d.minutes} minutes`}>
                <T size={11} tone="muted" style={{ opacity: d.minutes > 0 ? 1 : 0 }}>
                  {d.minutes}
                </T>
                <View style={styles.chartTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${(d.minutes / maxMinutes) * 100}%`,
                        backgroundColor: colors.accent,
                        opacity: d.today ? 1 : 0.55,
                      },
                    ]}
                  />
                </View>
                <View style={[styles.baseline, { backgroundColor: colors.line }]} />
                <T size={11} weight={d.today ? 'bold' : 'regular'} tone={d.today ? 'ink' : 'muted'}>
                  {d.label}
                </T>
              </View>
            ))}
          </View>
          <T size={12} tone="muted">
            Minutes with the app open, counted from this version on.
          </T>
        </View>

        <View style={card}>
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
            {grid.map((wk, w) => (
              <View key={w} style={styles.week}>
                {wk.map((n, d) => (
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

/** One bar split into Mastered, Familiar and Learning, with New as the empty track. */
function StageBar({ counts, total, height }: { counts: Record<Stage, number>; total: number; height: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stageBar, { height, backgroundColor: colors.track, borderRadius: height / 2 }]}>
      {STAGES.map((s) =>
        counts[s.id] > 0 ? (
          <View
            key={s.id}
            style={{
              width: `${(counts[s.id] / total) * 100}%`,
              minWidth: 3,
              backgroundColor: colors.accent,
              opacity: s.opacity,
            }}
          />
        ) : null,
      )}
    </View>
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

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T size={22} weight="bold">
        {value}
      </T>
      <T size={12} tone="muted">
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
  cardTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  stageBar: { flexDirection: 'row', overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  segRow: { borderTopWidth: 1, paddingTop: 10, gap: 6 },
  tricky: { flexDirection: 'row', gap: 8 },
  trickyCell: { flex: 1, borderRadius: 14, borderWidth: 1, alignItems: 'center', paddingVertical: 10 },
  chart: { flexDirection: 'row', gap: 8, height: 140 },
  chartCol: { flex: 1, alignItems: 'center', gap: 4 },
  chartTrack: { flex: 1, width: '100%', maxWidth: 28, justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  baseline: { height: 1, alignSelf: 'stretch', marginTop: -4 },
  grid: { flexDirection: 'row', gap: 4 },
  week: { flex: 1, gap: 4 },
  dayLabel: { height: 18, lineHeight: 18, textAlign: 'center' },
  cell: { aspectRatio: 1, borderRadius: 4, maxHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
});
