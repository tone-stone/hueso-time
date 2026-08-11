/** Create a unique id without external deps. */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.abs(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatMinutes(totalSeconds: number): string {
  const mins = totalSeconds / 60;
  if (mins < 1) return `${Math.round(totalSeconds)}s`;
  return `${mins.toFixed(mins >= 10 ? 0 : 1)} min`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
