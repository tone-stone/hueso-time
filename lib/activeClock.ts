/** A monotonic active-time model shared by the show and song timers. */
export class ActiveClock {
  private started: number;
  private pausedAt: number | null = null;
  private pausedMs = 0;
  constructor(now: number) { this.started = now; }
  reset(now: number, paused = false) {
    this.started = now; this.pausedMs = 0; this.pausedAt = paused ? now : null;
  }
  pause(now: number) { if (this.pausedAt === null) this.pausedAt = now; }
  resume(now: number) {
    if (this.pausedAt !== null) { this.pausedMs += Math.max(0, now - this.pausedAt); this.pausedAt = null; }
  }
  milliseconds(now: number) { return Math.max(0, (this.pausedAt ?? now) - this.started - this.pausedMs); }
  seconds(now: number) { return Math.floor(this.milliseconds(now) / 1000); }
}
