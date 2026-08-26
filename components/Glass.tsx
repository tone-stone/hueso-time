import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

/** react-native-web-only CSS passthrough; RN's ViewStyle type doesn't list it. */
const webShadow =
  Platform.OS === 'web'
    ? ({
        boxShadow:
          '0 16px 44px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), 0 0 60px rgba(255,45,123,0.1)',
      } as unknown as ViewStyle)
    : null;

const nativeShadow: ViewStyle =
  Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 24 }
    : Platform.OS === 'android'
      ? { elevation: 14 }
      : {};

/**
 * Frosted-glass panel — real blur on iOS/web (native UIVisualEffectView / CSS backdrop-filter),
 * translucent tinted panel on Android (expo-blur's fallback). Shared by the desktop web nav
 * and the mobile tab bar so the "glass" language (blur + top sheen + brand-color rim glow)
 * reads identically across web, iOS, and Android.
 */
export function GlassSurface({
  children,
  style,
  radius = 0,
  intensity = 80,
  border = true,
  sheen = true,
  edgeGlow = true,
  shadow = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Corner radius — 0 for edge-to-edge bars (mobile tab bar), 24 for floating cards (web nav). */
  radius?: number;
  /** Blur strength, 1–100. */
  intensity?: number;
  border?: boolean;
  sheen?: boolean;
  edgeGlow?: boolean;
  shadow?: boolean;
}) {
  return (
    <View
      style={[
        { borderRadius: radius, overflow: 'hidden' },
        border ? styles.border : null,
        shadow ? webShadow : null,
        shadow ? nativeShadow : null,
        style,
      ]}>
      <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(28,28,46,0.28)', 'rgba(10,10,20,0.38)']}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      {sheen ? (
        <LinearGradient
          colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          style={styles.sheen}
          pointerEvents="none"
        />
      ) : null}
      {edgeGlow ? (
        <LinearGradient
          colors={['rgba(255,45,123,0.16)', 'rgba(0,229,255,0.1)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomRim}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderTopColor: 'rgba(255,255,255,0.38)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
  },
  bottomRim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
});
