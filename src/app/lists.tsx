import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NameModal } from '../components/NameModal';
import { Icon, IconButton, Screen, T } from '../components/ui';
import { getLetter } from '../data/letters';
import { useLists } from '../lib/lists';
import type { LetterList } from '../lib/lists';
import { useTheme } from '../lib/theme';

/** Saved letter lists: practice, trace, rename or delete each one. */
export default function ListsScreen() {
  const { colors } = useTheme();
  const { lists, rename, remove } = useLists();
  const [renaming, setRenaming] = useState<LetterList | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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

        {lists.length === 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <T size={15}>No lists yet.</T>
            <T size={14} tone="muted">
              On the Alphabet tab, tap the letters you want, then tap Save list.
            </T>
          </View>
        )}

        {lists.map((list) => {
          const letters = list.ids.map(getLetter).filter((l) => !!l);
          const ids = list.ids.join(',');
          const deleting = confirmDelete === list.id;
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
                <IconButton label={`Rename ${list.name}`} onPress={() => setRenaming(list)}>
                  <Icon.Pencil color={colors.muted} size={20} />
                </IconButton>
              </View>
              <T size={20} numberOfLines={2}>
                {letters.map((l) => l!.tamil).join('  ')}
              </T>
              <View style={styles.actions}>
                <Action label="Practice" primary onPress={() => router.push({ pathname: '/drill', params: { ids } })} />
                <Action label="Trace" onPress={() => router.push({ pathname: '/trace', params: { ids } })} />
                <Action
                  label={deleting ? 'Tap to delete' : 'Delete'}
                  danger={deleting}
                  onPress={() => (deleting ? (remove(list.id), setConfirmDelete(null)) : setConfirmDelete(list.id))}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
      <NameModal
        visible={!!renaming}
        title="Rename list"
        initial={renaming?.name ?? ''}
        confirmLabel="Save"
        onClose={() => setRenaming(null)}
        onSubmit={(name) => {
          if (renaming) rename(renaming.id, name);
          setRenaming(null);
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
            ? { backgroundColor: colors.errorBg }
            : { backgroundColor: colors.track },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <T size={14} weight="medium" tone={primary ? 'onAccent' : danger ? 'error' : 'ink'}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 14 },
  top: { flexDirection: 'row' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
