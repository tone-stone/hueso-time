import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ user: { id: 'alice', idToken: 'signed-token' } as { id: string; idToken: string } | null }));
vi.mock('@/lib/authStorage', () => ({ loadAuthUser: async () => auth.user }));
import { apiRepository as repo, resetApiSession } from './apiRepository';
const fetchMock = vi.fn();
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const data = { songs: [], setlists: [], settings: { language: 'es', defaultSetMinutes: 45, defaultSetCount: 3 } };
beforeEach(() => {
  resetApiSession(); auth.user = { id: 'alice', idToken: 'signed-token' };
  fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
});
it('sends credentials and replaces only the collection with its loaded version', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers: { ETag: '"v1"' } }));
  await repo.load();
  fetchMock.mockResolvedValueOnce(new Response('[]', { headers: { ETag: '"v2"' } }));
  await repo.saveSongs([]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toMatch(/\/v1\/songs$/);
  expect(init.headers.Authorization).toBe('Bearer signed-token');
  expect(init.headers['If-Match']).toBe('"v1"');
  expect(JSON.parse(init.body)).toEqual([]);
});
it('does not retry a conflict by overwriting a newer document', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers: { ETag: '"v1"' } }));
  await repo.load();
  fetchMock.mockResolvedValueOnce(new Response('conflict', { status: 409 }));
  await expect(repo.saveSongs([])).rejects.toThrow('Los datos cambiaron');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('rejects queued work after a session change', async () => {
  const load = repo.load(); resetApiSession();
  await expect(load).rejects.toThrow('sesión cambió');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('requires authentication before making a request', async () => {
  auth.user = null;
  await expect(repo.load()).rejects.toThrow('Google');
  expect(fetchMock).not.toHaveBeenCalled();
});
it('recovers a backup through the guarded endpoint using the loaded revision', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers: { ETag: '"empty"' } }));
  await repo.load();
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers: { ETag: '"restored"' } }));
  await repo.restoreData(data);
  const [url, init] = fetchMock.mock.calls[1];
  expect(url).toMatch(/\/v1\/data\/recover$/);
  expect(init.method).toBe('POST');
  expect(init.headers.Authorization).toBe('Bearer signed-token');
  expect(init.headers['If-Match']).toBe('"empty"');
  expect(JSON.parse(init.body)).toEqual(data);
});
it('never retries recovery after another writer changes the account', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(data), { headers: { ETag: '"empty"' } }));
  await repo.load();
  fetchMock.mockResolvedValueOnce(new Response('{}', { status: 409 }));
  await expect(repo.restoreData(data)).rejects.toThrow('Los datos cambiaron');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('ends a stalled load and allows retrying without blocking the queue', async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementationOnce((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')));
  })).mockResolvedValueOnce(new Response(JSON.stringify(data), {
    headers: { ETag: '"revision"' },
  }));
  const failed = expect(repo.load()).rejects.toThrow('No se pudo conectar con la API');
  await vi.advanceTimersByTimeAsync(15_000);
  await failed;
  expect(await repo.load()).toEqual(data);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});
