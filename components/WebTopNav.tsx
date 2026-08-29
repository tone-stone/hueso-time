import { Image, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { FontFamily } from '@/constants/Fonts';
import { GlassSurface } from '@/components/Glass';
import { useAuth } from '@/context/AuthContext';

const c = Colors.dark;
const cat = require('../assets/images/brand/techplace-cat.png');
const lightenStyle = Platform.OS === 'web' ? ({ mixBlendMode: 'lighten' } as any) : undefined;

/** Floating-bar total footprint (outer margin + card) — RootLayoutNav pads content by this so it isn't hidden underneath. */
export const WEB_NAV_HEIGHT = 100;
const NAV_OUTER_PAD = 16;

/** react-native-web-only CSS passthrough; RN's ViewStyle type doesn't list it. */
const fixedPosition = { position: 'fixed' } as unknown as ViewStyle;

const LINKS: { href: Href; key: 'generate' | 'setlists' | 'repertoire' | 'settings' }[] = [
  { href: '/generate', key: 'generate' },
  { href: '/setlists', key: 'setlists' },
  { href: '/', key: 'repertoire' },
  { href: '/settings', key: 'settings' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/' || pathname === '/index';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isPrimaryTab(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/index' ||
    pathname === '/generate' ||
    pathname === '/setlists' ||
    pathname === '/settings' ||
    pathname === '/(tabs)' ||
    pathname === '/(tabs)/generate' ||
    pathname === '/(tabs)/setlists' ||
    pathname === '/(tabs)/settings' ||
    pathname === '/(tabs)/index'
  );
}

/**
 * Top site navigation for desktop web — brand, back, section links, sign out.
 */
export function WebTopNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { exitToLogin } = useAuth();
  const showBack = !isPrimaryTab(pathname) || pathname.includes('/setlist/');

  function onBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/generate');
  }

  async function onSignOut() {
    const ok =
      typeof window !== 'undefined' &&
      window.confirm(`${t('auth.signOut')}\n\n${t('auth.signOutConfirm')}`);
    if (!ok) return;
    await exitToLogin();
    router.replace('/login');
  }

  return (
    <View style={[styles.floatOuter, fixedPosition]} pointerEvents="box-none">
      <GlassSurface radius={12} intensity={90} style={styles.shell}>
        <View style={styles.inner}>
          <View style={styles.left}>
            {showBack ? (
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={({ pressed }) => [styles.backBtn, pressed && styles.linkHover]}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backText}>{t('common.back')}</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => router.push('/generate')}
              style={styles.brand}
              accessibilityRole="link">
              <Image
                source={cat}
                style={[styles.mark, lightenStyle]}
                resizeMode="contain"
                accessibilityLabel="Hueso Time"
              />
              <View>
                <Text style={styles.brandName}>Hueso Time</Text>
                <Text style={styles.brandTag}>HUESO TIME</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.links}>
            {LINKS.map((link) => {
              const focused = isActive(pathname, String(link.href));
              const label = t(`tabs.${link.key}`);
              return (
                <Pressable
                  key={String(link.href)}
                  accessibilityRole="link"
                  accessibilityState={{ selected: focused }}
                  onPress={() => router.push(link.href)}
                  style={({ pressed }) => [
                    styles.link,
                    focused && styles.linkActive,
                    pressed && !focused && styles.linkHover,
                  ]}>
                  <Text style={[styles.linkText, focused && styles.linkTextActive]}>{label}</Text>
                  {focused ? <View style={styles.underline} /> : null}
                </Pressable>
              );
            })}

            <View style={styles.separator} />

            <Pressable
              onPress={() => void onSignOut()}
              accessibilityRole="button"
              style={({ pressed }) => [styles.link, pressed && styles.linkHover]}>
              <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
            </Pressable>
          </View>
        </View>
      </GlassSurface>
    </View>
  );
}

/** In-page back control for web flows (create wizards, detail screens). */
export function WebBackButton({
  onPress,
  label,
}: {
  onPress?: () => void;
  label?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  if (Platform.OS !== 'web') return null;

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/setlists');
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pageBack, pressed && { opacity: 0.75 }]}>
      <Text style={styles.pageBackText}>
        ← {label ?? t('common.back')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatOuter: {
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: NAV_OUTER_PAD,
    paddingHorizontal: NAV_OUTER_PAD,
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: 1400,
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minWidth: 0,
    flexShrink: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  backArrow: {
    color: c.tint,
    fontSize: 15,
    fontWeight: '500',
  },
  backText: {
    color: c.text,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: FontFamily.display,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  mark: {
    width: 42,
    height: 42,
    backgroundColor: 'transparent',
  },
  brandName: {
    color: c.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: FontFamily.display,
  },
  brandTag: {
    color: c.accent,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 2,
    fontFamily: FontFamily.display,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  link: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    position: 'relative',
  },
  linkHover: {
    backgroundColor: 'rgba(233, 233, 237, 0.05)',
  },
  linkActive: {
    backgroundColor: 'rgba(145, 132, 217, 0.18)',
  },
  linkText: {
    color: c.tabIconDefault,
    fontSize: 13.5,
    fontWeight: '500',
    fontFamily: FontFamily.display,
  },
  linkTextActive: {
    color: c.text,
  },
  underline: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 4,
    height: 2,
    borderRadius: 1,
    backgroundColor: c.tint,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: c.border,
    marginHorizontal: 6,
  },
  signOutText: {
    color: c.tint,
    fontSize: 13.5,
    fontWeight: '500',
    fontFamily: FontFamily.display,
  },
  pageBack: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  pageBackText: {
    color: c.tint,
    fontWeight: '500',
    fontSize: 14,
  },
});

export function WebFooter() {
  return (
    <View style={footerStyles.shell}>
      <Text style={footerStyles.text}>Hueso Time · setlist · stage · covers</Text>
    </View>
  );
}

const footerStyles = StyleSheet.create({
  shell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: c.backgroundSheet,
  },
  text: {
    color: c.tabIconDefault,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
