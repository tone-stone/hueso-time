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
    // Required on Android to receive an idToken (must be the *Web* client ID).
    webClientId: clients.webClientId,
    iosClientId: clients.iosClientId,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
  configured = true;
}

/**
 * Clears the native Google Sign-In SDK's cached session. Without this, signing
 * back in silently re-authenticates the same account instead of prompting a
 * chooser — call before/at app-level sign-out so "switch account" actually works.
 */
export async function signOutNativeGoogle(): Promise<void> {
  if (!canUseNativeGoogleSignIn()) return;
  try {
    const { GoogleSignin } = getNativeModule();
    await GoogleSignin.signOut();
  } catch {
    // Best-effort — app-level sign-out must still proceed either way.
  }
}

/**
 * Native Google Sign-In → id_token.
 * Throws Error with message codes: missing_config | cancelled | play_services | developer_error | error
 */
export async function signInWithNativeGoogle(): Promise<string> {
  if (!canUseNativeGoogleSignIn()) {
    throw new Error('error');
  }

  const { GoogleSignin, statusCodes } = getNativeModule();
  const clients = getGoogleClientConfig();
  // Android needs the Web client ID to mint an idToken.
  if (Platform.OS === 'android' && !clients.webClientId) {
    throw new Error('missing_config');
  }
  if (!clients.webClientId && !clients.iosClientId) {
    throw new Error('missing_config');
  }

  configureNativeGoogleSignIn();

  if (Platform.OS === 'android') {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    } catch {
      throw new Error('play_services');
    }
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
    const code = (err as { code?: string | number })?.code;
    if (code === statusCodes.SIGN_IN_CANCELLED || code === 'cancelled') {
      throw new Error('cancelled');
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('play_services');
    }
    // Common Android misconfig: package/SHA-1 mismatch in Google Cloud.
    const message = err instanceof Error ? err.message : String(err ?? '');
    if (
      code === 10 ||
      code === '10' ||
      /DEVELOPER_ERROR/i.test(message) ||
      /Code:\s*10\b/i.test(message)
    ) {
      if (__DEV__) {
        console.error(
          '[Google Sign-In] DEVELOPER_ERROR: verificá package com.tonestone.huesotime + SHA-1 del keystore EAS en el cliente Android de Google Cloud.',
          err,
        );
      }
      throw new Error('developer_error');
    }
    if (
      err instanceof Error &&
      ['cancelled', 'play_services', 'missing_config', 'developer_error', 'error'].includes(err.message)
    ) {
      throw err;
    }
    if (__DEV__) {
      console.error('[Google Sign-In] unexpected error', err);
    }
    throw new Error('error');
  }
}
