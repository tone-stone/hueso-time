import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

import * as store from './store.js';
import type { Genre, KeyMode, MusicalKey, SongInput, SetlistInput } from './types.js';

const songSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  bpm: z.number().int().min(0).max(400),
  key: z.string().min(1),
  keyMode: z.enum(['major', 'minor']),
  genre: z.string().min(1),
  durationSec: z.number().int().min(1).max(3600),
  notes: z.string().optional(),
});

const setlistSchema = z.object({
  name: z.string().min(1),
  venue: z.string().optional(),
  date: z.string().optional(),
  genreFocus: z.string().optional(),
  sets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      targetMinutes: z.number().int().min(1).max(180),
      songs: z.array(
        z.object({
          songId: z.string(),
          order: z.number().int().min(0),
        }),
      ),
    }),
  ),
});

const settingsSchema = z.object({
  language: z.enum(['es', 'en']).optional(),
  defaultSetMinutes: z.number().int().min(1).max(180).optional(),
  defaultSetCount: z.number().int().min(1).max(10).optional(),
});

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.get('/health', (c) => c.json({ ok: true, service: 'hueso-time-api' }));

/** Full dump — útil para sync inicial de la app. */
app.get('/v1/data', (c) => c.json(store.readDb()));

app.put('/v1/data', async (c) => {
  const body = await c.req.json();
  const saved = store.replaceAll(body);
  return c.json(saved);
});

// —— Songs CRUD ——
app.get('/v1/songs', (c) => {
  const q = c.req.query('q') || undefined;
  const artist = c.req.query('artist') || undefined;
  const genre = c.req.query('genre') || undefined;
  const key = c.req.query('key') || undefined;
  const bpmMin = c.req.query('bpmMin') ? Number(c.req.query('bpmMin')) : undefined;
  const bpmMax = c.req.query('bpmMax') ? Number(c.req.query('bpmMax')) : undefined;
  return c.json(store.listSongs({ q, artist, genre, key, bpmMin, bpmMax }));
});

app.get('/v1/songs/:id', (c) => {
  const song = store.getSong(c.req.param('id'));
  if (!song) return c.json({ error: 'Song not found' }, 404);
  return c.json(song);
});

app.post('/v1/songs', async (c) => {
  const body = await c.req.json();
  const parsed = songSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const input = parsed.data as SongInput;
  input.key = parsed.data.key as MusicalKey;
  input.keyMode = parsed.data.keyMode as KeyMode;
  input.genre = parsed.data.genre as Genre;
  const song = store.createSong(input);
  return c.json(song, 201);
});

app.put('/v1/songs/:id', async (c) => {
  const body = await c.req.json();
  const parsed = songSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const input = parsed.data as SongInput;
  input.key = parsed.data.key as MusicalKey;
  input.keyMode = parsed.data.keyMode as KeyMode;
  input.genre = parsed.data.genre as Genre;
  const song = store.updateSong(c.req.param('id'), input);
  if (!song) return c.json({ error: 'Song not found' }, 404);
  return c.json(song);
});

app.delete('/v1/songs/:id', (c) => {
  const ok = store.deleteSong(c.req.param('id'));
  if (!ok) return c.json({ error: 'Song not found' }, 404);
  return c.json({ ok: true });
});

// —— Setlists CRUD ——
app.get('/v1/setlists', (c) => c.json(store.listSetlists()));

app.get('/v1/setlists/:id', (c) => {
  const setlist = store.getSetlist(c.req.param('id'));
  if (!setlist) return c.json({ error: 'Setlist not found' }, 404);
  return c.json(setlist);
});

app.post('/v1/setlists', async (c) => {
  const body = await c.req.json();
  const parsed = setlistSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const input = parsed.data as SetlistInput;
  if (parsed.data.genreFocus) input.genreFocus = parsed.data.genreFocus as Genre;
  const setlist = store.createSetlist(input);
  return c.json(setlist, 201);
});

app.put('/v1/setlists/:id', async (c) => {
  const body = await c.req.json();
  const parsed = setlistSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const input = parsed.data as SetlistInput;
  if (parsed.data.genreFocus) input.genreFocus = parsed.data.genreFocus as Genre;
  const setlist = store.updateSetlist(c.req.param('id'), input);
  if (!setlist) return c.json({ error: 'Setlist not found' }, 404);
  return c.json(setlist);
});

app.delete('/v1/setlists/:id', (c) => {
  const ok = store.deleteSetlist(c.req.param('id'));
  if (!ok) return c.json({ error: 'Setlist not found' }, 404);
  return c.json({ ok: true });
});

// —— Settings ——
app.get('/v1/settings', (c) => c.json(store.getSettings()));

app.patch('/v1/settings', async (c) => {
  const body = await c.req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  return c.json(store.updateSettings(parsed.data));
});
