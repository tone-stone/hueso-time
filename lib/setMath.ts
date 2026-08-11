import type { SetBlock, Song } from '@/types/models';

export function setDurationSec(set: SetBlock, songsById: Map<string, Song>): number {
  return set.songs.reduce((sum, ref) => {
    const song = songsById.get(ref.songId);
    return sum + (song?.durationSec ?? 0);
  }, 0);
}

export function setlistDurationSec(
  sets: SetBlock[],
  songsById: Map<string, Song>,
): number {
  return sets.reduce((sum, block) => sum + setDurationSec(block, songsById), 0);
}

export function isOverTarget(set: SetBlock, songsById: Map<string, Song>): boolean {
  return setDurationSec(set, songsById) > set.targetMinutes * 60;
}
