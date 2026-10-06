import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();
export async function authenticate(header?: string): Promise<string | null> {
  const audience = (process.env.GOOGLE_CLIENT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!audience.length) return 'unconfigured';
  const match = /^Bearer (\S+)$/.exec(header || '');
  if (!match) return null;
  try {
    const ticket = await client.verifyIdToken({ idToken: match[1], audience });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email_verified || !p.email || !/@(gmail|googlemail)\.com$/i.test(p.email) ||
        !p.exp || p.exp <= Math.floor(Date.now() / 1000)) return null;
    return p.sub;
  } catch { return null; }
}
