import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { TracePanel } from '../components/TracePanel';
import { Icon, IconButton, Screen, T } from '../components/ui';
import { getLetter } from '../data/letters';
import type { Letter } from '../data/letters';
import { useTheme } from '../lib/theme';

/** Trace a list of letters one after another (the pencil button on the Alphabet tab). */
export default function TraceScreen() {
  const { colors } = useTheme();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const letters = useMemo(
    () => (ids ?? '').split(',').map(getLetter).filter((l): l is Letter => !!l),
    [ids],
  );
  const [index, setIndex] = useState(0);
  const letter = letters[index];
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!letter) return <Redirect href="/" />;

  const last = index === letters.length - 1;

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.top}>
          <IconButton label="Close tracing" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
          <View style={[styles.track, { backgroundColor: colors.line }]}>
            <View
              style={[styles.fill, { backgroundColor: colors.accent, width: `${(index / letters.length) * 100}%` }]}
            />
          </View>
          <T size={14} tone="muted">
            {index + 1} / {letters.length}
          </T>
        </View>
        <TracePanel
          key={letter.id}
          letter={letter}
          reserve={400}
          nextLabel={last ? 'Done' : 'Next letter'}
          onNext={() => (last ? close() : setIndex(index + 1))}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 8, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
