import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ListsProvider } from '../lib/lists';
import { ProgressProvider } from '../lib/progress';
import { RemindersProvider } from '../lib/reminders';
import { ThemeProvider, useTheme } from '../lib/theme';
import { VocabProvider } from '../lib/vocab';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <ListsProvider>
          <VocabProvider>
            <RemindersProvider>
              <Root />
            </RemindersProvider>
          </VocabProvider>
        </ListsProvider>
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
        <Stack.Screen name="deck" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="deck-edit" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
