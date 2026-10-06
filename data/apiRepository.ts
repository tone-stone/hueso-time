import { loadAuthUser } from '@/lib/authStorage';
import type { DataRepository } from '@/data/repository';
import type {
  AppData,
  AppSettings,
  Setlist,
  SetlistInput,
  Song,
  SongInput,
} from '@/types/models';

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081').replace(/\/$/, '');

let etag: string | null = null;
let account: string | null = null;
let pending: Promise<unknown> = Promise.resolve();
let session = 0;
export function resetApiSession() { session += 1; etag = null; account = null; }

export class ApiError extends Error {
  constructor(public readonly status: number) {
    const messages: Record<number, string> = {
      401: 'Tu sesión venció o no es válida. Vuelve a iniciar sesión con Google.',
      409: 'Los datos cambiaron. Recárgalos antes de volver a guardar.',
      428: 'Recarga los datos antes de guardar.',
      400: 'Los datos no son válidos. Revisa la información antes de guardar.',
      500: 'No se pudieron leer o guardar los datos. Inténtalo nuevamente.',
      503: 'El servicio de datos todavía no está configurado o disponible.',
    };
    super(messages[status] || 'No se pudo completar la solicitud. Inténtalo nuevamente.');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const started = session;
  const user = await loadAuthUser();
  if (started !== session) throw new Error('La sesión cambió.');
  if (!user?.idToken) throw new Error('Inicia sesión con Google para usar la API.');
  if (account !== user.id) { account = user.id; etag = null; }
  const mutation = !!init?.method && init.method !== 'GET';
  if (mutation && !etag) throw new Error('Recarga los datos antes de guardar.');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user.idToken}`,
      ...(mutation && etag ? { 'If-Match': etag } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (started !== session) throw new Error('La sesión cambió.');
  if (!res.ok) {
    throw new ApiError(res.status);
  }
  etag = res.headers.get('ETag') || etag;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Implementación HTTP del DataRepository.
 * Activar con EXPO_PUBLIC_USE_API=1 y EXPO_PUBLIC_API_URL.
 */
const implementation: DataRepository = {
  async restoreData(data) {
    await request('/v1/data/recover', { method: 'POST', body: JSON.stringify(data) });
  },
  async load() {
    return request<AppData>('/v1/data');
  },

  async saveSongs(songs) {
    await request('/v1/songs', { method: 'PUT', body: JSON.stringify(songs) });
  },

  async saveSetlists(setlists) {
    await request('/v1/setlists', { method: 'PUT', body: JSON.stringify(setlists) });
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

function queued<A extends unknown[], T>(operation: (...args: A) => Promise<T>) {
  return (...args: A): Promise<T> => {
    const started = session;
    const result = pending.then(() => {
      if (started !== session) throw new Error('La sesión cambió.');
      return operation(...args);
    });
    pending = result.catch(() => undefined);
    return result;
  };
}
export const apiRepository: DataRepository = {
  restoreData(data) {
    const version = etag;
    return queued(async () => {
      if (!version) throw new Error('Recarga los datos antes de recuperar el repertorio.');
      await request('/v1/data/recover', { method: 'POST', headers: { 'If-Match': version }, body: JSON.stringify(data) });
    })();
  },
  load: queued(implementation.load),
  saveSongs(songs) {
    const version = etag;
    return queued(async () => {
      if (!version) throw new Error('Recarga los datos antes de importar.');
      await request('/v1/songs', { method: 'PUT', headers: { 'If-Match': version }, body: JSON.stringify(songs) });
    })();
  },
  saveSetlists(setlists) {
    const version = etag;
    return queued(async () => {
      if (!version) throw new Error('Recarga los datos antes de importar.');
      await request('/v1/setlists', { method: 'PUT', headers: { 'If-Match': version }, body: JSON.stringify(setlists) });
    })();
  },
  saveSettings: queued(implementation.saveSettings),
  upsertSong: queued(implementation.upsertSong),
  deleteSong: queued(implementation.deleteSong),
  upsertSetlist: queued(implementation.upsertSetlist),
  deleteSetlist: queued(implementation.deleteSetlist),
};
