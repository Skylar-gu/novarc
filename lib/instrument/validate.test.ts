import { test } from "node:test";
import assert from "node:assert/strict";
import { validateResult } from "./validate.ts";
import type { RawScore, Turn } from "./types.ts";

const TURNS: Turn[] = [
  { role: "user", text: "The row lock on refresh is my working theory.", index: 0 },
  { role: "assistant", text: "Plausible, but confirm the mechanism first.", index: 1 },
  { role: "user", text: "What test would confirm contention over pool saturation?", index: 2 },
];

const FIXED_CLOCK = () => new Date("2026-02-01T12:00:00.000Z");

function raw(overrides: Partial<RawScore> = {}): RawScore {
  return {
    scored: true,
    reasonIfUnscored: null,
    load: null,
    rigor: null,
    drift: null,
    intervention: null,
    coached: false,
    ...overrides,
  };
}

test("a fabricated receipt is dropped; a real one is kept", () => {
  const result = validateResult(
    raw({
      load: {
        value: 0.7,
        receipts: [
          { quote: "row lock on refresh", turnRef: 0, rationale: "real span" },
          { quote: "I never said this", turnRef: 0, rationale: "fabricated" },
        ],
      },
    }),
    TURNS,
    { engineMode: "llm", now: FIXED_CLOCK },
  );
  assert.equal(result.scored, true);
  assert.equal(result.load?.receipts.length, 1);
  assert.equal(result.load?.receipts[0].rationale, "real span");
});

test("a signal whose every receipt is fabricated becomes null", () => {
  const result = validateResult(
    raw({
      load: { value: 0.6, receipts: [{ quote: "nope", turnRef: 0, rationale: "x" }] },
      rigor: {
        value: 0.5,
        receipts: [{ quote: "What test would confirm contention", turnRef: 2, rationale: "real" }],
      },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(result.load, null);
  assert.equal(result.rigor?.receipts.length, 1);
  assert.equal(result.scored, true);
});

test("both core signals gone -> the whole result is unscored", () => {
  const result = validateResult(
    raw({
      load: { value: 0.6, receipts: [{ quote: "fake a", turnRef: 0, rationale: "" }] },
      rigor: { value: 0.6, receipts: [{ quote: "fake b", turnRef: 2, rationale: "" }] },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(result.scored, false);
  assert.equal(result.load, null);
  assert.equal(result.rigor, null);
  assert.match(result.reasonIfUnscored ?? "", /evidence/i);
});

test("values are clamped to 0..1; non-finite nulls the signal", () => {
  const clamped = validateResult(
    raw({
      load: { value: 4.2, receipts: [{ quote: "row lock", turnRef: 0, rationale: "" }] },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(clamped.load?.value, 1);

  const nan = validateResult(
    raw({
      load: { value: Number.NaN, receipts: [{ quote: "row lock", turnRef: 0, rationale: "" }] },
      rigor: {
        value: 0.4,
        receipts: [{ quote: "What test would confirm", turnRef: 2, rationale: "" }],
      },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(nan.load, null);
  assert.equal(nan.rigor?.value, 0.4);
});

test("an intervention with a bad anchor is dropped", () => {
  const result = validateResult(
    raw({
      load: { value: 0.3, receipts: [{ quote: "row lock", turnRef: 0, rationale: "" }] },
      intervention: { signal: "load", prompt: "…", anchoredTo: 99 },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(result.intervention, null);
});

test("an intervention pointing at a nulled signal is dropped", () => {
  const result = validateResult(
    raw({
      load: { value: 0.3, receipts: [{ quote: "row lock", turnRef: 0, rationale: "" }] },
      rigor: { value: 0.3, receipts: [{ quote: "fabricated", turnRef: 2, rationale: "" }] },
      intervention: { signal: "rigor", prompt: "…", anchoredTo: 2 },
    }),
    TURNS,
    { now: FIXED_CLOCK },
  );
  assert.equal(result.rigor, null);
  assert.equal(result.intervention, null);
});

test("the gate path carries its reason and coached flag through", () => {
  const result = validateResult(
    raw({ scored: false, reasonIfUnscored: "short factual lookup", coached: true }),
    TURNS,
    { engineMode: "heuristic", now: FIXED_CLOCK },
  );
  assert.equal(result.scored, false);
  assert.equal(result.reasonIfUnscored, "short factual lookup");
  assert.equal(result.coached, true);
  assert.equal(result.drift, null);
});

test("engineMode and scoredAt are stamped; drift is always null", () => {
  const result = validateResult(
    raw({
      load: { value: 0.5, receipts: [{ quote: "row lock", turnRef: 0, rationale: "" }] },
    }),
    TURNS,
    { engineMode: "llm", now: FIXED_CLOCK },
  );
  assert.equal(result.engineMode, "llm");
  assert.equal(result.scoredAt, "2026-02-01T12:00:00.000Z");
  assert.equal(result.drift, null);
});
