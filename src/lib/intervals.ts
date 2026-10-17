/** Closed intervals of video time in seconds, [start, end]. */
export type Interval = [number, number];

/** Merge overlapping or touching intervals into a sorted, disjoint list. */
export function mergeIntervals(intervals: Interval[]): Interval[] {
  const clean = intervals
    .map(([a, b]): Interval => [Math.min(a, b), Math.max(a, b)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((x, y) => x[0] - y[0]);
  const merged: Interval[] = [];
  for (const [start, end] of clean) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 0.5) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

export function coveredSeconds(intervals: Interval[], duration: number): number {
  return mergeIntervals(intervals).reduce((sum, [a, b]) => sum + Math.max(0, Math.min(b, duration) - Math.max(a, 0)), 0);
}

export function coveragePercent(intervals: Interval[], duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(100, Math.round((coveredSeconds(intervals, duration) / duration) * 10000) / 100);
}

/** Parse untrusted JSON into intervals, dropping anything malformed. */
export function parseIntervals(value: unknown): Interval[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((p): p is [unknown, unknown] => Array.isArray(p) && p.length === 2)
    .map(([a, b]) => [Number(a), Number(b)] as Interval)
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && a >= 0 && b > a);
}
