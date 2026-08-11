import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';

const c = Colors.dark;

function Orb({
  color,
  size,
  top,
  left,
  delay = 0,
}: {
  color: string;
  size: number;
  top: number;
  left: number;
  delay?: number;
}) {
  const pulse = useSharedValue(0.45);
  const drift = useSharedValue(0);

  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(14, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
          withTiming(-10, { duration: 4800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, drift, pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ translateY: drift.value }, { scale: 0.9 + pulse.value * 0.15 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
        },
        style,
      ]}
    />
  );
}

function StaffLines() {
  return (
    <View pointerEvents="none" style={styles.staffWrap}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.staffLine, { top: 18 + i * 14, opacity: 0.08 + i * 0.01 }]}
        />
      ))}
    </View>
  );
}

function VinylDisc() {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 28000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotate]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.vinyl, style]}>
      <View style={styles.vinylRing} />
      <View style={styles.vinylRingMid} />
      <View style={styles.vinylLabel} />
      <View style={styles.vinylHole} />
    </Animated.View>
  );
}

function FloatingNote({
  glyph,
  top,
  left,
  delay,
  size = 22,
}: {
  glyph: string;
  top: number;
  left: number;
  delay: number;
  size?: number;
}) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-18, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(8, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.45, { duration: 2200 }),
          withTiming(0.15, { duration: 2200 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.Text
      pointerEvents="none"
      style={[styles.note, { top, left, fontSize: size, color: c.accent }, style]}>
      {glyph}
    </Animated.Text>
  );
}

export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#07080C', '#10131A', '#0B0C10']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Stage spotlight wash */}
      <LinearGradient
        colors={['rgba(255,107,74,0.16)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={styles.spotlight}
      />
      <StaffLines />
      <VinylDisc />
      <Orb color="rgba(255, 107, 74, 0.2)" size={240} top={-50} left={-70} delay={0} />
      <Orb color="rgba(245, 165, 36, 0.12)" size={190} top={160} left={200} delay={700} />
      <Orb color="rgba(61, 220, 151, 0.07)" size={150} top={460} left={-20} delay={1400} />
      <FloatingNote glyph="♪" top={90} left={42} delay={0} size={26} />
      <FloatingNote glyph="♫" top={210} left={300} delay={500} size={24} />
      <FloatingNote glyph="♩" top={340} left={28} delay={900} size={20} />
      <FloatingNote glyph="♬" top={480} left={260} delay={1300} size={22} />
      <LinearGradient
        colors={['transparent', 'rgba(7, 8, 12, 0.92)']}
        style={styles.bottomFade}
      />
    </View>
  );
}

/** Mini EQ / waveform strip for music UI accents. */
export function Waveform({ active = true }: { active?: boolean }) {
  const bars = [8, 16, 11, 22, 14, 18, 10, 20, 12];
  return (
    <View style={styles.waveRow}>
      {bars.map((h, i) => (
        <WaveBar key={i} base={h} delay={i * 90} active={active} />
      ))}
    </View>
  );
}

function WaveBar({
  base,
  delay,
  active,
}: {
  base: number;
  delay: number;
  active: boolean;
}) {
  const h = useSharedValue(base);
  useEffect(() => {
    if (!active) return;
    h.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(base * 1.55, { duration: 420 + (delay % 200) }),
          withTiming(base * 0.55, { duration: 420 + (delay % 180) }),
        ),
        -1,
        false,
      ),
    );
  }, [active, base, delay, h]);

  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { backgroundColor: delay % 180 === 0 ? c.accent : c.tint },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute' },
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
    backgroundColor: '#F4F1EA',
  },
  vinyl: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: -36,
    top: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14171F',
    borderWidth: 1,
    borderColor: 'rgba(244,241,234,0.08)',
    opacity: 0.55,
  },
  vinylRing: {
    ...StyleSheet.absoluteFill,
    margin: 10,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(244,241,234,0.06)',
  },
  vinylRingMid: {
    ...StyleSheet.absoluteFill,
    margin: 28,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,107,74,0.12)',
  },
  vinylLabel: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,107,74,0.35)',
  },
  vinylHole: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#07080C',
  },
  note: {
    position: 'absolute',
    fontWeight: '700',
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
    height: 24,
    gap: 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
