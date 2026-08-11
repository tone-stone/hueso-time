import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AmbientBackground, Waveform } from '@/components/AmbientBackground';
import Colors from '@/constants/Colors';

const theme = Colors.dark;

export function useThemeColors() {
  return theme;
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.screen, style]}>
      <AmbientBackground />
      <View style={styles.screenContent}>{children}</View>
    </View>
  );
}

export function BrandMark({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.brandBlock}>
      <View style={styles.brandRow}>
        <LinearGradient
          colors={[theme.tint, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandBadge}>
          <Text style={styles.brandNote}>♪</Text>
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.brandName}>Hueso Time</Text>
          <Text style={styles.brandTag}>SETLIST · STAGE · COVERS</Text>
          {subtitle ? <Text style={styles.brandSub}>{subtitle}</Text> : null}
        </View>
        <Waveform />
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  index?: number;
}) {
  const body = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,107,74,0.1)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardSheen}
      />
      <View style={styles.cardFret} />
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      {body}
    </Pressable>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <Text style={[styles.body, { color: muted ? theme.textMuted : theme.text }]}>
      {children}
    </Text>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtnWrap,
        { opacity: disabled ? 0.45 : pressed ? 0.9 : 1 },
      ]}>
      <LinearGradient
        colors={[theme.tint, '#FF8A3D']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>♫  {label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        {
          borderColor: danger ? theme.tint : theme.borderStrong,
          backgroundColor: pressed
            ? danger
              ? theme.tintSoft
              : theme.surfaceElevated
            : 'transparent',
        },
      ]}>
      <Text style={{ color: danger ? theme.tint : theme.text, fontWeight: '700' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? theme.tint : theme.border,
          backgroundColor: selected ? theme.tintSoft : theme.surfaceElevated,
        },
      ]}>
      <Text
        style={{
          color: selected ? theme.tint : theme.textMuted,
          fontWeight: '700',
          fontSize: 13,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MetaPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View
      style={[
        styles.meta,
        {
          backgroundColor: accent ? theme.accentSoft : theme.backgroundAlt,
          borderColor: accent ? theme.accent : theme.border,
        },
      ]}>
      <Text
        style={{
          color: accent ? theme.accent : theme.textMuted,
          fontSize: 12,
          fontWeight: '700',
        }}>
        {label}
      </Text>
    </View>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: true, radius: 28 }}
      style={({ pressed }) => [styles.fabHit, { opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.fabWrap}>
        <LinearGradient
          colors={[theme.tint, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
    overflow: 'hidden',
    width: '100%',
    maxWidth: '100%',
  },
  screenContent: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  brandBlock: { marginBottom: 10, width: '100%', maxWidth: '100%' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: '100%',
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNote: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: -2,
  },
  brandName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  brandTag: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  brandSub: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardSheen: {
    ...StyleSheet.absoluteFill,
  },
  cardFret: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
    backgroundColor: theme.tint,
    opacity: 0.85,
  },
  title: {
    color: theme.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 21,
    flexShrink: 1,
  },
  body: { fontSize: 15, lineHeight: 21 },
  field: { marginBottom: 12 },
  label: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: theme.text,
    borderColor: theme.border,
    backgroundColor: theme.surfaceElevated,
  },
  primaryBtnWrap: {
    borderRadius: 14,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  ghostBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    flexShrink: 1,
  },
  meta: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginTop: 6,
  },
  fabHit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fabWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
    includeFontPadding: false,
    textAlign: 'center',
    marginTop: -1,
  },
});
