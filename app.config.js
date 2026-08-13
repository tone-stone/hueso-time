/**
 * Dynamic Expo config so Google Sign-In can read iosUrlScheme from env at build time.
 * @see docs/GOOGLE_AUTH.md
 */
const appJson = require('./app.json');

/** Derive reversed iOS client scheme: xxx.apps.googleusercontent.com → com.googleusercontent.apps.xxx */
function iosUrlSchemeFromClientId(clientId) {
  if (!clientId) return undefined;
  const match = String(clientId).match(/^([^.]+)\.apps\.googleusercontent\.com$/i);
  if (!match) return undefined;
  return `com.googleusercontent.apps.${match[1]}`;
}

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const iosUrlScheme =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ||
  iosUrlSchemeFromClientId(iosClientId);

const plugins = (appJson.expo.plugins || []).map((plugin) => {
  if (plugin === '@react-native-google-signin/google-signin') {
    if (iosUrlScheme) {
      return ['@react-native-google-signin/google-signin', { iosUrlScheme }];
    }
    return plugin;
  }
  if (Array.isArray(plugin) && plugin[0] === '@react-native-google-signin/google-signin') {
    return iosUrlScheme
      ? ['@react-native-google-signin/google-signin', { ...(plugin[1] || {}), iosUrlScheme }]
      : plugin;
  }
  return plugin;
});

module.exports = {
  expo: {
    ...appJson.expo,
    // Keep product scheme first so Expo CLI / Metro deep links don't pick the Google iOS URL scheme.
    scheme: iosUrlScheme ? ['huesotime', iosUrlScheme] : 'huesotime',
    plugins,
  },
};
