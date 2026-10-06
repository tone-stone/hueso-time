import { afterEach, expect, it, vi } from 'vitest';
import { searchMusic } from './musicSearch';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('queries Spotify through the same server port independently of the saved repertoire', async () => {
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://192.168.100.16:8081');
  const song = { id: 'spotify:track', spotifyId: 'track', title: 'New song', artist: 'Band', durationSec: 240, source: 'spotify' };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ source: 'spotify', results: [song] })));
  vi.stubGlobal('fetch', fetch);
  expect(await searchMusic('New song')).toEqual({ source: 'spotify', results: [song] });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe('http://192.168.100.16:8081/v1/music/search?q=New%20song&limit=10');
});
