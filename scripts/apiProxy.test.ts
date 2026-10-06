import { createServer, type Server } from 'node:http';
import { createRequire } from 'node:module';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, expect, it } from 'vitest';

const { createApiMiddleware } = createRequire(import.meta.url)('./apiProxy.cjs');
let api: Server;
let metro: Server;
let base: string;
let apiPort: number;

async function listen(server: Server): Promise<number> {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as AddressInfo).port;
}
async function close(server?: Server) {
  if (server?.listening) await new Promise<void>(resolve => server.close(() => resolve()));
}

beforeAll(async () => {
  api = createServer(async (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end('{"ok":true}');
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    res.writeHead(409, { ETag: '"version-2"', 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ method: req.method, url: req.url, authorization: req.headers.authorization,
      version: req.headers['if-match'], body: JSON.parse(body || 'null') }));
  });
  apiPort = await listen(api);
  metro = createServer(createApiMiddleware((_req: unknown, res: import('node:http').ServerResponse) => {
    res.end('packager-status:running');
  }, apiPort));
  base = `http://127.0.0.1:${await listen(metro)}`;
});

afterAll(async () => { await close(metro); await close(api); });

it('serves Metro and API health from the same public port', async () => {
  expect(await (await fetch(`${base}/status`)).text()).toBe('packager-status:running');
  expect(await (await fetch(`${base}/health`)).json()).toEqual({ ok: true });
});

it('preserves request body, query, identity, version and upstream response status', async () => {
  const response = await fetch(`${base}/v1/songs?q=rock`, {
    method: 'PUT', headers: { Authorization: 'Bearer test-token', 'If-Match': '"version-1"',
      'Content-Type': 'application/json' }, body: JSON.stringify([{ title: 'Song' }]),
  });
  expect(response.status).toBe(409);
  expect(response.headers.get('etag')).toBe('"version-2"');
  expect(await response.json()).toEqual({ method: 'PUT', url: '/v1/songs?q=rock',
    authorization: 'Bearer test-token', version: '"version-1"', body: [{ title: 'Song' }] });
});

it('does not route similarly named non-API paths to the backend', async () => {
  expect(await (await fetch(`${base}/v1extra`)).text()).toBe('packager-status:running');
});

it('reports a stopped API without breaking Metro', async () => {
  await close(api);
  const response = await fetch(`${base}/health`);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'api_unavailable' });
  expect(await (await fetch(`${base}/status`)).text()).toBe('packager-status:running');
});
