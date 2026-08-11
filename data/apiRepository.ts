import type { DataRepository } from '@/data/repository';
import type {
  AppData,
  AppSettings,
  Setlist,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Implementación HTTP del DataRepository.
 * Activar con EXPO_PUBLIC_USE_API=1 y EXPO_PUBLIC_API_URL.
 */
export const apiRepository: DataRepository = {
  async load() {
    return request<AppData>('/v1/data');
  },

  async saveSongs(songs) {
    const data = await request<AppData>('/v1/data');
    await request('/v1/data', {
      method: 'PUT',
      body: JSON.stringify({ ...data, songs }),
    });
  },

  async saveSetlists(setlists) {
    const data = await request<AppData>('/v1/data');
    await request('/v1/data', {
      method: 'PUT',
      body: JSON.stringify({ ...data, setlists }),
    });
  },

  async saveSettings(settings) {
    await request('/v1/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  async upsertSong(input: SongInput, id?: string) {
    if (id) {
      return request<Song>(`/v1/songs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }
    return request<Song>('/v1/songs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async deleteSong(id) {
    await request(`/v1/songs/${id}`, { method: 'DELETE' });
  },

  async upsertSetlist(input: SetlistInput, id?: string) {
    if (id) {
      return request<Setlist>(`/v1/setlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }
    return request<Setlist>('/v1/setlists', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async deleteSetlist(id) {
    await request(`/v1/setlists/${id}`, { method: 'DELETE' });
  },
};

export function isApiEnabled(): boolean {
  return process.env.EXPO_PUBLIC_USE_API === '1';
}
