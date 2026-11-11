/**
 * In-process counters reported by /health. Deliberately simple: each instance reports its
 * own numbers since start; logs carry the per-event detail.
 */
const counters = new Map<string, number>();
const durations = new Map<
  string,
  { count: number; totalMs: number; maxMs: number }
>();

export function increment(name: string, by = 1) {
  counters.set(name, (counters.get(name) ?? 0) + by);
}

export function recordDuration(name: string, ms: number) {
  const entry = durations.get(name) ?? { count: 0, totalMs: 0, maxMs: 0 };
  entry.count += 1;
  entry.totalMs += ms;
  entry.maxMs = Math.max(entry.maxMs, ms);
  durations.set(name, entry);
}

export function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    durations: Object.fromEntries(
      [...durations].map(([name, d]) => [
        name,
        {
          count: d.count,
          avg_ms: Math.round(d.totalMs / d.count),
          max_ms: Math.round(d.maxMs),
        },
      ]),
    ),
  };
}
