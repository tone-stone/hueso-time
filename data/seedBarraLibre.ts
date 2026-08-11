import { DEFAULT_SONG_DURATION_SEC } from '@/constants/defaults';
import { createId, nowIso } from '@/lib/id';
import type { KeyMode, MusicalKey, Song, SongInput } from '@/types/models';

/** Rows from Set-BarraLibre spreadsheet: [artist, title, tono] */
const ROWS: [string, string, string][] = [
  ['Caifanes', 'La célula que explota', 'Bm'],
  ['Caifanes', 'Viento', 'D'],
  ['Caifanes', 'Nubes', 'Bm'],
  ['Caifanes', 'Mátenme por qué me muero', 'G'],
  ['Caifanes', 'Afuera', 'Bm'],
  ['Caifanes', 'Aquí no es así', 'A#'],
  ['Caifanes', 'Miedo', 'Em'],
  ['Caifanes', 'No dejes que', 'D'],
  ['Caifanes', 'La negra tomasa', 'Am'],
  ['Caifanes', 'Perdí mi ojo de venado', 'C'],
  ['Caifanes', 'Amanece', 'A/B/C#m'],
  ['Caifanes', 'Los dioses ocultos', 'F'],
  ['Caifanes', 'Estas dormida', ''],
  ['Caifanes', 'Aviéntame', ''],
  ['Caifanes', 'Será por eso', 'E'],
  ['Jaguares', 'Te lo pido por favor', 'G'],
  ['Jaguares', 'Así Como tu', ''],
  ['Jaguares', 'Nunca te doblarás', ''],
  ['Maná', 'Hasta que te conocí', ''],
  ['Maná', 'Oye mi amor', 'Bm'],
  ['Maná', 'Me vale', 'A'],
  ['Maná', 'Clavado en un bar', 'E'],
  ['Maná', 'Corazón espinado', 'Bm'],
  ['Maná', 'Como te deseo', ''],
  ['Maná', 'Como diablos', ''],
  ['Maná', 'Rayando el sol', ''],
  ['Maná', 'Donde jugarán los niños', ''],
  ['Maná', 'Déjame entrar', ''],
  ['Maná', 'Perdido en un barco', ''],
  ['Maná', 'El desierto', ''],
  ['Maná', 'Pies a cabeza', ''],
  ['Enanitos Verdes', 'Amores lejanos', 'Dm'],
  ['Enanitos Verdes', 'La muralla', 'C#m'],
  ['Enanitos Verdes', 'Guitarras blancas', 'Cm'],
  ['Enanitos Verdes', 'Luz de día', 'Am'],
  ['Enanitos Verdes', 'Lamento boliviano', 'Em'],
  ['Enanitos Verdes', 'Tu cárcel', 'Bm'],
  ['Enanitos Verdes', 'Mi primer día sin ti', 'A'],
  ['Enanitos Verdes', 'Tan solo un instante', 'E'],
  ['Enanitos Verdes', 'Te vi en un tren', ''],
  ['Enanitos Verdes', 'Mariposas', ''],
  ['Elefante', 'De la noche a la mañana', 'Dm/G/A#/C/Dm'],
  ['Elefante', 'Mentirosa', ''],
  ['Elefante', 'Así es la vida', 'Gm'],
  ['Elefante', 'Ángel', ''],
  ['Elefante', 'Sabor a chocolate', 'Am'],
  ['Caos', 'La planta', 'Em'],
  ['Duncan Dhu', 'En algún lugar', 'Em'],
  ['Héroes del Silencio', 'Entre dos tierras', 'Bm'],
  ['Héroes del Silencio', 'Maldito duende', 'Em'],
  ['Héroes del Silencio', 'Héroe de leyenda', ''],
  ['Héroes del Silencio', 'La chispa adecuada', 'Dm'],
  ['Héroes del Silencio', 'La carta', ''],
  ['Café Tacuba', 'María', 'C#m-E-A-G#m'],
  ['Café Tacuba', 'Las flores', 'Bb/Dm/Eb/F'],
  ['Café Tacuba', 'Ingrata', 'G'],
  ['Café Tacuba', 'Eres', 'Am'],
  ['Soda Stereo', 'Signos', ''],
  ['Soda Stereo', 'La ciudad de la furia', 'Em'],
  ['Soda Stereo', 'El rito', ''],
  ['Soda Stereo', 'Zoom', ''],
  ['Soda Stereo', 'Música ligera', 'Bm'],
  ['Soda Stereo', 'Persiana americana', 'D'],
  ['Soda Stereo', 'Entre caníbales', 'Em'],
  ['Soda Stereo', 'Trátame suavemente', 'D'],
  ['La Ley', 'El duelo', 'Em'],
  ['La Ley', 'Día cero', 'Gm'],
  ['La Ley', 'Krazyworld', ''],
  ['La Ley', 'Intenta amar', ''],
  ['Los Auténticos Decadentes', 'La guitarra', ''],
  ['Los Auténticos Decadentes', 'Tu forma de ser', 'A'],
  ['Maldita Vecindad', 'Pachuco', ''],
  ['Maldita Vecindad', 'Gran circo', 'Am'],
  ['Maldita Vecindad', 'Kumbala', 'Em'],
  ['Maldita Vecindad', 'Pata de perro', ''],
  ['Maldita Vecindad', 'Un poco de sangre', 'Cm'],
  ['Maldita Vecindad', 'Solín', 'Am7'],
  ['Maldita Vecindad', 'Lo pasado pasado', ''],
  ['Panteón Rococó', 'Esta noche', 'C'],
  ['Panteón Rococó', 'Vendedora de caricias', 'F#m'],
  ['Panteón Rococó', 'La carencia', 'Am'],
  ['Panteón Rococó', 'Arréglame el alma', ''],
  ['Panteón Rococó', 'El demonio y la rubia', 'G'],
  ['Panteón Rococó', 'La dosis perfecta', 'Cm-Fm-Cm-A#'],
  ['Los Fabulosos Cadillacs', 'Dr. Satánico', 'Gm'],
  ['Los Fabulosos Cadillacs', 'Mal bicho', 'Am'],
  ['Los Fabulosos Cadillacs', 'Matador', 'Am'],
  ['Los Fabulosos Cadillacs', 'Manuel Santillán', 'Gm'],
  ['Los Fabulosos Cadillacs', 'Vasos vacíos', 'G'],
  ['Los Fabulosos Cadillacs', 'Siguiendo la luna', 'Em'],
  ['Los Fabulosos Cadillacs', 'Padre nuestro', ''],
  ['Inspector', 'Amargo adiós', 'Dm'],
  ['Inspector', 'Amnesia', 'F#m'],
  ['Inspector', 'Y qué', ''],
  ['Inspector', 'Me estoy enamorando', ''],
  ['La Cuca', 'La balada', ''],
  ['La Cuca', 'El son del dolor', 'Gb'],
  ['La Cuca', 'Cara de pizza', ''],
  ['Molotov', 'Gimme Tha Power', 'C#m'],
];

const KEY_ALIASES: Record<string, MusicalKey> = {
  'A#': 'Bb',
  BB: 'Bb',
  GB: 'F#',
  DB: 'C#',
  EB: 'Eb',
  AB: 'Ab',
};

function parseTono(raw: string): { key: MusicalKey; keyMode: KeyMode; notes?: string } {
  const cleaned = raw.trim();
  if (!cleaned) return { key: 'C', keyMode: 'major' };

  // Take first chord token from progressions like Bm/G or C#m-E-A
  const first = cleaned.split(/[\/\-–]/)[0]?.trim() ?? cleaned;
  const match = first.match(/^([A-Ga-g](?:#|b)?)(m|min|minor|maj|major|m7|7)?/i);
  if (!match) {
    return { key: 'C', keyMode: 'major', notes: `Tono original: ${cleaned}` };
  }

  let root = match[1].toUpperCase();
  // Normalize accidental casing: C# stays, Bb
  if (match[1].length > 1) {
    root = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  }
  const mapped = KEY_ALIASES[root.toUpperCase()] ?? (root as MusicalKey);
  const quality = (match[2] ?? '').toLowerCase();
  const keyMode: KeyMode =
    quality === 'm' || quality === 'min' || quality === 'minor' || quality === 'm7'
      ? 'minor'
      : 'major';

  const valid: MusicalKey[] = [
    'C',
    'C#',
    'Db',
    'D',
    'Eb',
    'E',
    'F',
    'F#',
    'G',
    'Ab',
    'A',
    'Bb',
    'B',
  ];
  const key = valid.includes(mapped) ? mapped : 'C';
  const notes =
    cleaned.includes('/') || cleaned.includes('-') || cleaned !== first
      ? `Tono original: ${cleaned}`
      : undefined;

  return { key, keyMode, notes };
}

function toSongInput(artist: string, title: string, tono: string): SongInput {
  const { key, keyMode, notes } = parseTono(tono);
  return {
    title,
    artist,
    bpm: 118,
    key,
    keyMode,
    genre: 'rock',
    durationSec: DEFAULT_SONG_DURATION_SEC,
    notes,
  };
}

export function buildBarraLibreSeedSongs(): Song[] {
  const stamp = nowIso();
  return ROWS.map(([artist, title, tono], index) => {
    const input = toSongInput(artist, title, tono);
    return {
      ...input,
      id: createId(`seed_${index}`),
      createdAt: stamp,
      updatedAt: stamp,
    };
  });
}

export function buildBarraLibreSongInputs(): SongInput[] {
  return ROWS.map(([artist, title, tono]) => toSongInput(artist, title, tono));
}

export const BARRA_LIBRE_COUNT = ROWS.length;
