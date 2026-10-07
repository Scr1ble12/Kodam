import { StyleSheet, View } from 'react-native';

import type { Word } from '../data/words';
import { useProgress } from '../lib/progress';
import { showRoman } from '../lib/roman';
import { speakTamil } from '../lib/speech';
import { useTheme } from '../lib/theme';
import { Icon, IconButton, T } from './ui';

/** Everything about a word: written and spoken Tamil, romanization, how to say it, meaning and a note. */
export function WordCard({ word, compact }: { word: Word; compact?: boolean }) {
  const { colors, settings } = useTheme();
  const progress = useProgress();
  const roman = showRoman(settings.roman, progress.stage(word.id));
  const spoken = settings.spoken === 'both' && word.spoken;

  return (
    <View style={styles.card}>
      <T size={compact ? 34 : 44} weight="medium" style={styles.center}>
        {word.tamil}
      </T>
      {roman && (
        <T size={14} tone="muted" style={styles.center}>
          {word.roman}
        </T>
      )}
      {spoken && (
        <View style={[styles.spoken, { backgroundColor: colors.track }]}>
          <T size={12} tone="muted">
            SPOKEN
          </T>
          <T size={20} weight="medium">
            {word.spoken}
          </T>
          {roman && (
            <T size={13} tone="muted">
              {word.spokenRoman}
            </T>
          )}
        </View>
      )}
      <T size={15} tone="muted" style={styles.center}>
        say “{word.say}”
      </T>
      <T size={compact ? 20 : 24} weight="bold" style={styles.center}>
        {word.english}
      </T>
      {word.note && !compact && (
        <T size={13} tone="muted" style={styles.center}>
          {word.note}
        </T>
      )}
      <View style={{ marginTop: 6 }}>
        <IconButton bordered label="Play word" onPress={() => speakTamil(word.spoken ?? word.tamil)}>
          <Icon.Speaker color={colors.ink} />
        </IconButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: 6, paddingHorizontal: 12, width: '100%' },
  center: { textAlign: 'center' },
  spoken: { alignItems: 'center', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 16, marginVertical: 4 },
});
