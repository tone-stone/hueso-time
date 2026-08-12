import { makeRedirectUri } from 'expo-auth-session';

/** Shared redirect used by browser OAuth (web / Expo Go fallback). */
export function getGoogleBrowserRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'huesotime',
    path: 'oauth',
    native: 'huesotime://oauth',
  });
}
