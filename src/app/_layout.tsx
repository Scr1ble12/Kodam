import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LessonsProvider } from '../lib/lessons';
import { ListsProvider } from '../lib/lists';
import { ProgressProvider } from '../lib/progress';
import { RemindersProvider } from '../lib/reminders';
import { ThemeProvider, useTheme } from '../lib/theme';
import { UnlockProvider } from '../lib/unlock';
import { VocabProvider } from '../lib/vocab';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <UnlockProvider>
          <ListsProvider>
            <VocabProvider>
              <LessonsProvider>
                <RemindersProvider>
                  <Root />
                </RemindersProvider>
              </LessonsProvider>
            </VocabProvider>
          </ListsProvider>
        </UnlockProvider>
      </ProgressProvider>
    </ThemeProvider>
  );
}

function Root() {
  const { colors, dark } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="drill" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="trace" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="lists" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="list-edit" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="stats" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="reminder" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="review" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="lesson" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="unlock" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="deck" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="deck-edit" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
