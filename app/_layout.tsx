import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { cloneElement, isValidElement, useEffect } from 'react';
import { Platform, Text as RNText, TextInput as RNTextInput, View, ActivityIndicator, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '@/i18n';

import { ToastHost } from '@/components/Toast';
import { WEB_NAV_HEIGHT, WebFooter, WebTopNav } from '@/components/WebTopNav';
import { useDesktopWeb } from '@/components/ui';
import { AppProvider, useApp } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { BASE_FONT } from '@/constants/Fonts';
import { isAuthSkipped } from '@/lib/googleAuth';
import { isOAuthRedirectRoute } from '@/lib/oauthRoute';

export { ErrorBoundary } from 'expo-router';

// Must run as early as possible so web OAuth popups can close themselves.
WebBrowser.maybeCompleteAuthSession();

/**
 * Give every <Text> / <TextInput> a base fontFamily so body copy and stray <Text> use
 * the app typeface without editing every file. An explicit `fontFamily` in a component's
 * own style still wins (it comes after this in the flattened array). Native only — web
 * font is handled by CSS and static rendering shouldn't be touched.
 */
function installBaseFont(Component: {
  render?: (...args: unknown[]) => unknown;
  __baseFont?: boolean;
}) {
  const orig = Component.render;
  if (typeof orig !== 'function' || Component.__baseFont) return;
  Component.render = function baseFontRender(...args: unknown[]) {
    const el = orig.apply(this, args);
    if (!isValidElement(el)) return el;
    const style = (el.props as { style?: unknown }).style;
    return cloneElement(el, { style: [{ fontFamily: BASE_FONT }, style] } as never);
  };
  Component.__baseFont = true;
}
if (Platform.OS !== 'web') {
  installBaseFont(RNText as never);
  installBaseFont(RNTextInput as never);
}

export const unstable_settings = {
  initialRouteName: isAuthSkipped() ? '(tabs)' : 'login',
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    if (error) console.warn('[fonts]', error);
  }, [error]);

  // Auto-hide native splash as soon as JS is up (don't gate on fonts).
  useEffect(() => {
    const t = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  // Android edge-to-edge nav bar is transparent by default (SDK 57+); we only own the
  // button/icon color, which should read light against the app's dark background.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setStyle('light');
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppSession />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppSession() {
  const { user } = useAuth();
  return <AppProvider key={user?.id || 'local'}><RootLayoutNav /></AppProvider>;
}

function RootLayoutNav() {
  const { ready, canAccessApp, exitToLogin } = useAuth();
  const data = useApp();
  const segments = useSegments();
  const router = useRouter();
  const desktopWeb = useDesktopWeb();
  const onLogin = segments[0] === 'login';
  const onOAuth = isOAuthRedirectRoute(segments[0]);
  const showWebNav = desktopWeb && canAccessApp && !onLogin && !onOAuth;

  useEffect(() => {
    if (!ready) return;

    // Never redirect away from /oauth — the popup must finish maybeCompleteAuthSession.
    if (onOAuth) return;

    if (!canAccessApp && !onLogin) {
      router.replace('/login');
      return;
    }
    if (canAccessApp && onLogin) {
      router.replace('/(tabs)/generate');
    }
  }, [ready, canAccessApp, onLogin, onOAuth, router]);

  if (ready && canAccessApp && !onLogin && !onOAuth && !data.ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
        {data.loadError ? <>
          <RNText style={{ color: Colors.dark.text }}>{data.loadError}</RNText>
          <Pressable accessibilityRole="button" onPress={data.retryLoad}>
            <RNText style={{ color: Colors.dark.tint }}>Reintentar / Retry</RNText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { void exitToLogin(); }}>
            <RNText style={{ color: Colors.dark.text }}>Volver al inicio de sesión / Sign in</RNText>
          </Pressable>
        </> : <ActivityIndicator accessibilityLabel="Cargando datos" color={Colors.dark.tint} />}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          {showWebNav ? <WebTopNav /> : null}
          <View style={{ flex: 1, minHeight: 0, paddingTop: showWebNav ? WEB_NAV_HEIGHT : 0 }}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.dark.background },
                headerTintColor: Colors.dark.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: Colors.dark.background },
              }}>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="oauth" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="setlist/[id]"
                options={{
                  title: 'Setlist',
                  presentation: 'card',
                  headerShown: !desktopWeb,
                  headerBackTitle: 'Volver',
                }}
              />
            </Stack>
          </View>
          {showWebNav ? <WebFooter /> : null}
        </View>
        <ToastHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
