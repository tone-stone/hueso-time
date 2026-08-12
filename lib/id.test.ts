import { describe, expect, it } from 'vitest';

import { createId, formatDuration, formatMinutes } from '../lib/id';

describe('id helpers', () => {
  it('creates unique prefixed ids', () => {
    const a = createId('song');
    const b = createId('song');
    expect(a).toMatch(/^song_/);
    expect(b).toMatch(/^song_/);
    expect(a).not.toBe(b);
  });

  it('formats duration mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('formats minutes for humans', () => {
    expect(formatMinutes(30)).toBe('30s');
    expect(formatMinutes(90)).toMatch(/1\.5 min/);
    expect(formatMinutes(600)).toBe('10 min');
  });
});
