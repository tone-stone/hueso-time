import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '@/i18n';

import { ToastHost } from '@/components/Toast';
import { WEB_NAV_HEIGHT, WebFooter, WebTopNav } from '@/components/WebTopNav';
import { useDesktopWeb } from '@/components/ui';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { isAuthSkipped } from '@/lib/googleAuth';
import { isOAuthRedirectRoute } from '@/lib/oauthRoute';

export { ErrorBoundary } from 'expo-router';

// Must run as early as possible so web OAuth popups can close themselves.
WebBrowser.maybeCompleteAuthSession();

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
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { ready, canAccessApp } = useAuth();
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
