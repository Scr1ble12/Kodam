import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../lib/theme';
import { SecondaryButton, T } from './ui';

/** "Are you sure?" pop-up for anything that can't be undone, with a red confirm button. */
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onClose}
          accessibilityLabel="Cancel"
        />
        <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityRole="alert">
          <T size={19} weight="bold">
            {title}
          </T>
          <T size={15} tone="muted">
            {message}
          </T>
          <View style={styles.actions}>
            <SecondaryButton style={{ flex: 1 }} label="Cancel" onPress={onClose} />
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [styles.danger, { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1 }]}
            >
              <T size={16} weight="bold" style={{ color: colors.onError }}>
                {confirmLabel}
              </T>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 22, gap: 12, width: '100%', maxWidth: 420, alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  danger: { flex: 1, minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
