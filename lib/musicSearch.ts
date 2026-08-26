import type { Genre } from '@/types/models';

export type MusicSearchHit = {
  id: string;
  title: string;
  artist: string;
  durationSec: number;
  imageUrl?: string;
  genreHint?: string;
  spotifyId?: string;
  externalUrl?: string;
  source: 'spotify' | 'itunes';
};

function apiBase() {
  return (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787').replace(/\/$/, '');
}

export function mapGenreHint(hint?: string): Genre | undefined {
  if (!hint) return undefined;
  const n = hint.toLowerCase();
  if (n.includes('djent')) return 'djent';
  if (n.includes('metalcore') || n.includes('deathcore')) return 'metalcore';
  if (n.includes('hardcore')) return 'hardcore';
  if (n.includes('punk')) return 'punk';
  if (n.includes('progressive') || n.includes('prog ')) return 'progressive';
  if (n.includes('salsa')) return 'salsa';
  if (n.includes('new age') || n.includes('newage') || n.includes('ambient')) return 'newAge';
  if (n.includes('spiritual') || n.includes('gospel') || n.includes('christian')) return 'spiritual';
  if (n.includes('instrumental')) return 'instrumental';
  if (n.includes('experimental') || n.includes('avant')) return 'experimental';
  if (n.includes('ethnic') || n.includes('world') || n.includes('folk') || n.includes('tradicional'))
    return 'ethnic';
  if (n.includes('reggaeton') || n.includes('urbano')) return 'reggaeton';
  if (
    n.includes('regional') ||
    n.includes('norteñ') ||
    n.includes('nortena') ||
    n.includes('banda') ||
    n.includes('corrido')
  ) {
    return 'regionalMexicano';
  }
  if (n.includes('latin') || n.includes('tropical')) return 'latin';
  if (n.includes('metal')) return 'metal';
  if (n.includes('rock') || n.includes('alternative')) return 'rock';
  if (n.includes('pop')) return 'pop';
  if (n.includes('blues')) return 'blues';
  if (n.includes('jazz')) return 'jazz';
  if (n.includes('country')) return 'country';
  if (n.includes('funk')) return 'funk';
  if (n.includes('soul') || n.includes('r&b') || n.includes('rnb')) return 'soul';
  if (n.includes('indie')) return 'indie';
  return 'other';
}

async function searchViaBackend(q: string): Promise<MusicSearchHit[] | null> {
  try {
    const url = `${apiBase()}/v1/music/search?q=${encodeURIComponent(q)}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: MusicSearchHit[]; source?: string };
    if (!data.results?.length) return null;
    return data.results;
  } catch {
    return null;
  }
}

async function searchItunes(q: string): Promise<MusicSearchHit[]> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', q);
  url.searchParams.set('media', 'music');
  url.searchParams.set('entity', 'song');
  url.searchParams.set('limit', '10');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`itunes_${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      trackTimeMillis?: number;
      artworkUrl100?: string;
      artworkUrl60?: string;
      primaryGenreName?: string;
      trackViewUrl?: string;
    }>;
  };

  return (data.results ?? []).map((item) => ({
    id: `itunes:${item.trackId}`,
    title: item.trackName,
    artist: item.artistName,
    durationSec: Math.max(1, Math.round((item.trackTimeMillis || 210000) / 1000)),
    imageUrl: item.artworkUrl100?.replace('100x100bb', '300x300bb') ?? item.artworkUrl60,
    genreHint: item.primaryGenreName,
    externalUrl: item.trackViewUrl,
    source: 'itunes' as const,
  }));
}

/**
 * Busca temas: Spotify (vía backend) si está configurado; si no, iTunes (público).
 */
export async function searchMusic(q: string): Promise<{
  results: MusicSearchHit[];
  source: 'spotify' | 'itunes' | 'none';
}> {
  const query = q.trim();
  if (!query) return { results: [], source: 'none' };

  const fromSpotify = await searchViaBackend(query);
  if (fromSpotify?.length) {
    return { results: fromSpotify, source: fromSpotify[0]?.source ?? 'spotify' };
  }

  const fromItunes = await searchItunes(query);
  return { results: fromItunes, source: fromItunes.length ? 'itunes' : 'none' };
}

export type ArtistSearchHit = {
  id: string;
  name: string;
  imageUrl?: string;
  source: 'spotify' | 'itunes';
};

async function searchArtistsViaBackend(q: string): Promise<ArtistSearchHit[] | null> {
  try {
    const url = `${apiBase()}/v1/music/search-artists?q=${encodeURIComponent(q)}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ id: string; name: string; imageUrl?: string }>;
    };
    if (!data.results?.length) return null;
    return data.results.map((r) => ({ ...r, source: 'spotify' as const }));
  } catch {
    return null;
  }
}

async function searchArtistsItunes(q: string): Promise<ArtistSearchHit[]> {
  const url = new URL('https://itunes.apple.com/search');
  url.searchParams.set('term', q);
  url.searchParams.set('entity', 'musicArtist');
  url.searchParams.set('limit', '10');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`itunes_artist_${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{ artistId: number; artistName: string }>;
  };

  return (data.results ?? []).map((item) => ({
    id: `itunes-artist:${item.artistId}`,
    name: item.artistName,
    source: 'itunes' as const,
  }));
}

/**
 * Busca artistas (no acotado a tu repertorio): Spotify vía backend si está
 * configurado; si no, iTunes. Usado para etiquetar preferencias de artista
 * aunque todavía no tengas temas suyos cargados.
 */
export async function searchArtists(q: string): Promise<{
  results: ArtistSearchHit[];
  source: 'spotify' | 'itunes' | 'none';
}> {
  const query = q.trim();
  if (!query) return { results: [], source: 'none' };

  const fromSpotify = await searchArtistsViaBackend(query);
  if (fromSpotify?.length) return { results: fromSpotify, source: 'spotify' };

  const fromItunes = await searchArtistsItunes(query);
  return { results: fromItunes, source: fromItunes.length ? 'itunes' : 'none' };
}
