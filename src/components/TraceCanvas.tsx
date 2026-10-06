import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import type { Glyph } from '../data/glyphs.generated';
import type { Stroke } from '../lib/tracing';
import { useTheme } from '../lib/theme';

/**
 * How much of the letter to show while tracing. The steps fade the support
 * away: the full letter, then a faint outline, then nothing (from memory).
 */
export type GuideLevel = 'full' | 'faint' | 'none';

type Props = {
  glyph: Glyph;
  guide: GuideLevel;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  /** Show the letter on top of the ink after checking, so the learner can compare. */
  reveal?: boolean;
  disabled?: boolean;
  /** Side length in px. */
  side: number;
};

const BOX = 1000;

function toPath(s: Stroke) {
  if (s.length < 2) return '';
  let d = `M${s[0].toFixed(0)} ${s[1].toFixed(0)}`;
  if (s.length === 2) d += `L${(s[0] + 0.1).toFixed(1)} ${s[1].toFixed(0)}`;
  for (let i = 2; i < s.length; i += 2) d += `L${s[i].toFixed(0)} ${s[i + 1].toFixed(0)}`;
  return d;
}

export function TraceCanvas({ glyph, guide, strokes, onStrokesChange, reveal, disabled, side }: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState(0);
  const sizeRef = useRef(0);
  // The responder is created once, so it reads the latest props through refs.
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const onChangeRef = useRef(onStrokesChange);
  onChangeRef.current = onStrokesChange;
  const live = useRef<Stroke | null>(null);
  const [, redraw] = useState(0);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const k = BOX / (sizeRef.current || 1);
          live.current = [e.nativeEvent.locationX * k, e.nativeEvent.locationY * k];
          redraw((n) => n + 1);
        },
        onPanResponderMove: (e) => {
          const s = live.current;
          if (!s) return;
          const k = BOX / (sizeRef.current || 1);
          const x = e.nativeEvent.locationX * k;
          const y = e.nativeEvent.locationY * k;
          // Skip jitter so long strokes stay light.
          if (Math.hypot(x - s[s.length - 2], y - s[s.length - 1]) < 4) return;
          s.push(x, y);
          redraw((n) => n + 1);
        },
        onPanResponderRelease: () => finish(),
        onPanResponderTerminate: () => finish(),
      }),
    [disabled],
  );

  function finish() {
    if (live.current) onChangeRef.current([...strokesRef.current, live.current]);
    live.current = null;
    redraw((n) => n + 1);
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    sizeRef.current = w;
    setSize(w);
  };

  const ink = Math.max(44, Math.min(glyph.stroke * 0.7, 80));
  const all = live.current ? [...strokes, live.current] : strokes;

  return (
    <View
      style={[styles.box, { width: side, height: side, backgroundColor: colors.surface, borderColor: colors.line }]}
      onLayout={onLayout}
      {...responder.panHandlers}
    >
      {size > 0 && (
        <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} pointerEvents="none">
          <Line x1={0} y1={BOX / 2} x2={BOX} y2={BOX / 2} stroke={colors.line} strokeWidth={3} strokeDasharray="14 14" />
          <Line x1={BOX / 2} y1={0} x2={BOX / 2} y2={BOX} stroke={colors.line} strokeWidth={3} strokeDasharray="14 14" />
          {guide === 'full' && (
            <Path d={glyph.d} fill={colors.muted} fillOpacity={0.16} stroke={colors.muted} strokeOpacity={0.3} strokeWidth={4} />
          )}
          {guide === 'faint' && (
            <Path d={glyph.d} fill="none" stroke={colors.muted} strokeOpacity={0.45} strokeWidth={4} strokeDasharray="18 16" />
          )}
          {all.map((s, i) => (
            <Path
              key={i}
              d={toPath(s)}
              fill="none"
              stroke={colors.accent}
              strokeOpacity={0.85}
              strokeWidth={ink}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {reveal && <Path d={glyph.d} fill="none" stroke={colors.ink} strokeWidth={6} />}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
