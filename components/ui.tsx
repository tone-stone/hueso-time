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

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export function useThemeColors() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.screen, { backgroundColor: c.background }, style]}>
      {children}
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
}) {
  const c = useThemeColors();
  const body = (
    <View
      style={[
        styles.card,
        { backgroundColor: c.surface, borderColor: c.border },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {body}
    </Pressable>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  return <Text style={[styles.title, { color: c.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const c = useThemeColors();
  return <Text style={[styles.subtitle, { color: c.textMuted }]}>{children}</Text>;
}

export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const c = useThemeColors();
  return (
    <Text style={[styles.body, { color: muted ? c.textMuted : c.text }]}>{children}</Text>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  const c = useThemeColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.textMuted}
        style={[
          styles.input,
          { color: c.text, borderColor: c.border, backgroundColor: c.surface },
        ]}
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
  const c = useThemeColors();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryBtn,
        {
          backgroundColor: c.tint,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
      ]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
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
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostBtn,
        { borderColor: danger ? c.tint : c.border, opacity: pressed ? 0.75 : 1 },
      ]}>
      <Text style={{ color: danger ? c.tint : c.text, fontWeight: '600' }}>{label}</Text>
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
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.tintSoft : c.surface,
          borderColor: selected ? c.tint : c.border,
        },
      ]}>
      <Text style={{ color: selected ? c.tint : c.text, fontWeight: '600', fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MetaPill({ label }: { label: string }) {
  const c = useThemeColors();
  return (
    <View style={[styles.meta, { backgroundColor: c.background, borderColor: c.border }]}>
      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4, marginBottom: 16 },
  body: { fontSize: 15, lineHeight: 21 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ghostBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  meta: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 6,
  },
});
