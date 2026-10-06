import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { T } from '../../components/ui';
import { useTheme } from '../../lib/theme';

export default function VocabularyScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.column}>
        <View>
          <T size={13} tone="muted">
            சொற்கள்
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            Vocabulary
          </T>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={16} weight="medium">
            Word decks are coming soon
          </T>
          <T size={14} tone="muted">
            Start with the alphabet for now. Daily reviews, lesson units and custom decks will live here.
          </T>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
});
