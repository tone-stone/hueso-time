import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

/** react-native-web-only CSS passthrough; RN's ViewStyle type doesn't list it. */
const webShadow =
  Platform.OS === 'web'
    ? ({
        boxShadow:
          '0 14px 34px rgba(0,0,0,0.55), 0 0 0 1px rgba(233,233,237,0.1), inset 0 1px 0 rgba(233,233,237,0.14)',
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
          colors={['rgba(43,39,65,0.5)', 'rgba(43,39,65,0.5)']}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>
      {sheen ? (
        <LinearGradient
          colors={['rgba(233,233,237,0.14)', 'rgba(233,233,237,0)']}
          style={styles.sheen}
          pointerEvents="none"
        />
      ) : null}
      {edgeGlow ? (
        <LinearGradient
          colors={['rgba(145,132,217,0.12)', 'rgba(145,132,217,0.05)']}
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
    borderColor: 'rgba(233,233,237,0.1)',
    borderTopColor: 'rgba(233,233,237,0.14)',
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
