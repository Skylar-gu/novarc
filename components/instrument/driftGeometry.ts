/**
 * Pure scale and path maths for the Drift trend SVG (`DriftTrend.tsx`).
 *
 * Kept free of React and of the DOM so the arithmetic can be unit-tested with
 * plain numbers. The component supplies the plot rectangle; these helpers map a
 * session index to an x and a 0..1 signal value to a y, and split a series that
 * has gaps (a session where one signal was not scored) into drawable runs.
 *
 * SVG y grows downward, so `scaleY(0)` is the bottom of the plot and
 * `scaleY(1)` is the top.
 */

/** Map session index `i` (0-based) of `n` sessions onto `[x0, x1]`. A single
 *  session sits at the midpoint rather than hard against the left axis. */
export function scaleX(i: number, n: number, x0: number, x1: number): number {
  if (n <= 1) return (x0 + x1) / 2;
  const clamped = Math.min(n - 1, Math.max(0, i));
  return x0 + ((x1 - x0) * clamped) / (n - 1);
}

/** Map a signal value in 0..1 onto the plot, `yBottom` for 0 and `yTop` for 1.
 *  Values outside 0..1 are clamped. */
export function scaleY(value: number, yTop: number, yBottom: number): number {
  const c = Math.min(1, Math.max(0, value));
  return yBottom - (yBottom - yTop) * c;
}

/** One plotted vertex: the session index and its (already 0..1) value. */
export interface Vertex {
  i: number;
  v: number;
}

/**
 * Split a per-session value series into contiguous runs, breaking on any `null`
 * or non-finite entry. A run of length one is a lone point (drawn as a marker,
 * not a line); a run of two or more becomes a polyline.
 */
export function contiguousRuns(values: (number | null)[]): Vertex[][] {
  const runs: Vertex[][] = [];
  let current: Vertex[] = [];
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      if (current.length > 0) {
        runs.push(current);
        current = [];
      }
      return;
    }
    current.push({ i, v });
  });
  if (current.length > 0) runs.push(current);
  return runs;
}

/** Build an SVG path `d` for one run of vertices. */
export function runPath(
  run: Vertex[],
  n: number,
  box: { x0: number; x1: number; yTop: number; yBottom: number },
): string {
  return run
    .map((vertex, index) => {
      const x = scaleX(vertex.i, n, box.x0, box.x1).toFixed(2);
      const y = scaleY(vertex.v, box.yTop, box.yBottom).toFixed(2);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

/**
 * The number of leading sessions that fall inside the baseline period, given
 * the full session count and the baseline minimum. Never more than `n`.
 */
export function baselineSpan(n: number, baselineMin: number): number {
  return Math.max(0, Math.min(n, baselineMin));
}
