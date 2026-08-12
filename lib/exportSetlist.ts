import type { SetBlock, Song } from '@/types/models';
import { formatDuration, formatMinutes } from '@/lib/id';
import { setDurationSec, setlistDurationSec } from '@/lib/setMath';

export function formatSetlistShareText(
  setlist: {
    name: string;
    venue?: string;
    date?: string;
    sets: SetBlock[];
  },
  songsById: Map<string, Song>,
  labels: {
    total: string;
    set: (n: number, name: string) => string;
    bpm: string;
  },
): string {
  const lines: string[] = [];
  lines.push(setlist.name);
  if (setlist.venue) lines.push(setlist.venue);
  if (setlist.date) lines.push(setlist.date);
  lines.push('');

  setlist.sets.forEach((block, index) => {
    const dur = setDurationSec(block, songsById);
    lines.push(labels.set(index + 1, block.name));
    lines.push(`(${formatMinutes(dur)})`);
    const refs = [...block.songs].sort((a, b) => a.order - b.order);
    refs.forEach((ref, i) => {
      const song = songsById.get(ref.songId);
      if (!song) return;
      lines.push(
        `${i + 1}. ${song.title} — ${song.artist} · ${song.bpm} ${labels.bpm} · ${song.key} · ${formatDuration(song.durationSec)}`,
      );
    });
    lines.push('');
  });

  const total = setlistDurationSec(setlist.sets, songsById);
  lines.push(`${labels.total}: ${formatMinutes(total)}`);
  lines.push('');
  lines.push('Hueso Time');
  return lines.join('\n');
}
