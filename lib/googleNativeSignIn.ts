import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { getGoogleClientConfig } from '@/lib/googleAuth';

/** True in Expo Go (no custom native modules). */
export function isExpoGo() {
  return Constants.appOwnership === 'expo';
}

/** Native Google Sign-In is available in dev/prod builds, not Expo Go or web. */
export function canUseNativeGoogleSignIn() {
  return Platform.OS !== 'web' && !isExpoGo();
}

let configured = false;

export function configureNativeGoogleSignIn() {
  if (configured || !canUseNativeGoogleSignIn()) return;
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
