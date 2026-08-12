import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { clearAuthUser, loadAuthUser, saveAuthUser } from '@/lib/authStorage';
import { getGoogleClientConfig, isAuthSkipped, userFromIdToken } from '@/lib/googleAuth';
import type { AuthUser } from '@/types/auth';

type AuthContextValue = {
  ready: boolean;
  user: AuthUser | null;
  /** True when the user may browse the app (Google session or guest/test). */
  canAccessApp: boolean;
  googleConfigured: boolean;
  completeGoogleSignIn: (idToken: string) => Promise<void>;
  /** Enter without Google (only when SKIP_AUTH is on). */
  enterAsGuest: () => void;
  /** Leave to login screen. */
  exitToLogin: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [guestIn, setGuestIn] = useState(false);
  const googleConfigured = getGoogleClientConfig().configured;
  const skipAuth = isAuthSkipped();

  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await loadAuthUser();
      if (!alive) return;
      setUser(stored);
      // Modo prueba: arrancar ya dentro de la app.
      if (isAuthSkipped() && !stored) setGuestIn(true);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const completeGoogleSignIn = useCallback(async (idToken: string) => {
    const next = userFromIdToken(idToken);
    await saveAuthUser(next);
    setUser(next);
    setGuestIn(false);
  }, []);

  const enterAsGuest = useCallback(() => {
    if (!isAuthSkipped()) return;
    setGuestIn(true);
  }, []);

  const exitToLogin = useCallback(async () => {
    await clearAuthUser();
    setUser(null);
    setGuestIn(false);
  }, []);

  const signOut = exitToLogin;

  const canAccessApp = !!user || (skipAuth && guestIn);

  const value = useMemo(
    () => ({
      ready,
      user,
      canAccessApp,
      googleConfigured,
      completeGoogleSignIn,
      enterAsGuest,
      exitToLogin,
      signOut,
    }),
    [
      ready,
      user,
      canAccessApp,
      googleConfigured,
      completeGoogleSignIn,
      enterAsGuest,
      exitToLogin,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
