import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

const c = Colors.dark;
const cat = require('../assets/images/brand/techplace-cat.png');

const LINKS: { href: Href; key: 'setlists' | 'repertoire' | 'settings' }[] = [
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
    pathname === '/setlists' ||
    pathname === '/settings' ||
    pathname === '/(tabs)' ||
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
    router.replace('/setlists');
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
    <View style={styles.shell}>
      <LinearGradient
        colors={['rgba(18,18,30,0.98)', 'rgba(10,10,20,0.94)']}
        style={StyleSheet.absoluteFill}
      />
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
            onPress={() => router.push('/setlists')}
            style={styles.brand}
            accessibilityRole="link">
            <Image source={cat} style={styles.mark} resizeMode="contain" accessibilityLabel="Hueso Time" />
            <View>
              <Text style={styles.brandName}>Hueso Time</Text>
              <Text style={styles.brandTag}>SETLIST · STAGE · COVERS</Text>
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

          <Pressable
            onPress={() => void onSignOut()}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.link,
              styles.signOutLink,
              pressed && styles.linkHover,
            ]}>
            <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
          </Pressable>
        </View>
      </View>
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
  shell: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,45,123,0.28)',
    zIndex: 20,
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backArrow: {
    color: c.tint,
    fontSize: 16,
    fontWeight: '800',
  },
  backText: {
    color: c.text,
    fontSize: 13,
    fontWeight: '700',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  mark: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
  },
  brandName: {
    color: c.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  brandTag: {
    color: c.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  link: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    position: 'relative',
  },
  linkHover: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  linkActive: {
    backgroundColor: 'rgba(255,45,123,0.12)',
  },
  linkText: {
    color: c.tabIconDefault,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
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
  signOutLink: {
    marginLeft: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,45,123,0.35)',
  },
  signOutText: {
    color: c.tint,
    fontSize: 13,
    fontWeight: '800',
  },
  pageBack: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  pageBackText: {
    color: c.tint,
    fontWeight: '800',
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
    borderTopColor: 'rgba(255,45,123,0.22)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: 'rgba(10,10,20,0.92)',
  },
  text: {
    color: c.tabIconDefault,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
