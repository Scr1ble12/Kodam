import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Segmented, T } from '../../components/ui';
import { useProgress } from '../../lib/progress';
import { ACCENTS, useTheme } from '../../lib/theme';
import type { FontName, LetterSize, RomanMode, ThemeName } from '../../lib/theme';

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

export default function SettingsScreen() {
  const { colors, settings, update, letterPx } = useTheme();
  const progress = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

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
          <Row label="Romanization" last>
            <Segmented options={ROMAN} value={settings.roman} onChange={(roman) => update({ roman })} />
            <T size={12} tone="muted">
              Auto-fade hides it on letters you know well.
            </T>
          </Row>
        </Section>

        <Section title="PROGRESS">
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
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  reset: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center' },
});
