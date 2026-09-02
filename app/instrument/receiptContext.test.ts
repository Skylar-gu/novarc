import { test } from "node:test";
import assert from "node:assert/strict";

import { receiptContext } from "../../components/instrument/receiptContext.ts";

const TURN =
  "The slow log shows three dashboard queries doing sequential scans on a " +
  "twenty million row table. So it is probably missing indexes, not raw " +
  "capacity. A replica would have masked that.";

test("returns the span and its surrounding context", () => {
  const context = receiptContext(TURN, "probably missing indexes, not raw capacity");
  assert.ok(context);
  assert.equal(context.match, "probably missing indexes, not raw capacity");
  assert.ok(context.before.endsWith("So it is"));
  assert.ok(context.after.startsWith(". A replica"));
});

test("matches across differing whitespace", () => {
  const context = receiptContext(TURN, "three   dashboard\nqueries");
  assert.ok(context);
  assert.equal(context.match, "three dashboard queries");
});

test("flags when the lead and tail were clipped", () => {
  const context = receiptContext(TURN, "sequential scans", 8);
  assert.ok(context);
  assert.equal(context.leadClipped, true);
  assert.equal(context.trailClipped, true);
});

test("does not flag clipping when the span reaches the ends of the turn", () => {
  const short = "missing indexes not raw capacity";
  const context = receiptContext(short, "missing indexes not raw capacity");
  assert.ok(context);
  assert.equal(context.leadClipped, false);
  assert.equal(context.trailClipped, false);
  assert.equal(context.before, "");
  assert.equal(context.after, "");
});

test("returns null when the span is absent from the turn", () => {
  assert.equal(receiptContext(TURN, "a phrase that is not present"), null);
});

test("returns null for an empty quote", () => {
  assert.equal(receiptContext(TURN, "   "), null);
});

test("regExp metacharacters in the quote are matched literally", () => {
  const turn = "I asked what (specifically) backs that claim about p < 0.05 here.";
  const context = receiptContext(turn, "p < 0.05");
  assert.ok(context);
  assert.equal(context.match, "p < 0.05");
});
