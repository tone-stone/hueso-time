const http = require('node:http');

/** Serve the API through Metro's port; leave bundle and WebSocket routes to Expo. */
function createApiMiddleware(metroMiddleware, port = 8787) {
  return (req, res, next) => {
    const pathname = (req.url || '/').split('?')[0];
    if (pathname !== '/health' && !/^\/v1(?:\/|$)/.test(pathname)) {
      return metroMiddleware(req, res, next);
    }

    const upstream = http.request({
      hostname: '127.0.0.1',
      port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${port}` },
    }, (response) => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.on('error', () => res.destroy());
      response.pipe(res);
    });

    upstream.setTimeout(30_000, () => upstream.destroy(new Error('API timeout')));
    upstream.on('error', () => {
      if (res.destroyed) return;
      if (res.headersSent) return res.destroy();
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'api_unavailable' }));
    });
    req.on('aborted', () => upstream.destroy());
    res.on('close', () => { if (!res.writableEnded) upstream.destroy(); });
    req.pipe(upstream);
  };
}

module.exports = { createApiMiddleware };
