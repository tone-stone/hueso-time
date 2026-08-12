import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { getGoogleClientConfig } from '@/lib/googleAuth';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

/** True in Expo Go (no custom native modules). */
export function isExpoGo() {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
}

/** Native Google Sign-In is available in dev/prod builds, not Expo Go or web. */
export function canUseNativeGoogleSignIn() {
  if (Platform.OS === 'web' || isExpoGo()) return false;
  try {
    const mod = getNativeModule();
    return typeof mod?.GoogleSignin?.configure === 'function';
  } catch {
    return false;
  }
}

/** Lazy-load so Expo Go never touches the native TurboModule at import time. */
function getNativeModule(): GoogleSignInModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin') as GoogleSignInModule;
}

let configured = false;

export function configureNativeGoogleSignIn() {
  if (configured || !canUseNativeGoogleSignIn()) return;
  const { GoogleSignin } = getNativeModule();
  const clients = getGoogleClientConfig();
  GoogleSignin.configure({
    // Required on Android to receive an idToken
    webClientId: clients.webClientId,
    iosClientId: clients.iosClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
  configured = true;
}

/**
 * Native Google Sign-In → id_token.
 * Throws Error with message codes: missing_config | cancelled | play_services | error
 */
export async function signInWithNativeGoogle(): Promise<string> {
  if (!canUseNativeGoogleSignIn()) {
    throw new Error('error');
  }

  const { GoogleSignin, statusCodes } = getNativeModule();
  const clients = getGoogleClientConfig();
  if (!clients.webClientId && !clients.iosClientId) {
    throw new Error('missing_config');
  }

  configureNativeGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  } catch {
    throw new Error('play_services');
  }

  try {
    const result = await GoogleSignin.signIn();
    if (result.type === 'cancelled') {
      throw new Error('cancelled');
    }
    const idToken = result.data?.idToken;
    if (!idToken) {
      // Some Android setups need getTokens()
      const tokens = await GoogleSignin.getTokens();
      if (!tokens.idToken) throw new Error('error');
      return tokens.idToken;
    }
    return idToken;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === 'cancelled') {
      throw new Error('cancelled');
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('play_services');
    }
    if (err instanceof Error && ['cancelled', 'play_services', 'missing_config', 'error'].includes(err.message)) {
      throw err;
    }
    throw new Error('error');
  }
}
