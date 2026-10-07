import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProgressProvider } from '../lib/progress';
import { ThemeProvider, useTheme } from '../lib/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProgressProvider>
        <Root />
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
      </Stack>
    </>
  );
}
