import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';

const c = Colors.dark;

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

export function AmbientBackground() {
  return (
    <View pointerEvents="none" style={styles.root}>
      <LinearGradient
        colors={[c.background, '#141428', c.backgroundAlt]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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

/** Static EQ bars (no animation). */
export function Waveform() {
  const bars = [8, 16, 11, 22, 14, 18, 10, 20, 12];
  return (
    <View style={styles.waveRow}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={[
            styles.waveBar,
            {
              height: h,
              backgroundColor: i % 2 === 0 ? c.tint : c.accent,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
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
    height: 24,
    gap: 3,
    flexShrink: 0,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    minHeight: 4,
  },
});
