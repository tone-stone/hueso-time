import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';

const c = Colors.dark;
const pattern = require('../assets/images/brand/techplace-pattern.png');

function StaffLines() {
  return (
    <View style={[styles.staffWrap, styles.noPointer]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.staffLine, { top: 18 + i * 14, opacity: 0.08 + i * 0.01 }]}
        />
      ))}
    </View>
  );
}

export function AmbientBackground() {
  return (
    <View style={[styles.root, styles.noPointer]}>
      <LinearGradient
        colors={[c.background, '#141428', c.backgroundAlt]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image source={pattern} style={styles.pattern} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(255,45,123,0.18)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={styles.spotlight}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,229,255,0.08)', 'transparent']}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <StaffLines />
      <View style={styles.vinyl}>
        <View style={styles.vinylRing} />
        <View style={styles.vinylRingMid} />
        <View style={styles.vinylLabel} />
        <View style={styles.vinylHole} />
      </View>
      <View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(255,45,123,0.2)',
            width: 200,
            height: 200,
            borderRadius: 100,
            top: -60,
            left: -50,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(0,229,255,0.12)',
            width: 160,
            height: 160,
            borderRadius: 80,
            top: 160,
            right: -40,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: 'rgba(139,92,246,0.14)',
            width: 120,
            height: 120,
            borderRadius: 60,
            bottom: 120,
            left: 40,
          },
        ]}
      />
      <Text style={[styles.note, { top: 100, left: 24, fontSize: 22, color: c.tint }]}>♪</Text>
      <Text style={[styles.note, { top: 220, right: 28, fontSize: 20, color: c.accent }]}>♫</Text>
      <LinearGradient
        colors={['transparent', 'rgba(13, 13, 24, 0.94)']}
        style={styles.bottomFade}
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
  pattern: {
    ...StyleSheet.absoluteFill,
    opacity: 0.07,
  },
  orb: { position: 'absolute', opacity: 0.9 },
  spotlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  staffWrap: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    height: 90,
  },
  staffLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF',
  },
  vinyl: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -28,
    top: 320,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18182A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    opacity: 0.4,
  },
  vinylRing: {
    ...StyleSheet.absoluteFill,
    margin: 8,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  vinylRingMid: {
    ...StyleSheet.absoluteFill,
    margin: 22,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,45,123,0.2)',
  },
  vinylLabel: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,45,123,0.45)',
  },
  vinylHole: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.background,
  },
  note: {
    position: 'absolute',
    fontWeight: '700',
    opacity: 0.28,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
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
