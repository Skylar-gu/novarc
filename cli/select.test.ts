import { test } from "node:test";
import assert from "node:assert/strict";

import { parseSelection, SelectionError } from "./select.ts";

test("empty input selects nothing", () => {
  assert.deepEqual(parseSelection("", 5), []);
  assert.deepEqual(parseSelection("   ", 5), []);
});

test("'all' and '*' select every index, 0-based", () => {
  assert.deepEqual(parseSelection("all", 3), [0, 1, 2]);
  assert.deepEqual(parseSelection("ALL", 3), [0, 1, 2]);
  assert.deepEqual(parseSelection("*", 2), [0, 1]);
});

test("single numbers are 1-based and map to 0-based indices", () => {
  assert.deepEqual(parseSelection("1", 5), [0]);
  assert.deepEqual(parseSelection("5", 5), [4]);
});

test("ranges are inclusive", () => {
  assert.deepEqual(parseSelection("2-4", 10), [1, 2, 3]);
});

test("mixed list is sorted and de-duplicated", () => {
  assert.deepEqual(parseSelection("5-8, 1, 6, 3", 8), [0, 2, 4, 5, 6, 7]);
});

test("whitespace and commas both separate", () => {
  assert.deepEqual(parseSelection("1 2\t3", 3), [0, 1, 2]);
});

test("out of range throws SelectionError", () => {
  assert.throws(() => parseSelection("0", 5), SelectionError);
  assert.throws(() => parseSelection("6", 5), SelectionError);
  assert.throws(() => parseSelection("3-9", 5), SelectionError);
});

test("backwards range throws", () => {
  assert.throws(() => parseSelection("5-2", 10), SelectionError);
});

test("garbage token throws", () => {
  assert.throws(() => parseSelection("1,two", 5), SelectionError);
});
