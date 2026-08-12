import type { Song } from '@/types/models';

/** Slow ballad-ish threshold for energy pacing. */
export const SLOW_BPM = 95;
/** Fast/up tempo threshold. */
export const FAST_BPM = 130;

export type EnergyBand = 'slow' | 'mid' | 'fast';

export function energyBand(bpm: number): EnergyBand {
  if (bpm < SLOW_BPM) return 'slow';
  if (bpm >= FAST_BPM) return 'fast';
  return 'mid';
}

/**
 * Score how good it is to place `candidate` after `prev`.
 * Higher = better for a live show (avoid two slow in a row, prefer artist change).
 */
export function placementScore(prev: Song | null, candidate: Song): number {
  let score = 10;
  if (!prev) return score;

  const prevBand = energyBand(prev.bpm);
  const nextBand = energyBand(candidate.bpm);

  if (prevBand === 'slow' && nextBand === 'slow') score -= 8;
  if (prevBand === 'fast' && nextBand === 'fast') score -= 2;
  if (prevBand === 'slow' && nextBand === 'fast') score += 4;
  if (prevBand === 'mid' && nextBand === 'fast') score += 2;

  if (prev.artist.trim().toLowerCase() === candidate.artist.trim().toLowerCase()) {
    score -= 5;
  } else {
    score += 3;
  }

  // Mild key continuity bonus (same root)
  if (prev.key === candidate.key) score += 1;

  return score;
}

/** Pick best index in candidates for next song after `prev`. */
export function pickBestIndex(prev: Song | null, candidates: Song[]): number {
  if (candidates.length === 0) return -1;
  let best = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < candidates.length; i += 1) {
    const s = placementScore(prev, candidates[i]);
    // slight randomness to keep shows fresh
    const jitter = Math.random() * 1.5;
    if (s + jitter > bestScore) {
      bestScore = s + jitter;
      best = i;
    }
  }
  return best;
}
