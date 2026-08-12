export function isAuthSkipped(): boolean {
  // Pruebas: por defecto salteamos login. Poné EXPO_PUBLIC_SKIP_AUTH=0 para exigir Gmail.
  const flag = process.env.EXPO_PUBLIC_SKIP_AUTH?.trim().toLowerCase();
  if (flag === '0' || flag === 'false' || flag === 'off') return false;
  if (flag === '1' || flag === 'true' || flag === 'on') return true;
  return true;
}

export function isGmailAddress(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith('@gmail.com') || normalized.endsWith('@googlemail.com');
}

export function getGoogleClientConfig() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || undefined;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || undefined;

  return {
    webClientId,
    iosClientId,
    androidClientId,
    configured: !!(webClientId || iosClientId || androidClientId),
  };
}

function base64UrlToUtf8(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
  const globalAtob = (globalThis as { atob?: (s: string) => string }).atob;
  if (globalAtob) return globalAtob(padded);

  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of padded.replace(/=+$/, '')) {
    const val = alphabet.indexOf(ch);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      str += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return str;
}

/** Decode JWT payload without verifying signature (Google already issued it). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('invalid_token');
  return JSON.parse(base64UrlToUtf8(part)) as Record<string, unknown>;
}

/** Returns true if exp claim is missing or still in the future (60s skew). */
export function isIdTokenFresh(idToken: string, nowSec = Math.floor(Date.now() / 1000)): boolean {
  try {
    const payload = decodeJwtPayload(idToken);
    const exp = Number(payload.exp);
    if (!Number.isFinite(exp)) return false;
    return exp > nowSec - 60;
  } catch {
    return false;
  }
}

export function userFromIdToken(idToken: string) {
  if (!isIdTokenFresh(idToken)) throw new Error('token_expired');
  const payload = decodeJwtPayload(idToken);
  const email = String(payload.email ?? '');
  if (!email) throw new Error('missing_email');
  if (!isGmailAddress(email)) throw new Error('gmail_required');

  return {
    id: String(payload.sub ?? email),
    email,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    idToken,
  };
}
