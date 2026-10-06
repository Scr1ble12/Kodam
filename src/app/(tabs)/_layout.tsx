import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import type { ColorValue } from 'react-native';

import { Icon } from '../../components/ui';
import { useTheme } from '../../lib/theme';

export default function TabsLayout() {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const glyph = (text: string) =>
    function TabGlyph({ color }: { color: ColorValue }) {
      return <Text style={{ fontFamily: fonts.medium, fontSize: 20, lineHeight: 26, color }}>{text}</Text>;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        // Tamil fonts sit taller than Latin ones, so the bar gets a little extra room.
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Alphabet', tabBarIcon: glyph('அ') }} />
      <Tabs.Screen name="vocabulary" options={{ title: 'Vocabulary', tabBarIcon: glyph('சொ') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Icon.Gear color={String(color)} /> }} />
    </Tabs>
  );
}
