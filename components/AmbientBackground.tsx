import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';

const c = Colors.dark;

/** Solid background with one subtle diagonal tint — no pattern/orbs/decorations. */
export function AmbientBackground() {
  return (
    <View style={[styles.root, styles.noPointer]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} />
      <LinearGradient
        colors={['rgba(255,45,123,0.07)', 'transparent', 'rgba(0,229,255,0.05)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const BAR_COUNT = 7;
const BAR_BASE = [0.35, 0.7, 0.45, 1, 0.55, 0.85, 0.4];
const BAR_DURATIONS = [420, 560, 480, 640, 520, 600, 460];

function AnimatedBar({
  index,
  color,
}: {
  index: number;
  color: string;
}) {
  const scale = useRef(new Animated.Value(BAR_BASE[index] ?? 0.5)).current;

  useEffect(() => {
    const min = 0.28;
    const max = 1;
    const duration = BAR_DURATIONS[index] ?? 500;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: max,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: min,
          duration: duration * 0.9,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const delay = setTimeout(() => loop.start(), index * 70);
    return () => {
      clearTimeout(delay);
      loop.stop();
    };
  }, [index, scale]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          backgroundColor: color,
          transform: [{ scaleY: scale }],
        },
      ]}
    />
  );
}

/** Animated EQ bars. */
export function Waveform() {
  return (
    <View style={styles.waveRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <AnimatedBar key={i} index={i} color={i % 2 === 0 ? c.tint : c.accent} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  noPointer: {
    pointerEvents: 'none',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 26,
    gap: 3,
    flexShrink: 0,
    paddingHorizontal: 2,
  },
  waveBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
  },
});
