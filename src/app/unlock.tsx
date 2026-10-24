import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Icon, IconButton, PrimaryButton, Screen, SecondaryButton, T } from '../components/ui';
import { UNITS } from '../data/lessons';
import { DECKS } from '../data/words';
import { useTheme } from '../lib/theme';
import { FREE_DECKS, FREE_UNITS, useUnlock } from '../lib/unlock';

const paidDecks = DECKS.filter((d) => !FREE_DECKS.includes(d.id));
const paidWords = paidDecks.reduce((n, d) => n + d.words.length, 0);
const paidUnits = UNITS.filter((u) => !FREE_UNITS.includes(u.id));

/** The Full Unlock screen: what's free, what the one-time purchase adds, and a grown-up check before buying. */
export default function UnlockScreen() {
  const { colors } = useTheme();
  const { unlocked, price, busy, error, buy, restore } = useUnlock();
  const [gate, setGate] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const included = [
    `${paidDecks.length} more vocabulary decks, ${paidWords} words: ${paidDecks.map((d) => d.name.toLowerCase()).join(', ')}`,
    `Lesson ${paidUnits.length === 1 ? 'unit' : 'units'} ${paidUnits.map((u) => UNITS.indexOf(u) + 1).join(' and ')}: ${paidUnits.map((u) => u.title.toLowerCase()).join(' and ')}`,
    'Every lesson and deck added in future updates',
    'Custom decks with words from any topic',
  ];
  const free = ['The whole alphabet, with tracing and quizzes', 'Lesson units 1 and 2, from the first vowel to reading real words', 'The Greetings deck', 'Lists, stats, reminders and every setting'];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.column}>
        <View style={styles.top}>
          <IconButton label="Close" onPress={close}>
            <Icon.Close color={colors.ink} />
          </IconButton>
        </View>
        <View style={{ gap: 4 }}>
          <T size={13} weight="bold" tone="accent" style={{ letterSpacing: 0.8 }}>
            FULL UNLOCK
          </T>
          <T size={30} weight="bold" style={{ lineHeight: 36 }}>
            {unlocked ? 'Everything is unlocked' : 'Unlock everything'}
          </T>
          <T size={15} tone="muted">
            {unlocked
              ? 'Thank you for supporting the app. Every deck and lesson is yours, including future ones.'
              : 'One purchase, yours for good. No subscription and no ads.'}
          </T>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
          <T size={13} weight="bold" tone="muted" style={{ letterSpacing: 0.8 }}>
            THE UNLOCK ADDS
          </T>
          {included.map((line) => (
            <View key={line} style={styles.item}>
              <T size={15} weight="bold" tone="accent">
                ✓
              </T>
              <T size={15} style={{ flex: 1 }}>
                {line}
              </T>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <T size={13} weight="bold" tone="muted" style={{ letterSpacing: 0.8 }}>
            ALWAYS FREE
          </T>
          {free.map((line) => (
            <View key={line} style={styles.item}>
              <T size={15} tone="muted">
                ✓
              </T>
              <T size={15} tone="muted" style={{ flex: 1 }}>
                {line}
              </T>
            </View>
          ))}
        </View>

        {error && (
          <T size={14} tone="error" style={{ textAlign: 'center' }}>
            {error}
          </T>
        )}

        {unlocked ? (
          <PrimaryButton label="Done" onPress={close} />
        ) : (
          <>
            <PrimaryButton
              label={busy ? 'Waiting for the store…' : price ? `Unlock for ${price}` : 'Unlock everything'}
              disabled={busy}
              onPress={() => setGate(true)}
            />
            <SecondaryButton label="Restore an earlier purchase" onPress={() => !busy && restore()} />
          </>
        )}
        <T size={12} tone="muted" style={{ textAlign: 'center' }}>
          Paid once through the App Store or Google Play. We never see your payment details, and the app collects no data.
        </T>
      </ScrollView>
      <ParentGate
        visible={gate}
        onClose={() => setGate(false)}
        onPass={() => {
          setGate(false);
          buy();
        }}
      />
    </Screen>
  );
}

const pick = () => 6 + Math.floor(Math.random() * 4);

/** "Ask a grown-up": a multiplication question before any purchase, so children can't buy by accident. */
function ParentGate({ visible, onClose, onPass }: { visible: boolean; onClose: () => void; onPass: () => void }) {
  const { colors, fonts } = useTheme();
  const [q, setQ] = useState(() => [pick(), pick()]);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const reset = () => {
    setQ([pick(), pick()]);
    setAnswer('');
    setWrong(false);
  };
  const check = () => {
    if (Number(answer) === q[0] * q[1]) {
      reset();
      onPass();
    } else {
      reset();
      setWrong(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cancel">
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <T size={20} weight="bold">
            Ask a grown-up
          </T>
          <T size={15} tone="muted">
            To keep purchases with parents, please answer:
          </T>
          <T size={28} weight="bold" style={{ textAlign: 'center', marginVertical: 6 }}>
            {q[0]} × {q[1]} = ?
          </T>
          <TextInput
            value={answer}
            onChangeText={(t) => setAnswer(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            onSubmitEditing={check}
            accessibilityLabel="Answer"
            style={[
              styles.input,
              { borderColor: wrong ? colors.error : colors.line, color: colors.ink, fontFamily: fonts.medium },
            ]}
          />
          {wrong && (
            <T size={13} tone="error">
              Not quite. Here's a new one.
            </T>
          )}
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                label="Cancel"
                onPress={() => {
                  reset();
                  onClose();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Continue" disabled={!answer} onPress={check} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, paddingTop: 8, gap: 16 },
  top: { flexDirection: 'row' },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10 },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 20, gap: 8 },
  input: { borderWidth: 1.5, borderRadius: 12, minHeight: 52, fontSize: 22, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
