import { makeRedirectUri } from 'expo-auth-session';

/** Redirect used by browser OAuth on web. Native installs use Google Sign-In. */
export function getGoogleBrowserRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'huesotime',
    path: 'oauth',
    native: 'huesotime://oauth',
  });
}
