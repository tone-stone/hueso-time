import 'dotenv/config';

import { serve } from '@hono/node-server';

import { app } from './app.js';

const port = Number(process.env.PORT || 8787);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Hueso Time API → http://localhost:${info.port}`);
  console.log(`Health          → http://localhost:${info.port}/health`);
  console.log(`Songs CRUD      → http://localhost:${info.port}/v1/songs`);
});
