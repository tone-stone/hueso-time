import { afterEach, describe, expect, it } from 'vitest';

import {
  getGoogleClientConfig,
  isAuthSkipped,
  isGmailAddress,
  isIdTokenFresh,
  userFromIdToken,
} from '../lib/googleAuth';

function b64url(obj: Record<string, unknown>) {
  const json = JSON.stringify(obj);
  const b64 = Buffer.from(json, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fakeJwt(payload: Record<string, unknown>) {
  return `hdr.${b64url(payload)}.sig`;
}

describe('googleAuth', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env.EXPO_PUBLIC_SKIP_AUTH = prev.EXPO_PUBLIC_SKIP_AUTH;
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = prev.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = prev.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = prev.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  });

  it('accepts gmail addresses only', () => {
    expect(isGmailAddress('Tone@Gmail.com')).toBe(true);
    expect(isGmailAddress('user@googlemail.com')).toBe(true);
    expect(isGmailAddress('user@company.com')).toBe(false);
  });

  it('parses SKIP_AUTH flags', () => {
    process.env.EXPO_PUBLIC_SKIP_AUTH = '0';
    expect(isAuthSkipped()).toBe(false);
    process.env.EXPO_PUBLIC_SKIP_AUTH = '1';
    expect(isAuthSkipped()).toBe(true);
    process.env.EXPO_PUBLIC_SKIP_AUTH = 'false';
    expect(isAuthSkipped()).toBe(false);
  });

  it('reports configured google clients', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = '';
    expect(getGoogleClientConfig().configured).toBe(false);

    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'ios.apps.googleusercontent.com';
    expect(getGoogleClientConfig().configured).toBe(true);
    expect(getGoogleClientConfig().iosClientId).toBe('ios.apps.googleusercontent.com');
  });

  it('rejects expired tokens', () => {
    const token = fakeJwt({
      email: 'band@gmail.com',
      sub: '123',
      exp: Math.floor(Date.now() / 1000) - 120,
    });
    expect(isIdTokenFresh(token)).toBe(false);
    expect(() => userFromIdToken(token)).toThrow('token_expired');
  });

  it('builds user from fresh gmail token', () => {
    const token = fakeJwt({
      email: 'band@gmail.com',
      sub: 'abc',
      name: 'Band',
      picture: 'https://example.com/p.png',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const user = userFromIdToken(token);
    expect(user.email).toBe('band@gmail.com');
    expect(user.id).toBe('abc');
    expect(user.name).toBe('Band');
  });

  it('rejects non-gmail tokens', () => {
    const token = fakeJwt({
      email: 'band@outlook.com',
      sub: 'abc',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(() => userFromIdToken(token)).toThrow('gmail_required');
  });
});
