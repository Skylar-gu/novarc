import { test } from "node:test";
import assert from "node:assert/strict";

import {
  baselineSpan,
  contiguousRuns,
  runPath,
  scaleX,
  scaleY,
} from "../../components/instrument/driftGeometry.ts";

test("scaleX places a lone session at the midpoint", () => {
  assert.equal(scaleX(0, 1, 10, 90), 50);
});

test("scaleX maps the first and last of many sessions onto the edges", () => {
  assert.equal(scaleX(0, 5, 10, 90), 10);
  assert.equal(scaleX(4, 5, 10, 90), 90);
  assert.equal(scaleX(2, 5, 10, 90), 50);
});

test("scaleX clamps an out-of-range index", () => {
  assert.equal(scaleX(-3, 5, 10, 90), 10);
  assert.equal(scaleX(99, 5, 10, 90), 90);
});

test("scaleY puts 0 at the bottom, 1 at the top, 0.5 in the middle", () => {
  assert.equal(scaleY(0, 20, 120), 120);
  assert.equal(scaleY(1, 20, 120), 20);
  assert.equal(scaleY(0.5, 20, 120), 70);
});

test("scaleY clamps values outside 0..1", () => {
  assert.equal(scaleY(-1, 20, 120), 120);
  assert.equal(scaleY(2, 20, 120), 20);
});

test("contiguousRuns splits a series on nulls", () => {
  const runs = contiguousRuns([0.1, 0.2, null, 0.4, 0.5, null, 0.7]);
  assert.deepEqual(
    runs.map((run) => run.map((v) => v.i)),
    [[0, 1], [3, 4], [6]],
  );
  assert.equal(runs[1][0].v, 0.4);
});

test("contiguousRuns treats NaN and Infinity as gaps", () => {
  const runs = contiguousRuns([0.3, Number.NaN, Number.POSITIVE_INFINITY, 0.6]);
  assert.deepEqual(
    runs.map((run) => run.map((v) => v.i)),
    [[0], [3]],
  );
});

test("contiguousRuns of an all-null series is empty", () => {
  assert.deepEqual(contiguousRuns([null, null]), []);
});

test("runPath emits one M then L commands for a multi-point run", () => {
  const d = runPath(
    [
      { i: 0, v: 0 },
      { i: 1, v: 1 },
    ],
    2,
    { x0: 0, x1: 100, yTop: 0, yBottom: 100 },
  );
  assert.equal(d, "M0.00 100.00 L100.00 0.00");
});

test("baselineSpan never exceeds the session count", () => {
  assert.equal(baselineSpan(3, 5), 3);
  assert.equal(baselineSpan(9, 5), 5);
  assert.equal(baselineSpan(0, 5), 0);
});
