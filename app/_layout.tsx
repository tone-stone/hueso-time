import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '@/i18n';

import { ToastHost } from '@/components/Toast';
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

SplashScreen.preventAutoHideAsync();

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
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

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

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'login';
    const onOAuth = isOAuthRedirectRoute(segments[0]);

    // Never redirect away from /oauth — the popup must finish maybeCompleteAuthSession.
    if (onOAuth) return;

    if (!canAccessApp && !onLogin) {
      router.replace('/login');
      return;
    }
    if (canAccessApp && onLogin) {
      router.replace('/(tabs)/setlists');
    }
  }, [ready, canAccessApp, segments, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
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
              headerShown: true,
              headerBackTitle: 'Volver',
            }}
          />
        </Stack>
        <ToastHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
