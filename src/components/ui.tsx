import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../lib/theme';

/**
 * A full-screen page padded clear of the notch, Dynamic Island and home bar.
 * Uses the insets directly so it also works inside stack screens without a header.
 */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: insets.bottom,
      }}
    >
      {children}
    </View>
  );
}

type Tone = 'ink' | 'muted' | 'accent' | 'onAccent' | 'error';

export function T({
  children,
  size = 15,
  weight = 'regular',
  tone = 'ink',
  style,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  weight?: 'regular' | 'medium' | 'bold';
  tone?: Tone;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  const { colors, fonts } = useTheme();
  const color = tone === 'error' ? colors.errorInk : colors[tone];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.35), color }, style]}
    >
      {children}
    </Text>
  );
}

/** A pill-shaped segmented control, as in the design canvas. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: K; label: string }[];
  value: K;
  onChange: (id: K) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: colors.track }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            style={[styles.segItem, on && [styles.segOn, { backgroundColor: colors.surface }]]}
          >
            <T size={13} weight={on ? 'medium' : 'regular'} tone={on ? 'ink' : 'muted'}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: disabled ? colors.line : colors.accent, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <T size={16} weight="medium" tone={disabled ? 'muted' : 'onAccent'}>
        {label}
      </T>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <T size={16} weight="medium">
        {label}
      </T>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  children,
  bordered,
  size = 44,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
  bordered?: boolean;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.icon,
        { width: size, height: size },
        bordered && { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

type IconProps = { color: string; size?: number };

const stroke = (color: string, w = 1.8) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const Icon = {
  Flame: ({ color, size = 18 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke(color, 2)} d="M12 2.5c.8 3.6 4.5 5.2 4.5 10a4.5 4.5 0 0 1-9 0c0-2 .9-3.4 1.9-4.4.1 1.9 1 2.9 2 2.9-.3-2.9-.8-5.3.6-8.5z" />
    </Svg>
  ),
  Close: ({ color, size = 22 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke(color, 2)} d="M6 6l12 12M18 6L6 18" />
    </Svg>
  ),
  Speaker: ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke(color)} d="M11 5L6 9H2v6h4l5 4z" />
      <Path {...stroke(color)} d="M15.5 8.5a5 5 0 0 1 0 7" />
      <Path {...stroke(color)} d="M19 5a10 10 0 0 1 0 14" />
    </Svg>
  ),
  Pencil: ({ color, size = 22 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke(color)} d="M12 20h9" />
      <Path {...stroke(color)} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  ),
  Info: ({ color, size = 18 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...stroke(color, 2)} cx={12} cy={12} r={9} />
      <Path {...stroke(color, 2)} d="M12 11v5M12 8h.01" />
    </Svg>
  ),
  Gear: ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...stroke(color)} cx={12} cy={12} r={3} />
      <Path {...stroke(color)} d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
    </Svg>
  ),
  Undo: ({ color, size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke(color)} d="M9 14L4 9l5-5" />
      <Path {...stroke(color)} d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </Svg>
  ),
};

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12 },
  segItem: { flex: 1, minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segOn: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  primary: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  icon: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
