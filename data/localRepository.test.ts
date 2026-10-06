import { beforeEach, describe, expect, it, vi } from 'vitest';
const storage = vi.hoisted(() => ({ raw: null as string | null }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: vi.fn(async () => storage.raw),
  setItem: vi.fn(async (_key: string, value: string) => { storage.raw = value; }),
} }));
import { localRepository as repo, readLocalBackup, readLocalBackupText } from './localRepository';
const input = { title: 'Song', artist: 'Band', bpm: 120, key: 'C' as const, keyMode: 'major' as const, genre: 'rock' as const, durationSec: 180 };
beforeEach(() => { storage.raw = null; });
describe('local persistence', () => {
  it('inspects missing storage without creating a new catalog', async () => {
    expect(await readLocalBackup()).toBeNull();
    expect(await readLocalBackupText()).toBeNull();
    expect(storage.raw).toBeNull();
  });
  it('exports the original backup and leaves it unchanged', async () => {
    const saved = await repo.load();
    const original = storage.raw;
    expect(await readLocalBackup()).toEqual(saved);
    expect(await readLocalBackupText()).toBe(original);
    expect(storage.raw).toBe(original);
    storage.raw = '{bad';
    await expect(readLocalBackup()).rejects.toThrow();
    expect(await readLocalBackupText()).toBe('{bad');
  });
  it('keeps simultaneous edits', async () => {
    await repo.load();
    await repo.saveSongs([]);
    await Promise.all([repo.upsertSong(input), repo.upsertSong({ ...input, title: 'Second' })]);
    expect((await repo.load()).songs).toHaveLength(2);
  });
  it('merges simultaneous settings changes', async () => {
    await repo.load();
    await Promise.all([repo.saveSettings({ language: 'en' }), repo.saveSettings({ defaultSetMinutes: 30 })]);
    expect((await repo.load()).settings).toMatchObject({ language: 'en', defaultSetMinutes: 30 });
  });
  it('does not reseed an intentionally empty collection', async () => {
    await repo.load(); await repo.saveSongs([]);
    expect((await repo.load()).songs).toEqual([]);
  });
  it('preserves corrupt storage and recovers the queue after failure', async () => {
    storage.raw = '{bad';
    await expect(repo.upsertSong(input)).rejects.toThrow();
    expect(storage.raw).toBe('{bad');
    storage.raw = null;
    expect((await repo.load()).songs.length).toBeGreaterThan(0);
  });
});
