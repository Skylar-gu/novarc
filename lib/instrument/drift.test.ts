import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BASELINE_MIN,
  DRIFT_EPSILON,
  TREND_WINDOW,
  capabilityScalar,
  computeDrift,
} from "./drift.ts";
import type { StoredSession } from "./record.ts";

const DAY = 86_400_000;
const T0 = Date.parse("2026-01-01T00:00:00.000Z");
const NOW = new Date("2027-01-01T00:00:00.000Z");

let seq = 0;

function session(over: Partial<StoredSession> = {}): StoredSession {
  seq += 1;
  return {
    id: `s${seq}`,
    scoredAt: new Date(T0 + seq * DAY).toISOString(),
    load: 0.5,
    rigor: 0.5,
    coached: false,
    engineMode: "heuristic",
    transcriptHash: "h",
    ...over,
  };
}

/** `n` sessions on consecutive days from `startDay`, each with the given scalar. */
function run(
  n: number,
  load: number,
  rigor: number | null,
  startDay: number,
  coached = false,
): StoredSession[] {
  return Array.from({ length: n }, (_v, i) =>
    session({
      scoredAt: new Date(T0 + (startDay + i) * DAY).toISOString(),
      load,
      rigor,
      coached,
    }),
  );
}

test("capabilityScalar averages load and rigor, or uses load alone when rigor is null", () => {
  assert.equal(capabilityScalar(session({ load: 0.4, rigor: 0.6 })), 0.5);
  assert.equal(capabilityScalar(session({ load: 0.4, rigor: null })), 0.4);
  assert.equal(capabilityScalar(session({ load: null, rigor: 0.7 })), 0.7);
  assert.equal(capabilityScalar(session({ load: null, rigor: null })), null);
});

test("computeDrift returns null on an empty record", () => {
  assert.equal(computeDrift([], { now: NOW }), null);
});

test("computeDrift returns null when no session carries a signal", () => {
  const sessions = [
    session({ load: null, rigor: null }),
    session({ load: null, rigor: null }),
  ];
  assert.equal(computeDrift(sessions, { now: NOW }), null);
});

test("baseline not ready under BASELINE_MIN non-coached sessions", () => {
  const sessions = run(BASELINE_MIN - 1, 0.5, 0.5, 0);
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.baselineReady, false);
  assert.equal(drift.direction, "holding");
  assert.equal(drift.vsBaseline, 0);
  // windowDays still measured from the sessions on hand (4 sessions span 3 days).
  assert.equal(drift.windowDays, BASELINE_MIN - 2);
});

test("baseline becomes ready exactly at BASELINE_MIN and reads as holding at the baseline", () => {
  const sessions = run(BASELINE_MIN, 0.5, 0.5, 0);
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.baselineReady, true);
  assert.equal(drift.direction, "holding");
  assert.equal(drift.vsBaseline, 0);
});

test("strengthening: trailing window mean above the baseline", () => {
  // First 5 at 0.4, next 10 at 0.6 -> baseline 0.4, trend 0.6, delta +0.2.
  const sessions = [...run(5, 0.4, 0.4, 0), ...run(TREND_WINDOW, 0.6, 0.6, 5)];
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.baselineReady, true);
  assert.equal(drift.vsBaseline, 0.2);
  assert.equal(drift.direction, "strengthening");
  assert.equal(drift.windowDays, 14); // day 0 .. day 14
});

test("eroding: trailing window mean below the baseline", () => {
  const sessions = [...run(5, 0.7, 0.7, 0), ...run(TREND_WINDOW, 0.5, 0.5, 5)];
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.vsBaseline, -0.2);
  assert.equal(drift.direction, "eroding");
});

test("holding: a delta inside the dead-band", () => {
  const delta = DRIFT_EPSILON - 0.01; // 0.04
  const sessions = [
    ...run(5, 0.5, 0.5, 0),
    ...run(TREND_WINDOW, 0.5 + delta, 0.5 + delta, 5),
  ];
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.vsBaseline, 0.04);
  assert.equal(drift.direction, "holding");
});

test("coached sessions are excluded from both baseline and trend", () => {
  const base = [
    ...run(5, 0.4, 0.4, 0),
    ...run(TREND_WINDOW, 0.6, 0.6, 5),
  ];
  const withCoached = [
    ...run(5, 0.4, 0.4, 0),
    // A coached blowout dropped in the middle of the timeline.
    ...run(3, 0.0, 0.0, 5, true),
    ...run(TREND_WINDOW, 0.6, 0.6, 8),
  ];
  const a = computeDrift(base, { now: NOW });
  const b = computeDrift(withCoached, { now: NOW });
  assert.ok(a && b);
  assert.equal(b.vsBaseline, a.vsBaseline);
  assert.equal(b.direction, a.direction);
});

test("null rigor: the baseline uses load alone, not load averaged with zero", () => {
  // Baseline: load 0.4, rigor null -> scalar 0.4. Trend: load 0.4, rigor 0.8 -> 0.6.
  const sessions = [
    ...run(5, 0.4, null, 0),
    ...run(TREND_WINDOW, 0.4, 0.8, 5),
  ];
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  // If null rigor were treated as 0 the baseline would be 0.2 and delta 0.4.
  assert.equal(drift.vsBaseline, 0.2);
  assert.equal(drift.direction, "strengthening");
});

test("windowDays is the span from earliest baseline to latest trailing session", () => {
  const sessions = [
    ...run(5, 0.5, 0.5, 0), // days 0..4
    ...run(TREND_WINDOW, 0.5, 0.5, 30), // days 30..39
  ];
  const drift = computeDrift(sessions, { now: NOW });
  assert.ok(drift);
  assert.equal(drift.windowDays, 39);
});

test("sessions stamped after `now` are ignored", () => {
  const future = session({
    scoredAt: new Date(T0 + 400 * DAY).toISOString(),
    load: 0,
    rigor: 0,
  });
  const sessions = [...run(5, 0.5, 0.5, 0), future];
  const drift = computeDrift(sessions, { now: new Date(T0 + 10 * DAY) });
  assert.ok(drift);
  // Without the guard the future 0.0 session would pull the trend negative.
  assert.equal(drift.vsBaseline, 0);
  assert.equal(drift.direction, "holding");
});

test("unsorted input is handled: order is derived from scoredAt", () => {
  const ordered = [...run(5, 0.4, 0.4, 0), ...run(TREND_WINDOW, 0.6, 0.6, 5)];
  const shuffled = [...ordered].reverse();
  const a = computeDrift(ordered, { now: NOW });
  const b = computeDrift(shuffled, { now: NOW });
  assert.deepEqual(b, a);
});
