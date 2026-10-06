import { z } from 'zod';
export const songSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  bpm: z.number().int().min(0).max(400),
  key: z.enum(['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']),
  keyMode: z.enum(['major', 'minor']),
  genre: z.enum(['rock', 'pop', 'blues', 'jazz', 'latin', 'regionalMexicano', 'reggaeton', 'metal', 'country', 'funk', 'soul', 'indie', 'punk', 'hardcore', 'metalcore', 'djent', 'progressive', 'salsa', 'ethnic', 'newAge', 'spiritual', 'instrumental', 'experimental', 'other']),
  durationSec: z.number().int().min(1).max(3600),
  notes: z.string().optional(),
  favorite: z.boolean().optional(),
  practiceStatus: z.enum(['ready', 'practice', 'showstopper']).optional(),
  imageUrl: z.string().optional(),
  spotifyId: z.string().optional(),
  externalUrl: z.string().optional(),
});

const songFiltersSchema = z.object({
  artists: z.array(z.string()),
  genres: z.array(z.string()),
  bpmMin: z.number().optional(),
  bpmMax: z.number().optional(),
  keys: z.array(z.string()),
});

export const setlistSchema = z.object({
  name: z.string().min(1),
  venue: z.string().optional(),
  date: z.string().optional(),
  genreFocus: z.string().optional(),
  songFilters: songFiltersSchema.optional(),
  favorite: z.boolean().optional(),
  sets: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      targetMinutes: z.number().int().min(1).max(180),
      songs: z.array(
        z.object({
          songId: z.string().min(1),
          order: z.number().int().min(0),
        }),
      ),
    }),
  ),
});

export const settingsSchema = z.object({
  language: z.enum(['es', 'en']).optional(),
  defaultSetMinutes: z.number().int().min(1).max(180).optional(),
  defaultSetCount: z.number().int().min(1).max(10).optional(),
});


const identity = { id: z.string().min(1), createdAt: z.string(), updatedAt: z.string() };
export const dataSchema = z.object({
  songs: z.array(songSchema.extend(identity)),
  setlists: z.array(setlistSchema.extend(identity)),
  settings: settingsSchema.required(),
}).strict().superRefine((data, ctx) => {
  const ids = new Set(data.songs.map(s => s.id));
  if (ids.size !== data.songs.length || new Set(data.setlists.map(s => s.id)).size !== data.setlists.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate identifiers' });
  for (const sl of data.setlists) {
    if (new Set(sl.sets.map(s => s.id)).size !== sl.sets.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate set identifiers' });
    for (const set of sl.sets) for (const ref of set.songs)
      if (!ids.has(ref.songId)) ctx.addIssue({ code: 'custom', message: 'Unknown song reference' });
  }
});
