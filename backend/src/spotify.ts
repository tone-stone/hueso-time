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

type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

function credentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isSpotifyConfigured() {
  return !!credentials();
}

async function getAccessToken(): Promise<string> {
  const creds = credentials();
  if (!creds) throw new Error('spotify_not_configured');

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) {
    return tokenCache.token;
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`spotify_token_${res.status}:${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export type ArtistSearchHit = {
  id: string;
  name: string;
  imageUrl?: string;
  genres?: string[];
  externalUrl?: string;
};

export async function searchSpotifyArtists(q: string, limit = 10): Promise<ArtistSearchHit[]> {
  const query = q.trim();
  if (!query) return [];

  const token = await getAccessToken();
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'artist');
  url.searchParams.set('limit', String(Math.min(10, Math.max(1, limit))));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`spotify_artist_search_${res.status}:${text}`);
  }

  const data = (await res.json()) as {
    artists?: {
      items?: Array<{
        id: string;
        name: string;
        genres?: string[];
        images?: Array<{ url: string }>;
        external_urls?: { spotify?: string };
      }>;
    };
  };

  return (data.artists?.items ?? []).map((artist) => ({
    id: artist.id,
    name: artist.name,
    imageUrl: artist.images?.[artist.images.length - 1]?.url ?? artist.images?.[0]?.url,
    genres: artist.genres,
    externalUrl: artist.external_urls?.spotify,
  }));
}

export async function searchSpotifyTracks(q: string, limit = 10): Promise<MusicSearchHit[]> {
  const query = q.trim();
  if (!query) return [];

  const token = await getAccessToken();
  const market = process.env.SPOTIFY_MARKET?.trim() || 'AR';
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(Math.min(10, Math.max(1, limit))));
  url.searchParams.set('market', market);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`spotify_search_${res.status}:${text}`);
  }

  const data = (await res.json()) as {
    tracks?: {
      items?: Array<{
        id: string;
        name: string;
        duration_ms: number;
        external_urls?: { spotify?: string };
        artists?: Array<{ name: string }>;
        album?: { images?: Array<{ url: string }> };
      }>;
    };
  };

  return (data.tracks?.items ?? []).map((track) => ({
    id: `spotify:${track.id}`,
    title: track.name,
    artist: (track.artists ?? []).map((a) => a.name).join(', ') || 'Unknown',
    durationSec: Math.max(1, Math.round((track.duration_ms || 0) / 1000)),
    imageUrl: track.album?.images?.[1]?.url ?? track.album?.images?.[0]?.url,
    spotifyId: track.id,
    externalUrl: track.external_urls?.spotify,
    source: 'spotify' as const,
  }));
}
