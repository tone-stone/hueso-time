import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground, Waveform } from '@/components/AmbientBackground';
import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import { useTranslation } from 'react-i18next';

const theme = Colors.dark;

const techplaceCat = require('../assets/images/brand/techplace-cat.png');

/** mix-blend-mode: lighten — the cat PNG's dark ground disappears into the app ground (web only). */
const lightenStyle = Platform.OS === 'web' ? ({ mixBlendMode: 'lighten' } as any) : undefined;

/** Desktop web breakpoint — site chrome + constrained page columns. */
export const DESKTOP_WEB_MIN_WIDTH = 900;

export function useDesktopWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_WEB_MIN_WIDTH;
}

/** Status bar / notch / punch-hole clearance (Android often reports insets.top = 0). */
export function useTopSafePad(extra = 56) {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') return Math.max(extra, 8);
  // Android: StatusBar.currentHeight covers classic bars; bump generously for punch-hole
  // cameras, since safe-area-context can under-report insets.top on some OEM skins.
  const fallback =
    Platform.OS === 'android'
      ? Math.max(RNStatusBar.currentHeight ?? 0, 64) + 20
      : 70;
  return Math.max(insets.top, fallback) + extra;
}

export function useThemeColors() {
  return theme;
}

export function Screen({
  children,
  style,
  /** Apply notch / Dynamic Island / status-bar top inset (default true). */
  safeTop = true,
  /** Extra space under the system bar so content clears camera + wifi icons. */
  topGap = 56,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  safeTop?: boolean;
  topGap?: number;
}) {
  const topPad = useTopSafePad(topGap);
  const desktop = useDesktopWeb();
  return (
    <View style={[styles.screen, style]}>
      <AmbientBackground />
      <View
        style={[
          styles.screenContent,
          safeTop ? { paddingTop: desktop ? Math.max(topPad, 12) : topPad } : null,
          desktop ? styles.screenContentDesktop : null,
        ]}>
        {children}
      </View>
    </View>
  );
}

/** Centers and caps page width on desktop web so screens don't stretch edge-to-edge. */
export function PageColumn({
  children,
  style,
  maxWidth = 920,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: number;
}) {
  const desktop = useDesktopWeb();
  return (
    <View
      style={[
        styles.pageColumn,
        desktop && { maxWidth, paddingHorizontal: 28 },
        style,
      ]}>
      {children}
    </View>
  );
}

/** Page title block; hides in-page BrandMark on desktop (top nav already shows it). */
export function PageHeader({
  title,
  subtitle,
  brandSubtitle,
  right,
  showBrand = true,
  onBack,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  brandSubtitle?: string;
  right?: React.ReactNode;
  showBrand?: boolean;
  onBack?: () => void;
  backLabel?: string;
}) {
  const { t } = useTranslation();
  const desktop = useDesktopWeb();
  const showMark = showBrand && !desktop;
  const showBack = Platform.OS === 'web' && !!onBack;

  return (
    <View style={[styles.pageHeader, desktop && styles.pageHeaderDesktop]}>
      <View style={{ flex: 1, minWidth: 0, paddingRight: right ? 12 : 0 }}>
        {showBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            style={({ pressed }) => [{ marginBottom: 10, opacity: pressed ? 0.75 : 1 }]}>
            <Text
              style={{
                color: theme.tint,
                fontWeight: '500',
                fontSize: 14,
                fontFamily: FontFamily.display,
              }}>
              ← {backLabel ?? t('common.back')}
            </Text>
          </Pressable>
        ) : null}
        {showMark ? <BrandMark subtitle={brandSubtitle} showWave={false} /> : null}
        <Title>{title}</Title>
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </View>
      {right ? <View style={styles.pageHeaderRight}>{right}</View> : null}
    </View>
  );
}

export function BrandMark({
  subtitle,
  showWave = true,
  size = 'compact',
}: {
  subtitle?: string;
  showWave?: boolean;
  /** compact = header row; hero = larger cat for login */
  size?: 'compact' | 'hero';
}) {
  const isHero = size === 'hero';

  if (isHero) {
    return (
      <View style={[styles.brandBlock, styles.brandHeroBlock]}>
        <Image
          source={techplaceCat}
          style={[styles.brandCatHero, lightenStyle]}
          resizeMode="contain"
          accessibilityLabel="Hueso Time"
        />
        <Text style={styles.brandProduct}>Hueso Time</Text>
        <Text style={styles.brandTag}>SETLIST · STAGE · COVERS</Text>
        {subtitle ? <Text style={styles.brandSub}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.brandBlock}>
      <View style={styles.brandRow}>
        <Image
          source={techplaceCat}
          style={[styles.brandBadgeImg, lightenStyle]}
          resizeMode="contain"
          accessibilityLabel="Hueso Time"
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.brandName}>Hueso Time</Text>
          <Text style={[styles.brandTag, styles.brandTagLeft]}>SETLIST · STAGE · COVERS</Text>
          {subtitle ? <Text style={[styles.brandSub, styles.brandSubLeft]}>{subtitle}</Text> : null}
        </View>
        {showWave ? <Waveform /> : null}
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
  style?: StyleProp<ViewStyle>;
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
      {children}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(233, 233, 237, 0.06)' }}
      style={({ pressed, hovered }: any) => [
        { opacity: pressed ? 0.92 : 1 },
        hovered ? { borderColor: theme.borderStrong } : null,
      ]}>
      {body}
    </Pressable>
  );
}

export function Title({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
}) {
  return <Text style={[styles.title, { textAlign: align }]}>{children}</Text>;
}

export function Subtitle({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center';
}) {
  return <Text style={[styles.subtitle, { textAlign: align }]}>{children}</Text>;
}

export function Body({
  children,
  muted,
  align = 'left',
}: {
  children: React.ReactNode;
  muted?: boolean;
  align?: 'left' | 'center';
}) {
  return (
    <Text
      style={[
        styles.body,
        { color: muted ? theme.textMuted : theme.text, textAlign: align },
      ]}>
      {children}
    </Text>
  );
}

/** Small uppercase section label — kicker, 10/600/0.14em. */
export function Kicker({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.kicker, style]}>{children}</Text>;
}

/** Horizontal rule that fades out at both ends instead of a hard line edge to edge. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={[
        'transparent',
        'rgba(233, 233, 237, 0.14)',
        'rgba(233, 233, 237, 0.14)',
        'transparent',
      ]}
      locations={[0, 0.12, 0.88, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.divider, style]}
    />
  );
}

export function Field({
  label,
  style,
  ...props
}: { label: string; style?: StyleProp<ViewStyle> } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { fontFamily: FontFamily.display }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.textFaint}
        style={[styles.input, { borderColor: focused ? theme.tint : theme.border }]}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
    </View>
  );
}

/**
 * Outlined primary action — border + tint text, transparent ground with a soft glow
 * rising from the bottom. Never a solid fill: that's the one Nocturne rule every button
 * in this app follows.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Optional leading glyph. */
  icon?: string;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      android_ripple={disabled ? undefined : { color: theme.tintSoft }}
      style={({ pressed }) => [
        styles.primaryBtn,
        {
          borderColor: theme.tint,
          backgroundColor: pressed ? theme.tintFaint : 'transparent',
          opacity: disabled ? 0.45 : 1,
        },
      ]}>
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(145, 132, 217, 0.16)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.primaryBtnText}>
        {icon ? `${icon}  ` : ''}
        {label}
      </Text>
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
      android_ripple={{ color: danger ? theme.tintSoft : 'rgba(233, 233, 237, 0.09)' }}
      style={({ pressed }) => [
        styles.ghostBtn,
        {
          backgroundColor: pressed
            ? danger
              ? theme.tintFaint
              : 'rgba(233, 233, 237, 0.07)'
            : 'transparent',
        },
      ]}>
      <Text
        style={{
          color: danger ? theme.accentText : 'rgba(233, 233, 237, 0.7)',
          fontWeight: '500',
          fontFamily: FontFamily.display,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  outlined,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Outlined variant: tint border, transparent ground, tint text — for filter pickers. */
  outlined?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.tintSoft }}
      style={[
        styles.chip,
        outlined
          ? {
              borderWidth: 1,
              borderColor: theme.tint,
              backgroundColor: 'transparent',
            }
          : {
              borderWidth: 0,
              backgroundColor: selected ? theme.surfaceAccent : theme.surfaceElevated,
            },
      ]}>
      <Text
        style={{
          color: outlined ? theme.tint : selected ? theme.accent : 'rgba(233, 233, 237, 0.7)',
          fontWeight: '400',
          fontSize: 11,
          letterSpacing: 0.02,
          fontFamily: FontFamily.display,
        }}
        numberOfLines={1}>
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
        { backgroundColor: accent ? theme.surfaceAccent : theme.surfaceElevated },
      ]}>
      <Text
        style={{
          color: accent ? theme.accent : 'rgba(233, 233, 237, 0.7)',
          fontSize: 11,
          fontWeight: '400',
          fontFamily: FontFamily.display,
        }}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Segmented control — bordered container, options divided by a hairline, the active one
 * ringed in tint (approximating the web spec's `inset 0 0 0 1px accent`).
 */
export function Segmented<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={[styles.segmented, { borderColor: theme.border }]}>
      {options.map((opt, i) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.segment,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
              active && { borderWidth: 1, borderColor: theme.tint, margin: -1 },
            ]}>
            <Text
              style={{
                color: active ? theme.tint : theme.textMuted,
                fontSize: 13,
                fontFamily: FontFamily.display,
              }}
              numberOfLines={1}>
              {labels[opt]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Groups ListRow children into one bordered, radius-8 block with 1px separators. */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.listGroup, style]}>{children}</View>;
}

/**
 * Settings-style grouped row: accent icon, muted label, value on the right, chevron.
 * `last` removes the bottom hairline (use on the final row of a ListGroup).
 */
export function ListRow({
  icon,
  label,
  value,
  onPress,
  last,
  danger,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
  danger?: boolean;
}) {
  const content = (
    <View
      style={[
        styles.listRow,
        { backgroundColor: theme.surface },
        !last && { borderBottomWidth: 1, borderBottomColor: theme.divider },
      ]}>
      {icon}
      <Text
        style={[
          styles.listRowLabel,
          { color: danger ? theme.accentText : theme.textMuted },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text style={styles.listRowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : (
        value
      )}
      {onPress ? (
        <Text style={{ color: theme.textFaint }}>›</Text>
      ) : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && { backgroundColor: theme.surfaceElevated }]}>
      {content}
    </Pressable>
  );
}

export function Fab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      android_ripple={{ color: theme.tintSoft }}
      style={({ pressed }) => [
        styles.fab,
        { borderColor: theme.tint, backgroundColor: pressed ? theme.tintFaint : 'transparent' },
      ]}>
      <Text style={styles.fabText}>+</Text>
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
  screenContentDesktop: {
    paddingBottom: 28,
  },
  pageColumn: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  pageHeader: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 12,
  },
  pageHeaderDesktop: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 12,
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
  },
  brandBlock: { marginBottom: 8, width: '100%', maxWidth: '100%' },
  brandHeroBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: '100%',
  },
  brandBadgeImg: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
  },
  brandCatHero: {
    width: 104,
    height: 104,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  brandProduct: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.4,
    textAlign: 'center',
    fontFamily: FontFamily.display,
  },
  brandName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: FontFamily.display,
  },
  brandTag: {
    color: theme.accent,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: FontFamily.display,
  },
  brandTagLeft: { textAlign: 'left' },
  brandSub: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  brandSubLeft: { textAlign: 'left' },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  title: {
    color: theme.text,
    fontSize: 27,
    fontWeight: '500',
    letterSpacing: -0.02 * 27,
    flexShrink: 1,
    width: '100%',
    fontFamily: FontFamily.display,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 19,
    flexShrink: 1,
    width: '100%',
  },
  body: { fontSize: 13, lineHeight: 21, width: '100%' },
  kicker: {
    color: theme.textFaint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  divider: { height: 1, width: '100%' },
  field: { marginBottom: 12 },
  label: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 7,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: FontFamily.display,
  },
  input: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.surface,
  },
  primaryBtn: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryBtnText: {
    color: theme.tint,
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: 0.1,
    fontFamily: FontFamily.display,
  },
  ghostBtn: {
    minHeight: 44,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 8,
    marginBottom: 8,
    flexShrink: 1,
    overflow: 'hidden',
  },
  meta: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 6,
    marginTop: 6,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  listGroup: {
    borderRadius: 8,
    overflow: 'hidden',
    gap: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  listRowLabel: { fontSize: 13, flex: 1 },
  listRowValue: { color: theme.text, fontSize: 13, fontWeight: '500' },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: theme.tint,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 24,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
