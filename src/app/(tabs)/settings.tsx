import { useState } from 'react';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, Segmented, T } from '../../components/ui';
import { useLists } from '../../lib/lists';
import { useProgress } from '../../lib/progress';
import { describeDays, formatTime, REMINDERS_SUPPORTED, useReminders, VOCAB_TARGET } from '../../lib/reminders';
import { ACCENTS, useTheme } from '../../lib/theme';
import type { FontName, LetterSize, RomanMode, SpokenMode, ThemeName } from '../../lib/theme';

const THEMES: { id: ThemeName; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'paper', label: 'Paper' },
  { id: 'dark', label: 'Dark' },
];
const FONTS: { id: FontName; label: string }[] = [
  { id: 'mukta', label: 'Mukta' },
  { id: 'noto', label: 'Noto Sans' },
  { id: 'catamaran', label: 'Catamaran' },
];
const SIZES: { id: LetterSize; label: string }[] = [
  { id: 's', label: 'Small' },
  { id: 'm', label: 'Medium' },
  { id: 'l', label: 'Large' },
];
const ROMAN: { id: RomanMode; label: string }[] = [
  { id: 'on', label: 'Always' },
  { id: 'fade', label: 'Auto-fade' },
  { id: 'off', label: 'Off' },
];

const SPOKEN: { id: SpokenMode; label: string }[] = [
  { id: 'both', label: 'Show both' },
  { id: 'written', label: 'Written only' },
];
const NEW_WORDS = [5, 10, 15, 20].map((n) => ({ id: String(n), label: String(n) }));

export default function SettingsScreen() {
  const { colors, settings, update, letterPx } = useTheme();
  const progress = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const reminders = useReminders();
  const { lists } = useLists();
  const switchColors = { true: colors.accent, false: colors.line };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.column}>
        <View>
          <T size={13} tone="muted">
            அமைப்புகள்
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Settings
          </T>
        </View>

        <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={[styles.previewTile, { backgroundColor: colors.accent }]}>
            <T size={letterPx * 1.45} tone="onAccent">
              கா
            </T>
          </View>
          <View style={{ flex: 1 }}>
            <T size={12} tone="muted">
              Live preview
            </T>
            <T size={17} weight="medium">
              தமிழ் கற்போம்
            </T>
            {settings.roman !== 'off' && (
              <T size={13} tone="muted">
                tamiḻ kaṟpōm · let us learn Tamil
              </T>
            )}
          </View>
        </View>

        <Section title="REMINDERS">
          {reminders.reminders.map((r) => {
            const list = lists.find((l) => l.id === r.listId);
            return (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={`Reminder at ${formatTime(r.hour, r.minute)}, ${describeDays(r.days)}. Edit`}
                onPress={() => router.push({ pathname: '/reminder', params: { id: r.id } })}
                style={[styles.row, styles.rowInline, { borderBottomWidth: 1, borderBottomColor: colors.line }]}
              >
                <View style={{ flex: 1 }}>
                  <T size={20} weight="medium" tone={r.enabled ? 'ink' : 'muted'}>
                    {formatTime(r.hour, r.minute)}
                  </T>
                  <T size={13} tone="muted">
                    {describeDays(r.days)}
                    {r.listId === VOCAB_TARGET ? " · Today's words" : list ? ` · ${list.name}` : ''}
                  </T>
                </View>
                <Switch
                  value={r.enabled}
                  onValueChange={(on) => reminders.setEnabled(r.id, on)}
                  trackColor={switchColors}
                  accessibilityLabel={`Reminder at ${formatTime(r.hour, r.minute)}`}
                />
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/reminder')}
            style={[styles.row, styles.rowInline, { borderBottomWidth: 1, borderBottomColor: colors.line }]}
          >
            <View style={styles.linkLabel}>
              <Icon.Bell color={colors.accent} />
              <T size={15} weight="medium" tone="accent">
                Add a reminder
              </T>
            </View>
            <Icon.Chevron color={colors.muted} />
          </Pressable>
          <Row label="Streak saver" last>
            <View style={styles.rowInline}>
              <T size={12} tone="muted" style={{ flex: 1, paddingRight: 12 }}>
                One extra nudge at 9 PM on days you haven't practiced yet.
              </T>
              <Switch
                value={reminders.streakSaver}
                onValueChange={reminders.setStreakSaver}
                trackColor={switchColors}
                accessibilityLabel="Streak saver"
              />
            </View>
          </Row>
        </Section>
        {!REMINDERS_SUPPORTED ? (
          <T size={12} tone="muted" style={{ marginTop: -10 }}>
            Reminders are sent as notifications on your phone. They can be set up here but only fire in the iPhone or
            Android app.
          </T>
        ) : reminders.permission === 'denied' ? (
          <T size={12} tone="error" style={{ marginTop: -10 }}>
            Notifications are turned off for this app. Turn them on in your phone's Settings so reminders can reach you.
          </T>
        ) : null}

        <Section title="APPEARANCE">
          <Row label="Theme">
            <Segmented options={THEMES} value={settings.theme} onChange={(theme) => update({ theme })} />
          </Row>
          <Row label="Accent" inline>
            <View style={styles.swatches}>
              {ACCENTS.map((a) => (
                <Pressable
                  key={a.hex}
                  accessibilityRole="radio"
                  accessibilityLabel={a.name}
                  accessibilityState={{ selected: a.hex === settings.accent }}
                  onPress={() => update({ accent: a.hex })}
                  hitSlop={6}
                  style={[
                    styles.swatch,
                    { backgroundColor: a.hex, borderColor: a.hex === settings.accent ? colors.ink : 'transparent' },
                  ]}
                />
              ))}
            </View>
          </Row>
          <Row label="Tamil font">
            <Segmented options={FONTS} value={settings.font} onChange={(font) => update({ font })} />
          </Row>
          <Row label="Letter size" last>
            <Segmented options={SIZES} value={settings.size} onChange={(size) => update({ size })} />
          </Row>
        </Section>

        <Section title="LEARNING">
          <Row label="Romanization">
            <Segmented options={ROMAN} value={settings.roman} onChange={(roman) => update({ roman })} />
            <T size={12} tone="muted">
              Auto-fade hides it on letters and words you know well.
            </T>
          </Row>
          <Row label="Spoken Tamil">
            <Segmented options={SPOKEN} value={settings.spoken} onChange={(spoken) => update({ spoken })} />
            <T size={12} tone="muted">
              Shows how a word is usually said (like இல்ல for இல்லை) next to the written form.
            </T>
          </Row>
          <Row label="New words per day" last>
            <Segmented
              options={NEW_WORDS}
              value={String(settings.newWords)}
              onChange={(n) => update({ newWords: Number(n) })}
            />
          </Row>
        </Section>

        <Section title="PROGRESS">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/stats')}
            style={[styles.row, styles.rowInline, { borderBottomWidth: 1, borderBottomColor: colors.line }]}
          >
            <View style={styles.linkLabel}>
              <Icon.Chart color={colors.accent} />
              <T size={15}>Your stats</T>
            </View>
            <Icon.Chevron color={colors.muted} />
          </Pressable>
          <Row label="Reset progress" last inline>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!confirmReset) return setConfirmReset(true);
                progress.reset();
                setConfirmReset(false);
              }}
              style={[styles.reset, { backgroundColor: confirmReset ? colors.errorBg : colors.track }]}
            >
              <T size={14} weight="medium" tone={confirmReset ? 'error' : 'ink'}>
                {confirmReset ? 'Tap again to erase' : 'Reset'}
              </T>
            </Pressable>
          </Row>
        </Section>

        <T size={12} tone="muted" style={{ textAlign: 'center' }}>
          Your progress stays on this device. Nothing is sent anywhere.
        </T>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <T size={13} weight="bold" tone="muted" style={{ letterSpacing: 0.8 }}>
        {title}
      </T>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.line }]}>{children}</View>
    </View>
  );
}

function Row({ label, children, inline, last }: { label: string; children: ReactNode; inline?: boolean; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        inline && styles.rowInline,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.line },
      ]}
    >
      <T size={15}>{label}</T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 18 },
  preview: { borderRadius: 20, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  previewTile: { width: 88, height: 88, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: 16, borderWidth: 1 },
  row: { padding: 14, gap: 10 },
  rowInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkLabel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  reset: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
});
