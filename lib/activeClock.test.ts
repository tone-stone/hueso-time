import { expect, it } from 'vitest';
import { ActiveClock } from './activeClock';

it('keeps show and song active times coherent across repeated pauses', () => {
  const show = new ActiveClock(0), song = new ActiveClock(0);
  for (const clock of [show, song]) {
    clock.pause(50_000);
    expect(clock.seconds(70_000)).toBe(50);
    clock.resume(70_000);
    expect(clock.seconds(71_000)).toBe(51);
    clock.pause(72_000); clock.pause(73_000);
    clock.resume(80_000); clock.resume(81_000);
    expect(clock.seconds(83_000)).toBe(55);
  }
});
it('starts a newly selected song at zero even when the show is paused', () => {
  const song = new ActiveClock(0);
  song.pause(10_000); song.reset(20_000, true);
  expect(song.seconds(60_000)).toBe(0);
  song.resume(60_000);
  expect(song.seconds(65_000)).toBe(5);
});
