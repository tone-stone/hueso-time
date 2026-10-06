import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
vi.mock('./auth.js', () => ({ authenticate: async (header?: string) => header === 'Bearer alice' ? 'alice' : header === 'Bearer bob' ? 'bob' : null }));
const dir = mkdtempSync(join(tmpdir(), 'hueso-test-'));
vi.stubEnv('DATA_DIR', dir);
let app: typeof import('./app').app;
beforeAll(async () => { app = (await import('./app')).app; });
afterAll(() => { rmSync(dir, { recursive: true, force: true }); vi.unstubAllEnvs(); });
const input = { title: 'Song', artist: 'Band', bpm: 120, key: 'C', keyMode: 'major', genre: 'rock', durationSec: 180, practiceStatus: 'ready' };
async function get(account = 'alice') { return app.request('/v1/data', { headers: { Authorization: `Bearer ${account}` } }); }
function mutate(path: string, method: string, body: unknown, etag?: string, account = 'alice') {
  return app.request(path, { method, headers: { Authorization: `Bearer ${account}`, 'Content-Type': 'application/json', ...(etag ? { 'If-Match': etag } : {}) }, body: JSON.stringify(body) });
}
describe('authenticated API and persistence', () => {
  it('requires credentials', async () => { expect((await app.request('/v1/data')).status).toBe(401); });
  it('isolates accounts and retains practice status on creation and update', async () => {
    const initial = await get();
    const catalog = await initial.clone().json();
    expect(catalog.songs).toHaveLength(254);
    expect((await get()).headers.get('etag')).toBe(initial.headers.get('etag'));
    const created = await mutate('/v1/songs', 'POST', input, initial.headers.get('etag')!);
    expect(created.status).toBe(201);
    const song = await created.json(); expect(song.practiceStatus).toBe('ready');
    const updated = await mutate(`/v1/songs/${song.id}`, 'PUT', { ...input, practiceStatus: 'showstopper' }, created.headers.get('etag')!);
    expect((await updated.json()).practiceStatus).toBe('showstopper');
    const bob = await (await get('bob')).json();
    expect(bob.songs).toHaveLength(254);
    expect(bob.songs.some((s: { id: string }) => s.id === song.id)).toBe(false);
  });
  it('rejects invalid dumps and unknown references without changing data', async () => {
    const initial = await get(); const etag = initial.headers.get('etag')!; const data = await initial.json();
    expect((await mutate('/v1/data', 'PUT', {}, etag)).status).toBe(400);
    expect((await mutate('/v1/data', 'PUT', { ...data, songs: 'bad' }, etag)).status).toBe(400);
    const sl = { id: 'sl', createdAt: '', updatedAt: '', name: 'show', sets: [{ id: 'set', name: 'set', targetMinutes: 45, songs: [{ songId: 'unknown', order: 0 }] }] };
    expect((await mutate('/v1/data', 'PUT', { ...data, setlists: [sl] }, etag)).status).toBe(400);
    expect(await (await get()).json()).toEqual(data);
  });
  it('rejects stale and unversioned mutations and saves a backup', async () => {
    const initial = await get(); const etag = initial.headers.get('etag')!;
    expect((await mutate('/v1/songs', 'POST', input)).status).toBe(428);
    const responses = await Promise.all([mutate('/v1/songs', 'POST', input, etag), mutate('/v1/songs', 'POST', input, etag)]);
    expect(responses.map(r => r.status).sort()).toEqual([201, 409]);
    expect(readdirSync(join(dir, 'accounts')).some(f => f.endsWith('.bak'))).toBe(true);
  });
  it('never overwrites a corrupted file', async () => {
    const file = `${createHash('sha256').update('alice').digest('hex')}.json`;
    const path = join(dir, 'accounts', file); writeFileSync(path, '{broken');
    expect((await get()).status).toBe(500);
    expect((await mutate('/v1/songs', 'POST', input, '"old"')).status).toBe(500);
    expect(readFileSync(path, 'utf8')).toBe('{broken');
  });
  it('replaces an untouched starter catalog with original backup identities and setlist links, once only', async () => {
    const initial = await get('bob');
    const etag = initial.headers.get('etag')!;
    const backup = {
      songs: [{ ...input, id: 'original-song', createdAt: '2025-01-01', updatedAt: '2025-02-01', favorite: true, spotifyId: 'saved-spotify-id' }],
      setlists: [{ id: 'original-show', createdAt: '2025-01-01', updatedAt: '2025-02-01', name: 'Previous show', sets: [{ id: 'original-set', name: 'Set 1', targetMinutes: 45, songs: [{ songId: 'original-song', order: 0 }] }] }],
      settings: { language: 'es', defaultSetMinutes: 45, defaultSetCount: 3 },
    };
    expect((await app.request('/v1/data/recover', { method: 'POST', body: JSON.stringify(backup) })).status).toBe(401);
    expect((await mutate('/v1/data/recover', 'POST', backup, undefined, 'bob')).status).toBe(428);
    expect((await mutate('/v1/data/recover', 'POST', { ...backup, songs: [] }, etag, 'bob')).status).toBe(400);
    const restored = await mutate('/v1/data/recover', 'POST', backup, etag, 'bob');
    expect(restored.status).toBe(200);
    expect(await restored.json()).toEqual(backup);
    expect(await (await get('bob')).json()).toEqual(backup);
    expect((await mutate('/v1/data/recover', 'POST', { ...backup, songs: [{ ...backup.songs[0], title: 'Overwrite attempt' }] }, restored.headers.get('etag')!, 'bob')).status).toBe(409);
    expect(await (await get('bob')).json()).toEqual(backup);
  });
  it('does not repopulate a saved repertoire after the user removes all songs', async () => {
    const initial = await get('bob');
    const empty = { songs: [], setlists: [], settings: { language: 'es', defaultSetMinutes: 45, defaultSetCount: 3 } };
    expect((await mutate('/v1/data', 'PUT', empty, initial.headers.get('etag')!, 'bob')).status).toBe(200);
    expect(await (await get('bob')).json()).toEqual(empty);
  });
});
