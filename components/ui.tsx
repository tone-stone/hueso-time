import React from 'react';
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
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground, Waveform } from '@/components/AmbientBackground';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

const theme = Colors.dark;

const techplaceCat = require('../assets/images/brand/techplace-cat.png');

/** Desktop web breakpoint — site chrome + constrained page columns. */
export const DESKTOP_WEB_MIN_WIDTH = 900;

export function useDesktopWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_WEB_MIN_WIDTH;
}

/** Status bar / notch / punch-hole clearance (Android often reports insets.top = 0). */
export function useTopSafePad(extra = 14) {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') return Math.max(extra, 8);
  // Android: StatusBar.currentHeight covers classic bars; bump for punch-hole cameras.
  const fallback =
    Platform.OS === 'android'
      ? Math.max(RNStatusBar.currentHeight ?? 0, 32) + 8
      : 47;
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
  topGap = 14,
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
            <Text style={{ color: theme.tint, fontWeight: '800', fontSize: 14 }}>
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
          style={styles.brandCatHero}
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
          style={styles.brandBadgeImg}
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
      <LinearGradient
        colors={['rgba(255,45,123,0.12)', 'rgba(0,229,255,0.06)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardSheen, { pointerEvents: 'none' }]}
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
        colors={[theme.tint, theme.purple, theme.accent]}
        locations={[0, 0.55, 1]}
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
    paddingHorizontal: 16,
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
    width: 48,
    height: 48,
    backgroundColor: 'transparent',
  },
  brandCatHero: {
    width: 112,
    height: 112,
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  brandProduct: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
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
    textAlign: 'center',
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
    width: '100%',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 21,
    flexShrink: 1,
    width: '100%',
  },
  body: { fontSize: 15, lineHeight: 21, width: '100%' },
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
    marginLeft: 4,
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
