import { describe, expect, it } from 'vitest';

import { isOAuthRedirectRoute } from '../lib/oauthRoute';

describe('oauthRoute', () => {
  it('recognizes oauth landing route', () => {
    expect(isOAuthRedirectRoute('oauth')).toBe(true);
    expect(isOAuthRedirectRoute('login')).toBe(false);
    expect(isOAuthRedirectRoute(undefined)).toBe(false);
  });
});
