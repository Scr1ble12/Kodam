import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ConfirmModal } from '../components/ConfirmModal';
import { Icon, IconButton, PrimaryButton, Screen, T } from '../components/ui';
import { useLists } from '../lib/lists';
import { describeDays, useReminders, VOCAB_TARGET } from '../lib/reminders';
import type { Reminder } from '../lib/reminders';
import { useTheme } from '../lib/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PRESETS = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [0, 1, 2, 3, 4] },
  { label: 'Weekends', days: [5, 6] },
];

/** Add a practice reminder, or change one (`?id=`). */
export default function ReminderScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { reminders, save, remove } = useReminders();
  const { lists } = useLists();
  const existing = reminders.find((r) => r.id === id);

  const [hour, setHour] = useState(existing?.hour ?? 19);
  const [minute, setMinute] = useState(existing?.minute ?? 0);
  const [days, setDays] = useState<number[]>(existing?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [listId, setListId] = useState<string | undefined>(existing?.listId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const submit = async () => {
    const r: Reminder = {
      id: existing?.id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      enabled: true,
      hour,
      minute,
      days,
      listId: listId === VOCAB_TARGET || lists.some((l) => l.id === listId) ? listId : undefined,
    };
    await save(r);
    close();
  };

  const card = [styles.card, { backgroundColor: colors.surface, borderColor: colors.line }];
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const pm = hour >= 12;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          <T size={17} weight="bold">
            {existing ? 'Edit reminder' : 'New reminder'}
          </T>
          <View style={{ width: 44 }} />
        </View>

        <View style={card}>
          <T size={13} weight="bold" tone="muted" style={styles.label}>
            TIME
          </T>
          <View style={styles.timeRow}>
            <Stepper
              value={String(h12)}
              label="hour"
              onUp={() => setHour((h) => (h + 1) % 24)}
              onDown={() => setHour((h) => (h + 23) % 24)}
            />
            <T size={40} weight="bold" style={{ lineHeight: 48 }}>
              :
            </T>
            <Stepper
              value={String(minute).padStart(2, '0')}
              label="minute"
              onUp={() => setMinute((m) => (m + 5) % 60)}
              onDown={() => setMinute((m) => (m + 55) % 60)}
            />
            <View style={[styles.ampm, { backgroundColor: colors.track }]}>
              {(['AM', 'PM'] as const).map((p) => {
                const on = (p === 'PM') === pm;
                return (
                  <Pressable
                    key={p}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => !on && setHour((h) => (h + 12) % 24)}
                    style={[styles.ampmItem, on && { backgroundColor: colors.surface }]}
                  >
                    <T size={14} weight={on ? 'bold' : 'regular'} tone={on ? 'ink' : 'muted'}>
                      {p}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={card}>
          <View style={styles.titleRow}>
            <T size={13} weight="bold" tone="muted" style={styles.label}>
              DAYS
            </T>
            <T size={13} tone="muted">
              {describeDays(days)}
            </T>
          </View>
          <View style={styles.days}>
            {DAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={i}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={DAY_LABELS[i]}
                  onPress={() => toggleDay(i)}
                  style={[
                    styles.day,
                    on
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                >
                  <T size={15} weight="medium" tone={on ? 'onAccent' : 'ink'}>
                    {d}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chips}>
            {PRESETS.map((p) => (
              <Chip key={p.label} label={p.label} on={p.days.join() === [...days].sort().join()} onPress={() => setDays(p.days)} />
            ))}
          </View>
        </View>

        <View style={card}>
          <T size={13} weight="bold" tone="muted" style={styles.label}>
            WHAT TO PRACTICE
          </T>
          <View style={styles.chips}>
            <Chip label="Anything" on={!listId} onPress={() => setListId(undefined)} />
            <Chip label="Today's words" on={listId === VOCAB_TARGET} onPress={() => setListId(VOCAB_TARGET)} />
            {lists.map((l) => (
              <Chip key={l.id} label={l.name} on={listId === l.id} onPress={() => setListId(l.id)} />
            ))}
          </View>
          <T size={12} tone="muted">
            {lists.length === 0
              ? 'Tapping the reminder opens what you pick. Save a letter list on the Alphabet tab to see it here.'
              : 'Tapping the reminder opens what you pick.'}
          </T>
        </View>

        <PrimaryButton label="Save reminder" disabled={days.length === 0} onPress={submit} />
        {existing && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setConfirmDelete(true)}
            style={[styles.delete, { backgroundColor: colors.errorBg, borderColor: colors.error }]}
          >
            <T size={15} weight="bold" tone="error">
              Delete reminder
            </T>
          </Pressable>
        )}
      </ScrollView>
      <ConfirmModal
        visible={confirmDelete}
        title="Delete this reminder?"
        message="You won't get this notification any more. This can't be undone."
        confirmLabel="Delete"
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (existing) remove(existing.id);
          close();
        }}
      />
    </Screen>
  );
}

function Stepper({ value, label, onUp, onDown }: { value: string; label: string; onUp: () => void; onDown: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepper}>
      <IconButton label={`Later ${label}`} onPress={onUp}>
        <Icon.Up color={colors.muted} />
      </IconButton>
      <T size={40} weight="bold" style={{ lineHeight: 48, minWidth: 56, textAlign: 'center' }}>
        {value}
      </T>
      <IconButton label={`Earlier ${label}`} onPress={onDown}>
        <Icon.Down color={colors.muted} />
      </IconButton>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[
        styles.chip,
        on ? { backgroundColor: colors.ink, borderColor: colors.ink } : { backgroundColor: colors.surface, borderColor: colors.line },
      ]}
    >
      <T size={13} weight="medium" style={{ color: on ? colors.bg : colors.ink }}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 4, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { letterSpacing: 0.8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  stepper: { alignItems: 'center' },
  ampm: { marginLeft: 10, padding: 4, borderRadius: 12, gap: 4 },
  ampmItem: { minHeight: 40, minWidth: 52, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  delete: { minHeight: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
