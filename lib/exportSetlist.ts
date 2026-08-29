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

function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** CSV of every song across the setlist — opens straight into Google Sheets / Excel. */
export function formatSetlistCsv(
  setlist: { sets: SetBlock[] },
  songsById: Map<string, Song>,
  labels: { set: (n: number, name: string) => string },
): string {
  const rows: string[][] = [['Set', 'Orden', 'Título', 'Artista', 'BPM', 'Tono', 'Duración']];

  setlist.sets.forEach((block, si) => {
    const refs = [...block.songs].sort((a, b) => a.order - b.order);
    refs.forEach((ref, i) => {
      const song = songsById.get(ref.songId);
      if (!song) return;
      rows.push([
        labels.set(si + 1, block.name),
        String(i + 1),
        song.title,
        song.artist,
        String(song.bpm),
        `${song.key}${song.keyMode === 'minor' ? 'm' : ''}`,
        formatDuration(song.durationSec),
      ]);
    });
  });

  return rows.map((row) => row.map(csvField).join(',')).join('\r\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Printable HTML doc for the setlist — used to drive the browser's "print to PDF". */
export function formatSetlistHtml(
  setlist: { name: string; venue?: string; date?: string; sets: SetBlock[] },
  songsById: Map<string, Song>,
  labels: { total: string; set: (n: number, name: string) => string; bpm: string },
): string {
  const total = setlistDurationSec(setlist.sets, songsById);
  const metaLine = [setlist.venue, setlist.date]
    .filter((v): v is string => !!v)
    .map(escapeHtml)
    .join(' · ');

  const setsHtml = setlist.sets
    .map((block, index) => {
      const dur = setDurationSec(block, songsById);
      const refs = [...block.songs].sort((a, b) => a.order - b.order);
      const rows = refs
        .map((ref, i) => {
          const song = songsById.get(ref.songId);
          if (!song) return '';
          return `<tr><td>${i + 1}</td><td>${escapeHtml(song.title)}</td><td>${escapeHtml(song.artist)}</td><td>${song.bpm}</td><td>${song.key}${song.keyMode === 'minor' ? 'm' : ''}</td><td>${formatDuration(song.durationSec)}</td></tr>`;
        })
        .join('');
      return `<h2>${escapeHtml(labels.set(index + 1, block.name))} <span class="dur">(${formatMinutes(dur)})</span></h2>
<table>
  <thead><tr><th>#</th><th>Título</th><th>Artista</th><th>${escapeHtml(labels.bpm)}</th><th>Tono</th><th>Dur.</th></tr></thead>
  <tbody>${rows}</tbody>
</table>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(setlist.name)}</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .meta { color: #555; margin-bottom: 24px; font-size: 13px; }
  h2 { margin-top: 28px; margin-bottom: 8px; font-size: 16px; }
  .dur { font-weight: 400; color: #666; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
  th { color: #666; font-weight: 600; }
  .total { margin-top: 24px; font-weight: 600; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>${escapeHtml(setlist.name)}</h1>
  ${metaLine ? `<div class="meta">${metaLine}</div>` : ''}
  ${setsHtml}
  <div class="total">${escapeHtml(labels.total)}: ${formatMinutes(total)}</div>
</body>
</html>`;
}
