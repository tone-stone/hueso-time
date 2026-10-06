import { afterEach, describe, expect, it, vi } from 'vitest';
const verify = vi.hoisted(() => vi.fn());
vi.mock('google-auth-library', () => ({ OAuth2Client: class { verifyIdToken = verify; } }));
import { authenticate } from './auth';
afterEach(() => { vi.unstubAllEnvs(); verify.mockReset(); });
const payload = { sub: 'verified-sub', email: 'user@gmail.com', email_verified: true, exp: Math.floor(Date.now() / 1000) + 1000 };
describe('server Google authentication', () => {
  it('fails closed when not configured or missing credentials', async () => {
    vi.stubEnv('GOOGLE_CLIENT_IDS', ''); expect(await authenticate('Bearer token')).toBe('unconfigured');
    vi.stubEnv('GOOGLE_CLIENT_IDS', 'client'); expect(await authenticate()).toBeNull(); expect(verify).not.toHaveBeenCalled();
  });
  it('passes explicit allowed audiences to the Google signature verifier', async () => {
    vi.stubEnv('GOOGLE_CLIENT_IDS', 'web, ios');
    verify.mockResolvedValue({ getPayload: () => payload });
    expect(await authenticate('Bearer token')).toBe('verified-sub');
    expect(verify).toHaveBeenCalledWith({ idToken: 'token', audience: ['web', 'ios'] });
  });
  it('rejects failed verification, expired tokens and unverified/non-Gmail accounts', async () => {
    vi.stubEnv('GOOGLE_CLIENT_IDS', 'client');
    verify.mockRejectedValueOnce(new Error('bad signature')); expect(await authenticate('Bearer forged')).toBeNull();
    for (const change of [{ exp: 0 }, { email_verified: false }, { email: 'user@example.com' }, { sub: '' }]) {
      verify.mockResolvedValue({ getPayload: () => ({ ...payload, ...change }) });
      expect(await authenticate('Bearer token')).toBeNull();
    }
  });
});
