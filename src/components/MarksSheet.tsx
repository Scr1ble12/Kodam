import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Letter } from '../data/letters';
import { useTheme } from '../lib/theme';
import { PrimaryButton, T } from './ui';

const RULES = [
  { marks: 'ā ī ū', text: 'Line on top: hold the vowel a little longer.' },
  { marks: 'ṭ ṇ ḷ', text: 'Dot below: curl your tongue tip back toward the roof of your mouth.' },
  { marks: 'ḻ ṟ ṉ', text: 'Line below: sounds special to Tamil, each with its own trick.' },
];

/** Bottom sheet explaining the romanization marks, with tips for the letters on screen. */
export function MarksSheet({ visible, letters, onClose }: { visible: boolean; letters: Letter[]; onClose: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityLabel="Close guide"
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: 24 + insets.bottom }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          <ScrollView contentContainerStyle={{ gap: 14 }}>
            <View>
              <T size={20} weight="bold">
                Reading the little marks
              </T>
              <T size={14} tone="muted">
                They are hints for your tongue, not extra things to memorize.
              </T>
            </View>
            {RULES.map((r) => (
              <View key={r.marks} style={styles.rule}>
                <T size={20} weight="medium" style={{ width: 64 }}>
                  {r.marks}
                </T>
                <T size={14} style={{ flex: 1 }}>
                  {r.text}
                </T>
              </View>
            ))}
            {letters.length > 0 && (
              <View style={[styles.tips, { backgroundColor: colors.bg }]}>
                <T size={12} weight="bold" tone="muted" style={{ letterSpacing: 0.7 }}>
                  IN THIS QUESTION
                </T>
                {letters.map((l) => (
                  <T key={l.id} size={14}>
                    <T size={14} weight="bold">
                      {l.tamil} {l.roman}
                    </T>
                    {'  '}
                    {l.hint}
                  </T>
                ))}
              </View>
            )}
          </ScrollView>
          <PrimaryButton label="Got it" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  rule: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  tips: { borderRadius: 16, padding: 14, gap: 8 },
});
