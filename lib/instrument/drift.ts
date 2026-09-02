/**
 * Drift — the trend computation.
 *
 * Drift is never a per-session score (see `docs/rubrics/drift.md`). It is a pure
 * function over the personal record: the sequence of prior scored sessions held
 * in `localStorage` by `record.ts`. This module keeps that math free of any
 * storage I/O so it can be tested with plain arrays and an injected clock.
 *
 * Semantics, matching `docs/rubrics/drift.md`:
 *   - A baseline period must complete before Drift reports a direction.
 *   - Coached sessions are excluded from both the baseline and the trend, so
 *     Drift never measures the instrument's own influence.
 *   - Direction is `strengthening` / `holding` / `eroding` by a documented
 *     threshold on the signed delta of the trailing window vs. the baseline.
 */

import type { DriftScore } from "./types.ts";
import type { StoredSession } from "./record.ts";

/* --- Tunable constants (documented; see report / drift.md) --------------- */

/**
 * Non-coached scored sessions required before a baseline exists. Until this
 * many are on record, Drift reports `baselineReady: false`, `direction:
 * "holding"`, `vsBaseline: 0`. Fixed by `docs/rubrics/drift.md` §"How Drift is
 * computed" (=5).
 */
export const BASELINE_MIN = 5;

/**
 * The trailing window is the **last `TREND_WINDOW` non-coached scored
 * sessions** — a count, not a number of days. A count-based window makes Drift
 * behave the same whether a person scores a transcript daily or monthly; a day
 * window would report "eroding" merely because someone used the instrument less
 * often. Ten is roughly twice the baseline: wide enough to average out a single
 * noisy session, narrow enough to still track a months-long change.
 */
export const TREND_WINDOW = 10;

/**
 * Dead-band on the signed delta (trailing mean − baseline mean), on the 0..1
 * signal scale. A gap under five points of capability is within
 * session-to-session noise and reads as `holding`. Strictly above → the delta's
 * sign decides `strengthening` (positive) or `eroding` (negative).
 */
export const DRIFT_EPSILON = 0.05;

/** `vsBaseline` is rounded to this many decimal places. */
const DELTA_DP = 3;

const MS_PER_DAY = 86_400_000;

/* --- helpers ----------------------------------------------------------- */

/**
 * The single "capability" scalar for one session: the mean of `load` and
 * `rigor`. When `rigor` is null, `load` stands alone. When both are null the
 * session carries no capability signal and is returned as `null` so callers can
 * drop it.
 */
export function capabilityScalar(session: StoredSession): number | null {
  const parts: number[] = [];
  if (typeof session.load === "number" && Number.isFinite(session.load)) {
    parts.push(session.load);
  }
  if (typeof session.rigor === "number" && Number.isFinite(session.rigor)) {
    parts.push(session.rigor);
  }
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

/** Milliseconds since the epoch for a session, or 0 when the stamp is unparseable. */
function stampMs(session: StoredSession): number {
  const t = Date.parse(session.scoredAt);
  return Number.isNaN(t) ? 0 : t;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function roundDelta(value: number): number {
  const factor = 10 ** DELTA_DP;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** Whole days between the earliest and latest session in the list (0 for <2). */
function daySpan(sessions: StoredSession[]): number {
  if (sessions.length < 2) return 0;
  let min = Infinity;
  let max = -Infinity;
  for (const s of sessions) {
    const t = stampMs(s);
    if (t < min) min = t;
    if (t > max) max = t;
  }
  return Math.round((max - min) / MS_PER_DAY);
}

/* --- the computation -------------------------------------------------- */

/**
 * Compute Drift from the personal record.
 *
 * @param sessions  Every stored session (any order; coached and uncoached).
 * @param opts.now  Injected clock. Sessions stamped after `now` are ignored
 *                  (clock-skew / bad-import guard). Defaults to the real clock.
 *
 * @returns `null` when the record holds no session with a capability signal at
 *          all; otherwise a `DriftScore`. Before the baseline completes the
 *          score is `{ direction: "holding", vsBaseline: 0, baselineReady:
 *          false }` with `windowDays` still measured from the sessions on hand.
 */
export function computeDrift(
  sessions: StoredSession[],
  opts: { now?: Date } = {},
): DriftScore | null {
  const nowMs = (opts.now ?? new Date()).getTime();

  const usable = sessions
    .filter((s) => capabilityScalar(s) !== null && stampMs(s) <= nowMs)
    .slice()
    .sort((a, b) => stampMs(a) - stampMs(b));

  if (usable.length === 0) return null;

  const nonCoached = usable.filter((s) => !s.coached);

  if (nonCoached.length < BASELINE_MIN) {
    return {
      direction: "holding",
      vsBaseline: 0,
      windowDays: daySpan(nonCoached),
      baselineReady: false,
    };
  }

  const baselineSet = nonCoached.slice(0, BASELINE_MIN);
  const trendSet = nonCoached.slice(-TREND_WINDOW);

  const baselineMean = mean(
    baselineSet.map((s) => capabilityScalar(s) as number),
  );
  const trendMean = mean(trendSet.map((s) => capabilityScalar(s) as number));
  const delta = roundDelta(trendMean - baselineMean);

  const direction =
    Math.abs(delta) < DRIFT_EPSILON
      ? "holding"
      : delta > 0
        ? "strengthening"
        : "eroding";

  return {
    direction,
    vsBaseline: delta,
    // Span of every session that fed the computation: earliest baseline to
    // latest trailing session.
    windowDays: daySpan([...baselineSet, ...trendSet]),
    baselineReady: true,
  };
}
