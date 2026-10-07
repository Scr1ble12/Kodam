import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../lib/theme';
import { PrimaryButton, SecondaryButton, T } from './ui';

/** A small dialog for naming or renaming a list. */
export function NameModal({
  visible,
  title,
  initial,
  confirmLabel,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  initial: string;
  confirmLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [name, setName] = useState(initial);

  useEffect(() => {
    if (visible) setName(initial);
  }, [visible, initial]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <T size={18} weight="bold">
            {title}
          </T>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            selectTextOnFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={submit}
            placeholder="List name"
            placeholderTextColor={colors.muted}
            accessibilityLabel="List name"
            style={[
              styles.input,
              { borderColor: colors.line, color: colors.ink, backgroundColor: colors.bg, fontFamily: fonts.regular },
            ]}
          />
          <View style={styles.actions}>
            <SecondaryButton style={{ flex: 1 }} label="Cancel" onPress={onClose} />
            <PrimaryButton style={{ flex: 1 }} label={confirmLabel} disabled={!name.trim()} onPress={submit} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderRadius: 20, padding: 20, gap: 14, width: '100%', maxWidth: 420, alignSelf: 'center' },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 14, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 10 },
});
