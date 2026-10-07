import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ConfirmModal } from '../components/ConfirmModal';
import { Icon, IconButton, Screen, T } from '../components/ui';
import { getLetter } from '../data/letters';
import { useLists } from '../lib/lists';
import type { LetterList } from '../lib/lists';
import { useTheme } from '../lib/theme';

/** Saved letter lists: practice, trace, rename or delete each one. */
export default function ListsScreen() {
  const { colors } = useTheme();
  const { lists, remove } = useLists();
  const [deleting, setDeleting] = useState<LetterList | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close lists" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
        </View>
        <View>
          <T size={13} tone="muted">
            பட்டியல்கள்
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Your lists
          </T>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/list-edit')}
          style={({ pressed }) => [styles.newList, { borderColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}
        >
          <Icon.Plus color={colors.accent} />
          <T size={15} weight="medium" tone="accent">
            New list
          </T>
        </Pressable>

        {lists.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <T size={15}>No lists yet.</T>
            <T size={14} tone="muted">
              Tap New list, name it, and pick the letters you want to study together.
            </T>
          </View>
        )}

        {lists.map((list) => {
          const letters = list.ids.map(getLetter).filter((l) => !!l);
          const ids = list.ids.join(',');
          return (
            <View key={list.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <T size={18} weight="medium" numberOfLines={1}>
                    {list.name}
                  </T>
                  <T size={13} tone="muted">
                    {letters.length} {letters.length === 1 ? 'letter' : 'letters'}
                  </T>
                </View>
                <IconButton
                  label={`Edit ${list.name}`}
                  onPress={() => router.push({ pathname: '/list-edit', params: { id: list.id } })}
                >
                  <Icon.Pencil color={colors.muted} size={20} />
                </IconButton>
              </View>
              <T size={20} numberOfLines={2}>
                {letters.map((l) => l!.tamil).join('  ')}
              </T>
              <View style={styles.actions}>
                <Action label="Practice" primary onPress={() => router.push({ pathname: '/drill', params: { ids } })} />
                <Action label="Trace" onPress={() => router.push({ pathname: '/trace', params: { ids } })} />
                <Action label="Delete" danger onPress={() => setDeleting(list)} />
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ConfirmModal
        visible={!!deleting}
        title={`Delete “${deleting?.name ?? ''}”?`}
        message={`This list and its ${deleting?.ids.length ?? 0} ${deleting?.ids.length === 1 ? 'letter' : 'letters'} will be removed from My lists. Your progress on the letters stays. This can't be undone.`}
        confirmLabel="Delete list"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove(deleting.id);
          setDeleting(null);
        }}
      />
    </Screen>
  );
}

function Action({
  label,
  onPress,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary
          ? { backgroundColor: colors.accent }
          : danger
            ? { backgroundColor: colors.errorBg, borderWidth: 1.5, borderColor: colors.error }
            : { backgroundColor: colors.track },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <T size={14} weight={danger ? 'bold' : 'medium'} tone={primary ? 'onAccent' : danger ? 'error' : 'ink'}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  newList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
